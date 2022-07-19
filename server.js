// This File Containing Staff Not Related to (Express framework)😁
const mongoose = require("mongoose");
const app = require("./app.js");

const URL = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

// Conncet With Mongo DB
mongoose
  .connect(URL)
  .then(() => console.log("Database connection successful ✅"))
  .catch((err) => {
    console.error("Database connection error ❌");
    console.log(err);
  });

app.listen(process.env.PORT, () => {
  console.log(`Server is Running At http://localhost:${process.env.PORT}/`);
});
