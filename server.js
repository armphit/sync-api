const express = require("express");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methode", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-HEADERS", "content-type, x-access-token");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});
var {
  testController,
  testController2,
} = require("./controller/testController");

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
  checkpatientController,
  deletecheckmedController,
  updatecheckmedController,
  reportcheckmedController,
  getCompilerController,
  mederrorController,
  positionerrorController,
  manageerrorController,
  timedispendController,
  cutqtyController,
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
  getUserController,
  datapatientController,
  managereportgd4Controller,
} = require("./controller/interfaceController");

var {
  getDispenseDaterangeController,
  doorreportController,
  onuspharController,
  dispendController,
  drugController,
  returndrugController,
} = require("./controller/msrController");

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
app.post("/datapatient", datapatientController);
app.post("/managereportgd4", managereportgd4Controller);
app.post("/returndrug", returndrugController);
app.post("/getTimedispenddrug", timedispendController);
// app.post("/getUser", getUserController);
// app.post("/cutqty", cutqtyController);

app.post("/test", testController);
app.post("/test2", testController2);

// Route สำหรับ SSE
const cors = require("cors");
const watcher = require("./controller/watcher"); // EventEmitter
app.use(cors());

app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  console.log("Client connected to SSE");

  const onFileAdded = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  watcher.on("fileAdded", onFileAdded);

  req.on("close", () => {
    console.log("Client disconnected from SSE");
    watcher.off("fileAdded", onFileAdded); // ป้องกัน memory leak
  });
});

module.exports = app;

app.get("/", (req, res) => {
  res.end("welcom to root path");
});

app.listen(4000, () => {
  console.log("Web Service Online:4000");
});
