const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userModel = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // Add this if usernames should be unique
    },
    email: {
      type: String,
      required: true,
      // unique: true, // Ensures unique emails
    },
    password: {
      type: String,
      required: true,
    },
    image: {
      type: Buffer, // Buffer for storing image data
    },
  },
  {
    timestamps: true, // Fix the typo here
  }
);

// Method to compare entered password with hashed password
userModel.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Pre-save middleware for hashing password
userModel.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model("User", userModel);

module.exports = User;
