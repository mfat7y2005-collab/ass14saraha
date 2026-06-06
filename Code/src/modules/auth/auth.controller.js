import { Router } from "express";
import { login, signup, signupWithGmail, loginWithGmail, confirmEmail, reSendConfirmEmail, requestForgotPasswordCode, verifyForgotPasswordCode, resetForgotPasswordCode, requestForgotPasswordLink, resetForgotPasswordLink } from "./auth.service.js";
import * as validators from './auth.validation.js';
import { successResponse } from "../../common/utils/response/success.response.js";
import { validation } from "../../middleware/validation.middleware.js";
const router = Router();

router.post("/signup", validation(validators.signup), async (req, res, next) => {
  const account = await signup(req.body);
  return successResponse({ res, status: 201, data: { account } });
});

router.post("/request-forget-password-code",
  validation(validators.verifyEmail),
  async (req, res, next) => {
    await requestForgotPasswordCode(req.body);
    return successResponse({ res, status: 201 });
  });

router.patch("/verify-forget-password-code",
  validation(validators.verifyForgotPasswordCode),
  async (req, res, next) => {
    await verifyForgotPasswordCode(req.body);
    return successResponse({ res, status: 200 });
  });

router.patch("/reset-forget-password-code",
  validation(validators.resetForgotPasswordCode),
  async (req, res, next) => {
    await resetForgotPasswordCode(req.body);
    return successResponse({ res, status: 200 });
  });

router.post("/request-forget-password-link",
  validation(validators.verifyEmail),
  async (req, res, next) => {
    await requestForgotPasswordLink(req.body, `${req.protocol}://${req.host}`);
    return successResponse({ res, status: 201 });
  });

router.patch("/reset-forget-password-link",
  validation(validators.resetForgotPasswordLink),
  async (req, res, next) => {
    await resetForgotPasswordLink(req.body);
    return successResponse({ res, status: 200 });
  });

router.patch("/confirm-email", validation(validators.confirmEmail), async (req, res, next) => {
  const account = await confirmEmail(req.body);
  return successResponse({ res });
});


router.patch("/resend-confirm-email", validation(validators.reSendConfirmEmail), async (req, res, next) => {
  const account = await reSendConfirmEmail(req.body);
  return successResponse({ res });
});

router.post("/login", validation(validators.login), async (req, res, next) => {
  const account = await login(req.body, `${req.protocol}://${req.host}`);
  return successResponse({ res, data: { ...account } });
});

router.post("/signup/gmail", async (req, res, next) => {
  const { account, status = 201 } = await signupWithGmail(req.body, `${req.protocol}://${req.host}`);
  return successResponse({ res, status, data: { account } });
});

router.post("/login/gmail", async (req, res, next) => {
  const account = await loginWithGmail(req.body, `${req.protocol}://${req.host}`);
  return successResponse({ res, data: { account } });
});

export default router;
