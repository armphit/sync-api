const express = require("express");
const bodyParser = require("body-parser");
const app = express();

var {
  registerController,
  loginController,
  updatePasswordController,
} = require("./controller/userController");
var {
  syncOPDController,
  syncOPDManualController,
} = require("./controller/syncController");

var {
  soapDIHController,
  prinstickerDataController,
} = require("./controller/soapController");

var {
  checkpatientController,
  deletecheckmedController,
  updatecheckmedController,
} = require("./controller/checkmedController");

var {
  patientSyncController,
  drugSyncController,
  listDrugSyncController,
  listPatientAllergicController,
} = require("./controller/interfaceController");

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
app.post("/updatePassword", updatePasswordController);
app.post("/syncOPD", syncOPDController);
app.post("/syncOPDManual", syncOPDManualController);
app.post("/soapDIH", soapDIHController);
app.post("/patientSync", patientSyncController);
app.post("/drugSync", drugSyncController);
app.post("/listDrugAllSync", listDrugSyncController);
app.post("/listPatientAllergicController", listPatientAllergicController);

app.post("/prinsticker", prinstickerDataController);
app.post("/checkpatient", checkpatientController);
app.post("/deletecheckmed", deletecheckmedController);
app.post("/updatecheckmed", updatecheckmedController);

// app.post("/prinstickerData", function (req, res) {
//   checkpatientController;
// });
// app.post("/syncOPDManual", function (req, res) {
//   syncOPDManualController;
// });
// app.post("/test", function (req, res) {
//   test;
// });

module.exports = app;

app.get("/", (req, res) => {
  res.end("welcom to root path");
});

app.listen(4000, () => {
  console.log("Web Service Online:4000");
});
