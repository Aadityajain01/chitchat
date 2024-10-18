const express = require("express");
const userModel = require("../Models/userModel");
const handler = require("express-async-handler");
const generateToken = require("../Config/generateToken");

/// LOGIN CONTROLLER
const loginController = handler(async (req, res) => {
   const { name, password } = req.body;
   const user = await userModel.findOne({ name });

   // Check if the user exists and password matches
   if (user && (await user.matchPassword(password))) {
      // Convert user image to base64 if available
      const imageBase64 = user.image ? user.image.toString("base64") : null;

      // Respond with user details
      const response = {
         _id: user._id,
         name: user.name,
         email: user.email,
         isAdmin: user.isAdmin,
         image: imageBase64,
         token: generateToken(user._id),
      };
      res.json(response);
   } else {
      res.status(401);
      throw new Error("Invalid username or password");
   }
});

/// REGISTRATION CONTROLLER
const registerController = handler(async (req, res) => {
   try {
      const { name, email, password } = req.body;
      const image = req.file;

      // Check for missing fields
      if (!name || !email || !password) {
         return res.status(400).json({ error: "All fields are required" });
      }

      // Check if email already exists
      const emailExist = await userModel.findOne({ email });
      if (emailExist) {
         return res.status(400).json({ error: "Email already exists" });
      }

      // Check if username already exists
      const userExist = await userModel.findOne({ name });
      if (userExist) {
         return res.status(400).json({ error: "Username already exists" });
      }

      // Create new user in the database
      let newUser;
      if (image) {
         newUser = await userModel.create({
            name,
            email,
            password,
            image: image.buffer, // Store image as buffer
         });
      } else {
         newUser = await userModel.create({ name, email, password });
      }

      // Successful user creation
      if (newUser) {
         res.status(201).json({
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            token: generateToken(newUser._id), // Generate JWT token
         });
      } else {
         res.status(400).json({ error: "Failed to register user" });
      }
   } catch (error) {
      console.error("Registration error:", error.message, error);
      res.status(500).json({ error: "Internal Server Error" });
   }
});

/// FETCH ALL USERS CONTROLLER
const fetchAllUsersController = handler(async (req, res) => {
   try {
      const keyword = req.query.search
         ? {
              $or: [
                 { name: { $regex: req.query.search, $options: "i" } }, // Case-insensitive search
                 { email: { $regex: req.query.search, $options: "i" } },
              ],
           }
         : {};

      // Find users except the logged-in user
      const users = await userModel.find(keyword).find({
         _id: { $ne: req.user._id },
      });

      res.json(users);
   } catch (error) {
      console.error("Error fetching users:", error.message);
      res.status(500).json({ error: "Failed to fetch users" });
   }
});

module.exports = {
   registerController,
   loginController,
   fetchAllUsersController,
};
