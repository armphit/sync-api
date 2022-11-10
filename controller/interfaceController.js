var db_mysql101 = require("../DB/db_gd4unit_101_mysql");
var gd4unit101 = new db_mysql101();
var db_104_Center = require("../DB/db_104_Center");
var Center_104 = new db_104_Center();
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

exports.listPatientAllergicController = async (req, res, next) => {
  if (req.body) {
    let moph_patient = await center102.hn_moph_patient(req.body.hn);
    let drug_maharat = 0;
    if (moph_patient.length) {
      if (moph_patient[0].drugAllergy === "Y") {
        let moph_10666 = await center102.hn_moph_maharat(moph_patient[0].cid);

        drug_maharat = moph_10666.length;
      }
    }

    let data = {
      moph_patient: moph_patient,
      moph_drug: drug_maharat,
    };
    res.send(data);
  }
};
