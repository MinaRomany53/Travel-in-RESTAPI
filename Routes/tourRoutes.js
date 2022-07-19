const express = require("express");
const tourController = require("../Controllers/tourController");
const authController = require("../Controllers/authController");
const reviewRouter = require("./reviewRoutes");

const router = express.Router();

router
  .route("/")
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo("admin", "guide"),
    tourController.createTour
  );
router
  .route("/top-5-cheap")
  .get(tourController.aliasingTopCheap, tourController.getAllTours);
router
  .route("/top-5-rating")
  .get([tourController.aliasingTopRating, tourController.getAllTours]);
router
  .route("/stats")
  .get(
    authController.protect,
    authController.restrictTo("admin"),
    tourController.getTourStats
  );
router
  .route("/monthly-plan/:year")
  .get(
    authController.protect,
    authController.restrictTo("admin"),
    tourController.getTourMonthlyPlan
  );
router
  .route("/:tourId")
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo("admin", "guide"),
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin", "guide"),
    tourController.deleteTour
  );

// Nested Routes
router.use("/:tourId/reviews", reviewRouter);

module.exports = router;
