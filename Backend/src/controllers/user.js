import user from "../models/user.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import Meeting from "../models/meeting.js";
import User from "../models/user.js";

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const existingUser = await user.findOne({ username });
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate random token and save to document
    let token = crypto.randomBytes(20).toString("hex");
    existingUser.token = token;
    await existingUser.save();

    return res.status(200).json({
      message: "Login successful",
      token: token,
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const register = async (req, res) => {
  const { name, username, password } = req.body;

  try {
    const existingUser = await user.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new user({
      name: name,

      username: username,

      password: hashedPassword,
    });

    await newUser.save();
    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getUserHistory = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Token required" });
    }

    const user = await User.findOne({ token: token });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const meetings = await Meeting.find({ user_id: user.username });
    return res.status(200).json(meetings);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

const addToHistory = async (req, res) => {
  const { token, meeting_code } = req.body;

  try {
    const user = await User.findOne({ token: token });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newMeeting = new Meeting({
      user_id: user.username, // Store user identifier
      meetingCode: meeting_code,
    });

    await newMeeting.save();
    return res.status(201).json({ message: "Added to history" });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

export { login, register, getUserHistory, addToHistory };
