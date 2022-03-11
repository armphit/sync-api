const express = require("express");
const bodyParser = require("body-parser");
const app = express();

var {
  registerController,
  loginController,
  syncOPDController,
} = require("./controller/userController");

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methode", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-HEADERS", "content-type, x-access-token");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

app.post("/register", registerController);
app.post("/login", loginController);
app.post("/syncOPD", syncOPDController);
app.post("/syncOPD", syncOPDController);

module.exports = app;

app.get("/", (req, res) => {
  res.end("welcom to root path");
});

app.listen(2000, () => {
  console.log("Web Service Online:2000");
});
