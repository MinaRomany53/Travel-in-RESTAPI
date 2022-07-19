const mongoose = require("mongoose");
const slugify = require("slugify");

// Creating Tour Schema
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A tour must have a name"],
      unique: true,
      trim: true,
      minLength: [8, "Minimum name length is 8 characters"],
      maxLength: [40, "Maximum name length is 40 characters"],
      validate: {
        validator: function (value) {
          return /^[ a-zA-Z]+$/g.test(value);
        },
        message: "Only alphabets Allowed",
      },
    },
    slug: String,
    summary: {
      type: String,
      required: [true, "A tour must have a summary"],
      trim: true,
      maxLength: [200, "Maximum summary length is 200 characters"],
    },
    description: {
      type: String,
      required: [true, "A tour must have a description"],
      trim: true,
      maxLength: [1000, "Maximum summary length is 1000 characters"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"],
      min: [2, "Minimum GroupSize is 2 "],
      max: [40, "Maximum GroupSize is 40 "],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message:
          "{VALUE} is not supported, You must choose difficulty field from: easy - medium - difficult ",
      },
    },
    imageCover: {
      type: String,
    },
    images: [String],
    duration: { type: Number, required: [true, "A tour must have a duration"] },
    price: {
      type: Number,
      required: [true, "A tour must have a price"],
      min: 100,
      max: 1000000,
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (value) {
          return value < this.price;
        },
        message: "Discount amount must be less than the original price",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1.0, "Rating must be above 1"],
      max: [5.0, "Rating must be below 5"],
    },
    ratingsQuantity: { type: Number, default: 0 },
    createAt: {
      type: Date,
      default: Date.now(),
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },

    // Embedded Document
    startLocation: {
      //GeoJSON
      geoType: {
        type: String,
        default: "point",
        enum: ["point"],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    // (1:Few Relation) (Embedded) array of documents
    locations: [
      {
        geoType: {
          type: String,
          default: "point",
          enum: ["point"],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // Child Referencing tourGuides (users with role guide)
    guides: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
  },

  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

/* ------------------- Start Mongoose Middleware ------------------- */

// MongoDB Indexes
// tourSchema.index({ price: 1 }); // execute query with Price faster
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });

//Virtual Populate to showing all Reviews Reelated to this Tour
tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour",
  localField: "_id",
});

// Document Middleware  -  runs before create() and save() see others on documentation
tourSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  this.name = this.name.replace(/  +/g, " ");
  next();
});

// tourSchema.post("save", (doc, next) => {
//   console.log("this document saved successfully");
//   console.log(doc);
//   next();
// });

// Query Middleware  - runs before find() see others on documentation
tourSchema.pre(/^find/, function (next) {
  this.startTime = Date.now();
  this.find({ secretTour: { $ne: true } }); // not showing any secret tours
  this.projection({ secretTour: 0 }); // not showing any secret tours
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate("guides"); // Replace All Referenced Ids with the related data
  next();
});
// tourSchema.post(/^find/, function (doc, next) {
//   console.log(`Time for this Query => ${Date.now() - this.startTime} ms`);
//   next();
// });

// Aggregation Middleware  - runs before aggregate() only
tourSchema.pre("aggregate", function (next) {
  const stage = { $match: { secretTour: { $ne: true } } };
  this.pipeline().unshift(stage); // add new stage at the first of aggregation pipeline array
  next();
});

// tourSchema.post("aggregate", function (doc, next) {
//   console.log(this);
//   next();
// });

/* ------------------- End Mongoose Middleware --------------------- */

//Creating Tour Model
const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;
