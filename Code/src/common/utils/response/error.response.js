import multer from "multer";
import { NODE_ENV } from "../../../../config/config.service.js";

export const ErrorResponse = ({ message = "Error", status = 400, extra = undefined } = {}) => {
    throw new Error(message, { cause: { status, extra } });
};

export const BadRequestException = ({ message = "BadRequestException", extra = undefined } = {}) => {
    return ErrorResponse({ message, status: 400, extra });
};

export const ConfilectException = ({ message = "ConfilectException", extra = undefined } = {}) => {
    return ErrorResponse({ message, status: 409, extra });
};

export const UnauthorizedException = ({ message = "UnauthorizedException", extra = undefined } = {}) => {
    return ErrorResponse({ message, status: 401, extra });
};

export const NotFoundException = ({ message = "NotFoundException", extra = undefined } = {}) => {
    return ErrorResponse({ message, status: 404, extra });
};

export const ForbiddenException = ({ message = "ForbiddenException", extra = undefined } = {}) => {
    return ErrorResponse({ message, status: 403, extra });
};

export const globalErrorHandling = (error, req, res, next) => {
    let status = error.cause?.status ?? 500;
    const mood = NODE_ENV == "production";
    const defaultErrorMessage = "something went wrong server error";
    const displayErrorMessage = error.message || defaultErrorMessage;
    if (error instanceof multer.MulterError) {
        status = 400;
    }

    return res.status(status).json({
        status,
        stack: mood ? undefined : error.stack,
        errorMessage: mood ? status == 500 ? defaultErrorMessage : displayErrorMessage : displayErrorMessage
    });
};