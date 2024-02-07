var db_mysql101 = require("../DB/db_gd4unit_101_mysql");
var gd4unit101 = new db_mysql101();

var db_pmpf = require("../DB/db_pmpf_thailand_mnrh");
var pmpf = new db_pmpf();
var db_mysql102 = require("../DB/db_center_102_mysql");
var center102 = new db_mysql102();
const moment = require("moment");
const html2json = require("html2json").html2json;
var db_Homc = require("../DB/db_Homc");
var homc = new db_Homc();
const axios = require("axios");
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
    let moph_patient = await center102.hn_moph_patient(req.body);
    if (!moph_patient.length) {
      let getCid = await homc.getCid(req.body.hn);

      if (getCid.length) {
        if (getCid[0].CardID) {
          cid = getCid[0].CardID.trim();
          let dataAllergic = await getAllergic(cid);

          let stampDB = {
            hn: req.body.hn,
            cid: cid,
            check: dataAllergic ? (dataAllergic.length ? "Y" : "N") : "N",
          };
          center102.insertSync(stampDB).then(async (insertSync) => {
            if (insertSync.affectedRows) {
              // console.log(stampDB.hn + " : " + stampDB.check);
              if (dataAllergic.length) {
                center102
                  .deleteAllgerlic(stampDB.cid)
                  .then(async (result) => {
                    // console.log(stampDB.hn + " : " + "Delete Success");
                    for (let k = 0; k < dataAllergic.length; k++) {
                      center102
                        .insertDrugAllergy(dataAllergic[k])
                        .then(async (insert_md) => {
                          // if (insert_md.affectedRows) {
                          //   console.log(
                          //     stampDB.hn +
                          //       " : " +
                          //       dataAllergic[k].drugname +
                          //       " : " +
                          //       "Success"
                          //   );
                          //   console.log(
                          //     "---------------------------------------"
                          //   );
                          // } else {
                          //   console.log(stampDB.hn + " : " + "Failed");
                          //   console.log(
                          //     "---------------------------------------"
                          //   );
                          // }
                        })

                        .catch((err) => {
                          console.log(err);
                        });
                    }
                  })
                  .catch((err) => {
                    console.log(err);
                  });
              }
            }
          });
        }
      }

      moph_patient = await center102.hn_moph_patient(req.body);
    }
    let data = {
      moph_patient: moph_patient,
    };
    res.send(data);
  }
};

exports.checkallergyController = async (req, res, next) => {
  let countDrug = 0;
  if (req.body.choice == 2) {
    let checkBase = await center102.check_moph(req.body);
    if (checkBase.length) {
      countDrug = checkBase[0].num;
    } else {
      let getCid = await homc.getCid(req.body.hn);

      if (getCid.length) {
        if (getCid[0].CardID) {
          const cid = getCid[0].CardID.trim();
          let dataAllergic = await getAllergic(cid);

          let stampDB = {
            hn: req.body.hn,
            cid: cid,
            check: dataAllergic ? (dataAllergic.length ? "Y" : "N") : "N",
          };

          center102.insertSync(stampDB).then(async (insertSync) => {
            if (insertSync.affectedRows) {
              // console.log(stampDB.hn + " : " + stampDB.check);
              if (dataAllergic.length) {
                center102
                  .deleteAllgerlic(stampDB.cid)
                  .then(async (result) => {
                    // console.log(stampDB.hn + " : " + "Delete Success");
                    for (let k = 0; k < dataAllergic.length; k++) {
                      dataAllergic[k].cid = stampDB.cid;
                      center102
                        .insertDrugAllergy(dataAllergic[k])
                        .then(async (insert_md) => {
                          // if (insert_md.affectedRows) {
                          //   console.log(
                          //     stampDB.hn +
                          //       " : " +
                          //       dataAllergic[k].drugname +
                          //       " : " +
                          //       "Success"
                          //   );
                          //   console.log(
                          //     "---------------------------------------"
                          //   );
                          // } else {
                          //   console.log(stampDB.hn + " : " + "Failed");
                          //   console.log(
                          //     "---------------------------------------"
                          //   );
                          // }
                        })

                        .catch((err) => {
                          console.log(err);
                        });
                    }
                  })
                  .catch((err) => {
                    console.log(err);
                  });
              }
            }
          });
          if (dataAllergic.length) {
            checkBase = await center102.check_moph(req.body);
            if (checkBase.length) {
              countDrug = checkBase[0].num;
            }
          }
        }
      }
    }
  }
  let getData = await center102.get_moph(req.body);
  res.send({ getData, countDrug });
};

async function getAllergic(cid) {
  // let a = await axios.get(
  //   "http://164.115.23.100/test_token_php/index6.php?cid=" +
  //     cid +
  //     "&format=json"
  // );

  // try {
  //   let dataDrug = html2json(a.data).child[0].child[3].child[5].text;
  //   let dataDrug2 = html2json(a.data).child[0].child[3].child[6].text;
  //   if (dataDrug) {
  //     return JSON.parse(dataDrug).data;
  //   } else if (dataDrug2) {
  //     return JSON.parse(dataDrug2).data;
  //   } else {
  //     return [];
  //   }
  // } catch (error) {
  //   return [];
  // }
  let a = await axios.get(
    `http://164.115.23.100/test_token_php/index77.php?cid=${cid}`
  );
  let b = html2json(a.data).child;
  let c = [];

  for (let index = 0; index < b.length; index++) {
    if (b[index].node == "text") {
      try {
        let d = JSON.parse(b[index].text);
        if ("drugName" in d) {
          c.push(d);
        }
      } catch (e) {}
    }
  }

  return c;
}

exports.drugQueuePController = async (req, res, next) => {
  let data = req.body;
  let checkq = await center102.checkqueue();
  let permittedValues = checkq.map((value) => value.patientNO).join("','");
  permittedValues = `'${permittedValues}'`;
  data.hn = permittedValues;
  data.datethai1 = moment(data.date1).add(543, "year").format("YYYYMMDD");
  data.datethai2 = moment(data.date2).add(543, "year").format("YYYYMMDD");
  checkq = await homc.getQP(data);
  let datacut = await center102.get_cut_dispend_drug();
  let datacon = await center102.get_moph_sync();
  let qp = await gd4unit101.getqp(data);
  checkq = checkq.map(function (emp) {
    return {
      ...emp,
      ...(datacut.find(
        (item) => item.patientNO.trim() === emp.patientNO.trim()
      ) ?? { status: "N" }),
      ...(datacon.find(
        (item) => item.patientNO.trim() === emp.patientNO.trim()
      ) ?? { check: "", timestamp: null }),
      ...(qp.find((item) => item.patientNO.trim() === emp.patientNO.trim()) ?? {
        QN: null,
      }),
    };
  });
  let gethospitalQ = await center102.listPatientQpost(data);
  // checkq = checkq
  //   .concat(gethospitalQ)
  //   .filter(
  //     (item) =>
  //       checkq.patientNO.trim() !== item.patientNO.trim() ||
  //       gethospitalQ.patientNO.trim() !== item.patientNO.trim()
  //   );
  checkq = checkq.filter(
    (obj1) =>
      !gethospitalQ.some(
        (obj2) => obj2.patientNO.trim() === obj1.patientNO.trim()
      )
  );
  gethospitalQ = checkq.concat(gethospitalQ);
  gethospitalQ.sort((a, b) => {
    let da = new Date(a.createdDT),
      db = new Date(b.createdDT);
    return db - da;
  });
  res.send({ gethospitalQ, rowCount: gethospitalQ.length });
};
