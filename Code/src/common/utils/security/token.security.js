import jwt from "jsonwebtoken";
import { ACCESS_EXPIRES_IN, REFRESH_EXPIRES_IN, System_REFRESH_TOKEN_SECRET_KEY, System_TOKEN_SECRET_KEY, User_REFRESH_TOKEN_SECRET_KEY, User_TOKEN_SECRET_KEY } from "../../../../config/config.service.js";
import { roleEnum } from "../../enums/user.enum.js";
import { audienceEnum, tokenTypeEnum } from "../../enums/security.enum.js";
import { BadRequestException, NotFoundException, UnauthorizedException } from "../response/error.response.js";
import { findOne } from "../../../DB/database.service.js";
import { UserModel } from "../../../DB/index.js";
import { randomUUID } from "crypto";
import { get, revokeTokenKey } from "../../services/index.js";

export const generateToken = async ({
  payload = {}, secret = User_TOKEN_SECRET_KEY, options = {},
} = {}) => {
  return jwt.sign(payload, secret, options);
};

export const verifyToken = async ({
  token, secret = User_TOKEN_SECRET_KEY,
} = {}) => {
  return jwt.verify(token, secret);
};

export const getSignatureLevel = async (audienceType) => {
  let signatureLevel = audienceEnum.User;
  switch (audienceType) {
    case audienceEnum.System:
      signatureLevel = roleEnum.Admin;
      break;
    default:
      signatureLevel = roleEnum.User;
      break;
  }
  return signatureLevel;
};

export const getTokenSignature = async (role) => {
  let accessSignature = undefined;
  let refreshSignature = undefined;
  let audience = audienceEnum.User;
  switch (role) {
    case roleEnum.Admin:
      accessSignature = System_TOKEN_SECRET_KEY;
      refreshSignature = System_REFRESH_TOKEN_SECRET_KEY;
      audience = audienceEnum.System;
      break;
    default:
      accessSignature = User_TOKEN_SECRET_KEY;
      refreshSignature = User_REFRESH_TOKEN_SECRET_KEY;
      audience = audienceEnum.User;
      break;
  }
  return { accessSignature, refreshSignature, audience };
};

export const decodeToken = async ({ token, tokenType = tokenTypeEnum.access } = {}) => {

  const decoded = jwt.decode(token);
  console.log({ decoded });
  if (!decoded?.aud?.length) {
    throw BadRequestException({ message: 'Fail ro decoded this token audience is required' });
  }

  const [decodeTokenType, audienceType] = decoded.aud;
  if (decodeTokenType !== tokenType) {
    throw BadRequestException({ message: `Invalid token type, token of type ${decodeTokenType} cannot access this api while we excpected token of type ${tokenType}` });
  }

  if (decoded.jti && await get(revokeTokenKey({ userId: decoded.sub, jti: decoded.jti }))) {
    throw UnauthorizedException({ message: `Invalid login session` });

  }

  const signatureLevel = await getSignatureLevel(audienceType);
  const { accessSignature, refreshSignature } = await getTokenSignature(signatureLevel);
  console.log({ accessSignature, refreshSignature });

  const verifiedData = await verifyToken({
    token,
    secret: tokenType == tokenTypeEnum.refresh ? refreshSignature : accessSignature
  });

  const user = await findOne({ model: UserModel, filter: { _id: verifiedData.sub } });

  if (!user) {
    throw NotFoundException({ message: `Not register account` });
  }
  if (user.changeCredentialsTime instanceof Date) {
    console.log({
      changeCredentialsTime: user.changeCredentialsTime.getTime(),
      iat: decoded.iat * 1000,
    });
  }

  if (user.changeCredentialsTime && user.changeCredentialsTime?.getTime() >= decoded.iat * 1000) {
    throw UnauthorizedException({ message: `Invalid login session` });
  }
  return { user, decoded };
};

export const createLoginCredentials = async (user, issuer) => {

  const { accessSignature, refreshSignature, audience } = await getTokenSignature(user.role);

  const jwtid = randomUUID();
  const access_token = await generateToken({
    payload: { sub: user._id },
    secret: accessSignature,
    options: {
      issuer,
      audience: [tokenTypeEnum.access, audience],
      expiresIn: ACCESS_EXPIRES_IN,
      jwtid
    }
  });
  const refresh_token = await generateToken({
    payload: { sub: user._id },
    secret: refreshSignature,
    options: {
      issuer,
      audience: [tokenTypeEnum.refresh, audience],
      expiresIn: REFRESH_EXPIRES_IN,
      jwtid
    }
  });
  return { access_token, refresh_token };
};
