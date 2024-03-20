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
  testController,
} = require("./controller/syncController");

var {
  checkpatientController,
  deletecheckmedController,
  updatecheckmedController,
  reportcheckmedController,
  getCompilerController,
  mederrorController,
  positionerrorController,
  manageerrorController,
} = require("./controller/checkmedController");

var {
  soapDIHController,
  prinstickerDataController,
} = require("./controller/soapController");

var {
  patientSyncController,
  drugSyncController,
  listDrugSyncController,
  listPatientAllergicController,
  checkallergyController,
  drugQueuePController,
} = require("./controller/interfaceController");

var {
  getDispenseDaterangeController,
  doorreportController,
  onuspharController,
  dispendController,
  drugController,
} = require("./controller/msrController");

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
app.post("/reportcheckmed", reportcheckmedController);
app.post("/getDispenseDaterange", getDispenseDaterangeController);
app.post("/doorReport", doorreportController);
app.post("/getCompiler", getCompilerController);
app.post("/medError", mederrorController);
app.post("/positionError", positionerrorController);
app.post("/manageError", manageerrorController);
app.post("/onusPhar", onuspharController);
app.post("/getDispend", dispendController);
app.post("/checkAllergy", checkallergyController);
app.get("/drugs", drugController);
app.post("/queueP", drugQueuePController);
app.get("/test", testController);
module.exports = app;

app.get("/", (req, res) => {
  res.end("welcom to root path");
});

app.listen(4000, () => {
  console.log("Web Service Online:4000");
});
