const Review = require("../Models/reviewModel");
const APIFeatures = require("../Utils/apiFeatures");
const APIErrors = require("../Utils/apiErrors");
const Tour = require("../Models/tourModel");

// Calc ratings Average & Quantity for All Reviews and put in tour document when any Action happen in Reviews
const calcRatingsStats = async (tourId) => {
  const stats = await Review.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: "$tour",
        numRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  if (stats.length) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: stats[0].avgRating,
      ratingsQuantity: stats[0].numRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 4.5,
      ratingsQuantity: 0,
    });
  }
};

exports.getAllReviews = async (req, res, next) => {
  try {
    const filter = {};
    if (req.params.tourId) filter.tour = req.params.tourId;
    const newReview = new APIFeatures(Review.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const reviews = await newReview.query;

    res.status(200).json({
      status: "success",
      date: req.date,
      results: reviews.length,
      data: { reviews: reviews },
    });
  } catch (err) {
    next(err);
  }
};
exports.createReview = async (req, res, next) => {
  try {
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id;

    // Each User can review only once on one tour
    // ensure thst this user not create any review previous
    const isReview = await Review.find({
      tour: req.body.tour,
      user: req.body.user,
    });
    if (isReview.length !== 0)
      return next(
        new APIErrors(403, "fail", "Sorry You already Reviewed this Tour!")
      );

    // Oki Create this New Review
    const newReview = await Review.create(req.body);

    // Calc ratings Average & Quantity for All Reviews when any new review Created
    calcRatingsStats(newReview.tour);

    res
      .status(201)
      .json({ status: "success", date: req.date, review: newReview });
  } catch (err) {
    next(err);
  }
};
exports.getReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return next(new APIErrors(404, "fail", "Invalid ID!"));

    res.status(200).json({ status: "success", date: req.date, review: review });
  } catch (err) {
    next(err);
  }
};
exports.updateReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!review) return next(new APIErrors(404, "fail", "Invalid ID!"));

    // Calc ratings Average & Quantity for All Reviews when any new review Update
    calcRatingsStats(review.tour);

    res.status(200).json({ status: "success", date: req.date, review: review });
  } catch (err) {
    next(err);
  }
};
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return next(new APIErrors(404, "fail", "Invalid ID!"));

    // Calc ratings Average & Quantity for All Reviews when any new review Deleted
    calcRatingsStats(review.tour);

    res.status(204).json({ status: "success", date: req.date });
  } catch (err) {
    next(err);
  }
};
