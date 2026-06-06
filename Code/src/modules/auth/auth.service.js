import { emailEnum, providerEnum } from "../../common/enums/index.js";
import { BadRequestException, ConfilectException, NotFoundException } from "../../common/utils/response/error.response.js";
import { UserModel, create, createOne, findOne, findOneAndUpdate } from "../../DB/index.js";
import { compareHash, generateHash } from "../../common/utils/security/hash.security.js";
import { encrypt } from "../../common/utils/security/encryption.security.js";
import { createLoginCredentials } from "../../common/utils/security/token.security.js";
import { OAuth2Client } from 'google-auth-library';
import { CLIENT_IDS, ORIGINS } from "../../../config/config.service.js";
import { createNumberOtp, emailEmitter, emailTemplate, sendEmail } from "../../common/utils/index.js";
import { baseRevokeTokenKey, deleteKey, forgotPasswordLinkKey, get, increment, keys, otpBlockKey, otpKey, otpMaxRequestKey, set, ttl } from "../../common/services/index.js";
import { randomUUID } from "crypto";

const verifyEmailOtp = async ({ email, subject = emailEnum.ConfirmEmail, title = "Verify Account" } = {}) => {

  // Check block condition
  const blockKey = otpBlockKey({ email, type: subject });
  const remainingBlockTime = await ttl(blockKey);
  if (remainingBlockTime > 0) {
    throw ConfilectException({ message: `You have reached max trial count please try again after ${remainingBlockTime} seconds` });
  }

  const oldCodeTTl = await ttl(otpKey({ email, type: subject }));
  if (oldCodeTTl > 0) {
    throw ConfilectException({ message: `Sorry we cannot send new otp until the first one expires, try again after ${oldCodeTTl}` });
  }
  // Check max trial count 
  const maxTrialCountKey = otpMaxRequestKey({ email, type: subject });
  const checkMaxOtpRequest = Number(await get(maxTrialCountKey) || 0);


  if (checkMaxOtpRequest >= 3) {
    await set({
      key: otpBlockKey({ email, type: subject }),
      value: 0,
      ttl: 300
    });

    throw ConfilectException({ message: `You have reached max trial count please try again after 300 seconds` });
  }

  const code = await createNumberOtp();
  await set({
    key: otpKey({ email, type: subject }),
    value: await generateHash(`${code}`),
    ttl: 120
  });



  await sendEmail({
    to: email,
    subject,
    html: emailTemplate({ code, title })
  });

  checkMaxOtpRequest > 0 ? await increment(maxTrialCountKey) : await set({ key: maxTrialCountKey, value: 1, ttl: 300 });

  return;
};

export const signup = async (inputs) => {
  const { username, email, password, phone } = inputs;

  const checkUserExist = await findOne({
    model: UserModel,
    filter: { email }
  });
  if (checkUserExist) {
    throw ConfilectException({ message: "Email exist" });
  }

  const user = await createOne({
    model: UserModel,
    data: {
      username,
      email,
      password: await generateHash(password),
      phone: await encrypt(phone),
    },
  });

  emailEmitter.emit("sendEmail", async () => {
    await verifyEmailOtp({ email });
  });

  return user;
};

export const confirmEmail = async (inputs) => {

  const { email, otp } = inputs;

  const account = await findOne({
    model: UserModel,
    filter: { email, confirmEmail: { $exists: false }, provider: providerEnum.System }
  });
  if (!account) {
    throw NotFoundException({ message: "Fail to find account" });
  }

  const hashOtp = await get(otpKey({ email }));
  if (!hashOtp) {
    throw NotFoundException({ message: "Expired otp" });
  }
  if (!await compareHash(otp, hashOtp)) {
    throw ConfilectException({ message: "Invalid otp" });
  }

  account.confirmEmail = new Date();
  await account.save();

  await deleteKey(await keys(otpKey({ email })));
  return;
};

export const reSendConfirmEmail = async (inputs) => {
  const { email } = inputs;

  const account = await findOne({
    model: UserModel,
    filter: {
      email,
      confirmEmail: { $exists: false },
      provider: providerEnum.System
    }
  });
  if (!account) {
    throw NotFoundException({ message: "Fail to find matching account" });
  }

  await verifyEmailOtp({ email });

  return;
};

export const requestForgotPasswordLink = async ({ email } = {}, issuer) => {
  const account = await findOne({
    model: UserModel,
    filter: {
      email,
      confirmEmail: { $exists: true },
      provider: providerEnum.System
    }
  });
  if (!account) {
    throw NotFoundException({ message: "Invalid Account" });
  }

  const token = randomUUID();
  await set({
    key: forgotPasswordLinkKey({ userId: account._id }),
    value: await generateHash(token),
    ttl: 900
  });

  const origin = Array.isArray(ORIGINS) && ORIGINS.length ? ORIGINS[0] : issuer;
  const resetLink = `${origin}/auth/reset-password?userId=${account._id}&token=${token}`;

  await sendEmail({
    to: email,
    subject: emailEnum.ForgortPassword,
    html: emailTemplate({ code: `<a href="${resetLink}">Reset Password</a>`, title: "Reset Password" })
  });

  return;
};


