var db_mysql101 = require("../DB/db_gd4unit_101_mysql");
var gd4unit101 = new db_mysql101();
var db_104_Center = require("../DB/db_104_Center");
var Center_104 = new db_104_Center();
var db_pmpf = require("../DB/db_pmpf_thailand_mnrh");
var pmpf = new db_pmpf();
const moment = require("moment");
exports.patientSyncController = async (req, res, next) => {
  if (req.body) {
    let patient = await gd4unit101.getPatientSync(req.body.date);
    patient = patient.map((r) => ({
      ...r,
      readdatetime: moment(r.readdatetime).format("YYYY-MM-DD hh:mm:ss"),
    }));
    res.send(patient);
  }
};

exports.drugSyncController = async (req, res, next) => {
  if (req.body) {
    let patientDrug = await gd4unit101.getDrugSync(req.body);
    let moph_patient = await Center_104.hn_moph_patient(req.body.hn);
    let data = { patientDrug: patientDrug, moph_patient: moph_patient };
    res.send(data);
  }
};

exports.listDrugSyncController = async (req, res, next) => {
  if (req.body) {
    let patientDrug = await pmpf.allDrug(req.body.code);
    res.send(patientDrug);
  }
};
