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
app.use("/api/v1/users", userRoutes);
app.use("/api/v2/users", userRoutes);

app.set("port", process.env.PORT || 8000);

app.get("/home", (req, res) => {
  return res.json({ hello: "world" });
});

const start = async () => {
  try {
    const connectionDb = await mongoose.connect(
      "mongodb+srv://<db_username>:Ui7M1tZu0WmyZMax@syncspace-cluster.nipsarr.mongodb.net/?appName=SyncSpace-Cluster ",
    );
    console.log(`MONGO Connected DB Host: ${connectionDb.connection.host}`);

    server.listen(app.get("port"), () => {
      console.log(`Server is running on port ${app.get("port")}`);
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};
start();
