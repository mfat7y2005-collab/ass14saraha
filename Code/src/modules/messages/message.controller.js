import { Router } from "express";
import { BadRequestException, decodeToken, fileFieldValidation, localFileUpload, successResponse } from "../../common/utils/index.js";
import { deleteMessageById, getAllMessages, getMessageById, sendMessage } from "./message.service.js";
import { validation } from "../../middleware/validation.middleware.js";
import { authentication } from "../../middleware/authentication.middleware.js";
import * as validators from './message.validation.js';
import { tokenTypeEnum } from "../../common/enums/security.enum.js";
const router = Router();

router.post(
    "/:receiverId",
    async (req, res, next) => {
        if (req.headers?.authorization) {
            const { user, decoded } = await decodeToken({ token: req.headers.authorization.split(" ")[1], tokenType: tokenTypeEnum.access });
            req.user = user;
            req.decoded = decoded;
        }
        next();
    },
    localFileUpload({ customPath: "messages", validation: fileFieldValidation.image, maxSize: 1 }).array("attachments", 2),
    validation(validators.sendMessage),
    async (req, res, next) => {
        if (!req.body?.content && !req.files) {
            throw BadRequestException({ message: "validation error", extra: { message: "at least one key is required from [content, attachment]" } });
        }
        const message = await sendMessage(req.params.receiverId, req.files, req.body, req.user);
        return successResponse({ res, status: 201, data: { message } });
    });

router.get(
    "/list",
    authentication(),
    async (req, res, next) => {
        const messages = await getAllMessages(req.user);
        return successResponse({ res, status: 200, data: { messages } });
    });


router.get(
    "/:messageId",
    authentication(),
    validation(validators.getMessage),
    async (req, res, next) => {
        const message = await getMessageById(req.params.messageId, req.user);
        return successResponse({ res, status: 200, data: { message } });
    });


router.delete(
    "/:messageId",
    authentication(),
    validation(validators.getMessage),
    async (req, res, next) => {
        const message = await deleteMessageById(req.params.messageId, req.user);
        return successResponse({ res, status: 200, data: { message } });
    });

export default router;