const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { promisify } = require("util");
const APIErrors = require("../Utils/apiErrors");
const sendEmail = require("../Utils/email");
const User = require("../Models/userModel");

exports.signup = async (req, res, next) => {
  try {
    // Create New User in Database
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    });
    newUser.password = undefined; // not showing it in the response
    newUser.active = undefined;
    newUser.role = undefined;

    // Create new unique JWT
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_PRIVATE_KEY, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    // Send Welcome Email
    const options = {
      email: newUser.email,
      subject: "Welcome To BookIt",
      message: `Welcome to the Best Booking Tours Company ,feel free to contact us at any time\n Best Regards\n CEO: Mina Romany
      `,
    };
    await sendEmail(options);

    // Send JWT with Cookie to the Browser
    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 60 * 60 * 1000
      ),
      httpOnly: true,
    };
    if (process.env.NODE_ENV === "Production") cookieOptions.secure = true; // https only in production

    res.cookie("jwt", token, cookieOptions);

    // Send Response
    res.status(201).json({
      status: "success",
      date: req.date,
      token: token,
      data: { user: newUser },
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    // Check user credentials first
    const { email, password } = req.body;
    if (!email || !password)
      return next(new APIErrors(400, "fail", "Email and Password Required!"));
    // Check Email -if user exist?
    const account = await User.findOne({ email: email }).select("+password");
    if (!account)
      return next(new APIErrors(401, "fail", "Sorry ,user not found!"));
    // Check Password
    const checkPass = await bcrypt.compare(password, account.password);
    if (!checkPass)
      return next(
        new APIErrors(401, "fail", "Sorry ,email or password is incorrect!")
      );

    // congratulations now we can Create new unique JWT as a passport to this user
    const token = jwt.sign({ id: account._id }, process.env.JWT_PRIVATE_KEY, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    // return Logged User Info Without the Password
    account.password = undefined;

    // Send JWT with Cookie to the Browser
    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 60 * 60 * 1000
      ),
      httpOnly: true,
    };
    if (process.env.NODE_ENV === "Production") cookieOptions.secure = true; // https only in production

    res.cookie("jwt", token, cookieOptions);

    // Send Response
    res.status(200).json({
      status: "success",
      date: req.date,
      token: token,
      account: account,
    });
  } catch (err) {
    next(err);
  }
};

exports.protect = async (req, res, next) => {
  try {
    // Check if Token exist first - find it in req.headers
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.split(" ")[0] === "Bearer"
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) return next(new APIErrors(401, "fail", "Please Login First!"));

    // Verify this Token
    const decodeToken = await promisify(jwt.verify)(
      token,
      process.env.JWT_PRIVATE_KEY
    );

    // Check if this user still exist
    const currentUser = await User.findById(decodeToken.id);
    if (!currentUser)
      return next(new APIErrors(401, "fail", "This User no longer exist!"));

    // Check if user change password after sending this Token
    if (currentUser.passwordChangeAt) {
      const tokenIssuedAt = decodeToken.iat; // seconds
      const passChangedAt = currentUser.passwordChangeAt.getTime() / 1000; // seconds
      if (tokenIssuedAt < passChangedAt) {
        return next(
          new APIErrors(
            401,
            "fail",
            "This User change his Password, Please Login Again!"
          )
        );
      }
    }

    // Move to next Middleware
    req.user = currentUser; // use it to access Role of current user - next middleware
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError")
      err.message = "Invalid Token, Please Login Again!";
    if (err.name === "TokenExpiredError")
      err.message = "Your Token Expired, Please Login Again!";
    err.statusCode = 401;
    next(err);
  }
};

exports.restrictTo = function (...roles) {
  // return middleware function
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new APIErrors(
          403,
          "fail",
          "Sorry,You don't havne permission to perform this Action!"
        )
      );
    next();
  };
};

exports.forgetPassword = async (req, res, next) => {
  try {
    // Cehck that Email
    if (!req.body.email)
      return next(new APIErrors(400, "fail", "Please Enter Valid Email!"));
    // Check if user exist with this email
    const user = await User.findOne({ email: req.body.email });
    if (!user)
      return next(
        new APIErrors(404, "fail", "There is no user with this email address!")
      );

    // Create random JWT
    const token = jwt.sign({ email: user.email }, process.env.JWT_PRIVATE_KEY, {
      expiresIn: "10minute",
    });

    // Send it to user's email to reset password
    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/users/resetPassword/${token}`; //http://localhost:8000/api/v1/users/resetPassword/token
    const options = {
      email: user.email,
      subject: "Reset Your Password - (Only Valid For 10 Minutes)",
      message: `Hello from BookIt - Please Reset Your Password by PATCH request with your new password and passwordConfirm to: ${resetURL}`,
    };
    await sendEmail(options);
    console.log("Email sent successfully");

    // Send response
    res.status(200).json({
      status: "success",
      message: "E-mail Sent Successfully",
    });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    // Check and Verify JWT
    const decodeToken = await promisify(jwt.verify)(
      req.params.token,
      process.env.JWT_PRIVATE_KEY
    );
    //Get User based on JWT
    const user = await User.findOne({ email: decodeToken.email });
    if (!user)
      return next(
        new APIErrors(400, "fail", "Invalid Token, Please Try Again!")
      );
    // Change User Password and PasswordChangeAt property
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordChangeAt = new Date() - 1000;
    await user.save(); // to run all validators and document middleware function
    // Log In The User
    const token = jwt.sign({ id: user._id }, process.env.JWT_PRIVATE_KEY, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    // Send JWT with Cookie to the Browser
    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 60 * 60 * 1000
      ),
      httpOnly: true,
    };
    if (process.env.NODE_ENV === "Production") cookieOptions.secure = true; // https only in production

    res.cookie("jwt", token, cookieOptions);

    // Send Response
    res.status(200).json({
      status: "success",
      date: req.date,
      message: "Your Password Changed Successfully",
      token: token,
    });
  } catch (err) {
    if (err.name === "JsonWebTokenError")
      err.message = "Invalid Token, Please Try Again!";
    if (err.name === "TokenExpiredError")
      err.message = "Your Token Expired, Please Try Again!";
    err.statusCode = 401;
    next(err);
  }
};

exports.updatMyPassword = async (req, res, next) => {
  try {
    // Get User
    const user = await User.findById(req.user.id).select("+password");
    // Check User Password
    const checkPass = await bcrypt.compare(req.body.password, user.password);
    if (!checkPass)
      return next(new APIErrors(401, "fail", "Password is not Correct!"));
    // Update User Password to the new Password and specify PasswordChangeAt property
    user.password = req.body.newPassword;
    user.passwordConfirm = req.body.newPasswordConfirm;
    user.passwordChangeAt = new Date() - 1000;
    await user.save(); // to run all validators and document middleware function
    // Log User in  - send JWT Token
    const token = jwt.sign({ id: user._id }, process.env.JWT_PRIVATE_KEY, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
    // Send JWT with Cookie to the Browser
    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 60 * 60 * 1000
      ),
      httpOnly: true,
    };
    if (process.env.NODE_ENV === "Production") cookieOptions.secure = true; // https only in production

    res.cookie("jwt", token, cookieOptions);

    // Send Response
    res.status(200).json({
      status: "success",
      date: req.date,
      message: "Your Password Updated Successfully",
      token: token,
    });
  } catch (err) {
    if (err.name === "JsonWebTokenError")
      err.message = "Invalid Token, Please Try Again!";
    if (err.name === "TokenExpiredError")
      err.message = "Your Token Expired, Please Try Again!";
    err.statusCode = 401;
    next(err);
  }
};
