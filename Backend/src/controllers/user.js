import user from "../models/user.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

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
  const { name, username, password, email } = req.body;

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

      email: email,
    });

    await newUser.save();
    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export { login, register };
