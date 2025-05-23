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
const https = require("https");
const fs = require("fs");
var token = fs.readFileSync(
  "D:\\Projacts\\NodeJS\\MHRdashboard\\node\\model\\token.txt",
  "utf-8"
);
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
    let getCid = [];
    if (!moph_patient.length) {
      getCid = await center102.hn_moph_cid(req.body.hn);

      if (!getCid.length) {
        getCid = await homc.getCid(req.body.hn);
      }

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
    let data = {
      moph_patient: moph_patient,
    };
    res.send(data);
  }
};
exports.checkallergyController = async (req, res, next) => {
  let countDrug = 0;
  if (req.body.choice == 2) {
    let getCid = [];
    getCid = await center102.hn_moph_cid(req.body.hn);

    if (!getCid.length) {
      getCid = await homc.getCid(req.body.hn);
    }

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

      if (checkBase.length) {
        countDrug = checkBase[0].num;
        let getData = await center102.get_moph(req.body);
        res.send({ getData, countDrug });
      } else {
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
  // let qp = [];
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
