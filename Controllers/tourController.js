const Tour = require("../Models/tourModel");
const APIFeatures = require("../Utils/apiFeatures");
const APIErrors = require("../Utils/apiErrors");

// IN specific year => get how many tours in each month (Aggregation Pipeline)
exports.getTourMonthlyPlan = async (req, res, next) => {
  try {
    const { year } = req.params;
    if (year > new Date().getFullYear() || year < 2000 || year === " ")
      throw new Error("This year not Valid!");

    const plan = await Tour.aggregate([
      { $unwind: "$startDates" },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$startDates" },
          numTours: { $sum: 1 },
          tours: { $push: "$name" },
        },
      },
      {
        $addFields: { month: "$_id" },
      },
      {
        $project: { _id: 0 },
      },
      {
        $sort: { month: 1 },
      },
    ]);
    res.status(200).json({
      status: "success",
      date: req.date,
      results: plan.length,
      data: { plan },
    });
  } catch (err) {
    next(err);
  }
};
// Aggregation Pipeline
exports.getTourStats = async (req, res, next) => {
  try {
    const toursStats = await Tour.aggregate([
      {
        $match: {},
      },
      {
        $group: {
          _id: "$difficulty",
          numTours: { $sum: 1 },
          numRating: { $sum: "$ratingsQuantity" },
          avgRating: { $avg: "$ratingsAverage" },
          avgPrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
      {
        $sort: { numTours: -1 },
      },
    ]);
    res.status(200).json({
      status: "success",
      date: req.date,
      data: { stats: toursStats },
    });
  } catch (err) {
    next(err);
  }
};

exports.aliasingTopCheap = (req, res, next) => {
  req.query.sort = "price,-duration";
  req.query.limit = "5";
  req.query.fields = "name,price,duration,difficulty,summary";
  next();
};

exports.aliasingTopRating = (req, res, next) => {
  req.query.sort = "-ratingsAverage,price";
  req.query.limit = "5";
  req.query.fields =
    "name,price,duration,difficulty,summary,ratingsAverage,ratingsQuantity";
  next();
};

exports.getAllTours = async (req, res, next) => {
  try {
    // Build Query step by step ( 1.Filtering  2.Sorting  3.Field Limiting  4.Pagination ) Chainable methods returning (this)
    const features = new APIFeatures(Tour.find(), req.query)
      .filter()
      .limitFields()
      .sort()
      .paginate();

    // Execute Query
    const tours = await features.query;

    // Send response (end req-res cycle)
    res.status(200).json({
      status: "success",
      date: req.date,
      results: tours.length,
      data: { tours: tours },
    });
  } catch (err) {
    next(err);
  }
};

exports.createTour = async (req, res, next) => {
  try {
    const newTour = await Tour.create(req.body);
    res.status(201).json({
      status: "success",
      date: req.date,
      tour: newTour,
    });
  } catch (err) {
    next(err);
  }
};

exports.getTour = async (req, res, next) => {
  try {
    const id = req.params.tourId;
    const tour = await Tour.findById(id).populate("reviews"); // or find({ _id: id })
    if (!tour) {
      return next(new APIErrors(404, "fail", "Invalid ID!"));
    }
    res.status(200).json({
      status: "success",
      date: req.date,
      data: { tour: tour },
    });
  } catch (err) {
    next(err);
  }
};

exports.updateTour = async (req, res, next) => {
  try {
    const id = req.params.tourId;
    const newTour = await Tour.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!newTour) {
      return next(new APIErrors(404, "fail", "Invalid ID!"));
    }
    res.status(200).json({
      status: "success",
      date: req.date,
      tour: newTour,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteTour = async (req, res, next) => {
  try {
    const id = req.params.tourId;
    const deletedTour = await Tour.findByIdAndDelete(id);
    if (!deletedTour) {
      return next(new APIErrors(404, "fail", "Invalid ID!"));
    }
    res.status(204).json({
      status: "success",
      date: req.date,
    });
  } catch (err) {
    next(err);
  }
};
