var db_mysql101 = require("../DB/db_gd4unit_101_mysql");
var gd4unit101 = new db_mysql101();
var db_pmpf = require("../DB/db_pmpf_thailand_mnrh");
var pmpf = new db_pmpf();
var db_mysql102 = require("../DB/db_center_102_mysql");
var center102 = new db_mysql102();
const moment = require("moment");
var db_Homc = require("../DB/db_Homc");
var homc = new db_Homc();
const axios = require("axios");
const https = require("https");
var db_center104 = require("../DB/db_104_Center");
var center104 = new db_center104();
const fs = require("fs");
var token = "test";

var db_GD4Unit_101 = require("../DB/db_GD4Unit_101_sqlserver");
var GD4Unit_101 = new db_GD4Unit_101();
// exports.patientSyncController = async (req, res, next) => {
//   if (req.body) {
//     let patient = await center104.getPatientSync(req.body.date);
//     patient = patient.map((r) => ({
//       ...r,
//       readdatetime: moment(r.readdatetime).format("YYYY-MM-DD HH:mm:ss"),
//     }));
//     res.send(patient);
//   }
// };
exports.patientSyncController = async (req, res, next) => {
  if (req.body) {
    let patient = [];

    if (req.body.site == "W8") {
      patient = await gd4unit101.getPatientSync(req.body.date);
      patient = patient.map((r) => ({
        ...r,
        readdatetime: moment(r.readdatetime).format("YYYY-MM-DD HH:mm:ss"),
      }));
    } else {
      patient = await GD4Unit_101.interfaceSys(req.body);
    }
    res.send(patient);
  }
};
exports.drugSyncController = async (req, res, next) => {
  if (req.body) {
    let patientDrug = [];
    let data = { patientDrug: [] };
    if (req.body.site == "W8") {
      patientDrug = await gd4unit101.getDrugSync(req.body);
      data = { patientDrug: patientDrug };
    } else {
      patientDrug = await GD4Unit_101.interfaceDrug(req.body);
      data = { patientDrug: patientDrug };
    }

    res.send(data);
  }
};
// exports.drugSyncController = async (req, res, next) => {
//   if (req.body) {
//     let patientDrug = await center104.getDrugSync(req.body);
//     let data = { patientDrug: patientDrug };
//     res.send(data);
//   }
// };

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
        }
      }

      moph_patient = await center102.hn_moph_patient(req.body);
    }
    console.log(moph_patient);

    let data = {
      moph_patient: moph_patient,
    };
    res.send(data);
  }
};
exports.checkallergyController = async (req, res, next) => {
  let countDrug = 0;

  if (req.body.choice == 2) {
    let getCid = await homc.getCid(req.body.hn);

    if (getCid.length) {
      if (req.body.select) {
        let q = "";
        if (req.body.select == "W18") {
          q = await center102.queue(req.body);
          q = q.length ? q[0].QN : req.body.select;
        } else {
          q = req.body.select;
        }
        let send = {
          QN: q,
          patientNO: req.body.hn,
          patientName: getCid[0].patientName,
          date: req.body.date,
        };
        await center102.addQP(send);
      }
      let checkBase = await center102.check_moph(req.body);
      console.log(checkBase);
      if (checkBase.length) {
        countDrug = checkBase[0].num;
        let getData = await center102.get_moph(req.body);
        res.send({ getData, countDrug });
      } else {
        console.log(getCid);
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

              if (dataAllergic) {
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
                            try {
                              let hosp = await center102.getHosp(
                                dataAllergic[k].hospcode
                                  ? dataAllergic[k].hospcode
                                  : ""
                              );
                              let sendata = {
                                hosp_code: `${
                                  dataAllergic[k].hospcode
                                    ? dataAllergic[k].hospcode
                                    : ""
                                }`,
                                hosp_name: `${
                                  hosp[0].hospname ? hosp[0].hospname : ""
                                }`,
                                pid: Buffer.from(
                                  `${
                                    dataAllergic[k].cid
                                      ? dataAllergic[k].cid
                                      : ""
                                  }`
                                ).toString("base64"),
                                med_code: `${
                                  dataAllergic[k].drugcode
                                    ? dataAllergic[k].drugcode
                                    : ""
                                }`,
                                med_name: `${
                                  dataAllergic[k].drugname
                                    ? dataAllergic[k].drugname
                                    : ""
                                }`,
                                adr_level: `${
                                  dataAllergic[k].allerglevelcode
                                    ? dataAllergic[k].allerglevelcode
                                    : ""
                                }`,
                                data_source: "10666",
                              };

                              const headers = {
                                "Content-Type":
                                  "application/x-www-form-urlencoded",
                              };

                              let resultapi = await axios.post(
                                "http://164.115.61.30/post_adr.php",
                                sendata,
                                {
                                  headers,
                                }
                              );

                              console.log(
                                `cid ${
                                  dataAllergic[k].cid ? dataAllergic[k].cid : ""
                                } send to api `
                              );

                              resultapi = null;
                              hosp = null;
                              sendata = null;
                            } catch (error) {
                              console.log(
                                "error to connect apiAllergy\r\n\r\n\r\n"
                              );
                              console.log(error);
                            }
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
                      checkBase = await center102.check_moph(req.body);
                      let getData = await center102.get_moph(req.body);

                      if (checkBase.length) {
                        countDrug = checkBase[0].num;
                      }
                      res.send({ getData, countDrug });
                    })
                    .catch((err) => {
                      console.log(err);
                    });
                } else {
                  checkBase = await center102.check_moph(req.body);
                  let getData = await center102.get_moph(req.body);

                  if (checkBase.length) {
                    countDrug = checkBase[0].num;
                  }
                  res.send({ getData, countDrug });
                }
              } else {
                checkBase = await center102.check_moph(req.body);
                let getData = await center102.get_moph(req.body);

                if (checkBase.length) {
                  countDrug = checkBase[0].num;
                }
                res.send({ getData, countDrug });
              }
            } else {
              checkBase = await center102.check_moph(req.body);
              let getData = await center102.get_moph(req.body);

              if (checkBase.length) {
                countDrug = checkBase[0].num;
              }
              res.send({ getData, countDrug });
            }
          });
        } else {
          checkBase = await center102.check_moph(req.body);
          let getData = await center102.get_moph(req.body);

          if (checkBase.length) {
            countDrug = checkBase[0].num;
          }
          res.send({ getData, countDrug });
        }
      }
    } else {
      let getData = await center102.get_moph(req.body);
      res.send({ getData, countDrug });
    }
  } else {
    let getData = await center102.get_moph(req.body);
    res.send({ getData, countDrug });
  }
  // console.log(countDrug);
};

