const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "your name is required!"],
    trim: true,
    minLength: [4, "At least 4 characters!"],
    maxLength: [20, "At most 20 characters!"],
    validate: {
      validator: function (value) {
        return /^[ a-zA-Z]+$/g.test(value);
      },
      message: "Only alphabets Allowed",
    },
  },
  email: {
    type: String,
    unique: true,
    required: [true, "Your email is required!"],
    trim: true,
    validate: {
      validator: function (value) {
        return validator.isEmail(value);
      },
      message: "This Email is not Valid",
    },
  },
  photo: {
    type: String,
  },
  password: {
    type: String,
    required: [true, "Password is required!"],
    minLength: [8, "Password must contains at least 8 characters!"],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "password must entered again"],
    validate: {
      validator: function (value) {
        return this.password === value;
      },
      message: "Password Don't Match!",
    },
  },
  role: {
    type: String,
    enum: {
      values: ["user", "guide", "admin"],
      message:
        "{VALUE} is not supported, You must choose difficulty field from: user - staff - admin ",
    },
    default: "user",
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  passwordChangeAt: Date,
});

// Encrypt Password - Using Document Middleware
userSchema.pre("save", async function (next) {
  // check first if the user modefied password or not
  if (!this.isModified("password")) return next();
  // Hash Password
  this.password = await bcrypt.hash(this.password, 12);
  // Don't save PasswordConfirmation in the DB
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
