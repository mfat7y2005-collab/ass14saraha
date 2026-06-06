import { hash, compare } from "bcrypt";
import * as argon2 from "argon2";
import { SALT_ROUND } from "../../../../config/config.service.js";
import { hashEnum } from "../../enums/index.js";
import { BadRequestException } from "../response/error.response.js";

export const generateHash = async (plaintext, salt = SALT_ROUND, algo = hashEnum.Bcrypt) => {
    if (plaintext === undefined || plaintext === null) {
        throw BadRequestException({ message: "Password is required for hashing" });
    }

    const value = Buffer.isBuffer(plaintext) ? plaintext : String(plaintext);

    let rounds = salt;
    if (typeof rounds === "string") {
        rounds = parseInt(rounds, 10);
    }
    if (!Number.isInteger(rounds) || rounds <= 0) {
        rounds = SALT_ROUND || 10;
    }

    let hashResult = "";
    switch (algo) {
        case hashEnum.Bcrypt:
            hashResult = await hash(value, rounds);
            break;

        case hashEnum.Argon:
            hashResult = await argon2.hash(value);
            break;
        default:
            hashResult = await hash(value, rounds);
            break;
    }
    return hashResult;
};

export const compareHash = async (plaintext, cipherText, algo = hashEnum.Bcrypt) => {
    if (typeof plaintext === "object" && plaintext !== null && cipherText === undefined) {
        const opts = plaintext;
        plaintext = opts.plaintext;
        cipherText = opts.cipherText;
        algo = opts.algo || hashEnum.Bcrypt;
    }

    if (plaintext === undefined || cipherText === undefined) {
        throw BadRequestException({ message: "Both plaintext and cipherText are required for comparison" });
    }

    let match = false;
    switch (algo) {
        case hashEnum.Bcrypt:
            match = await compare(plaintext, cipherText);
            break;

        case hashEnum.Argon:
            match = await argon2.verify(cipherText, plaintext);
            break;
        default:
            match = await compare(plaintext, cipherText);
            break;
    }
    return match;
};

