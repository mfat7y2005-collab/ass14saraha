import { NotFoundException } from "../../common/utils/index.js";
import { createOne, deleteOne, find, findOne } from "../../DB/database.service.js";
import { MessageModel, UserModel } from "../../DB/index.js";

export const sendMessage = async (receiverId, files = [], { content }, user) => {
    const receiver = await findOne({
        model: UserModel,
        filter: {
            _id: receiverId,
            confirmEmail: { $exists: true }
        },
    });
    if (!receiver) {
        throw NotFoundException({ message: "No matching account" });
    }

    const message = await createOne({
        model: MessageModel,
        data: {
            content,
            attachments: files.map(file => file.finalPath),
            receiverId,
            senderId: user ? user._id : undefined
        }

    });
    return message;
};

export const getMessageById = async (messageId, user) => {
    const message = await findOne({
        model: MessageModel,
        select: "-senderId",
        filter: {
            _id: messageId,
            $or: [
                { senderId: user._id },
                { receiverId: user._id }
            ],
        }
    });
    if (!message) {
        throw NotFoundException({ message: "Invalid message id or not authorized action" });
    }
    return message;
};

export const deleteMessageById = async (messageId, user) => {
    const message = await deleteOne({
        model: MessageModel,
        filter: {
            _id: messageId,
            receiverId: user._id,
        },
    });
    if (!message.deletedCount) {
        throw NotFoundException({ message: "Invalid message id or not authorized action" });
    }
    return message;
};

export const getAllMessages = async (user) => {
    const messages = await find({
        model: MessageModel,
        filter: {
            $or: [
                { senderId: user._id },
                { receiverId: user._id }
            ],
        },
    });
    return messages;
};