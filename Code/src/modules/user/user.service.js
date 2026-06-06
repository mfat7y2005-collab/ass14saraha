import { ACCESS_EXPIRES_IN, REFRESH_EXPIRES_IN } from "../../../config/config.service.js";
import { logoutEnum } from "../../common/enums/security.enum.js";
import { baseRevokeTokenKey, deleteKey, keys, revokeTokenKey, set } from "../../common/services/index.js";
import { BadRequestException, ConfilectException } from "../../common/utils/response/error.response.js";
import { compareHash, generateHash } from "../../common/utils/security/hash.security.js";
import { createLoginCredentials } from "../../common/utils/security/token.security.js";
import { findOne } from "../../DB/database.service.js";
import { UserModel } from "../../DB/index.js";

const createRevokeToken = async ({ userId, jti, ttl }) => {
  await set({
    key: revokeTokenKey({ userId, jti }),
    value: jti,
    ttl
  });
  return;
};

export const updatePassword = async ({ oldPassword, password }, user, issuer) => {
  if (!await compareHash(oldPassword, user.password)) {
    throw ConfilectException({ message: "Invalid old password 😈" });
  }

  user.password = await generateHash(password);
  user.changeCredentialsTime = new Date();
  await user.save();
  await deleteKey(await keys(baseRevokeTokenKey(user._id)));
  return await createLoginCredentials(user, issuer);
};

export const logout = async ({ flag }, user, decoded = {}) => {
  const { jti, iat, sub } = decoded;

  let status = 200;
  switch (flag) {
    case logoutEnum.All:
      user.changeCredentialsTime = new Date();
      await user.save();
      await deleteKey(await keys(baseRevokeTokenKey(sub)));
      break;

    default:
      if (!jti || !iat || !sub) {
        throw BadRequestException({ message: "Invalid token payload for logout 😈" });
      }
      await createRevokeToken({
        userId: sub,
        jti,
        ttl: iat + REFRESH_EXPIRES_IN
      });

      status = 201;
      break;
  }
  return status;
};

export const rotateToken = async (user, { sub, jti, iat }, issuer) => {
  if ((iat + ACCESS_EXPIRES_IN) * 1000 >= Date.now() + (30000)) {
    throw ConfilectException({ message: "Current access token still valid 😍" });
  }
  await createRevokeToken({
    userId: sub,
    jti,
    ttl: iat + REFRESH_EXPIRES_IN
  });
  return await createLoginCredentials(user, issuer);
};

export const profileImage = async (file, user) => {
  user.profilePicture = file.finalPath;
  await user.save();
  return user;
};

export const profileCoverImage = async (files, user) => {
  user.coverProfilePictures = files.map(file => file.finalPath);
  await user.save();
  return user;
};

export const profile = async (user) => {
  return user;
};


export const shareProfile = async (userId) => {
  const profile = await findOne({
    model: UserModel,
    filter: { _id: userId },
    select: "phone profilePicture firstName  & lastName & email & username"
  });
  if (!profile) {
    throw BadRequestException({ message: "Fail to find matching profile 😈" });
  }
  if (profile.phone) {
    profile.phone = await generateDecryption(profile.phone);
  }
  return profile;
};