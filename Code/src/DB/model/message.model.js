import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: {
        type: String,
        minLength: 2,
        maxLength: 100000,
        required: function () {
            return !this.attachments?.length;
        }
    },
    attachments: { type: [String] },

}, {
    timestamps: true,
    collection: "SARAHA_MESSAGES",
    strictQuery: true,
    strict: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

export const MessageModel = mongoose.models.Message || mongoose.model("Message", messageSchema);