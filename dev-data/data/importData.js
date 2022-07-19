/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const fs = require("fs");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const Tour = require("../../Models/tourModel.js");
const User = require("../../Models/userModel");
const Review = require("../../Models/reviewModel");

// Get all env variables in this file and save it as nodejs env variables
dotenv.config({ path: "../../config.env" });

// Conncet With Mongo DB
const URL = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(URL)
  .then(() => console.log("Database connection successful ✅"))
  .catch((err) => {
    console.error("Database connection error ❌");
    console.log(err);
  });

// Reading Data from a File
const toursData = JSON.parse(fs.readFileSync(`./tours.json`, "utf-8"));
const usersData = JSON.parse(fs.readFileSync(`./users.json`, "utf-8"));
const reviewsData = JSON.parse(fs.readFileSync(`./reviews.json`, "utf-8"));

// Import data into Collection
const importData = async () => {
  try {
    await Tour.create([...toursData]);
    await User.create([...usersData], { validateBeforeSave: false });
    await Review.create([...reviewsData]);
    console.log("All the data in the file inserted successfully ✅");
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// Delete All Data from a Collection
const delteAllData = async () => {
  try {
    await Tour.deleteMany({});
    await User.deleteMany({});
    await Review.deleteMany({});
    console.log("All the data in this Collection Deleted Successfully ✅");
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

importData();
// delteAllData();
