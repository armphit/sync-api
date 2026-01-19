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

var token =
  "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtMjAwMGthQGdtYWlsLmNvbSIsInJvbGVzIjpbIkxLXzAwMDIzXzAzNF8wMSIsIkxLXzAwMDIzXzAwOF8wMSIsIk5IU08iLCJQRVJTT04iLCJEUlVHQUxMRVJHWSIsIklNTUlHUkFUSU9OIiwiTEtfMDAwMjNfMDI3XzAxIiwiQUREUkVTUyIsIkxLXzAwMDIzXzAwM18wMSIsIkxLXzAwMDIzXzAwMV8wMSIsIkFERFJFU1NfV0lUSF9UWVBFIiwiTEtfMDAyMjZfMDAxXzAxIl0sImlhdCI6MTc2Nzg1ODM5MCwiZXhwIjoxNzY3ODkxNTk5fQ.XKqcxn6JhaMmLspbQRtI3lA36gnMNrZjRRkJlCQdt-A";

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
                                  : "",
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
                                  }`,
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
                                },
                              );

                              console.log(
                                `cid ${
                                  dataAllergic[k].cid ? dataAllergic[k].cid : ""
                                } send to api `,
                              );

                              resultapi = null;
                              hosp = null;
                              sendata = null;
                            } catch (error) {
                              console.log(
                                "error to connect apiAllergy\r\n\r\n\r\n",
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
      cid,
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
exports.getdatacpoeController = async (req, res, next) => {
  try {
    if (req.body.check == 1) {
      finalResult = {};
      let todayDrugsHN = await homc.getCpoeData(req.body);

      if (todayDrugsHN.length) {
        let queue = await center104.getQueue(todayDrugsHN[0].hn);
        todayDrugsHN = todayDrugsHN.map((val) => {
          return {
            ...val,
            queue: queue.length ? queue[0]?.queue : "",
          };
        });
        let historyDrugs = await homc.getCpoeDataOld(req.body);
        let drugMaster = await GD4Unit_101.getdrugdupl();

        let allergys = await listPatientAllergicController({
          hn: req.body.hn,
          site: "W8",
        });

        let checkHn = [];

        finalResult = {
          allergymed: allergys,
          duplicatemed: await checkDrugSafety(
            todayDrugsHN,
            historyDrugs,
            drugMaster,
          ),
          lab: { valueLab: await checkLab(todayDrugsHN), result: {} },
        };

        finalResult.duplicatemed.result = {};
        console.log(allergys);
        if (allergys[0].cid) {
          console.log(3);
          finalResult.allergymhr = await homc.getAllergyMhr(
            allergys[0]?.patientID.trim(),
          );
        }
        if (
          Object.values(finalResult.duplicatemed).some(
            (arr) => Array.isArray(arr) && arr.length > 0,
          ) ||
          finalResult.lab?.valueLab.some((x) => x.lab_res === 1)
        ) {
          todayDrugsHN[0].statusCheck = 1;

          if (
            finalResult.duplicatemed.condition1.length ||
            finalResult.duplicatemed.condition2.length ||
            finalResult.duplicatemed.condition3.length
          ) {
            console.log(4);
            checkHn = await GD4Unit_101.Inserthn({
              ...todayDrugsHN[0],
              text: "Duplicate",
            });
            let findDupli = checkHn.find(
              (val) => val.drug_interaction_type == "Duplicate",
            );

            if (Object.keys(findDupli)?.length !== 0) {
              finalResult.duplicatemed.result = findDupli;
            }
          }

          if (finalResult.lab?.valueLab.some((x) => x.lab_res === 1)) {
            console.log(8);
            let checkLabInsert = await GD4Unit_101.Inserthn({
              ...todayDrugsHN[0],
              text: "Lab",
            });
            let findLab = checkLabInsert.find(
              (val) => val.drug_interaction_type == "Lab",
            );
            if (Object.keys(findLab)?.length !== 0) {
              finalResult.lab.result = findLab;
            }
          }
        } else {
          console.log(5);
          todayDrugsHN[0].statusCheck = 0;
          checkHn = await GD4Unit_101.Inserthn(todayDrugsHN[0]);
        }

        res.status(200).json({ todayDrugsHN, finalResult });
      } else {
        res.status(404).json({
          message: "No Data",
        });
      }
    } else if (req.body.check == 2) {
      if (req.body.text == "allergy") {
        await center102.addMophConfirm(req.body);

        let moph_patient = await center102.hn_moph_patient(req.body);
        res.status(200).json({ moph_patient });
      } else if (req.body.text == "duplicate") {
        let dataupdate = await GD4Unit_101.updateInteraction(req.body);
        res.status(200).json(dataupdate);
      } else if (req.body.text == "lab") {
        let dataupdate = await GD4Unit_101.updateInteraction(req.body);
        res.status(200).json(dataupdate);
      }
    }
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: error,
    });
  }
};

function checkDrugSafety(today, history, master) {
  const todayDate = new Date(); // หรือกำหนด fix วันที่ทดสอบ: new Date("2025-12-22")
  const resultJson = { condition1: [], condition2: [], condition3: [] };

  today.forEach((currentDrug) => {
    // ตัดช่องว่างรหัสยาวันนี้
    const invCode = currentDrug.invCode ? currentDrug.invCode.trim() : "";

    // ค้นหากฎจาก Master (ต้อง trim drugCode จาก master ด้วย)
    const rules = master.filter((m) => m.drugCode?.trim() === invCode);

    rules.forEach((rule) => {
      const { groupCode, groupName, conditionCode } = rule;

      // --- Condition 1: Same Visit ---
      if (conditionCode === 1) {
        const duplicatesToday = today.filter((t) => {
          const tCode = t.invCode?.trim();
          return (
            tCode !== invCode &&
            master.some(
              (m) => m.drugCode?.trim() === tCode && m.groupCode === groupCode,
            )
          );
        });

        if (duplicatesToday.length > 0) {
          addTodayResult(
            resultJson.condition1,
            currentDrug,
            groupName,
            duplicatesToday,
          );
        }
      }

      // --- Condition 2 & 3: History ---
      else if (conditionCode === 2 || conditionCode === 3) {
        const maxDays = conditionCode === 2 ? 10 : 120;
        const targetKey = conditionCode === 2 ? "condition2" : "condition3";

        history.forEach((h) => {
          const hInvCode = h.invCode?.trim();
          const hDate = new Date(h.lastIssTime);

          // คำนวณวันที่ต่างกัน
          const diffDays = Math.floor(
            (todayDate - hDate) / (1000 * 60 * 60 * 24),
          );

          // ตรวจสอบว่าเป็นกลุ่มเดียวกัน แต่ไม่ใช่รหัสยาเดียวกัน
          const isSameGroup = master.some(
            (m) => m.drugCode?.trim() === hInvCode && m.groupCode === groupCode,
          );
          const isDifferentDrug = invCode !== hInvCode;

          if (
            isSameGroup &&
            isDifferentDrug &&
            diffDays >= 0 &&
            diffDays <= maxDays
          ) {
            addHistoryResult(
              resultJson[targetKey],
              currentDrug,
              groupName,
              h,
              diffDays,
            );
          }
        });
      }
    });
  });

  return resultJson;
}
async function checkLab(today) {
  const inClause = today.map((data) => `'${data.invCode}'`).join(",");
  let druglab = await GD4Unit_101.checkDrugLab(inClause);

  let checkLab = today.flatMap((t) =>
    druglab
      .filter((d) => d.drugCode === t.invCode)
      .map((d) => ({
        ...t,
        ...d,
      })),
  );

  let resultLab = [];
  let dataLab = [];
  for (let i = 0; i < checkLab.length; i++) {
    if (!checkLab[i].labMin && checkLab[i].labMax) {
      console.log(6);
      checkLab[i].checklab =
        `TRY_CONVERT(INT, real_res)  > ${checkLab[i].labMax}, 1, 0`;
      dataLab = await homc.getLabHomc(checkLab[i]);
      resultLab.push(...dataLab);
    } else if (checkLab[i].labMin && !checkLab[i].labMax) {
      console.log(7);
      checkLab[i].checklab =
        `TRY_CONVERT(INT, real_res)  < ${checkLab[i].labMin}, 1, 0`;
      dataLab = await homc.getLabHomc(checkLab[i]);
      resultLab.push(...dataLab);
    } else if (checkLab[i].labMin && checkLab[i].labMax) {
      checkLab[i].checklab =
        `TRY_CONVERT(INT, real_res)  >= ${checkLab[i].labMin} AND TRY_CONVERT(INT, real_res)  <= ${checkLab[i].labMin} 
      AND ${checkLab[i].time_docperday} > ${checkLab[i].dosagePdayMax}, 1, 0`;
      console.log(8);
      dataLab = await homc.getLabHomc(checkLab[i]);
      resultLab.push(...dataLab);
    } else if (
      checkLab[i].labMin &&
      !checkLab[i].labMax &&
      checkLab[i].strength
    ) {
      console.log(9);
      checkLab[i].checklab =
        `TRY_CONVERT(INT, real_res)  < ${checkLab[i].labMin} AND ${checkLab[i].time_docperday} > ${checkLab[i].dosagePdayMax}, 1, 0`;
      dataLab = await homc.getLabHomc(checkLab[i]);
      resultLab.push(...dataLab);
    } else if (
      !checkLab[i].labMin &&
      checkLab[i].labMax &&
      checkLab[i].strength
    ) {
      console.log(10);
      checkLab[i].checklab =
        `TRY_CONVERT(INT, real_res)  > ${checkLab[i].labMax} AND ${checkLab[i].time_docperday} > ${checkLab[i].dosagePdayMax}, 1, 0`;
      dataLab = await homc.getLabHomc(checkLab[i]);
      resultLab.push(...dataLab);
    }
    dataLab = [];
  }
  // resultLab = [
  //   {
  //     hn: "1497839",
  //     lab_code: "CC036",
  //     result_name: "SGPT (ALT)",
  //     res_date: "25681014",
  //     real_res: "27",
  //     lab_res: 0,
  //     invCode: "ATOR1",
  //     invName: "(TOVASTIN) ATORVASTATIN 40 MG",
  //     parameter: "ALT/AST>3X ULN",
  //     labMin: null,
  //     labMax: 150,
  //     checkDosagePday: null,
  //     dosagePday: null,
  //   },
  //   {
  //     hn: "1497839",
  //     lab_code: "CC003",
  //     result_name: "eGFR",
  //     res_date: "25680718",
  //     real_res: "20",
  //     lab_res: 1,
  //     invCode: "ALEND",
  //     invName: "( DUE )ALENDRONATE+VIT.D3(FOSAMAX PLUS) ฉรผ.",
  //     parameter: "CrCl",
  //     labMin: 35,
  //     labMax: null,
  //     checkDosagePday: null,
  //     dosagePday: null,
  //   },
  //   {
  //     hn: "1497839",
  //     lab_code: "CC003",
  //     result_name: "eGFR",
  //     res_date: "25681226",
  //     real_res: "59",
  //     lab_res: 0,
  //     invCode: "METFO",
  //     invName: "metformin 500 mg.(เมตฟอร์มิน) ยาเบาหวาน[ร]",
  //     parameter: "CrCl",
  //     labMin: 30,
  //     labMax: 44,
  //     checkDosagePday: 2,
  //     dosagePday: 1,
  //   },
  //   {
  //     hn: "1497839",
  //     lab_code: "CC003",
  //     result_name: "eGFR",
  //     res_date: "25681226",
  //     real_res: "59",
  //     lab_res: 0,
  //     invCode: "ALOGL",
  //     invName: "Alogliptin + Pioglitazone 25/15 mg Tab.(Oseni)",
  //     parameter: "CrCl",
  //     labMin: 30,
  //     labMax: null,
  //     checkDosagePday: 0.25,
  //     dosagePday: 0.5,
  //   },
  // ];

  return resultLab;
}
// ปรับปรุง Helper เล็กน้อยให้รองรับการ trim
function addTodayResult(targetArray, currentDrug, groupName, duplicatesToday) {
  const currentKey = currentDrug.invCode.trim();
  if (!targetArray.find((item) => item.currentDrug === currentKey)) {
    targetArray.push({
      currentDrug: currentKey,
      currentDrugName: currentDrug.invName?.trim(),
      groupName: groupName,
      foundToday: duplicatesToday.map((d) => ({
        invCode: d.invCode.trim(),
        invName: d.invName,
      })),
    });
  }
}

function addHistoryResult(
  targetArray,
  currentDrug,
  groupName,
  matchData,
  diffDays,
) {
  // console.log(currentDrug);
  const currentKey = currentDrug.invCode.trim();
  let existingEntry = targetArray.find(
    (item) => item.currentDrug === currentKey,
  );

  const detail = {
    duplicateDrugCode: matchData.invCode,
    duplicateDrug: matchData.invName,
    lastDate: matchData.lastIssTime,
    daysDiff: diffDays,
  };

  if (existingEntry) {
    const isDuplicate = existingEntry.foundHistory.some(
      (h) =>
        h.lastDate === detail.lastDate &&
        h.duplicateDrug === detail.duplicateDrug,
    );
    if (!isDuplicate) existingEntry.foundHistory.push(detail);
  } else {
    targetArray.push({
      currentDrug: currentKey,
      currentDrugName: currentDrug.invName?.trim(),
      groupName: groupName,
      foundHistory: [detail],
    });
  }
}

async function listPatientAllergicController(data) {
  try {
    let moph_patient = await center102.hn_moph_patient(data);

    if (!moph_patient.length) {
      let getCid = await homc.getCid(data.hn);

      if (getCid.length) {
        if (getCid[0].CardID) {
          const cid = getCid[0].CardID.trim();
          let dataAllergic = await getAllergic(cid);

          let stampDB = {
            hn: data.hn,
            cid: cid,
            check: dataAllergic ? (dataAllergic.length ? "Y" : "N") : "N",
          };
          let insertSync = await center102.insertSync(stampDB);
          if (insertSync.affectedRows) {
            if (dataAllergic) {
              if (dataAllergic.length) {
                await center102.deleteAllgerlic(stampDB.cid);
                for (let k = 0; k < dataAllergic.length; k++) {
                  dataAllergic[k].cid = stampDB.cid;
                  await center102.insertDrugAllergy(dataAllergic[k]);

                  let hosp = await center102.getHosp(
                    dataAllergic[k].hospcode ? dataAllergic[k].hospcode : "",
                  );
                  let sendata = {
                    hosp_code: `${
                      dataAllergic[k].hospcode ? dataAllergic[k].hospcode : ""
                    }`,
                    hosp_name: `${hosp[0].hospname ? hosp[0].hospname : ""}`,
                    pid: Buffer.from(
                      `${dataAllergic[k].cid ? dataAllergic[k].cid : ""}`,
                    ).toString("base64"),
                    med_code: `${
                      dataAllergic[k].drugcode ? dataAllergic[k].drugcode : ""
                    }`,
                    med_name: `${
                      dataAllergic[k].drugname ? dataAllergic[k].drugname : ""
                    }`,
                    adr_level: `${
                      dataAllergic[k].allerglevelcode
                        ? dataAllergic[k].allerglevelcode
                        : ""
                    }`,
                    data_source: "10666",
                  };

                  const headers = {
                    "Content-Type": "application/x-www-form-urlencoded",
                  };

                  let resultapi = await axios.post(
                    "http://164.115.61.30/post_adr.php",
                    sendata,
                    {
                      headers,
                    },
                  );

                  console.log(
                    `cid ${
                      dataAllergic[k].cid ? dataAllergic[k].cid : ""
                    } send to api `,
                  );

                  resultapi = null;
                  hosp = null;
                  sendata = null;
                }
                moph_patient = await center102.hn_moph_patient(data);
                return new Promise((resolve, reject) => {
                  resolve(moph_patient);
                });
              }
              //  else {
              //   return new Promise((resolve, reject) => {
              //     resolve(true);
              //   });
              // }
            }
            // else {
            //   return new Promise((resolve, reject) => {
            //     resolve(true);
            //   });
            // }
          }
          // else {
          //   return new Promise((resolve, reject) => {
          //     resolve(true);
          //   });
          // }
        }
      }
    } else {
      return new Promise((resolve, reject) => {
        resolve(moph_patient);
      });
    }
  } catch (error) {
    console.log("error to connect apiAllergy\r\n\r\n\r\n");
    console.log(error);
    return new Promise((resolve, reject) => {
      resolve(false);
    });
  }
}

// async function getAllergic(cid) {
//   // return [];

//   const url = `https://smarthealth.service.moph.go.th/phps/api/drugallergy/v1/find_by_cid?cid=${Number(
//     cid
//   )}`;
//   const instance = axios.create({
//     httpsAgent: new https.Agent({
//       rejectUnauthorized: false,
//       keepAlive: true,
//     }),
//     baseURL: url,
//     timeout: 1000, //optional
//     headers: {
//       "jwt-token": token, // Add more default headers as needed
//     },
//   });
//   // instance.defaults.headers.get["jwt-token"] =
//   //   "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtMjAwMGthQGdtYWlsLmNvbSIsInJvbGVzIjpbIkxLXzAwMDIzXzAzNF8wMSIsIkxLXzAwMDIzXzAwOF8wMSIsIk5IU08iLCJQRVJTT04iLCJEUlVHQUxMRVJHWSIsIklNTUlHUkFUSU9OIiwiTEtfMDAwMjNfMDI3XzAxIiwiQUREUkVTUyIsIkxLXzAwMDIzXzAwM18wMSIsIkxLXzAwMDIzXzAwMV8wMSIsIkFERFJFU1NfV0lUSF9UWVBFIiwiTEtfMDAyMjZfMDAxXzAxIl0sImlhdCI6MTcyNDIwMDQwMiwiZXhwIjoxNzI0MjU5NTk5fQ.B4aUytFhi4rTay1hIYHoH7-9Y0QJWw25wcu97XVfmIE";
//   let dataAllegy = await instance.get(url);
//   if (dataAllegy.data.data) {
//     return dataAllegy.data.data;
//   } else {
//     return [];
//   }
// }
