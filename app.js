const express = require("express");
const morgan = require("morgan");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");

const tourRouter = require("./Routes/tourRoutes");
const userRouter = require("./Routes/userRoutes");
const reviewRouter = require("./Routes/reviewRoutes");
const APIErrors = require("./Utils/apiErrors");

const app = express();

// Get all env variables in this file and save it as nodejs env variables
dotenv.config({ path: "./config.env" });

// Third Party Middleware - Set a Couple of security HTTP Headers to secure this APP
app.use(helmet());

// Third Party Middleware - Logging Response in the console
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// Third Party Middleware - Limiting Requests for each IP
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1hour in ms
  max: 100, // the limit is 100 Request per hour for each user
  message: "Your are Reached the Maximun Requests per hour, try again later",
});
app.use("/api", limiter);

// Built-In Middleware - Read request body from client (req.body)
app.use(express.json({ limit: "20kb" }));

// Third Party Middleware  - Data Sanitization
//  - Against NoSql query injection
app.use(mongoSanitize());
//  - Against XSS (Cross Site Scripting Attacks)
app.use(xss());

// Third Party Middleware  - Preventing Parameter Pollution
app.use(hpp());

// Application-Level Middleware
app.use((req, res, next) => {
  const date = new Date().toISOString();
  req.date = date;
  // console.log(req.headers);
  next();
});

// Router-Level Middleware
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);

// Handled Unhandled Routes
app.all("*", (req, res, next) => {
  next(
    new APIErrors(404, "fail", `Can't find ${req.originalUrl} in this server!`)
  );
});

// Error-handling middleware - Handling All Errors in the App
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  err.message = err.message || "Something Wrong happen";
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
});

module.exports = app;
