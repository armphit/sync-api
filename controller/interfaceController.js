var db_mysql101 = require("../DB/db_gd4unit_101_mysql");
var gd4unit101 = new db_mysql101();

var db_pmpf = require("../DB/db_pmpf_thailand_mnrh");
var pmpf = new db_pmpf();
var db_mysql102 = require("../DB/db_center_102_mysql");
var center102 = new db_mysql102();
const moment = require("moment");
exports.patientSyncController = async (req, res, next) => {
  if (req.body) {
    let patient = await gd4unit101.getPatientSync(req.body.date);
    patient = patient.map((r) => ({
      ...r,
      readdatetime: moment(r.readdatetime).format("YYYY-MM-DD HH:mm:ss"),
    }));
    res.send(patient);
  }
};

exports.drugSyncController = async (req, res, next) => {
  if (req.body) {
    let patientDrug = await gd4unit101.getDrugSync(req.body);

    let data = { patientDrug: patientDrug };
    res.send(data);
  }
};

exports.listDrugSyncController = async (req, res, next) => {
  if (req.body) {
    let patientDrug = await pmpf.allDrug(req.body.code);
    res.send(patientDrug);
  }
};

exports.listPatientAllergicController = async (req, res, next) => {
  if (req.body) {
    let moph_patient = await center102.hn_moph_patient(req.body.hn);

    let data = {
      moph_patient: moph_patient,
    };
    res.send(data);
  }
};

exports.checkallergyController = async (req, res, next) => {
  let getdata = await center102.get_moph(req.body);

  res.send(getdata);
};
