import mongoose from "mongoose";
import { genderEnum, providerEnum, roleEnum } from "../../common/enums/user.enum.js";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: [true, "First name is required"], minLength: 2, maxLength: 25 },

    lastName: { type: String, required: [true, "Last name is required"], minLength: 2, maxLength: 25 },

    email: { type: String, required: true, unique: true },

    password: {
      type: String, required: function () {
        return this.provider == providerEnum.System;
      }
    },

    gender: { type: Number, enum: Object.values(genderEnum), default: genderEnum.Male },

    provider: { type: Number, enum: Object.values(providerEnum), default: providerEnum.System },

    role: { type: Number, enum: Object.values(roleEnum), default: roleEnum.User },

    confirmEmail: Date,
    changeCredentialsTime: Date,

    DOB: Date,

    oldPasswords: [String],
    phone: String,

    profilePicture: String,
    coverProfilePictures: [String],
  },
  {
    collection: "Saraha_Users",
    timestamps: true,
    strict: true,
    strictQuery: true,
    optimisticConcurrency: true,
    autoIndex: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

userSchema
  .virtual("username")
  .set(function (value) {
    const [firstName, lastName] = value?.split(" ") || [];
    this.set({ firstName, lastName });
  })
  .get(function () {
    return this.firstName + " " + this.lastName;
  });

export const UserModel =
  mongoose.models.User || mongoose.model("User", userSchema);