// async function getAllergic(cid) {
//   let a = await axios.get(
//     "http://164.115.23.100/test_token_php/index6.php?cid=" +
//       cid +
//       "&format=json"
//   );

//   try {
//     let dataDrug = html2json(a.data).child[0].child[3].child[5].text;
//     let dataDrug2 = html2json(a.data).child[0].child[3].child[6].text;
//     if (dataDrug) {
//       return JSON.parse(dataDrug).data;
//     } else if (dataDrug2) {
//       return JSON.parse(dataDrug2).data;
//     } else {
//       return [];
//     }
//   } catch (error) {
//     return [];
//   }
// }

async function getAllergic(cid) {
  // return [];

  try {
    const url = `https://smarthealth.service.moph.go.th/phps/api/drugallergy/v1/find_by_cid?cid=${Number(
      cid
    )}`;
    const instance = axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
        keepAlive: true,
      }),
      baseURL: url,
      timeout: 1000, //optional
      headers: {
        "jwt-token": token, // Add more default headers as needed
      },
    });
    // axiosRetry(instance, { retries: 3 });
    // instance.defaults.headers.get["jwt-token"] =
    //   "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtMjAwMGthQGdtYWlsLmNvbSIsInJvbGVzIjpbIkxLXzAwMDIzXzAzNF8wMSIsIkxLXzAwMDIzXzAwOF8wMSIsIk5IU08iLCJQRVJTT04iLCJEUlVHQUxMRVJHWSIsIklNTUlHUkFUSU9OIiwiTEtfMDAwMjNfMDI3XzAxIiwiQUREUkVTUyIsIkxLXzAwMDIzXzAwM18wMSIsIkxLXzAwMDIzXzAwMV8wMSIsIkFERFJFU1NfV0lUSF9UWVBFIiwiTEtfMDAyMjZfMDAxXzAxIl0sImlhdCI6MTcyNDIwMDQwMiwiZXhwIjoxNzI0MjU5NTk5fQ.B4aUytFhi4rTay1hIYHoH7-9Y0QJWw25wcu97XVfmIE";
    let dataAllegy = await instance.get(url);
    console.log("-----------------------------------------");
    console.log(`${cid}`);
    console.log(dataAllegy.data);
    console.log("-----------------------------------------");
    if (dataAllegy.data.data) {
      return dataAllegy.data.data;
    } else {
      return [];
    }
  } catch (error) {
    console.log("getallegic");
    console.log(error);
  }
}

