import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import cors from "cors";

import connectToSocket from "./src/controllers/socketManager.js";
import userRoutes from "./src/routes/user.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

//middleware configuration
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

//routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v2/users", userRoutes);

app.set("port", process.env.PORT || 8000);

app.get("/home", (req, res) => {
  return res.json({ hello: "world" });
});

const start = async () => {
  try {
    if (!process.env.MONGO_URL) {
      throw new Error("MONGO_URL environment variable is missing.");
    }
    const connectionDb = await mongoose.connect(process.env.MONGO_URL);
    console.log(`MONGO Connected DB Host: ${connectionDb.connection.host}`);

    server.listen(app.get("port"), () => {
      console.log(`Server is running on port ${app.get("port")}`);
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};
start();
