import { ORIGINS, port } from '../config/config.service.js';
import { connectDB, redisConnection } from './DB/index.js';
import { globalErrorHandling } from './common/utils/response/error.response.js';
import { authRouter, messageRouter, userRouter } from './modules/index.js';
import express from "express";
import cors from 'cors';
import { resolve } from 'node:path';
import helmet from 'helmet';

async function bootstrap() {
  const app = express();
  var corsOptions = {
    origin: ORIGINS,
    optionsSuccessStatus: 200 
  };
  app.use(cors(corsOptions), helmet(), express.json());
  app.use("/uploads", express.static(resolve("../uploads")));

  // DB
  await connectDB();
  await redisConnection();

  // Application routing
  app.use("/auth", authRouter);
  app.use('/user', userRouter);
  app.use('/message', messageRouter);

  // Invalid routing 
  app.use("{/*dummy}", (req, res) => {
    return res.status(404).json({ message: "Invalid application routing 😈" });
  });

  // Error-handling
  app.use(globalErrorHandling);

  app.listen(port, () => console.log(`Server is running on port ${port} ✈️`));
}
export default bootstrap;
