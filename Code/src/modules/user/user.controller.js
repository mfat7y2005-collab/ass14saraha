import { Router } from "express";
import { logout, profile, profileCoverImage, profileImage, rotateToken, shareProfile, updatePassword } from "./user.service.js";
import { successResponse } from "../../common/utils/response/success.response.js";
import { authentication } from "../../middleware/authentication.middleware.js";
import { tokenTypeEnum } from "../../common/enums/security.enum.js";
import { validation } from "../../middleware/validation.middleware.js";
import * as validators from "./user.validation.js";
import { fileFieldValidation, localFileUpload } from "../../common/utils/multer/index.js";
const router = Router();


router.post(
  "/logout",
  authentication(),
  async (req, res, next) => {
    const status = await logout(req.body, req.user, req.decoded);
    return successResponse({ res, status });
  });

router.patch(
  "/password",
  authentication(),
  validation(validators.updatePassword),
  async (req, res, next) => {
    const credentials = await updatePassword(req.body, req.user, `${req.protocol}://${req.host}`);
    return successResponse({ res, data: { ...credentials } });
  });

router.patch(
  "/profile-image",
  authentication(),
  localFileUpload({
    customPath: 'user/profile',
    validation: fileFieldValidation.image,
    maxSize: 5
  }).single("attachment"),
  validation(validators.profileImage),
  async (req, res, next) => {
    const account = await profileImage(req.file, req.user);
    return successResponse({ res, data: { account } });
  });

router.patch(
  "/profile-cover-image",
  authentication(),
  localFileUpload({
    customPath: 'user/profile/cover',
    validation: fileFieldValidation.image,
    maxSize: 10
  }).array("attachments", 5),
  validation(validators.profileCoverImage),
  async (req, res, next) => {
    const account = await profileCoverImage(req.files, req.user);
    return successResponse({ res, data: { account } });
  });

router.get(
  "/",
  authentication(),
  async (req, res, next) => {
    const account = await profile(req.user);
    return successResponse({ res, data: { account } });
  });


router.post(
  "/rotate-token",
  authentication(tokenTypeEnum.refresh),
  async (req, res, next) => {
    const credential = await rotateToken(req.user, req.decoded, `${req.protocol}://${req.host}`);
    return successResponse({ res, status: 201, data: { ...credential } });
  });

router.get(
  "/:userId/share-profile",
  validation(validators.shareProfile),
  async (req, res, next) => {
    const account = await shareProfile(req.params.userId);
    return successResponse({ res, data: { account } });
  });


export default router;
