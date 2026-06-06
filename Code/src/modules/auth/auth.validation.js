import joi from "joi";
import { generalValidationFields } from "../../common/utils/validation.js";

export const verifyEmail = {
    body: joi.object().keys({
        email: generalValidationFields.email.required(),
    }).required()
};

export const verifyForgotPasswordCode = {
    body: verifyEmail.body.append({
        otp: generalValidationFields.otp.required(),
    }).required()
};

export const resetForgotPasswordCode = {
    body: verifyForgotPasswordCode.body.append({
        password: generalValidationFields.password.required(),
        confirmPassword: generalValidationFields.confirmPassword("password").required()
    }).required()
};

export const resetForgotPasswordLink = {
    body: joi.object().keys({
        userId: generalValidationFields.id.required(),
        token: joi.string().required(),
        password: generalValidationFields.password.required(),
        confirmPassword: generalValidationFields.confirmPassword("password").required()
    }).required()
};

export const login = {
    body: joi.object().keys({
        email: generalValidationFields.email.required(),
        password: generalValidationFields.password.required()
    }).required()
};

export const signup = {
    body: login.body.append({
        username: generalValidationFields.username.required(),
        phone: generalValidationFields.phone.required(),
        confirmPassword: generalValidationFields.confirmPassword("password").required()
    }).required(),
};

export const reSendConfirmEmail = {
    body: joi.object().keys({
        email: generalValidationFields.email.required(),
    }).required(),
};

export const confirmEmail = {
    body: joi.object().keys({
        email: generalValidationFields.email.required(),
        otp: generalValidationFields.otp.required()
    }).required(),
};