exports.drugQueuePController = async (req, res, next) => {
  // let data = req.body;
  // let checkq = await center102.checkqueue();
  // let permittedValues = checkq.map((value) => value.patientNO).join("','");
  // permittedValues = `'${permittedValues}'`;
  // data.hn = permittedValues;
  // data.datethai1 = moment(data.date1).add(543, "year").format("YYYYMMDD");
  // data.datethai2 = moment(data.date2).add(543, "year").format("YYYYMMDD");
  // checkq = await homc.getQP(data);
  // let datacut = await center102.get_cut_dispend_drug();
  // let datacon = await center102.get_moph_sync();
  // let qp = await gd4unit101.getqp(data);
  // // let qp = [];
  // checkq = checkq.map(function (emp) {
  //   return {
  //     ...emp,
  //     ...(datacut.find(
  //       (item) => item.patientNO.trim() === emp.patientNO.trim()
  //     ) ?? { status: "N" }),
  //     ...(datacon.find(
  //       (item) => item.patientNO.trim() === emp.patientNO.trim()
  //     ) ?? { check: "", timestamp: null }),
  //     ...(qp.find((item) => item.patientNO.trim() === emp.patientNO.trim()) ?? {
  //       QN: null,
  //     }),
  //   };
  // });
  // let gethospitalQ = await center102.listPatientQpost(data);
  // checkq = checkq.filter(
  //   (obj1) =>
  //     !gethospitalQ.some(
  //       (obj2) => obj2.patientNO.trim() === obj1.patientNO.trim()
  //     )
  // );
  // gethospitalQ = checkq.concat(gethospitalQ);
  // gethospitalQ.sort((a, b) => {
  //   let da = new Date(a.createdDT),
  //     db = new Date(b.createdDT);
  //   return db - da;
  // });
  // res.send({ gethospitalQ, rowCount: gethospitalQ.length });
  let data = req.body;
  let gethospitalQ = await center102.listPatientQpost(data);
  res.send({ gethospitalQ, rowCount: gethospitalQ.length });
};
exports.datapatientController = async (req, res, next) => {
  let cid = req.body.cid;

  try {
    let gethospitalQ = await homc.datapatient(cid);
    if (gethospitalQ.length) {
      res.status(200).json(gethospitalQ[0]);
    } else {
      res.status(404).json({
        message: "No Data",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: error,
    });
  }
};
exports.managereportgd4Controller = async (req, res, next) => {
  try {
    if (req.body.choice == 1) {
      let data = [];
      req.body.data.forEach((val) => {
        let comma = Object.keys(val)
          .map(function (k) {
            return val[k];
          })
          .join("','");
        comma = `(NEWID(),'${comma}','',${req.body.date},REPLACE(CONVERT(varchar(5), CURRENT_TIMESTAMP, 108), ':', ''),CURRENT_TIMESTAMP)`;
        data.push(comma);
      });
      let addReport = await center104.addReport(data);

      res.send({
        data: addReport.rowsAffected.length ? addReport.rowsAffected[0] : 0,
      });
    } else if (req.body.choice == 2) {
      let data = [];
      let date = req.body.date;
      await center104.deleteReport(date);
      req.body.data.forEach((val) => {
        let comma = Object.keys(val)
          .map(function (k) {
            return val[k];
          })
          .join("','");
        comma = `(NEWID(),'${comma}','',${req.body.date},REPLACE(CONVERT(varchar(5), CURRENT_TIMESTAMP, 108), ':', ''),CURRENT_TIMESTAMP)`;
        data.push(comma);
      });
      let addReport = await center104.addReport(data);

      res.send({
        data: addReport.rowsAffected.length ? addReport.rowsAffected[0] : 0,
      });
    } else if (req.body.choice == 3) {
      let date = req.body.date.dateend
        ? `date_index between  ${req.body.date.datestart} and ${req.body.date.dateend}`
        : `date_index = ${req.body.date}`;

      let getReport = await center104.getReport(date);
      // let getProgram = await center104.getProgram();
      res.send({ getReport });
    } else if (req.body.choice == 4) {
      let getmanage = null;
      if (req.body.text == "INSERT") {
        getmanage = await center104.insertProgram(req.body);
      } else {
        getmanage = await center104.deleteProgram(req.body);
      }
      res.send({ getmanage });
    }
  } catch (error) {
    res.send({
      massage: error,
    });
  }
};

// const path = require("path");
// const chokidar = require("chokidar");
// const receiveFolder = path.join(__dirname, "receive");
// let batchQueue = [];
// let batchTimeout = null;

// const watcher = chokidar.watch(receiveFolder, { persistent: true });

// watcher.on("add", (filePath) => {
//   batchQueue.push(filePath);

//   if (batchTimeout) clearTimeout(batchTimeout);
//   batchTimeout = setTimeout(() => {
//     console.log(`\nProcessing batch of ${batchQueue.length} files:`);

//     batchQueue.forEach((file) => {
//       fs.readFile(file, "utf-8", (err, data) => {
//         if (err) return console.error(err);
//         console.log(`File "${path.basename(file)}" content:`, data);

//         // ลบไฟล์หลังอ่านเสร็จ
//         fs.unlink(file, (err) => {
//           if (err) return console.error(err);
//           console.log(
//             `File "${path.basename(file)}" deleted from ${receiveFolder}`
//           );
//         });
//       });
//     });

//     batchQueue = [];
//   }, 200);
// });
