import { tokenTypeEnum } from "../common/enums/security.enum.js"
import { BadRequestException, ForbiddenException, UnauthorizedException } from "../common/utils/response/error.response.js"
import { decodeToken } from "../common/utils/security/token.security.js"

export const authentication = (tokenType = tokenTypeEnum.access) => {
    return async (req, res, next) => {
        const [key, credential] = req.headers?.authorization?.split(" ") || [];
        console.log({key, credential});
        if (!key || !credential) {
            throw UnauthorizedException({message: "Missing authorization"})
        }
        switch (key) {
            case 'Basic':
                const [username, password] = Buffer.from(credential, 'base64').toString().split(":")
                console.log({username, password});
                break;

            default:
                const { user, decoded } = await decodeToken({ token: credential, tokenType });
                req.user = user;
                req.decoded = decoded;
                break;
        }
        next();
    }
}




export const authorization = (accessRoles = [], tokenType = tokenTypeEnum.access) => {
    return async (req, res, next) => {
        if (!req?.headers?.authorization) {
            throw BadRequestException({message:"Missing authorization key"})
        }
        req.user = await decodeToken({token: req.headers?.authorization, tokenType})
        console.log(req.user.role);
        if (!accessRoles.includes(req.user.role)) {
            throw ForbiddenException({message:"Not allowed account"})
        }
        next()
    }
}