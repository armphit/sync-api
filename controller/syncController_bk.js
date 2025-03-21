const moment = require("moment");
const js2xmlparser = require("js2xmlparser");
const soap = require("soap");
const { transform } = require("camaro");

var db_Homc = require("../DB/db_Homc");
var homc = new db_Homc();
var db_pmpf = require("../DB/db_pmpf_thailand_mnrh");
var pmpf = new db_pmpf();

var db_onCube = require("../DB/db_onCube");
var onCube = new db_onCube();
var db_mysql102 = require("../DB/db_center_102_mysql");
var center102 = new db_mysql102();
var db_mysql101 = require("../DB/db_gd4unit_101_mysql");
var gd4unit101 = new db_mysql101();
var db_Xmed = require("../DB/db_Xed_102_sqlserver");
var Xmed = new db_Xmed();
const axios = require("axios");
const https = require("https");
const fs = require("fs");
var token = fs.readFileSync(
  "D:\\Projacts\\NodeJS\\MHRdashboard\\node\\model\\token.txt",
  "utf-8"
);
//แก้นับตอนยิง
const html2json = require("html2json").html2json;

exports.syncOPDController = async (req, res, next) => {
  let data = req.body;
  const hn = req.body.data;
  const check = req.body.check;
  let sendv = {};

  if (parseInt(hn) != NaN) {
    let dataP = [];
    let q = await center102.queue({ hn: hn });
    // if (check.user != "admin") {
    if (!q.length) {
      // q = await gd4unit101.getsiteQ();
      // q = q.length ? `P${Number(q[0].num) + 1}` : "P1";
      dataP = await homc.getQPatient(data);
      if (dataP.length) {
        await center102.addQP(dataP[0]);
      }

      // let send = {
      //   patientNO: data.data,
      //   QN: q,
      //   date: new Date().toISOString().split("T")[0],
      // };
      // await center102.addQP(send);

      // dataP = null;
      // send = null;
    } else {
      q = q[0].QN;
    }
    // } else {
    //   q = q.length ? q[0].QN : "";
    // }

    let checkAllergic = await listPatientAllergicController({ hn: hn });
    // console.log("checkAllergic : " + checkAllergic);

    // if (checkAllergic) {
    let moph_patient = await center102.hn_moph_patient({ hn: hn });
    if (moph_patient.length) {
      if (
        moph_patient[0].timestamp === null &&
        moph_patient[0].drugcode !== null
      ) {
        sendv.status = 6;
        res.send(sendv);
      } else {
        let allTimeOld = "";
        let time = await gd4unit101.checkPatient(hn);
        // let time = [];
        if (time.length != 0) {
          for (let d of time) {
            allTimeOld = allTimeOld + `'` + d.ordertime + `',`;
          }
          allTimeOld = allTimeOld.substring(0, allTimeOld.length - 1);
        } else {
          allTimeOld = `''`;
        }
        data.allTimeOld = allTimeOld;
        let x = {};
        x = await homc.fill(data);
        let b = x.recordset;

        if (b.length > 0) {
          let drugarr = [];
          if (!q.length) {
            // let send = {};
            q = await gd4unit101.getsiteQ();
            q = q.length ? `P${Number(q[0].num) + 1}` : "P1";
            // if (dataP.length) {
            //   send = {
            //     patientNO: dataP[0].patientNO,
            //     patientName: dataP[0].patientName,
            //     QN: q,
            //     date: new Date().toISOString().split("T")[0],
            //   };
            //   await center102.addQP(send);
            // } else {
            //   send = {
            //     patientNO: data.data,
            //     QN: q,
            //     date: new Date().toISOString().split("T")[0],
            //   };
            //   await center102.addQP(send);
            // }

            // dataP = null;
            // send = {};
          }

          let c = {
            hn: b[0].hn.trim(),
            name: b[0].patientname.trim(),
            sex: b[0].sex.trim(),
            prescriptionno: b[0].prescriptionno.trim(),
            patientdob: b[0].patientdob.trim(),
            queue: q,
            jvm: check.jvm,
            dih: check.dih,
            win1: check.win1,
            win2: check.win2,
            user: check.user,
          };

          for (let i = 0; i < b.length; i++) {
            if (b[i].orderitemname) {
              b[i].orderitemname = b[i].orderitemname.replace(
                /[\/\\#,+$~.'":?<>{}]/g,
                " "
              );
            }

            let pmpf102 = await pmpf.getDrug(b[i].orderitemcode);

            if (
              pmpf102.length !== 0 &&
              Number(b[i].orderqty.trim()) > 0 &&
              Number(b[i].orderqty.trim()) < 10000
            ) {
              let drug = {
                Name: b[i].orderitemname.trim(),
                Qty: b[i].orderqty.trim(),
                alias: "",
                code: b[i].orderitemcode.trim(),
                firmName: pmpf102[0].firmname,
                method: "",
                note: "",
                spec: pmpf102[0].Strength,
                type: "",
                unit: pmpf102[0].dosageunitcode,
                pack: pmpf102[0].pack,
                location: pmpf102[0].checkLocation,
                device: pmpf102[0].deviceCode,
                // dosage: b[i].dosage ? b[i].dosage.trim() : "",
                // freetext1: b[i].freetext1 ? b[i].freetext1.trim() : "",
              };

              drugarr.push(drug);
            }
          }
          console.log(c);
          // if (c.queue.includes("P")) {
          //   await center102.addQP({
          //     patientNO: c.hn,
          //     patientName: c.name,
          //     QN: c.queue,
          //     date: new Date().toISOString().split("T")[0],
          //   });
          //   console.log(`queue p : insert success`);
          // }

          // if (drugarr.length) {
          //   let drugFilter = drugarr.filter((val) =>
          //     val.device ? val.device.includes("M2") : ""
          //   );
          //   // if (drugFilter.length) {
          //   //   await gd4unit101.addDrugL(c);
          //   // }
          // }

          // getdataHomc(drugarr, c)
          //   .then((value) => {

          // if (value.dih === 1 && value.jvm === 1) {

          let val = {
            prescriptionno: b[0].prescriptionno,
            hn: b[0].hn,
            date: moment(data.date).subtract(543, "year").format("YYYY-MM-DD"),
            allTimeOld: allTimeOld,
          };

          // getdataHomc(drugarr, c)
          // .then((value) => {
          //   if (value.dih === 1 && value.jvm === 1) {
          //     console.log("HN : " + b[0].hn.trim() + " :success");
          //     console.log("successDT : " + new Date().toLocaleString());
          //     console.log(
          //       "-------------------------------------------------"
          //     );
          //     res.status(200).json({
          //       // Authorization: Bearer,
          //       status: 1,
          //     });
          //   } else {
          //     sendv.status = 2;
          //     res.send(sendv);
          //   }
          // })
          // .catch((err) => {
          //   console.log(err);
          //   sendv.status = err;
          //   res.send(sendv);
          // });
          if (q.includes("P")) {
            let send = {};
            if (dataP.length) {
              send = {
                patientNO: dataP[0].patientNO,
                patientName: dataP[0].patientName,
                QN: q,
                date: new Date().toISOString().split("T")[0],
              };
              await center102.addQP(send);
            } else {
              send = {
                patientNO: data.data,
                QN: q,
                date: new Date().toISOString().split("T")[0],
              };
              await center102.addQP(send);
            }
            // dataP = null;
            // send = {};
          }

          gd4unit101.fill(val).then((result) => {
            if (result.affectedRows > 0) {
              b.forEach(async function (b) {
                b.lastmodified = b.lastmodified
                  ? b.lastmodified
                      .toISOString()
                      .replace(/T/, " ")
                      .replace(/\..+/, "")
                  : "";
                b.ordercreatedate = b.ordercreatedate
                  ? b.ordercreatedate
                      .toISOString()
                      .replace(/T/, " ")
                      .replace(/\..+/, "")
                  : "";
                b.takedate = b.takedate
                  ? b.takedate.toISOString().substr(0, 10)
                  : "";
                b.queue = c.queue;
                await gd4unit101.insertDrug(b);
              });
              getdataHomc(drugarr, c)
                .then((value) => {
                  if (value.dih === 1 && value.jvm === 1) {
                    console.log("HN : " + b[0].hn.trim() + " :success");
                    console.log("successDT : " + new Date().toLocaleString());
                    console.log(
                      "-------------------------------------------------"
                    );
                    res.status(200).json({
                      // Authorization: Bearer,
                      status: 1,
                    });
                  } else {
                    sendv.status = 2;
                    res.send(sendv);
                  }
                })
                .catch((err) => {
                  console.log(err);
                  sendv.status = err;
                  res.send(sendv);
                });
            } else {
              sendv.status = 0;
              res.send(sendv);
            }
          });

          // } else {
          //   sendv.status = 2;
          //   res.send(sendv);
          // }
          // })
          // .catch((err) => {
          //   console.log(err);
          //   sendv.status = err;
          //   res.send(sendv);
          // });
        } else {
          sendv.status = {
            err: 3,
            time: allTimeOld,
          };
          res.send(sendv);
        }
      }
    } else {
      let allTimeOld = "";
      let time = await gd4unit101.checkPatient(hn);
      // let time = [];
      if (time.length != 0) {
        for (let d of time) {
          allTimeOld = allTimeOld + `'` + d.ordertime + `',`;
        }
        allTimeOld = allTimeOld.substring(0, allTimeOld.length - 1);
      } else {
        allTimeOld = `''`;
      }
      data.allTimeOld = allTimeOld;
      let x = {};
      x = await homc.fill(data);
      let b = x.recordset;

      if (b.length > 0) {
        let drugarr = [];
        if (!q.length) {
          // let send = {};
          q = await gd4unit101.getsiteQ();
          q = q.length ? `P${Number(q[0].num) + 1}` : "P1";
          // if (dataP.length) {
          //   send = {
          //     patientNO: dataP[0].patientNO,
          //     patientName: dataP[0].patientName,
          //     QN: q,
          //     date: new Date().toISOString().split("T")[0],
          //   };
          //   await center102.addQP(send);
          // } else {
          //   send = {
          //     patientNO: data.data,
          //     QN: q,
          //     date: new Date().toISOString().split("T")[0],
          //   };
          //   await center102.addQP(send);
          // }

          // dataP = null;
          // send = {};
        }

        let c = {
          hn: b[0].hn.trim(),
          name: b[0].patientname.trim(),
          sex: b[0].sex.trim(),
          prescriptionno: b[0].prescriptionno.trim(),
          patientdob: b[0].patientdob.trim(),
          queue: q,
          jvm: check.jvm,
          dih: check.dih,
          win1: check.win1,
          win2: check.win2,
          user: check.user,
        };

        for (let i = 0; i < b.length; i++) {
          if (b[i].orderitemname) {
            b[i].orderitemname = b[i].orderitemname.replace(
              /[\/\\#,+$~.'":?<>{}]/g,
              " "
            );
          }

          let pmpf102 = await pmpf.getDrug(b[i].orderitemcode);

          if (
            pmpf102.length !== 0 &&
            Number(b[i].orderqty.trim()) > 0 &&
            b[i].orderqty.trim() < 10000
          ) {
            let drug = {
              Name: b[i].orderitemname.trim(),
              Qty: b[i].orderqty.trim(),
              alias: "",
              code: b[i].orderitemcode.trim(),
              firmName: pmpf102[0].firmname,
              method: "",
              note: "",
              spec: pmpf102[0].Strength,
              type: "",
              unit: pmpf102[0].dosageunitcode,
              pack: pmpf102[0].pack,
              location: pmpf102[0].checkLocation,
              device: pmpf102[0].deviceCode,
              // dosage: b[i].dosage ? b[i].dosage.trim() : "",
              // freetext1: b[i].freetext1 ? b[i].freetext1.trim() : "",
            };

            drugarr.push(drug);
          }
        }
        console.log(c);
        // if (c.queue.includes("P")) {
        //   await center102.addQP({
        //     patientNO: c.hn,
        //     patientName: c.name,
        //     QN: c.queue,
        //     date: new Date().toISOString().split("T")[0],
        //   });
        //   console.log(`queue p : insert success`);
        // }

        // if (drugarr.length) {
        //   let drugFilter = drugarr.filter((val) =>
        //     val.device ? val.device.includes("M2") : ""
        //   );
        //   // if (drugFilter.length) {
        //   //   await gd4unit101.addDrugL(c);
        //   // }
        // }

        // getdataHomc(drugarr, c)
        //   .then((value) => {

        // if (value.dih === 1 && value.jvm === 1) {

        let val = {
          prescriptionno: b[0].prescriptionno,
          hn: b[0].hn,
          date: moment(data.date).subtract(543, "year").format("YYYY-MM-DD"),
          allTimeOld: allTimeOld,
        };

        // getdataHomc(drugarr, c)
        // .then((value) => {
        //   if (value.dih === 1 && value.jvm === 1) {
        //     console.log("HN : " + b[0].hn.trim() + " :success");
        //     console.log("successDT : " + new Date().toLocaleString());
        //     console.log(
        //       "-------------------------------------------------"
        //     );
        //     res.status(200).json({
        //       // Authorization: Bearer,
        //       status: 1,
        //     });
        //   } else {
        //     sendv.status = 2;
        //     res.send(sendv);
        //   }
        // })
        // .catch((err) => {
        //   console.log(err);
        //   sendv.status = err;
        //   res.send(sendv);
        // });
        if (q.includes("P")) {
          let send = {};
          if (dataP.length) {
            send = {
              patientNO: dataP[0].patientNO,
              patientName: dataP[0].patientName,
              QN: q,
              date: new Date().toISOString().split("T")[0],
            };
            await center102.addQP(send);
          } else {
            send = {
              patientNO: data.data,
              QN: q,
              date: new Date().toISOString().split("T")[0],
            };
            await center102.addQP(send);
          }
          // dataP = null;
          // send = {};
        }

        gd4unit101.fill(val).then((result) => {
          if (result.affectedRows > 0) {
            b.forEach(async function (b) {
              b.lastmodified = b.lastmodified
                ? b.lastmodified
                    .toISOString()
                    .replace(/T/, " ")
                    .replace(/\..+/, "")
                : "";
              b.ordercreatedate = b.ordercreatedate
                ? b.ordercreatedate
                    .toISOString()
                    .replace(/T/, " ")
                    .replace(/\..+/, "")
                : "";
              b.takedate = b.takedate
                ? b.takedate.toISOString().substr(0, 10)
                : "";
              b.queue = c.queue;
              await gd4unit101.insertDrug(b);
            });
            getdataHomc(drugarr, c)
              .then((value) => {
                if (value.dih === 1 && value.jvm === 1) {
                  console.log("HN : " + b[0].hn.trim() + " :success");
                  console.log("successDT : " + new Date().toLocaleString());
                  console.log(
                    "-------------------------------------------------"
                  );
                  res.status(200).json({
                    // Authorization: Bearer,
                    status: 1,
                  });
                } else {
                  sendv.status = 2;
                  res.send(sendv);
                }
              })
              .catch((err) => {
                console.log(err);
                sendv.status = err;
                res.send(sendv);
              });
          } else {
            sendv.status = 0;
            res.send(sendv);
          }
        });

        // } else {
        //   sendv.status = 2;
        //   res.send(sendv);
        // }
        // })
        // .catch((err) => {
        //   console.log(err);
        //   sendv.status = err;
        //   res.send(sendv);
        // });
      } else {
        sendv.status = {
          err: 3,
          time: allTimeOld,
        };
        res.send(sendv);
      }
    }
    // } else {
    //   sendv.status = checkAllergic;
    //   res.send(sendv);
    // }
  } else {
    sendv.status = 4;
    res.send(sendv);
  }
};

exports.syncOPDManualController = async (req, res, next) => {
  let sendv = {};
  let data = req.body.data;
  let patient = req.body.patient;
  let drugarr = [];
  patient.user = patient.user ? patient.user : "admin";

  // sendv.status = 0;
  // res.send(sendv);

  for (let i = 0; i < data.length; i++) {
    let pmpf102 = await pmpf.getDrug(data[i].code);

    if (
      pmpf102.length !== 0 &&
      Number(data[i].Qty) > 0 &&
      Number(data[i].Qty) < 10000
    ) {
      let drug = {
        Name: pmpf102[0].drugName.trim(),
        Qty: data[i].Qty,
        alias: "",
        code: pmpf102[0].drugCode.trim(),
        firmName: pmpf102[0].firmname,
        method: "",
        note: "",
        spec: pmpf102[0].Strength,
        type: "",
        unit: pmpf102[0].dosageunitcode,
        pack: pmpf102[0].pack,
        location: pmpf102[0].checkLocation,
        device: pmpf102[0].deviceCode,
        // dosage: b[i].dosage ? b[i].dosage.trim() : "",
        // freetext1: b[i].freetext1 ? b[i].freetext1.trim() : "",
      };

      drugarr.push(drug);
    }
    // data[i].location = pmpf102[0].checkLocation;
  }

  let q = await center102.queue(patient);
  if (q.length) {
    patient.queue = q[0].QN;
  } else {
    // q = await gd4unit101.getsiteQhn(patient);
    // if (q.length) {
    //   patient.queue = q[0].queue;
    // } else {
    //   patient.queue = "";
    // }
    patient.queue = "";
  }

  console.log(patient);

  getdataHomc(drugarr, patient)
    .then((value) => {
      if (value.dih === 1 && value.jvm === 1) {
        console.log("HN : " + patient.hn + " :success");
        console.log("-------------------------------------------------");
        res.status(200).json({
          status: 1,
        });
      } else {
        sendv.status = 5;
        res.send(sendv);
      }
    })
    .catch((err) => {
      console.log(err);
      sendv.status = err;
      res.send(sendv);
    });
};

// async function getdataHomc(data, etc) {
//   // try {

//   const momentDate = new Date();
//   let datePayment = moment(momentDate).format("YYYY-MM-DD");
//   let dateA = moment(momentDate).format("YYMMDD");
//   let dateB = moment(momentDate).add(543, "year").format("DD/MM/YYYY");

//   let birthDate = null;
//   let m = null;

//   m = moment(etc.patientdob, "YYYYMMDD", "th", true);

//   birthDate = moment(m).subtract(543, "year").format("YYYY-MM-DD");
//   if (birthDate == "Invalid date") {
//     m = moment(Number(etc.patientdob) - 1, "YYYYMMDD", "th", true);
//     birthDate = moment(m).subtract(543, "year");
//     birthDate = moment(birthDate).add(1, "day").format("YYYY-MM-DD");
//   }

//   let codeArr = new Array();
//   let codeArrPush = new Array();
//   let numDontKnow = Math.floor(Math.random() * 10000);
//   let dateBirthConvert = moment(birthDate).format("DD/MM/YYYY");

//   var dateParts = birthDate.split("-");
//   var dateObject = new Date(+dateParts[0], +dateParts[1], +dateParts[2]);
//   var timeDiff = Math.abs(Date.now() - new Date(dateObject).getTime());
//   var age = Math.floor(timeDiff / (1000 * 3600 * 24) / 365.25);

//   let j = 0;
//   let numSize = 0;
//   let arrSE = new Array();
//   let codeArrSE = new Array();
//   let zone = [];
//   data = data.sort((a, b) => (a.Qty < b.Qty ? 1 : a.Qty > b.Qty ? -1 : 0));
//   for (let i = 0; i < data.length; i++) {
//     if (data[i].Qty > 0) {
//       let dataZone = await pmpf.dataZone(data[i].code);

//       if (dataZone.length != 0) {
//         zone.push(dataZone[0].group_id);
//       } else {
//         zone.push(3);
//       }
//     }

//     let seD = { code: data[i].code, lo: "XMed1" };
//     let listDrugSE = [];
//     let datadrugMain = await Xmed.dataDrugMain(seD);

//     if (datadrugMain.length > 0) {
//       if (data[i].Qty >= datadrugMain[0].HisPackageRatio) {
//         datadrugMain[0].lo = "main";
//         listDrugSE.push(datadrugMain[0]);
//       }
//     }
//     let seP = {
//       code: data[i].code.includes("-") ? data[i].code : data[i].code + "-",
//       lo: "XMed1",
//     };
//     let datadrugPre = await Xmed.datadrugX(seP);

//     if (datadrugPre.length > 0) {
//       for (let index = 0; index < datadrugPre.length; index++) {
//         if (data[i].Qty >= datadrugPre[index].HisPackageRatio) {
//           datadrugPre[index].lo = "pre";
//           listDrugSE.push(datadrugPre[index]);
//         }
//       }
//     }
//     let jvmD = { code: data[i].code, lo: "JV" };
//     let listDrugJvm = await pmpf.datadrugMain(jvmD);

//     if (listDrugSE.length > 0) {
//       let datamathSE = mathSE(listDrugSE, { Qty: data[i].Qty });

//       listDrugSE = datamathSE.drug;
//       data[i].Qty = datamathSE.Qty;
//       // listDrugSE = [];

//       for (let x = 0; x < listDrugSE.length; x++) {
//         if (listDrugSE[x].qty) {
//           if (
//             Math.floor(
//               listDrugSE[x].qty / Number(listDrugSE[x].HisPackageRatio)
//             ) <= 15
//           ) {
//             let drugSize =
//               ~~(listDrugSE[x].qty / listDrugSE[x].HisPackageRatio) *
//               listDrugSE[x].Item;

//             let se = null;

//             if (numSize + drugSize < 3200) {
//               numSize = numSize + drugSize;
//               se = null;
//               se = {
//                 code: listDrugSE[x].drugCode,
//                 Name: listDrugSE[x].drugName,
//                 alias: data[i].alias,
//                 firmName: data[i].firmName,
//                 method: data[i].method,
//                 note: data[i].note,
//                 spec: data[i].spec,
//                 type: data[i].type,
//                 unit: data[i].unit,
//                 pack: listDrugSE[x].HisPackageRatio,
//                 location: data[i].location,
//                 device: "XMed",
//                 Qty:
//                   Math.floor(
//                     listDrugSE[x].qty / listDrugSE[x].HisPackageRatio
//                   ) * listDrugSE[x].HisPackageRatio,
//               };
//               Number(se.Qty) ? arrSE.push(se) : "";

//               if (
//                 x === listDrugSE.length - 1 &&
//                 data[i].Qty &&
//                 !listDrugJvm.length
//               ) {
//                 se = null;
//                 se = {
//                   code: data[i].code,
//                   Name: listDrugSE[x].drugName,
//                   alias: data[i].alias,
//                   firmName: data[i].firmName,
//                   method: data[i].method,
//                   note: data[i].note,
//                   spec: data[i].spec,
//                   type: data[i].type,
//                   unit: data[i].unit,
//                   pack: listDrugSE[x].HisPackageRatio,
//                   location: data[i].location,
//                   device: "XMed",
//                   Qty: data[i].Qty,
//                 };
//                 arrSE.push(se);
//                 data[i].Qty = 0;
//               }

//               // numSize = numSize + drugSize;

//               // se.Qty =
//               //   Math.floor(listDrugSE[x].qty / listDrugSE[x].HisPackageRatio) *
//               //   listDrugSE[x].HisPackageRatio;
//               // Number(se.Qty) ? arrSE.push(se) : "";

//               // if (
//               //   x === listDrugSE.length - 1 &&
//               //   data[i].Qty &&
//               //   !listDrugJvm.length
//               // ) {
//               //   se.code = data[i].code;
//               //   // se.Qty = data[i].Qty;
//               //   arrSE.push(se);
//               //   // arrSE[listDrugSE.length - 1].Qty = data[i].Qty;
//               //   data[i].Qty = 0;
//               // }
//               // console.log(arrSE);
//             } else {
//               do {
//                 se = null;
//                 se = {
//                   code: listDrugSE[x].drugCode,
//                   Name: listDrugSE[x].drugName,
//                   alias: data[i].alias,
//                   firmName: data[i].firmName,
//                   method: data[i].method,
//                   note: data[i].note,
//                   spec: data[i].spec,
//                   type: data[i].type,
//                   unit: data[i].unit,
//                   pack: listDrugSE[x].HisPackageRatio,
//                   location: data[i].location,
//                   device: "XMed",
//                   Qty:
//                     ~~(Math.abs(numSize - 3200) / listDrugSE[x].Item) *
//                     listDrugSE[x].HisPackageRatio,
//                 };
//                 // se.Qty =
//                 //   ~~(Math.abs(numSize - 3200) / listDrugSE[x].Item) *
//                 //   listDrugSE[x].HisPackageRatio;

//                 drugSize =
//                   ~~(
//                     (listDrugSE[x].qty - se.Qty) /
//                     listDrugSE[x].HisPackageRatio
//                   ) * listDrugSE[x].Item;
//                 listDrugSE[x].qty = listDrugSE[x].qty - se.Qty;
//                 // data[i].Qty = listDrugSE[x].qty;
//                 Number(se.Qty) ? arrSE.push(se) : "";

//                 if (
//                   x === listDrugSE.length - 1 &&
//                   data[i].Qty &&
//                   drugSize < 3200 &&
//                   !listDrugJvm.length
//                 ) {
//                   se = null;
//                   se = {
//                     code: data[i].code,
//                     Name: listDrugSE[x].drugName,
//                     alias: data[i].alias,
//                     firmName: data[i].firmName,
//                     method: data[i].method,
//                     note: data[i].note,
//                     spec: data[i].spec,
//                     type: data[i].type,
//                     unit: data[i].unit,
//                     pack: listDrugSE[x].HisPackageRatio,
//                     location: data[i].location,
//                     device: "XMed",
//                     Qty: data[i].Qty,
//                   };
//                   arrSE.push(se);
//                   data[i].Qty = 0;
//                 }

//                 codeArrSE.push(arrSE);
//                 arrSE = [];
//                 numSize = 0;
//               } while (drugSize > 3200);

//               if (drugSize >= listDrugSE[x].Item) {
//                 // var seS = {};
//                 // seS.code = listDrugSE[x].drugCode;
//                 // seS.Name = listDrugSE[x].drugName;
//                 // seS.alias = data[i].alias;
//                 // seS.firmName = data[i].firmName;
//                 // seS.method = data[i].method;
//                 // seS.note = data[i].note;
//                 // seS.spec = data[i].spec;
//                 // seS.type = data[i].type;
//                 // seS.unit = data[i].unit;
//                 // seS.pack = listDrugSE[x].HisPackageRatio;
//                 // seS.location = data[i].location;
//                 se = null;
//                 se = {
//                   code: listDrugSE[x].drugCode,
//                   Name: listDrugSE[x].drugName,
//                   alias: data[i].alias,
//                   firmName: data[i].firmName,
//                   method: data[i].method,
//                   note: data[i].note,
//                   spec: data[i].spec,
//                   type: data[i].type,
//                   unit: data[i].unit,
//                   pack: listDrugSE[x].HisPackageRatio,
//                   location: data[i].location,
//                   device: "XMed",
//                   Qty:
//                     ~~(drugSize / listDrugSE[x].Item) *
//                     listDrugSE[x].HisPackageRatio,
//                 };

//                 Number(se.Qty) ? arrSE.push(se) : "";
//                 if (
//                   x === listDrugSE.length - 1 &&
//                   data[i].Qty &&
//                   !listDrugJvm.length
//                 ) {
//                   se = null;
//                   se = {
//                     code: data[i].code,
//                     Name: listDrugSE[x].drugName,
//                     alias: data[i].alias,
//                     firmName: data[i].firmName,
//                     method: data[i].method,
//                     note: data[i].note,
//                     spec: data[i].spec,
//                     type: data[i].type,
//                     unit: data[i].unit,
//                     pack: listDrugSE[x].HisPackageRatio,
//                     location: data[i].location,
//                     device: "XMed",
//                     Qty: data[i].Qty,
//                   };
//                   arrSE.push(se);
//                   data[i].Qty = 0;
//                 }
//                 numSize =
//                   ~~(drugSize / listDrugSE[x].Item) * listDrugSE[x].Item;
//               }
//             }
//             // } else {
//             //   let dataArr = listDrugSE.filter(function (item) {
//             //     return item.drugCode !== listDrugSE[x].drugCode;
//             //   });

//             //   let mathAgain = mathSE(dataArr, { Qty: listDrugSE[x].qty });
//             //   mathAgain.drug = mathAgain.drug.filter(
//             //     (element) => element.qty !== 0
//             //   );

//             //   data[i].Qty = data[i].Qty + mathAgain.Qty;

//             //   for (let j = 0; j < mathAgain.drug.length; j++) {
//             //     listDrugSE[listDrugSE.length] = mathAgain.drug[j];
//             //   }
//             // }

//             // } else {
//             //   data[i].Qty = data[i].Qty + listDrugSE[x].qty;
//             // }
//           } else {
//             data[i].Qty = data[i].Qty + listDrugSE[x].qty;
//           }
//         }
//       }
//     }

//     let lcaD = { code: data[i].code + "-", lo: "J" };
//     let listDrugLca = await pmpf.datadrugX(lcaD);

//     if (
//       listDrugLca.length !== 0 &&
//       Math.floor(data[i].Qty / listDrugLca[0].HisPackageRatio) *
//         listDrugLca[0].HisPackageRatio >
//         0
//     ) {
//       var lca = {};
//       lca.code = listDrugLca[0].drugCode;
//       lca.Qty =
//         Math.floor(data[i].Qty / listDrugLca[0].HisPackageRatio) *
//         listDrugLca[0].HisPackageRatio;
//       lca.Name = data[i].Name;
//       lca.alias = data[i].alias;
//       lca.firmName = data[i].firmName;
//       lca.method = data[i].method;
//       lca.note = data[i].note;
//       lca.spec = data[i].spec;
//       lca.type = data[i].type;
//       lca.unit = data[i].unit;
//       lca.pack = data[i].pack;
//       lca.location = data[i].location;
//       lca.device = "J";
//       codeArrPush.push(lca);
//       data[i].Qty = data[i].Qty % listDrugLca[0].HisPackageRatio;
//     }

//     let numMax = 0;
//     if (data[i].Qty > 0) {
//       if (listDrugJvm.length !== 0) {
//         let dataonCube = await onCube.datadrug(data[i].code);
//         let dateC = null;
//         let date = new Date();
//         date.setFullYear(date.getFullYear() + 1);

//         let warning = "";
//         // if (dataonCube[0].dateDiff && data[i].freetext1 && data[i].dosage) {
//         //   if (
//         //     dataonCube[0].dateDiff -
//         //       data[i].Qty / (Number(s.match(r)) * Number(data[i].dosage)) <
//         //     0
//         //   ) {
//         //     warning = "";
//         //   }
//         // }
//         if (dataonCube.length) {
//           if (dataonCube[0].dateDiff) {
//             if (dataonCube[0].dateDiff < 365) {
//               warning = "*";
//             }
//           }
//         }

//         if (dataonCube.length !== 0) {
//           if (dataonCube[0].ExpiredDate) {
//             dateC = moment(dataonCube[0].ExpiredDate)
//               .add(543, "year")
//               .format("DD/MM/YYYY");
//           } else {
//             dateC = moment(date).add(543, "year").format("DD/MM/YYYY");
//           }

//           if (Number(dataonCube[0].QuantityMaximum)) {
//             numMax = Number(dataonCube[0].QuantityMaximum);
//           } else {
//             numMax = data[i].Qty;
//           }
//         } else {
//           dateC = moment(date).add(543, "year").format("DD/MM/YYYY");
//           numMax = data[i].Qty;
//         }

//         let amount = 0;
//         let qty = data[i].Qty;
//         let dateAdd = "00:" + (j < 10 ? `0${j}` : `${j}`);
//         do {
//           j++;
//           amount = qty >= numMax ? numMax : qty;
//           let dataJVM =
//             etc.name +
//             "|" +
//             etc.hn +
//             j +
//             "|" +
//             etc.prescriptionno +
//             "|" +
//             dateBirthConvert +
//             " 0:00:00|OPD|||" +
//             age +
//             "||" +
//             numDontKnow +
//             "|I|" +
//             amount +
//             "|" +
//             data[i].code +
//             "|" +
//             data[i].Name +
//             "|" +
//             dateA +
//             "|" +
//             dateA +
//             "|" +
//             dateAdd +
//             "|||โรงพยาบาลมหาราชนครราชสีมา|||" +
//             etc.prescriptionno +
//             data[i].code +
//             "|||" +
//             dateB +
//             "|" +
//             dateC +
//             "|" +
//             etc.hn +
//             "|" +
//             etc.queue +
//             " " +
//             warning +
//             "|";

//           codeArr.push(dataJVM);
//           qty = qty - amount;
//         } while (qty > 0);
//       }

//       codeArrPush.push(data[i]);
//     }
//   }

//   let DataJV = "";
//   if (codeArr.length > 0) {
//     for (let i = 0; i < codeArr.length; i++) {
//       const myArray = codeArr[i].split("|");

//       var checkStar = await homc.getDrugstar(myArray[12]);

//       checkStar = checkStar.length ? (checkStar[0].val === 1 ? "*" : "") : "";
//       codeArr[i] =
//         codeArr[i] + "(" + (i + 1) + "/" + codeArr.length + ")" + checkStar;
//     }

//     DataJV = codeArr.join("\r\n");
//   }

//   let op = [];

//   for (let i = 0; i < codeArrSE.length; i++) {
//     op.push(codeArrSE[i]);
//   }

//   op.push(arrSE.concat(codeArrPush));

//   var orderNo =
//     etc.prescriptionno +
//     "_" +
//     ("0" + momentDate.getHours()).slice(-2) +
//     +("0" + momentDate.getMinutes()).slice(-2) +
//     +("0" + momentDate.getSeconds()).slice(-2);

//   let value2 = [];
//   let dih = 1;
//   let jvm = 1;
//   // let checkWin = null;
//   // if (etc.win1 && !etc.win2) {
//   //   checkWin = 3;
//   // } else if (!etc.win1 && etc.win2) {
//   //   checkWin = 4;
//   // } else {
//   //   checkWin = "";
//   // }
//   // for (let i = 0; i < op.length; i++) {
//   //   for (let j = 0; j < op[i].length; j++) {
//   //     let value = {
//   //       drug: op[i][j],
//   //     };
//   //     value2.push(value);
//   //   }
//   //   let checkXmed = "";
//   //   let ex = value2.map((a) => a.drug.device).filter(Boolean);
//   //   ex = Array.from(new Set(ex));
//   //   zone = zone.sort((a, b) => (a > b ? 1 : a < b ? -1 : 0));

//   //   let jsonDrug = {
//   //     patient: {
//   //       patID: etc.hn,
//   //       patName:
//   //         etc.name.length > 14
//   //           ? etc.queue +
//   //             " " +
//   //             etc.name.substring(0, 12) +
//   //             ".." +
//   //             `[${zone[0]}](` +
//   //             (i + 1) +
//   //             "/" +
//   //             op.length +
//   //             ")" +
//   //             checkXmed
//   //           : etc.queue +
//   //             " " +
//   //             etc.name +
//   //             `[${zone[0]}](` +
//   //             (i + 1) +
//   //             "/" +
//   //             op.length +
//   //             ")" +
//   //             checkXmed,
//   //       gender: etc.sex,
//   //       birthday: birthDate,
//   //       age: age,
//   //       identity: "",
//   //       insuranceNo: "",
//   //       chargeType: "",
//   //     },
//   //     prescriptions: {
//   //       prescription: {
//   //         orderNo: orderNo + (i + 1),
//   //         ordertype: "M",
//   //         pharmacy: "OPD",
//   //         // windowNo: checkWin,
//   //         windowNo: ex.length > 2 ? 3 : 4,
//   //         paymentIP: "",
//   //         paymentDT: datePayment,
//   //         outpNo: "",
//   //         visitNo: "",
//   //         deptCode: "",
//   //         deptName: "",
//   //         doctCode: "",
//   //         doctName: "",
//   //         diagnosis: "",
//   //         drugs: value2,
//   //       },
//   //     },
//   //   };

//   //   value2 = [];

//   //   let xmlDrug = {
//   //     xml: js2xmlparser.parse("outpOrderDispense", jsonDrug),
//   //   };
//   //   // console.log(xmlDrug);
//   //   console.log("-------------------------------------------------");

//   //   if (etc.dih) {
//   //     var url =
//   //       "http://192.168.185.102:8788/axis2/services/DIHPMPFWebservice?wsdl";
//   //     var client = await soap.createClientAsync(url);
//   //     var result = await client.outpOrderDispenseAsync(xmlDrug);

//   //     var val = await transform(result[0].return, { data: "//code" });

//   //     if (val.data !== "0") {
//   //       dih = 0;
//   //     }
//   //   }
//   // }
//   let arrJson = [];
//   let value3 = [];
//   for (let i = 0; i < op.length; i++) {
//     for (let j = 0; j < op[i].length; j++) {
//       let value = {
//         drug: op[i][j],
//       };

//       value2.push(value);
//       value3.push(value);
//     }

//     zone = zone.sort((a, b) => (a > b ? 1 : a < b ? -1 : 0));

//     let jsonDrug = {
//       patient: {
//         patID: etc.hn,
//         patName:
//           etc.name.length > 14
//             ? etc.queue +
//               " " +
//               etc.name.substring(0, 12) +
//               ".." +
//               `[${zone[0]}](` +
//               (i + 1) +
//               "/" +
//               op.length +
//               ")"
//             : etc.queue +
//               " " +
//               etc.name +
//               `[${zone[0]}](` +
//               (i + 1) +
//               "/" +
//               op.length +
//               ")",
//         gender: etc.sex,
//         birthday: birthDate,
//         age: age,
//         identity: "",
//         insuranceNo: "",
//         chargeType: "",
//       },
//       prescriptions: {
//         prescription: {
//           orderNo: orderNo + (i + 1),
//           ordertype: "M",
//           pharmacy: "OPD",
//           // windowNo: checkWin,
//           windowNo: "",
//           paymentIP: "",
//           paymentDT: datePayment,
//           outpNo: "",
//           visitNo: "",
//           deptCode: "",
//           deptName: "",
//           doctCode: "",
//           doctName: "",
//           diagnosis: "",
//           drugs: value2,
//         },
//       },
//     };
//     arrJson.push(jsonDrug);
//     value2 = [];
//   }
//   let ex = value3.map((a) => a.drug.device).filter(Boolean);
//   ex = Array.from(new Set(ex));
//   arrJson.map(async function (item) {
//     if (etc.win1 && !etc.win2) {
//       item.prescriptions.prescription.windowNo = ex.length > 4 ? 3 : 4;
//     } else {
//       item.prescriptions.prescription.windowNo =
//         etc.user.toLowerCase().charAt(0) === "c" ? 4 : 3;
//     }

//     if (etc.win1 && !etc.win2) {
//       item.prescriptions.prescription.windowNo = 3;
//     } else if (!etc.win1 && etc.win2) {
//       item.prescriptions.prescription.windowNo = 4;
//     }

//     let xmlDrug = {
//       xml: js2xmlparser.parse("outpOrderDispense", item),
//     };
//     // console.log(xmlDrug);
//     console.log("-------------------------------------------------");
//     console.log("WindowNo : " + item.prescriptions.prescription.windowNo);
//     console.log("Locataion : " + ex);
//     if (etc.dih) {
//       var url =
//         "http://192.168.185.102:8788/axis2/services/DIHPMPFWebservice?wsdl";
//       var client = await soap.createClientAsync(url);
//       var result = await client.outpOrderDispenseAsync(xmlDrug);

//       var val = await transform(result[0].return, { data: "//code" });

//       if (val.data !== "0") {
//         dih = 0;
//       }
//     }
//     return item;
//   });

//   zone = [];
//   let numtxt = 0;
//   if (etc.jvm) {
//     if (DataJV) {
//       var now = new Date();
//       var fileName = moment(now).format("YYYYMMDDHHmmssSSS") + ".txt";
//       var fullNameJVM = fileName;
//       numtxt++;
//       if (numtxt === 1) {
//         jvm = await createFile(fullNameJVM, DataJV);
//         if (jvm) {
//           const { exec } = require("child_process");
//           exec(
//             "gd4iconv.exe DATA/JVM_OPD/" +
//               fullNameJVM +
//               " tis-620 \\\\192.168.185.164\\OCSReading\\" +
//               fullNameJVM,
//             (err, stdout, stderr) => {
//               if (err) {
//                 console.log(err);
//                 return;
//               }

//               if (stdout == "1") {
//                 jvm = 1;
//               } else {
//                 jvm = 0;
//               }
//             }
//           );
//         } else {
//           jvm = 0;
//         }
//       }
//     }
//   }

//   let checkStatus = {
//     dih: dih,
//     jvm: jvm,
//   };
//   return checkStatus;
// }
async function getdataHomc(data, etc) {
  // try {

  const momentDate = new Date();
  let datePayment = moment(momentDate).format("YYYY-MM-DD");
  let dateA = moment(momentDate).format("YYMMDD");
  let dateB = moment(momentDate).add(543, "year").format("DD/MM/YYYY");
  let birthDate = null;
  let m = null;

  m = moment(etc.patientdob, "YYYYMMDD", "th", true);

  birthDate = moment(m).subtract(543, "year").format("YYYY-MM-DD");
  if (birthDate == "Invalid date") {
    m = moment(Number(etc.patientdob) - 1, "YYYYMMDD", "th", true);
    birthDate = moment(m).subtract(543, "year");
    birthDate = moment(birthDate).add(1, "day").format("YYYY-MM-DD");
  }

  let codeArr = new Array();
  let codeArrPush = new Array();
  let numDontKnow = Math.floor(Math.random() * 10000);
  let dateBirthConvert = moment(birthDate).format("DD/MM/YYYY");

  var dateParts = birthDate.split("-");
  var dateObject = new Date(+dateParts[0], +dateParts[1], +dateParts[2]);
  var timeDiff = Math.abs(Date.now() - new Date(dateObject).getTime());
  var age = Math.floor(timeDiff / (1000 * 3600 * 24) / 365.25);

  let j = 0;
  let numSize = 0;
  let arrSE = new Array();
  let codeArrSE = new Array();
  let zone = [];
  let checkcut = await gd4unit101.checkCut();
  data = data.sort((a, b) => (a.Qty < b.Qty ? 1 : a.Qty > b.Qty ? -1 : 0));
  for (let i = 0; i < data.length; i++) {
    let ck_c = checkcut.filter((val) => val.drugCode == data[i].code);
    if (ck_c.length) {
      if (data[i].Qty > ck_c[0].qty_cut) {
        data[i].Qty = ck_c[0].qty_cut;
      }
    }
    ck_c = [];
    // if (data[i].Qty > 0) {
    //   let dataZone = await pmpf.dataZone(data[i].code);

    //   if (dataZone.length != 0) {
    //     zone.push(dataZone[0].group_id);
    //   } else {
    //     zone.push(3);
    //   }
    // }

    let seD = { code: data[i].code, lo: "XMed1" };
    let listDrugSE = [];
    let datadrugMain = await Xmed.dataDrugMain(seD);

    if (datadrugMain.length > 0) {
      if (data[i].Qty >= datadrugMain[0].HisPackageRatio) {
        datadrugMain[0].lo = "main";
        listDrugSE.push(datadrugMain[0]);
      }
    }
    let seP = {
      code: data[i].code.includes("-") ? data[i].code : data[i].code + "-",
      lo: "XMed1",
    };
    let datadrugPre = await Xmed.datadrugX(seP);

    if (datadrugPre.length > 0) {
      for (let index = 0; index < datadrugPre.length; index++) {
        if (data[i].Qty >= datadrugPre[index].HisPackageRatio) {
          datadrugPre[index].lo = "pre";
          listDrugSE.push(datadrugPre[index]);
        }
      }
    }
    let jvmD = { code: data[i].code, lo: "JV" };
    let listDrugJvm = await pmpf.datadrugMain(jvmD);

    if (listDrugSE.length > 0) {
      let datamathSE = mathSE(listDrugSE, { Qty: data[i].Qty });

      listDrugSE = datamathSE.drug;
      data[i].Qty = datamathSE.Qty;
      // listDrugSE = [];

      for (let x = 0; x < listDrugSE.length; x++) {
        if (listDrugSE[x].qty) {
          if (
            Math.floor(
              listDrugSE[x].qty / Number(listDrugSE[x].HisPackageRatio)
            ) <= 15
          ) {
            let drugSize =
              ~~(listDrugSE[x].qty / listDrugSE[x].HisPackageRatio) *
              listDrugSE[x].Item;

            let se = null;

            if (numSize + drugSize < 3200) {
              numSize = numSize + drugSize;
              se = null;
              se = {
                code: listDrugSE[x].drugCode,
                Name: listDrugSE[x].drugName,
                alias: data[i].alias,
                firmName: data[i].firmName,
                method: data[i].method,
                note: data[i].note,
                spec: data[i].spec,
                type: data[i].type,
                unit: data[i].unit,
                pack: listDrugSE[x].HisPackageRatio,
                location: data[i].location,
                device: "XMed",
                Qty:
                  Math.floor(
                    listDrugSE[x].qty / listDrugSE[x].HisPackageRatio
                  ) * listDrugSE[x].HisPackageRatio,
              };
              Number(se.Qty) ? arrSE.push(se) : "";

              if (
                x === listDrugSE.length - 1 &&
                data[i].Qty &&
                !listDrugJvm.length
              ) {
                se = null;
                se = {
                  code: data[i].code,
                  Name: listDrugSE[x].drugName,
                  alias: data[i].alias,
                  firmName: data[i].firmName,
                  method: data[i].method,
                  note: data[i].note,
                  spec: data[i].spec,
                  type: data[i].type,
                  unit: data[i].unit,
                  pack: listDrugSE[x].HisPackageRatio,
                  location: data[i].location,
                  device: "XMed",
                  Qty: data[i].Qty,
                };
                arrSE.push(se);
                data[i].Qty = 0;
              }

              // numSize = numSize + drugSize;

              // se.Qty =
              //   Math.floor(listDrugSE[x].qty / listDrugSE[x].HisPackageRatio) *
              //   listDrugSE[x].HisPackageRatio;
              // Number(se.Qty) ? arrSE.push(se) : "";

              // if (
              //   x === listDrugSE.length - 1 &&
              //   data[i].Qty &&
              //   !listDrugJvm.length
              // ) {
              //   se.code = data[i].code;
              //   // se.Qty = data[i].Qty;
              //   arrSE.push(se);
              //   // arrSE[listDrugSE.length - 1].Qty = data[i].Qty;
              //   data[i].Qty = 0;
              // }
              // console.log(arrSE);
            } else {
              do {
                se = null;
                se = {
                  code: listDrugSE[x].drugCode,
                  Name: listDrugSE[x].drugName,
                  alias: data[i].alias,
                  firmName: data[i].firmName,
                  method: data[i].method,
                  note: data[i].note,
                  spec: data[i].spec,
                  type: data[i].type,
                  unit: data[i].unit,
                  pack: listDrugSE[x].HisPackageRatio,
                  location: data[i].location,
                  device: "XMed",
                  Qty:
                    ~~(Math.abs(numSize - 3200) / listDrugSE[x].Item) *
                    listDrugSE[x].HisPackageRatio,
                };
                // se.Qty =
                //   ~~(Math.abs(numSize - 3200) / listDrugSE[x].Item) *
                //   listDrugSE[x].HisPackageRatio;

                drugSize =
                  ~~(
                    (listDrugSE[x].qty - se.Qty) /
                    listDrugSE[x].HisPackageRatio
                  ) * listDrugSE[x].Item;
                listDrugSE[x].qty = listDrugSE[x].qty - se.Qty;
                // data[i].Qty = listDrugSE[x].qty;
                Number(se.Qty) ? arrSE.push(se) : "";

                if (
                  x === listDrugSE.length - 1 &&
                  data[i].Qty &&
                  drugSize < 3200 &&
                  !listDrugJvm.length
                ) {
                  se = null;
                  se = {
                    code: data[i].code,
                    Name: listDrugSE[x].drugName,
                    alias: data[i].alias,
                    firmName: data[i].firmName,
                    method: data[i].method,
                    note: data[i].note,
                    spec: data[i].spec,
                    type: data[i].type,
                    unit: data[i].unit,
                    pack: listDrugSE[x].HisPackageRatio,
                    location: data[i].location,
                    device: "XMed",
                    Qty: data[i].Qty,
                  };
                  arrSE.push(se);
                  data[i].Qty = 0;
                }

                codeArrSE.push(arrSE);
                arrSE = [];
                numSize = 0;
              } while (drugSize > 3200);

              if (drugSize >= listDrugSE[x].Item) {
                // var seS = {};
                // seS.code = listDrugSE[x].drugCode;
                // seS.Name = listDrugSE[x].drugName;
                // seS.alias = data[i].alias;
                // seS.firmName = data[i].firmName;
                // seS.method = data[i].method;
                // seS.note = data[i].note;
                // seS.spec = data[i].spec;
                // seS.type = data[i].type;
                // seS.unit = data[i].unit;
                // seS.pack = listDrugSE[x].HisPackageRatio;
                // seS.location = data[i].location;
                se = null;
                se = {
                  code: listDrugSE[x].drugCode,
                  Name: listDrugSE[x].drugName,
                  alias: data[i].alias,
                  firmName: data[i].firmName,
                  method: data[i].method,
                  note: data[i].note,
                  spec: data[i].spec,
                  type: data[i].type,
                  unit: data[i].unit,
                  pack: listDrugSE[x].HisPackageRatio,
                  location: data[i].location,
                  device: "XMed",
                  Qty:
                    ~~(drugSize / listDrugSE[x].Item) *
                    listDrugSE[x].HisPackageRatio,
                };

                Number(se.Qty) ? arrSE.push(se) : "";
                if (
                  x === listDrugSE.length - 1 &&
                  data[i].Qty &&
                  !listDrugJvm.length
                ) {
                  se = null;
                  se = {
                    code: data[i].code,
                    Name: listDrugSE[x].drugName,
                    alias: data[i].alias,
                    firmName: data[i].firmName,
                    method: data[i].method,
                    note: data[i].note,
                    spec: data[i].spec,
                    type: data[i].type,
                    unit: data[i].unit,
                    pack: listDrugSE[x].HisPackageRatio,
                    location: data[i].location,
                    device: "XMed",
                    Qty: data[i].Qty,
                  };
                  arrSE.push(se);
                  data[i].Qty = 0;
                }
                numSize =
                  ~~(drugSize / listDrugSE[x].Item) * listDrugSE[x].Item;
              }
            }
            // } else {
            //   let dataArr = listDrugSE.filter(function (item) {
            //     return item.drugCode !== listDrugSE[x].drugCode;
            //   });

            //   let mathAgain = mathSE(dataArr, { Qty: listDrugSE[x].qty });
            //   mathAgain.drug = mathAgain.drug.filter(
            //     (element) => element.qty !== 0
            //   );

            //   data[i].Qty = data[i].Qty + mathAgain.Qty;

            //   for (let j = 0; j < mathAgain.drug.length; j++) {
            //     listDrugSE[listDrugSE.length] = mathAgain.drug[j];
            //   }
            // }

            // } else {
            //   data[i].Qty = data[i].Qty + listDrugSE[x].qty;
            // }
          } else {
            data[i].Qty = data[i].Qty + listDrugSE[x].qty;
          }
        }
      }
    }

    let lcaD = { code: data[i].code + "-", lo: "J" };
    let listDrugLca = await pmpf.datadrugX(lcaD);

    if (
      listDrugLca.length !== 0 &&
      Math.floor(data[i].Qty / listDrugLca[0].HisPackageRatio) *
        listDrugLca[0].HisPackageRatio >
        0
    ) {
      var lca = {};
      lca.code = listDrugLca[0].drugCode;
      lca.Qty =
        Math.floor(data[i].Qty / listDrugLca[0].HisPackageRatio) *
        listDrugLca[0].HisPackageRatio;
      lca.Name = data[i].Name;
      lca.alias = data[i].alias;
      lca.firmName = data[i].firmName;
      lca.method = data[i].method;
      lca.note = data[i].note;
      lca.spec = data[i].spec;
      lca.type = data[i].type;
      lca.unit = data[i].unit;
      lca.pack = data[i].pack;
      lca.location = data[i].location;
      lca.device = "J";
      codeArrPush.push(lca);
      data[i].Qty = data[i].Qty % listDrugLca[0].HisPackageRatio;
    }

    let numMax = 0;
    if (data[i].Qty > 0) {
      if (listDrugJvm.length !== 0) {
        if (etc.jvm) {
          let dataonCube = await onCube.datadrug(data[i].code);
          let dateC = null;
          let date = new Date();
          date.setFullYear(date.getFullYear() + 1);

          let warning = "";
          // if (dataonCube[0].dateDiff && data[i].freetext1 && data[i].dosage) {
          //   if (
          //     dataonCube[0].dateDiff -
          //       data[i].Qty / (Number(s.match(r)) * Number(data[i].dosage)) <
          //     0
          //   ) {
          //     warning = "";
          //   }
          // }
          if (dataonCube.length) {
            if (dataonCube[0].dateDiff) {
              if (dataonCube[0].dateDiff < 365) {
                warning = "*";
              }
            }
          }
          if (dataonCube.length !== 0) {
            if (dataonCube[0].ExpiredDate) {
              dateC = moment(dataonCube[0].ExpiredDate)
                .add(543, "year")
                .format("DD/MM/YYYY");
            } else {
              dateC = moment(date).add(543, "year").format("DD/MM/YYYY");
            }

            if (Number(dataonCube[0].QuantityMaximum)) {
              numMax = Number(dataonCube[0].QuantityMaximum);
            } else {
              numMax = data[i].Qty;
            }
          } else {
            dateC = moment(date).add(543, "year").format("DD/MM/YYYY");
            numMax = data[i].Qty;
          }

          let amount = 0;
          let qty = data[i].Qty;
          let dateAdd = "00:" + (j < 10 ? `0${j}` : `${j}`);
          do {
            j++;
            amount = qty >= numMax ? numMax : qty;
            let dataJVM =
              etc.name +
              "|" +
              etc.hn +
              j +
              "|" +
              etc.prescriptionno +
              "|" +
              dateBirthConvert +
              " 0:00:00|OPD|||" +
              age +
              "||" +
              numDontKnow +
              "|I|" +
              amount +
              "|" +
              data[i].code +
              "|" +
              (data[i].Name == "Prednisolone 5 mg"
                ? "PREDnisolone 5 mg"
                : data[i].Name) +
              "|" +
              dateA +
              "|" +
              dateA +
              "|" +
              dateAdd +
              "|||โรงพยาบาลมหาราชนครราชสีมา|||" +
              etc.prescriptionno +
              data[i].code +
              "|||" +
              dateB +
              "|" +
              dateC +
              "|" +
              etc.hn +
              "|" +
              etc.queue +
              " " +
              warning +
              "|";

            codeArr.push(dataJVM);
            qty = qty - amount;
          } while (qty > 0);
        }
      }

      codeArrPush.push(data[i]);
    }
  }
  checkcut = null;
  let DataJV = "";
  if (codeArr.length > 0) {
    for (let i = 0; i < codeArr.length; i++) {
      const myArray = codeArr[i].split("|");

      var checkStar = await homc.getDrugstar(myArray[12]);

      checkStar = checkStar.length ? (checkStar[0].val === 1 ? "*" : "") : "";
      codeArr[i] =
        codeArr[i] + "(" + (i + 1) + "/" + codeArr.length + ")" + checkStar;
    }

    DataJV = codeArr.join("\r\n");
  }

  let op = [];

  for (let i = 0; i < codeArrSE.length; i++) {
    op.push(codeArrSE[i]);
  }

  op.push(arrSE.concat(codeArrPush));

  var orderNo =
    etc.prescriptionno +
    "_" +
    ("0" + momentDate.getHours()).slice(-2) +
    +("0" + momentDate.getMinutes()).slice(-2) +
    +("0" + momentDate.getSeconds()).slice(-2);

  let value2 = [];
  let dih = 1;
  let jvm = 1;
  // let checkWin = null;
  // if (etc.win1 && !etc.win2) {
  //   checkWin = 3;
  // } else if (!etc.win1 && etc.win2) {
  //   checkWin = 4;
  // } else {
  //   checkWin = "";
  // }
  // for (let i = 0; i < op.length; i++) {
  //   for (let j = 0; j < op[i].length; j++) {
  //     let value = {
  //       drug: op[i][j],
  //     };
  //     value2.push(value);
  //   }
  //   let checkXmed = "";
  //   let ex = value2.map((a) => a.drug.device).filter(Boolean);
  //   ex = Array.from(new Set(ex));
  //   zone = zone.sort((a, b) => (a > b ? 1 : a < b ? -1 : 0));

  //   let jsonDrug = {
  //     patient: {
  //       patID: etc.hn,
  //       patName:
  //         etc.name.length > 14
  //           ? etc.queue +
  //             " " +
  //             etc.name.substring(0, 12) +
  //             ".." +
  //             `[${zone[0]}](` +
  //             (i + 1) +
  //             "/" +
  //             op.length +
  //             ")" +
  //             checkXmed
  //           : etc.queue +
  //             " " +
  //             etc.name +
  //             `[${zone[0]}](` +
  //             (i + 1) +
  //             "/" +
  //             op.length +
  //             ")" +
  //             checkXmed,
  //       gender: etc.sex,
  //       birthday: birthDate,
  //       age: age,
  //       identity: "",
  //       insuranceNo: "",
  //       chargeType: "",
  //     },
  //     prescriptions: {
  //       prescription: {
  //         orderNo: orderNo + (i + 1),
  //         ordertype: "M",
  //         pharmacy: "OPD",
  //         // windowNo: checkWin,
  //         windowNo: ex.length > 2 ? 3 : 4,
  //         paymentIP: "",
  //         paymentDT: datePayment,
  //         outpNo: "",
  //         visitNo: "",
  //         deptCode: "",
  //         deptName: "",
  //         doctCode: "",
  //         doctName: "",
  //         diagnosis: "",
  //         drugs: value2,
  //       },
  //     },
  //   };

  //   value2 = [];

  //   let xmlDrug = {
  //     xml: js2xmlparser.parse("outpOrderDispense", jsonDrug),
  //   };
  //   // console.log(xmlDrug);
  //   console.log("-------------------------------------------------");

  //   if (etc.dih) {
  //     var url =
  //       "http://192.168.185.102:8788/axis2/services/DIHPMPFWebservice?wsdl";
  //     var client = await soap.createClientAsync(url);
  //     var result = await client.outpOrderDispenseAsync(xmlDrug);

  //     var val = await transform(result[0].return, { data: "//code" });

  //     if (val.data !== "0") {
  //       dih = 0;
  //     }
  //   }
  // }
  let arrJson = [];
  // let value3 = [];
  let sendzone = [];
  for (let i = 0; i < op.length; i++) {
    for (let j = 0; j < op[i].length; j++) {
      if (op[i][j].device == "XMed" && op[i][j].Qty % op[i][j].pack != 0) {
        op[i][j].device = data.find((d) => d.code == op[i][j].code).device;
      }

      let value = {
        drug: op[i][j],
      };

      value2.push(value);
      // value3.push(value);
    }

    sendzone = value2
      .map((a) => a.drug.device)
      .filter(Boolean)
      .map((item) => (item == "XMed" ? "Xmed1" : item));
    sendzone = Array.from(new Set(sendzone)).sort((a, b) =>
      a > b ? 1 : a < b ? -1 : 0
    );

    let dataZone = await pmpf.dataZone(`'${sendzone.join("','")}'`);

    if (dataZone.length != 0) {
      zone = dataZone
        .sort((a, b) =>
          a.group_id > b.group_id ? 1 : a.group_id < b.group_id ? -1 : 0
        )
        .map((val) => val.group_id);
    } else {
      zone.push(3);
    }
    // console.log(sendzone);
    // console.log(zone);
    let jun =
      sendzone.toString() === "JV,Xmed1"
        ? 99
        : sendzone.toString() === "Xmed1"
        ? 99
        : sendzone.toString() === "JV"
        ? 99
        : sendzone.toString() === "J"
        ? 99
        : sendzone.toString() === "J,JV,Xmed1"
        ? 99
        : sendzone.toString() === "J,JV"
        ? 99
        : sendzone.toString() === "J,Xmed1"
        ? 99
        : 0;

    let jsonDrug = {
      patient: {
        patID: etc.hn,
        patName:
          etc.name.length > 14
            ? etc.queue +
              " " +
              etc.name.substring(0, 12) +
              ".." +
              `[${zone[0]}](` +
              (i + 1) +
              "/" +
              op.length +
              ")"
            : etc.queue +
              " " +
              etc.name +
              `[${zone[0]}](` +
              (i + 1) +
              "/" +
              op.length +
              ")",
        gender: etc.sex,
        birthday: birthDate,
        age: jun,
        identity: "",
        insuranceNo: "",
        chargeType: "",
      },
      prescriptions: {
        prescription: {
          orderNo: orderNo + (i + 1),
          ordertype: "M",
          pharmacy: "OPD",
          // windowNo: checkWin,
          windowNo: "",
          paymentIP: "",
          paymentDT: datePayment,
          outpNo: "",
          visitNo: "",
          deptCode: "",
          deptName: "",
          doctCode: "",
          doctName: "",
          diagnosis: "",
          drugs: value2,
        },
      },
    };
    arrJson.push(jsonDrug);
    value2 = [];
  }

  let winNo = null;
  if (etc.user.toLowerCase().charAt(0) === "c") {
    winNo = 4;
  } else {
    winNo = 3;
    // let obj = JSON.parse(fs.readFileSync("./config.json", "utf-8"));

    // winNo = obj.win == 3 ? 4 : 3;
    // obj.win = winNo;
    // fs.writeFile("./config.json", JSON.stringify(obj), (err) => {
    //   if (err) throw err;
    //   obj = null;
    // });
  }
  arrJson.map(async function (item) {
    item.prescriptions.prescription.windowNo = winNo;
    // if (etc.user.toLowerCase().charAt(0) === "c") {
    //   item.prescriptions.prescription.windowNo = 4;
    // } else {
    //   item.prescriptions.prescription.windowNo = "";
    //   // let obj = JSON.parse(fs.readFileSync("./config.json", "utf-8"));

    //   // obj.win = obj.win == 3 ? 4 : 3;
    //   // item.prescriptions.prescription.windowNo = obj.win;
    //   // fs.writeFile("./config.json", JSON.stringify(obj), (err) => {
    //   //   if (err) throw err;
    //   //   obj = null;
    //   // });
    // }
    if (etc.win1 && !etc.win2) {
      item.prescriptions.prescription.windowNo = 3;
    } else if (!etc.win1 && etc.win2) {
      item.prescriptions.prescription.windowNo = 4;
    }
    let xmlDrug = {
      xml: js2xmlparser.parse("outpOrderDispense", item),
    };

    // console.log(xmlDrug);
    console.log("-------------------------------------------------");
    console.log("WindowNo : " + item.prescriptions.prescription.windowNo);
    console.log("Name : " + item.patient.patName);
    console.log("Locataion : " + sendzone);
    if (etc.dih) {
      var url =
        "http://192.168.185.102:8788/axis2/services/DIHPMPFWebservice?wsdl";
      var client = await soap.createClientAsync(url);
      var result = await client.outpOrderDispenseAsync(xmlDrug);

      var val = await transform(result[0].return, { data: "//code" });

      if (val.data !== "0") {
        dih = 0;
      }
    }
    return item;
  });
  winNo = null;
  dataZone = null;
  zone = [];
  sendzone = null;
  let numtxt = 0;
  if (etc.jvm) {
    if (DataJV) {
      var now = new Date();
      var fileName = moment(now).format("YYYYMMDDHHmmssSSS") + ".txt";
      var fullNameJVM = fileName;
      numtxt++;
      if (numtxt === 1) {
        jvm = await createFile(fullNameJVM, DataJV);
        if (jvm) {
          const { exec } = require("child_process");
          exec(
            "gd4iconv.exe DATA/JVM_OPD/" +
              fullNameJVM +
              " tis-620 \\\\192.168.185.164\\OCSReading\\" +
              fullNameJVM,
            (err, stdout, stderr) => {
              if (err) {
                console.log(err);
                return;
              }

              if (stdout == "1") {
                jvm = 1;
              } else {
                jvm = 0;
              }
            }
          );
        } else {
          jvm = 0;
        }
      }
    }
  }

  let checkStatus = {
    dih: dih,
    jvm: jvm,
  };
  return checkStatus;
}
async function createFile(filename = "DIH/file.XML", text) {
  let pathRoot = "DATA/JVM_OPD/";
  let fullname = pathRoot + filename;
  let path = require("path").dirname(fullname);

  return new Promise(function (resolve, reject) {
    if (!fs.existsSync(pathRoot)) {
      fs.mkdirSync(pathRoot);
    }

    if (!fs.existsSync(path)) {
      fs.mkdirSync(path);
    }
    fs.appendFileSync(fullname, text + "\r\n", (err) => {
      if (err) {
        throw err;
      }
    });
    resolve(1);
  });
}

function mathSE(listDrugSE, data) {
  let dataDrug = [];
  let listDrug_index = 0;
  listDrugSE = listDrugSE.sort((a, b) =>
    a.HisPackageRatio < b.HisPackageRatio
      ? 1
      : a.HisPackageRatio > b.HisPackageRatio
      ? -1
      : 0
  );

  let checkdrugmain = listDrugSE.filter(
    (val) => data.Qty % val.HisPackageRatio === 0 && val.lo === "main"
  );

  listDrugSE = checkdrugmain.length ? checkdrugmain : listDrugSE;

  if (!checkdrugmain.length) {
    let data_qty = data.Qty;

    if (listDrugSE.length !== 1) {
      do {
        if (listDrugSE.every((item) => !item.box)) {
          listDrug_index = 0;
        } else {
          let result = listDrugSE.filter((item) => item.box !== 0);
          result = result.find(
            (item2) =>
              // item2.box === Math.min(...result.map((item3) => item3.box)) &&
              item2.HisPackageRatio ===
              Math.min(...result.map((item3) => item3.HisPackageRatio))
          );

          if (
            listDrugSE[
              listDrugSE.map((e) => e.drugCode).indexOf(result.drugCode) + 1
            ] === undefined
          ) {
            listDrugSE = listDrugSE.map((obj) => {
              if (obj.HisPackageRatio === result.HisPackageRatio) {
                data_qty = data_qty + obj.box * obj.HisPackageRatio;
                obj.box = 0;
              }
              return obj;
            });
          } else {
            listDrugSE = listDrugSE.map((obj) => {
              if (obj.HisPackageRatio === result.HisPackageRatio) {
                obj.box--;
                data_qty = data_qty + obj.HisPackageRatio;
              }
              return obj;
            });
          }

          listDrug_index =
            listDrugSE.findIndex(
              (item) => item.HisPackageRatio === result.HisPackageRatio
            ) + 1;
        }

        for (let index = listDrug_index; index < listDrugSE.length; index++) {
          // if ( listDrugSE[index].box == undefined) {
          if (
            data_qty >= listDrugSE[index].HisPackageRatio &&
            ~~(data_qty / listDrugSE[index].HisPackageRatio) <=
              listDrugSE[index].Quantity
          ) {
            listDrugSE[index].box = ~~(
              data_qty / listDrugSE[index].HisPackageRatio
            );
            data_qty = data_qty % listDrugSE[index].HisPackageRatio;
          } else {
            listDrugSE[index].box = 0;
          }
          // }
        }
        setDrug = null;
        // let sum = 0;
        if (listDrugSE[listDrug_index] !== undefined) {
          sum = listDrugSE.reduce((accumulator, object) => {
            return accumulator + object.box;
          }, 0);
          for (let index = 0; index < listDrugSE.length; index++) {
            if (index !== listDrugSE.length - 1) {
              setDrug = setDrug + listDrugSE[index].box;
            }
          }
        }

        let pushDatadrug = [];
        for (let i = 0; i < listDrugSE.length; i++) {
          pushDatadrug.push({
            drugID: listDrugSE[i].drugID,
            drugCode: listDrugSE[i].drugCode,
            drugName: listDrugSE[i].drugName,
            HisPackageRatio: listDrugSE[i].HisPackageRatio,
            qty: listDrugSE[i].box * listDrugSE[i].HisPackageRatio,
            isPrepack: listDrugSE[i].isPrepack,
            lo: listDrugSE[i].lo,
            Quantity: listDrugSE[i].Quantity,
            Item: listDrugSE[i].Item,
          });
        }
        let arrFind = pushDatadrug.find((element) => element.lo === "main");
        let countZero = pushDatadrug.filter(
          (element) => element.qty === 0
        ).length;

        dataDrug.push({
          drug: pushDatadrug,
          box_main: arrFind ? arrFind.qty / arrFind.HisPackageRatio : 0,
          box_count: sum,
          zero_length: countZero,
          data_mod: data_qty,
        });
      } while (setDrug != 0);
    } else {
      let calPrepack = data.Qty % listDrugSE[0].HisPackageRatio;
      let pushArrDrug = [];
      if (
        ~~(data.Qty / listDrugSE[0].HisPackageRatio) <= listDrugSE[0].Quantity
      ) {
        if (calPrepack) {
          let finddrugMain = listDrugSE.find(
            (element) => element.lo === "main"
          );
          if (finddrugMain) {
            pushArrDrug.push({
              drugID: listDrugSE[0].drugID,
              drugCode: listDrugSE[0].drugCode,
              drugName: listDrugSE[0].drugName,
              HisPackageRatio: listDrugSE[0].HisPackageRatio,
              qty:
                ~~(data.Qty / listDrugSE[0].HisPackageRatio) *
                listDrugSE[0].HisPackageRatio,
              isPrepack: listDrugSE[0].isPrepack,
              lo: listDrugSE[0].lo,
              Quantity: listDrugSE[0].Quantity,
              Item: listDrugSE[0].Item,
            });
            data.Qty = calPrepack;
          } else {
            listDrugSE = [];
          }
        } else {
          // for (let i = 0; i < listDrugSE.length; i++) {
          //   pushArrDrug.push({
          //     drugID: listDrugSE[i].drugID,
          //     drugCode: listDrugSE[i].drugCode,
          //     drugName: listDrugSE[i].drugName,
          //     HisPackageRatio: listDrugSE[i].HisPackageRatio,
          //     qty:
          //       ~~(data.Qty / listDrugSE[i].HisPackageRatio) *
          //       listDrugSE[i].HisPackageRatio,
          //     isPrepack: listDrugSE[i].isPrepack,
          //     lo: listDrugSE[i].lo,
          //     Quantity: listDrugSE[i].Quantity,
          //     Item: listDrugSE[i].Item,
          //   });
          // }
          pushArrDrug.push({
            drugID: listDrugSE[0].drugID,
            drugCode: listDrugSE[0].drugCode,
            drugName: listDrugSE[0].drugName,
            HisPackageRatio: listDrugSE[0].HisPackageRatio,
            qty:
              ~~(data.Qty / listDrugSE[0].HisPackageRatio) *
              listDrugSE[0].HisPackageRatio,
            isPrepack: listDrugSE[0].isPrepack,
            lo: listDrugSE[0].lo,
            Quantity: listDrugSE[0].Quantity,
            Item: listDrugSE[0].Item,
          });
          data.Qty = data.Qty % listDrugSE[0].HisPackageRatio;
        }
      }
      listDrugSE = pushArrDrug;
    }
    if (dataDrug.length) {
      let getArr = dataDrug.filter(
        (d) => d.data_mod === Math.min(...dataDrug.map((item) => item.data_mod))
      );
      getArr = getArr.filter(
        (v) => v.box_count === Math.min(...getArr.map((item) => item.box_count))
      );
      getArr = getArr.filter(
        (v) => v.box_main === Math.max(...getArr.map((item) => item.box_main))
      );
      getArr = getArr.filter(
        (v) =>
          v.zero_length === Math.max(...getArr.map((item) => item.zero_length))
      );
      getArr = getArr.filter((v) => v.data_mod === 0);

      if (!getArr.length) {
        let getPack = listDrugSE.find((s) => s.lo == "main");
        if (getPack) {
          if (getPack.HisPackageRatio) {
            let checkMain = dataDrug
              .filter(
                (d) =>
                  d.box_main ===
                  Math.max(...dataDrug.map((item) => item.box_main))
              )
              .filter((s) => s.data_mod === data.Qty % getPack.HisPackageRatio);
            if (checkMain.length) {
              // listDrugSE = checkMain[0].drug;
              // data.Qty = checkMain[0].data_mod;
              if (
                checkMain.map((item) => item.data_mod > 0).every((val) => val)
              ) {
                listDrugSE = [];
              } else {
                listDrugSE = checkMain[0].drug;
                data.Qty = checkMain[0].data_mod;
              }
            } else {
              listDrugSE = [];
            }
          } else {
            listDrugSE = [];
          }
        } else {
          listDrugSE = [];
        }
      } else {
        listDrugSE = getArr[0].drug;
        data.Qty = getArr[0].data_mod;
      }

      // if (getArr.length) {
      //   if (getArr[0].data_mod) {
      //     listDrugSE = [];
      //   } else {
      //     listDrugSE = getArr[0].drug;
      //     data.Qty = getArr[0].data_mod;
      //   }
      // } else {
      //   listDrugSE = [];
      // }
    }
  } else {
    checkdrugmain[0].qty = data.Qty;
    listDrugSE = checkdrugmain;
    data.Qty = 0;
  }

  return {
    drug: listDrugSE,
    Qty: data.Qty,
  };
}
async function listPatientAllergicController(data) {
  try {
    let moph_patient = await center102.hn_moph_patient(data);
    let getCid = [];
    if (!moph_patient.length) {
      getCid = await center102.hn_moph_cid(data.hn);

      if (getCid.length) {
        getCid = await homc.getCid(data.hn);
      }

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
                    dataAllergic[k].hospcode ? dataAllergic[k].hospcode : ""
                  );
                  let sendata = {
                    hosp_code: `${
                      dataAllergic[k].hospcode ? dataAllergic[k].hospcode : ""
                    }`,
                    hosp_name: `${hosp[0].hospname ? hosp[0].hospname : ""}`,
                    pid: Buffer.from(
                      `${dataAllergic[k].cid ? dataAllergic[k].cid : ""}`
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
                }
              } else {
                return new Promise((resolve, reject) => {
                  resolve(true);
                });
              }
            } else {
              return new Promise((resolve, reject) => {
                resolve(true);
              });
            }
          } else {
            return new Promise((resolve, reject) => {
              resolve(true);
            });
          }
        }
      }
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
async function getAllergic2(cid) {
  // return [];

  const url = `https://smarthealth.service.moph.go.th/phps/api/drugallergy/v1/find_by_cid?cid=${Number(
    cid
  )}`;
  const instance = axios.create({
    httpsAgent: new https.Agent({
      rejectUnauthorized: false,
      keepAlive: true,
    }),
    baseURL: url,
    // timeout: 1000, //optional
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
}
// const url = `https://smarthealth.service.moph.go.th/phps/api/drugallergy/v1/find_by_cid?cid=${Number(
//   cid
// )}`;
// const instance = axios.create({
//   httpsAgent: new https.Agent({
//     rejectUnauthorized: false,
//   }),
// });
// instance.defaults.headers.get["jwt-token"] =
//   "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtMjAwMGthQGdtYWlsLmNvbSIsInJvbGVzIjpbIkxLXzAwMDIzXzAzNF8wMSIsIkxLXzAwMDIzXzAwOF8wMSIsIk5IU08iLCJQRVJTT04iLCJEUlVHQUxMRVJHWSIsIklNTUlHUkFUSU9OIiwiTEtfMDAwMjNfMDI3XzAxIiwiQUREUkVTUyIsIkxLXzAwMDIzXzAwM18wMSIsIkxLXzAwMDIzXzAwMV8wMSIsIkFERFJFU1NfV0lUSF9UWVBFIiwiTEtfMDAyMjZfMDAxXzAxIl0sImlhdCI6MTcyNDIwMDQwMiwiZXhwIjoxNzI0MjU5NTk5fQ.B4aUytFhi4rTay1hIYHoH7-9Y0QJWw25wcu97XVfmIE";
// let dataAllegy = await instance.get(url);
// if (dataAllegy.data.data) {
//   return dataAllegy.data.data;
// } else {
//   return [];
// }
