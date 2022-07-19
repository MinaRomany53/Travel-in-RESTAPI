const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, "Review can not be empty!"],
    trim: true,
  },
  rating: {
    type: Number,
    default: 4.5,
    min: [1.0, "Rating must be above 1"],
    max: [5.0, "Rating must be below 5"],
  },
  createAt: {
    type: Date,
    default: Date.now(),
  },

  // Parent Referencing (User who wrote this Review)
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "Review Must belong to a User!"],
  },
  // Parent Referencing (Tour which Review about)
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: "Tour",
    required: [true, "Review Must belong to a Tour!"],
  },
});

// Query Middleware
// Replace All Referenced Ids with the related data
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name",
  });
  next();
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
