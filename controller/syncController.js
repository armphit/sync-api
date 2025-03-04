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
var db_GD4Unit_101 = require("../DB/db_GD4Unit_101_sqlserver");
var GD4Unit_101 = new db_GD4Unit_101();
var db_yurim = require("../DB/db_yurim_sqlserver");
var yurim = new db_yurim();
// var token = fs.readFileSync(
//   "D:\\Projacts\\NodeJS\\MHRdashboard\\node\\model\\token.txt",
//   "utf-8"
// );
var token =
  "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtMjAwMGthQGdtYWlsLmNvbSIsInJvbGVzIjpbIkxLXzAwMDIzXzAzNF8wMSIsIkxLXzAwMDIzXzAwOF8wMSIsIk5IU08iLCJQRVJTT04iLCJEUlVHQUxMRVJHWSIsIklNTUlHUkFUSU9OIiwiTEtfMDAwMjNfMDI3XzAxIiwiQUREUkVTUyIsIkxLXzAwMDIzXzAwM18wMSIsIkxLXzAwMDIzXzAwMV8wMSIsIkFERFJFU1NfV0lUSF9UWVBFIiwiTEtfMDAyMjZfMDAxXzAxIl0sImlhdCI6MTczODc3NDg3OSwiZXhwIjoxNzM4ODYxMTk5fQ.o2xLXumRr8FI8bl49pWQKvyplO4uEVYhdfKtfZRw5yg";
