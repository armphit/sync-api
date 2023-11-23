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

//แก้นับตอนยิง

exports.syncOPDController = async (req, res, next) => {
  let data = req.body;
  const hn = req.body.data;
  const check = req.body.check;
  let sendv = {};

  if (parseInt(hn) != NaN) {
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
      if (check.sitew1) {
      } else {
        let q = await center102.fill(b[0]);
      }

      let c = {
        hn: b[0].hn.trim(),
        name: b[0].patientname.trim(),
        sex: b[0].sex.trim(),
        prescriptionno: b[0].prescriptionno.trim(),
        patientdob: b[0].patientdob.trim(),
        queue: q[0] ? q[0].QN : "",
        jvm: check.jvm,
        dih: check.dih,
        win1: check.win1,
        win2: check.win2,
      };
      for (let i = 0; i < b.length; i++) {
        b[i].orderitemname = b[i].orderitemname.replace(
          /[\/\\#,+$~.'":?<>{}]/g,
          " "
        );
        let pmpf102 = await pmpf.getDrug(b[i].orderitemcode);

        if (pmpf102.length !== 0 && Number(b[i].orderqty.trim()) > 0) {
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

      // getdataHomc(drugarr, c)
      //   .then((value) => {

      // if (value.dih === 1 && value.jvm === 1) {
      let val = {
        prescriptionno: b[0].prescriptionno,
        hn: b[0].hn,
        date: moment(data.date).subtract(543, "year").format("YYYY-MM-DD"),
        allTimeOld: allTimeOld,
      };
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
          // console.log("HN : " + b[0].hn.trim() + " :success");
          // console.log("successDT : " + new Date().toLocaleString());
          // console.log(
          //   "-------------------------------------------------"
          // );
          // res.status(200).json({
          //   // Authorization: Bearer,
          //   status: 1,
          // });
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
  // sendv.status = 0;
  // res.send(sendv);

  for (let i = 0; i < data.length; i++) {
    let pmpf102 = await pmpf.getDrug(data[i].code);

    if (pmpf102.length !== 0 && Number(data[i].Qty) > 0) {
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
  patient.queue = q[0] ? q[0].QN : "";
  console.log(q);
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

async function getdataHomc(data, etc) {
  // try {
  let dataDrug = [];
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

  let getAge = new Date().getFullYear() - 2020;
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

  for (let i = 0; i < data.length; i++) {
    if (data[i].Qty > 0) {
      let dataZone = await pmpf.dataZone(data[i].code);

      if (dataZone.length != 0) {
        zone.push(dataZone[0].group_id);
      } else {
        zone.push(3);
      }
    }

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
            // if (
            //   Math.floor(
            //     listDrugSE[x].qty / Number(listDrugSE[x].HisPackageRatio)
            //   ) < 15
            // ) {
            // let getdrugSize = await Xmed.dataDrugSize(listDrugSE[x].drugID);

            // if (
            //   listDrugSE[x].qty <=
            //   listDrugSE[x].Quantity * listDrugSE[x].HisPackageRatio
            // ) {
            let drugSize =
              ~~(listDrugSE[x].qty / listDrugSE[x].HisPackageRatio) *
              listDrugSE[x].Item;

            if (numSize + drugSize < 4000) {
              numSize = numSize + drugSize;

              var se = {};
              se.code = listDrugSE[x].drugCode;
              se.Name = listDrugSE[x].drugName;
              se.alias = data[i].alias;
              se.firmName = data[i].firmName;
              se.method = data[i].method;
              se.note = data[i].note;
              se.spec = data[i].spec;
              se.type = data[i].type;
              se.unit = data[i].unit;
              se.pack = listDrugSE[x].HisPackageRatio;
              se.location = data[i].location;
              se.device = "XMed";
              se.Qty =
                Math.floor(listDrugSE[x].qty / listDrugSE[x].HisPackageRatio) *
                listDrugSE[x].HisPackageRatio;
              // data[i].Qty = listDrugSE[x].qty - se.Qty;
              Number(se.Qty) ? arrSE.push(se) : "";
            } else {
              do {
                se = {};
                se.code = listDrugSE[x].drugCode;
                se.Name = listDrugSE[x].drugName;
                se.alias = data[i].alias;
                se.firmName = data[i].firmName;
                se.method = data[i].method;
                se.note = data[i].note;
                se.spec = data[i].spec;
                se.type = data[i].type;
                se.unit = data[i].unit;
                se.pack = listDrugSE[x].HisPackageRatio;
                se.location = data[i].location;
                se.device = "XMed";
                se.Qty =
                  ~~(Math.abs(numSize - 4000) / listDrugSE[x].Item) *
                  listDrugSE[x].HisPackageRatio;

                drugSize =
                  ~~(
                    (listDrugSE[x].qty - se.Qty) /
                    listDrugSE[x].HisPackageRatio
                  ) * listDrugSE[x].Item;
                listDrugSE[x].qty = listDrugSE[x].qty - se.Qty;
                // data[i].Qty = listDrugSE[x].qty;
                Number(se.Qty) ? arrSE.push(se) : "";
                codeArrSE.push(arrSE);
                arrSE = [];
                numSize = 0;
              } while (drugSize > 4000);
              // console.log(listDrugSE[x].Item);
              if (drugSize >= listDrugSE[x].Item) {
                var seS = {};
                seS.code = listDrugSE[x].drugCode;
                seS.Name = listDrugSE[x].drugName;
                seS.alias = data[i].alias;
                seS.firmName = data[i].firmName;
                seS.method = data[i].method;
                seS.note = data[i].note;
                seS.spec = data[i].spec;
                seS.type = data[i].type;
                seS.unit = data[i].unit;
                seS.pack = listDrugSE[x].HisPackageRatio;
                seS.location = data[i].location;
                seS.device = "XMed";
                seS.Qty =
                  ~~(drugSize / listDrugSE[x].Item) *
                  listDrugSE[x].HisPackageRatio;
                // data[i].Qty = data[i].Qty - seS.Qty;

                Number(seS.Qty) ? arrSE.push(seS) : "";
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
      let jvmD = { code: data[i].code, lo: "JV" };
      let listDrugJvm = await pmpf.datadrugMain(jvmD);
      if (listDrugJvm.length !== 0) {
        let dataonCube = await onCube.datadrug(data[i].code);
        let dateC = null;
        let date = new Date();
        date.setFullYear(date.getFullYear() + 1);
        let warning = "*";
        let r = /\d+/;
        let s = data[i].freetext1;

        // if (dataonCube[0].dateDiff && data[i].freetext1 && data[i].dosage) {
        //   if (
        //     dataonCube[0].dateDiff -
        //       data[i].Qty / (Number(s.match(r)) * Number(data[i].dosage)) <
        //     0
        //   ) {
        //     warning = "*";
        //   }
        // }

        // if (dataonCube[0].dateDiff) {
        //   if (dataonCube[0].dateDiff < 365) {
        //     warning = "*";
        //   }
        // }
        // console.log(warning);
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
            data[i].Name +
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
            "2C-299" +
            " " +
            warning +
            "|";

          codeArr.push(dataJVM);
          qty = qty - amount;
        } while (qty > 0);
      }

      codeArrPush.push(data[i]);
    }
  }

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
  let value3 = [];
  for (let i = 0; i < op.length; i++) {
    for (let j = 0; j < op[i].length; j++) {
      let value = {
        drug: op[i][j],
      };

      value2.push(value);
      value3.push(value);
    }

    zone = zone.sort((a, b) => (a > b ? 1 : a < b ? -1 : 0));

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
        age: age,
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
  let ex = value3.map((a) => a.drug.device).filter(Boolean);
  ex = Array.from(new Set(ex));
  arrJson.map(async function (item) {
    item.prescriptions.prescription.windowNo = ex.length > 4 ? 3 : 4;
    if (etc.win1 && !etc.win2) {
      item.prescriptions.prescription.windowNo = 3;
    } else if (!etc.win1 && etc.win2) {
      item.prescriptions.prescription.windowNo = 4;
    }
    let xmlDrug = {
      xml: js2xmlparser.parse("outpOrderDispense", item),
    };
    console.log(xmlDrug);
    console.log("-------------------------------------------------");
    console.log("WindowNo : " + ex);
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

  zone = [];
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
  let fs = require("fs");

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
      if (calPrepack) {
        let finddrugMain = listDrugSE.find((element) => element.lo === "main");
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
        if (getPack.HisPackageRatio) {
          let checkMain = dataDrug
            .filter(
              (d) =>
                d.box_main ===
                Math.max(...dataDrug.map((item) => item.box_main))
            )
            .filter((s) => s.data_mod === data.Qty % getPack.HisPackageRatio);
          if (checkMain.length) {
            listDrugSE = checkMain[0].drug;
            data.Qty = checkMain[0].data_mod;
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

      // if (getArr[0].data_mod) {
      //   // let test = dataDrug.filter(
      //   //   (d) =>
      //   //     d.box_main === Math.max(...dataDrug.map((item) => item.box_main))
      //   // );
      //   // // .filter((d) => d.box_main === d.box_count);
      //   // console.log(test);
      //   listDrugSE = [];
      // } else {
      //   listDrugSE = getArr[0].drug;
      //   data.Qty = getArr[0].data_mod;
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
