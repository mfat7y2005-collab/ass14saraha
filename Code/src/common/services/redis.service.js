import { redisClient } from "../../DB/index.js";
import { emailEnum } from "../enums/email.enum.js";

export const baseRevokeTokenKey = (userId)=>{
  return `RevokeToken::${userId}`
}

export const revokeTokenKey = ({userId, jti} = {})=>{
  return `${baseRevokeTokenKey(userId)}::${jti}`
}

export const otpKey = ({email, type=emailEnum.ConfirmEmail}={})=>{
  return `OTP::User::${email}::${type}`
}

export const otpMaxRequestKey = ({email, type=emailEnum.ConfirmEmail})=>{
  return `${otpKey({email, type})}::Request`
}

export const otpBlockKey = ({email, type=emailEnum.ConfirmEmail})=>{
  return `${otpKey({email, type})}::Block::Request`
}

export const forgotPasswordLinkKey = ({userId} = {}) => {
  return `ForgotPasswordLink::User::${userId}`
}

export const set = async ({
  key, 
  value,
  ttl
} = {}) => {
  try {
    let data = typeof value === 'string' ? value : JSON.stringify(value)
    return ttl ? await redisClient.set(key, data, {EX:ttl}) : await redisClient.set(key, data)

  } catch (error) {
    console.log(`Fail in redis set operation ${error}`);
  }
};


export const update = async ({
  key, 
  value,
  ttl
} = {}) => {
  try {
    if (!await redisClient.exists(key)) return 0;
    return await set({key, value, ttl})
     
  } catch (error) {
    console.log(`Fail in redis update operation ${error}`);
  }
};

export const increment = async (key) => {
  try {
    if (!await redisClient.EXISTS(key)){
      return 0;
    }
    return redisClient.incr(key) 
  } catch (error) {
        console.log(`Fail to set this operation`);

  }
};

export const get = async (key) => { 
  try {
    
    try {
      return JSON.parse(await redisClient.get(key))

    } catch (error) {
      return await redisClient.get(key)
    }

  } catch (error) {
    console.log(`Fail in redis get operation ${error}`);
  }
}; 

export const ttl = async (key) => { 
  try {
    return await redisClient.ttl(key)
  } catch (error) {
    console.log(`Fail in redis ttl operation ${error}`);
    return -2;
  }
};

export const exists = async (key) => { 
  try {
    return await redisClient.exists(key)
  } catch (error) {
    console.log(`Fail in redis exists operation ${error}`);
  }
};

export const expire = async ({
  key, 
  ttl
} = {}) => { 
  try {
    return await redisClient.expire(key, ttl)
  } catch (error) {
    console.log(`Fail in redis add-expire operation ${error}`);
  }
};

export const mGet = async (keys=[]) => { 
  try {
    if (!keys.length) return 0;
    return await redisClient.mGet(keys)
  } catch (error) {
    console.log(`Fail in redis mGet operation ${error}`);
    return -2;
  }
};

export const keys = async(prefix)=>{
  try {
    return await redisClient.keys(`${prefix}*`)
  } catch (error) {
    console.log(`Fail in redis keys operation ${error}`);
  }
};

export const deleteKey = async (key) => { 
  try {
    if (!key.length) return 0;
    return await redisClient.del(key)
  } catch (error) {
    console.log(`Fail in redis delete operation ${error}`);
  }
};