export const requestForgotPasswordCode = async ({ email }) => {
  const account = await findOne({
    model: UserModel,
    filter: {
      email,
      confirmEmail: { $exists: true },
      provider: providerEnum.System
    }
  });
  if (!account) {
    throw NotFoundException({ message: "Invalid Account" });
  }
  await verifyEmailOtp({ email, subject: emailEnum.ForgortPassword });
  return;
};


export const verifyForgotPasswordCode = async ({ email, otp }) => {
  const hashOtp = await get(otpKey({ email, type: emailEnum.ForgortPassword }));
  if (!hashOtp) {
    throw NotFoundException({ message: `Expired OTP` });
  }
  if (!await compareHash(otp, hashOtp)) {
    throw ConfilectException({ message: `Invalid OTP` });
  }
  return;
};

export const resetForgotPasswordCode = async ({ email, otp, password }) => {
  await verifyForgotPasswordCode({ email, otp });
  const account = await findOneAndUpdate({
    model: UserModel,
    filter: {
      email,
      confirmEmail: { $exists: true },
      provider: providerEnum.System
    },
    update: {
      password: await generateHash(password),
      changeCredentialsTime: new Date()
    }
  });
  if (!account) {
    throw NotFoundException({ message: "Invalid account" });
  }
  const otpKeys = await keys(otpKey({ email, type: emailEnum.ForgortPassword }));
  const tokenKeys = await keys(await keys(baseRevokeTokenKey(account._id)));
  await deleteKey([...otpKeys, ...tokenKeys]);

  return;
};

export const resetForgotPasswordLink = async ({ userId, token, password } = {}) => {
  const storedHash = await get(forgotPasswordLinkKey({ userId }));
  if (!storedHash) {
    throw NotFoundException({ message: "Expired or invalid reset link" });
  }

  const isValid = await compareHash(token, storedHash);
  if (!isValid) {
    throw ConfilectException({ message: "Invalid reset link" });
  }

  const account = await findOneAndUpdate({
    model: UserModel,
    filter: {
      _id: userId,
      confirmEmail: { $exists: true },
      provider: providerEnum.System
    },
    update: {
      password: await generateHash(password),
      changeCredentialsTime: new Date()
    }
  });
  if (!account) {
    throw NotFoundException({ message: "Invalid account" });
  }

  const linkKey = await keys(forgotPasswordLinkKey({ userId }));
  const tokenKeys = await keys(await keys(baseRevokeTokenKey(account._id)));
  await deleteKey([...linkKey, ...tokenKeys]);

  return;
};


export const login = async (inputs, issuer) => {
  const { email, password } = inputs;
  const user = await findOne({
    model: UserModel,
    filter: { email, provider: providerEnum.System },
  });
  if (!user) {
    throw NotFoundException({ message: "Invalid login data" });
  }
  const match = await compareHash(password, user.password);
  if (!match) {
    throw NotFoundException({ message: "Invalid login data" });
  }

  return await createLoginCredentials(user, issuer);
};


const verifyGoogleAccount = async (idToken) => {
  const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: CLIENT_IDS,
  });
  const payload = ticket.getPayload();
  if (!payload?.email_verified) {
    throw BadRequestException({ message: "Fail to verify this account with Google" });
  }
  return payload;
};

export const loginWithGmail = async ({ idToken }, issuer) => {
  const payload = await verifyGoogleAccount(idToken);
  const user = await findOne({ model: UserModel, filter: { email: payload.email, provider: providerEnum.Google } });
  if (!user) {
    throw NotFoundException({ message: "Invalid login data" });
  }
  return await createLoginCredentials(user, issuer);
};


export const signupWithGmail = async ({ idToken }, issuer) => {
  const payload = await verifyGoogleAccount(idToken);

  const checkUserExist = await findOne({ model: UserModel, filter: { email: payload.email } });
  if (checkUserExist) {
    if (checkUserExist?.provider == providerEnum.System) {
      throw ConfilectException({ message: "Account already exist with different provider" });
    }
    const account = await loginWithGmail({ idToken }, issuer);
    return { account, status: 200 };
  }

  const user = await create({
    model: UserModel,
    data: [{
      firstName: payload.given_name,
      lastName: payload.family_name,
      email: payload.email,
      provider: providerEnum.Google,
      profilePicture: payload.picture,
      confirmEmail: new Date(),
    }],
  });

  return { account: await createLoginCredentials(user[0], issuer) };
};

