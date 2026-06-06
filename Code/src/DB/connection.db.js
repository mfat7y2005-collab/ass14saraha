import mongoose from "mongoose";
import { DB_URI } from "../../config/config.service.js";
import { UserModel } from "./model/user.model.js";

export const connectDB = async () => {
  try {
    const result = await mongoose.connect(DB_URI,{serverSelectionTimeoutMS:5000});
    await UserModel.syncIndexes();
    console.log(`DB connected successfully ✈️`);
  } catch (error) {
    console.log(`Failed to connect to DB ${error} 😈`);
  }
};