// var token = fs.readFileSync(
//   "D:\\Projacts\\NodeJS\\MHRdashboard\\node\\model\\token.txt",
//   "utf-8"
// );
//แก้นับตอนยิง
// const html2json = require("html2json").html2json;
yurim;
exports.syncOPDController = async (req, res, next) => {
  let data = req.body;

  if (data.site && data.site != "W8") {
    let sendReturn = await getPrescriptionSite(data, 1);
    res.send(sendReturn);
  } else {
    const hn = req.body.data;
    const check = req.body.check;
    let sendv = {};

    if (parseInt(hn) != NaN) {
      let dataP = [];
      let q = await center102.queue({ hn: hn });

      if (!q.length) {
        // q = await gd4unit101.getsiteQ();
        // q = q.length ? `P${Number(q[0].num) + 1}` : "P1";
        dataP = await homc.getQPatient(data);
        if (dataP.length) {
          await center102.addQP(dataP[0]);
        }
      } else {
        q = q[0].QN;
      }

      let checkAllergic = await listPatientAllergicController({ hn: hn });
      console.log(req.body);

      let moph_patient = await center102.hn_moph_patient({
        hn: hn,
        site: req.body.site,
      });

      console.log(moph_patient[0].drugcode);
      console.log(moph_patient[0].timestamp);
      console.log(moph_patient.length);
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

            let val = {
              prescriptionno: b[0].prescriptionno,
              hn: b[0].hn,
              date: moment(data.date)
                .subtract(543, "year")
                .format("YYYY-MM-DD"),
              allTimeOld: allTimeOld,
            };

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
            q = await gd4unit101.getsiteQ();
            q = q.length ? `P${Number(q[0].num) + 1}` : "P1";
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

          let val = {
            prescriptionno: b[0].prescriptionno,
            hn: b[0].hn,
            date: moment(data.date).subtract(543, "year").format("YYYY-MM-DD"),
            allTimeOld: allTimeOld,
          };

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
        }
      }
    } else {
      sendv.status = 4;
      res.send(sendv);
    }
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

  if (req.body.patient.site && req.body.patient.site != "W8") {
    let sendw18 = {
      ...req.body,
      check: { ...req.body.patient },
      ...req.body.patient,
    };
    if (sendw18.data.length) {
      sendw18.data = sendw18.data.map(function (obj) {
        obj["orderitemname"] = obj["Name"];
        obj["orderqty"] = String(obj["Qty"]);
        obj["orderitemcode"] = obj["code"];
        obj["orderunitcode"] = obj["unit"];
        obj["lastmodified"] = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
        obj["patientdob"] = moment(new Date()).add(543, "y").format("YYYYMMDD");
        obj["sex"] = "M";
        obj["prescriptionno"] = String(
          Math.floor(10000000 + Math.random() * 90000000)
        );
        obj["hn"] = sendw18["hn"];
        obj["patientname"] = sendw18["name"];
        delete obj["Name"];
        delete obj["Qty"];
        delete obj["code"];
        delete obj["unit"];

        return obj;
      });
      sendw18["listDrug"] = sendw18["data"];
      delete sendw18["data"];
      sendw18["data"] = sendw18["hn"];
      delete sendw18["patient"];

      // sendv.status = 4;
      // sendv.message = sendw18;
      // res.send(sendv);
      let sendReturn = await getPrescriptionSite(sendw18, 0);

      res.send(sendReturn);
    } else {
      sendv.status = 4;
      res.send(sendv);
    }
  } else {
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
  }
};

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
  }
  arrJson.map(async function (item) {
    item.prescriptions.prescription.windowNo = winNo;

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

    if (!moph_patient.length) {
      let getCid = await homc.getCid(data.hn);

      if (getCid.length) {
        if (getCid[0].CardID) {
          const cid = getCid[0].CardID.trim();
          let dataAllergic = await getAllergic(cid);
          console.log(dataAllergic);

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

async function getAllergic(cid) {
  // return [];
  console.log(cid);
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
}

async function getPrescriptionSite(data, check) {
  let checkAllergic = await listPatientAllergicController({ hn: data.data });
  let sendv = {};

  let moph_patient = await center102.hn_moph_patient({
    hn: data.data,
    site: data.site,
  });

  let listDrug = [];
  if (
    moph_patient.length &&
    moph_patient[0].timestamp === null &&
    moph_patient[0].drugcode !== null
  ) {
    sendv.status = 6;
    return sendv;
  } else {
    data.qn = "";
    if (data.site == "W18") {
      let q = await center102.queue({ hn: data.data, select: data.site });
      data.qn = q.length ? q[0].QN : "";
    }
    let allTimeOld = null;
    if (check) {
      allTimeOld = await GD4Unit_101.checkDrugPatient(data.data);
      if (allTimeOld.length) {
        allTimeOld = allTimeOld.map((u) => u.ordertime).join("','");
        allTimeOld = `'${allTimeOld}'`;
      } else {
        allTimeOld = `''`;
      }

      data.allTimeOld = allTimeOld;

      listDrug = await homc.fill(data);
      listDrug = listDrug.recordset;
    } else {
      listDrug = data.listDrug;
    }

    if (listDrug.length) {
      let opd3Location = await GD4Unit_101.opd3Location(data);
      let yulimLocation = await yurim.dataDrug();
      listDrug = listDrug.map((val) => {
        return {
          ...val,
          qn: data.qn,
          ...(opd3Location.find(
            (emp) => emp.orderitemcode === val.orderitemcode.trim()
          ) ??
            yulimLocation.find(
              (emp) => emp.orderitemcode === val.orderitemcode.trim()
            ) ?? { location: "W", sortOrder: "" }),
          datePrint: moment(new Date())
            .add(543, "year")
            .format("DD/MM/YYYY HH:mm:ss"),
          ipPrint: data.check.ip_print,
          maker: data.check.user,
          site: data.site,
        };
      });

      let dataYulim = [];
      if (data.check.yulim) {
        let dataPack = await GD4Unit_101.packYurim();

        let setyulimLocation = new Set(
          yulimLocation.map((item) => item.orderitemcode)
        );
        dataYulim = listDrug
          .filter((item) => setyulimLocation.has(item.orderitemcode))
          .map((item1) => {
            const item2 = dataPack.find(
              (item2) =>
                item2.orderitemcode === item1.orderitemcode && item2.pack
            ) ?? { pack: 0 };
            return {
              ...item1,
              orderqty:
                parseInt(item1.orderqty) > item2.pack && item2.pack
                  ? parseInt(item1.orderqty) % item2.pack
                  : item1.orderqty,
              checkqty: parseInt(item1.orderqty),
            };
          });
        listDrug = listDrug
          .map((item1) => {
            const item2 = dataPack.find(
              (item2) =>
                item2.orderitemcode === item1.orderitemcode && item2.pack
            ) ?? { pack: 0 };

            return {
              ...item1,
              orderqty:
                item2.pack &&
                parseInt(item1.orderqty) > item2.pack &&
                item2.pack
                  ? parseInt(item1.orderqty) % item2.pack
                  : item1.orderqty,
              checkPack:
                item2.pack && parseInt(item1.orderqty) > item2.pack ? "Y" : "N",
              checkqty: parseInt(item1.orderqty),
              // pack: item2.pack,
            };
          })
          .flatMap((item3) =>
            item3.checkPack == "Y"
              ? [
                  item3,
                  {
                    ...item3,
                    location: "YU",
                    sortOrder: 22,
                    orderqty: item3.checkqty - item3.orderqty,
                    // orderqty: (item3.checkqty - item3.orderqty) / item3.pack,
                    // orderitemcode: "BOX",
                  },
                ]
              : [item3]
          );
        if (dataYulim.length) {
          let seen = new Map();
          let data1 = [];
          let data2 = [];

          dataYulim.forEach((item) => {
            if (!seen.has(item.orderitemcode)) {
              seen.set(item.orderitemcode, true);
              data1.push(item);
            } else {
              data2.push(item);
            }
          });

          dataYulim = [data1, data2];

          let filexml = await createXML(dataYulim, dataPack);
          if (filexml == 1) {
            return await dataResult(listDrug, check, { check: data.check });
          } else {
            sendv.status = filexml;
            return sendv;
          }
        } else {
          return await dataResult(listDrug, check, { check: data.check });
        }
      } else {
        return await dataResult(listDrug, check, { check: data.check });
      }
      // if (data.check.yulim) {

      //   let dataPack = await GD4Unit_101.packYurim();
      //   let setyulimLocation = new Set(
      //     yulimLocation.map((item) => item.orderitemcode)
      //   );
      //   dataYulim = listDrug
      //     .filter((item) => setyulimLocation.has(item.orderitemcode))
      //     .map((item1) => {
      //       const item2 = dataPack.find(
      //         (item2) => item2.orderitemcode === item1.orderitemcode
      //       ) ?? { pack: 0 };
      //       return {
      //         ...item1,
      //         orderqty:
      //           parseInt(item1.orderqty) > item2.pack
      //             ? parseInt(item1.orderqty) - item2.pack
      //             : item1.orderqty,
      //         checkPack: parseInt(item1.orderqty) > item2.pack ? "Y" : "N",
      //         checkqty: parseInt(item1.orderqty),
      //       };
      //     });
      //   listDrug = listDrug
      //     .map((item1) => {
      //       const item2 = dataPack.find(
      //         (item2) => item2.orderitemcode === item1.orderitemcode
      //       ) ?? { pack: 0 };

      //       return {
      //         ...item1,
      //         orderqty:
      //           item2.pack && parseInt(item1.orderqty) > item2.pack
      //             ? parseInt(item1.orderqty) - item2.pack
      //             : item1.orderqty,
      //         checkPack:
      //           item2.pack && parseInt(item1.orderqty) > item2.pack ? "Y" : "N",
      //         checkqty: parseInt(item1.orderqty),
      //       };
      //     })
      //     .flatMap((item3) =>
      //       item3.checkPack == "Y"
      //         ? [
      //             item3,
      //             {
      //               ...item3,
      //               location: "YU",
      //               sortOrder: 22,
      //               orderqty: item3.checkqty - item3.orderqty,
      //             },
      //           ]
      //         : [item3]
      //     );
      // }
    } else {
      sendv.status = {
        err: 3,
        time: allTimeOld,
      };
      return sendv;
    }
  }
}
function formatDate(dateString) {
  const date = new Date(dateString);
  const pad = (n) => n.toString().padStart(2, "0");

  // Convert the date to local time if needed
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
function createXML(data, dataPack) {
  // data = data.map((item) => {
  //   return {
  //     ...item,
  //     // ...dataPack.find(
  //     //   (item2) => item2.orderitemcode === item.orderitemcode && item2.cup
  //     // ),
  //   };
  // });
  data = data.filter((subArray) => subArray.length > 0);
  console.log(data);

  // data = data.flatMap((item3) =>

  //   item3.checkPack == "Y"
  //     ? [
  //         item3,
  //         {
  //           ...item3,
  //           location: "YU",
  //           sortOrder: 22,
  //           orderqty: item3.checkqty - item3.orderqty,
  //           // orderqty: (item3.checkqty - item3.orderqty) / item3.pack,
  //           // orderitemcode: "BOX",
  //         },
  //       ]
  //     : [item3]
  // );
  try {
    for (let i = 0; i < data.length; i++) {
      let arrDrug = data[i].map((val) => {
        return {
          MedCd: val.orderitemcode
            ? val.orderitemcode.trim()
            : val.orderitemcode,
          MedNm: val.orderitemname
            ? val.orderitemname.trim()
            : val.orderitemname,
          MedType: "",
          MedSpec: "",
          MedUnit: val.orderunitcode
            ? val.orderunitcode.trim()
            : val.orderunitcode,
          DrtsCd: "",
          Dose: val.orderqty ? parseInt(val.orderqty) : val.orderqty,
          Note2: "",
          Note3: "",
          XmlFlag: "",
        };
      });

      if (data[i].length) {
        let dataJson = {
          OrderNum: data[i][0].prescriptionno,
          OrderDt: moment(data[i][0].lastmodified).format("YYYYMMDD"),
          OrderDtm: moment(data[i][0].lastmodified).format("YYYYMMDDHHmmss"),
          MdctNum: data.length,
          MdctDt: "",
          PtntNum: data[i][0].hn ? data[i][0].hn.trim() : data[i][0].hn,
          PtntNm: data[i][0].patientname
            ? data[i][0].patientname.trim()
            : data[i][0].patientname,
          Sex: data[i][0].sex,
          Birthday: data[i][0].patientdob,
          DptmtCd: "",
          DoctorNm: "",
          DptmtCd: "",
          DptmtCd: "",
          DptmtCd: "",
          DptmtCd: "",
          DoctorNm: "",
          PtntTel: "",
          Note: `${data[i][0].prescriptionno}${
            data[i][0].hn ? data[i][0].hn.trim() : data[i][0].hn
          }`,
          HsptCd: "",
          PtntAddr: "",
          MedItem: arrDrug,
        };
        let xmlDrug = js2xmlparser.parse("OrderInfo", dataJson);

        // const filePath = `\\\\192.168.180.161\\order\\${
        //   data[0].prescriptionno
        // }_${moment(new Date()).format("YYMMDDHHmm")}.xml`;

        const filePath = `order\\${data[i][0].prescriptionno}_${Math.floor(
          10000 + Math.random() * 90000
        )}.xml`;

        fs.writeFileSync(filePath, xmlDrug);
      }
    }

    return 1;
  } catch (error) {
    console.error("Error writing file:", error);
    return {
      err: 8,
      message: "Error writing file : " + error,
    };
  }
}
async function dataResult(listDrug, check, data) {
  listDrug = listDrug.sort((a, b) => {
    if (a.sortOrder === "") return 1;
    if (b.sortOrder === "") return -1;
    return a.sortOrder - b.sortOrder;
  });

  let sendv = {};

  if (check) {
    if (data.check.print) {
      try {
        const url = `http://localhost:1200/drugLocation`;
        const instance = axios.create({
          httpsAgent: new https.Agent({
            rejectUnauthorized: false,
            keepAlive: true,
          }),
          // baseURL: url,
          // timeout: 1000,
        });

        let dataPrint = await instance.post(url, listDrug);

        if (dataPrint.data.status == 1) {
          let insertSys = await GD4Unit_101.insertSys(listDrug[0]);
          if (insertSys.rowsAffected[0]) {
            let sysId = await GD4Unit_101.getSys(listDrug[0]);
            let arr = [];

            if (sysId.length) {
              for (const key in listDrug) {
                arr.push(`(
                  NEWID(),
                  '${sysId[0].id}',
                  ${listDrug[key].seq},
                  '${
                    listDrug[key].orderitemcode
                      ? listDrug[key].orderitemcode.trim()
                      : listDrug[key].orderitemcode
                  }',
                  N'${
                    listDrug[key].orderitemname
                      ? listDrug[key].orderitemname.trim()
                      : listDrug[key].orderitemname
                  }',
                  '${
                    listDrug[key].orderqty
                      ? listDrug[key].orderqty.trim()
                      : listDrug[key].orderqty
                  }',
                  '${
                    listDrug[key].orderunitcode
                      ? listDrug[key].orderunitcode.trim()
                      : listDrug[key].orderunitcode
                  }',
                  '${
                    listDrug[key].lastmodified
                      ? formatDate(listDrug[key].lastmodified)
                      : formatDate(listDrug[key].ordercreatedate)
                  }',
                  GetDate(),
                  FORMAT (GetDate(), 'yyyyMMdd'),
                  FORMAT (GetDate(), 'HHmm'),
                  '${listDrug[key].prescriptionno}',
                  '${
                    listDrug[key].hn
                      ? listDrug[key].hn.trim()
                      : listDrug[key].hn
                  }'
                  )`);
              }
              arr = arr.join(",");
              let insertPre = await GD4Unit_101.insertPre(arr);

              if (insertPre.rowsAffected[0]) {
              } else {
                sendv.status = 2;
                return sendv;
              }
            } else {
              sendv.status = {
                err: 8,
                message: "Insert Sys Fail : 0",
              };
              return sendv;
            }
          } else {
            sendv.status = {
              err: 8,
              message: "Insert Sys Fail : " + err,
            };
            return sendv;
          }
        } else {
          sendv.status = {
            err: 8,
            message: `HN : ${listDrug[0].hn} : PDF OPD3 Print Unsuccessfully!!!`,
          };
          return sendv;
        }
      } catch (error) {
        console.log(error);
        sendv.status = {
          err: 8,
          message: `HN : ${listDrug[0].hn} : PDF OPD3 generated Unsuccessfully!!!`,
        };
        return sendv;
      }
    } else {
      let insertSys = await GD4Unit_101.insertSys(listDrug[0]);
      if (insertSys.rowsAffected[0]) {
        let sysId = await GD4Unit_101.getSys(listDrug[0]);
        let arr = [];

        if (sysId.length) {
          for (const key in listDrug) {
            arr.push(`(
              NEWID(),
              '${sysId[0].id}',
              ${listDrug[key].seq},
              '${
                listDrug[key].orderitemcode
                  ? listDrug[key].orderitemcode.trim()
                  : listDrug[key].orderitemcode
              }',
              N'${
                listDrug[key].orderitemname
                  ? listDrug[key].orderitemname.trim()
                  : listDrug[key].orderitemname
              }',
              '${
                listDrug[key].orderqty
                  ? listDrug[key].orderqty.trim()
                  : listDrug[key].orderqty
              }',
              '${
                listDrug[key].orderunitcode
                  ? listDrug[key].orderunitcode.trim()
                  : listDrug[key].orderunitcode
              }',
              '${
                listDrug[key].lastmodified
                  ? formatDate(listDrug[key].lastmodified)
                  : formatDate(listDrug[key].ordercreatedate)
              }',
              GetDate(),
              FORMAT (GetDate(), 'yyyyMMdd'),
              FORMAT (GetDate(), 'HHmm'),
              '${listDrug[key].prescriptionno}',
              '${listDrug[key].hn ? listDrug[key].hn.trim() : listDrug[key].hn}'
              )`);
          }
          arr = arr.join(",");
          let insertPre = await GD4Unit_101.insertPre(arr);

          if (insertPre.rowsAffected[0]) {
          } else {
            sendv.status = 2;
            return sendv;
          }
        } else {
          sendv.status = {
            err: 8,
            message: "Insert Sys Fail : 0",
          };
          return sendv;
        }
      } else {
        sendv.status = {
          err: 8,
          message: "Insert Sys Fail : " + err,
        };
        return sendv;
      }
      sendv.status = 1;
      return sendv;
    }
  } else {
    if (data.check.print) {
      try {
        const url = `http://localhost:1200/drugLocation`;
        const instance = axios.create({
          httpsAgent: new https.Agent({
            rejectUnauthorized: false,
            keepAlive: true,
          }),
          // baseURL: url,
          // timeout: 1000,
        });

        let dataPrint = await instance.post(url, listDrug);

        return dataPrint.data;
      } catch (error) {
        console.log(error);
        sendv.status = {
          err: 8,
          message: `HN : ${listDrug[0].hn} : PDF OPD3 generated Unsuccessfully!!!`,
        };
        return sendv;
      }
    } else {
      sendv.status = 1;
      return sendv;
    }
  }
}
