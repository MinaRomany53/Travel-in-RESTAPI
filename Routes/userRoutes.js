const express = require("express");
const userController = require("../Controllers/userController");
const authController = require("../Controllers/authController");

const router = express.Router();

/////////////////////////////////////
/////// Authentication Routes ///////
/////////////////////////////////////
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/forgetPassword", authController.forgetPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

// User Protect as a middleware that runs before all this routes middelwares
router.use(authController.protect);

// User Actions
router.patch("/updatePassword", authController.updatMyPassword);
router.get("/me", userController.getMe);
router.patch("/updateMe", userController.updateMe);
router.delete("/deleteMe", userController.deleteMe);

// Admin Actions
router
  .route("/")
  .get(authController.restrictTo("admin"), userController.getAllUsers);

router
  .route("/:id")
  .get(authController.restrictTo("admin"), userController.getUser)
  .patch(authController.restrictTo("admin"), userController.updateUser)
  .delete(authController.restrictTo("admin"), userController.deleteUser);

module.exports = router;
