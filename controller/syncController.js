const moment = require("moment");
const js2xmlparser = require("js2xmlparser");
const soap = require("soap");
const { transform } = require("camaro");

const soapRequest = require("easy-soap-request");

var db_Homc = require("../DB/db_Homc");
var homc = new db_Homc();
var db_pmpf = require("../DB/db_pmpf_thailand_mnrh");
var pmpf = new db_pmpf();
var db_GD4Unit_101 = require("../DB/db_GD4Unit_101_sqlserver");
var GD4Unit_101 = new db_GD4Unit_101();
var db_onCube = require("../DB/db_onCube");
var onCube = new db_onCube();
var db_mysql102 = require("../DB/db_center_102_mysql");
var center102 = new db_mysql102();
var db_mysql101 = require("../DB/db_gd4unit_101_mysql");
var gd4unit101 = new db_mysql101();

exports.syncOPDController = async (req, res, next) => {
  let data = req.body;
  const hn = req.body.data;
  let sendv = {};
  // sendv.status = 0;
  // res.send(sendv);

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
      let q = await center102.fill(b[0].hn.trim());
      // console
      let c = {
        hn: b[0].hn.trim(),
        name: b[0].patientname.trim(),
        sex: b[0].sex.trim(),
        prescriptionno: b[0].prescriptionno.trim(),
        patientdob: b[0].patientdob.trim(),
        queue: q[0] ? q[0].QN : "",
        jvm: true,
        dih: true,
      };
      for (let i = 0; i < b.length; i++) {
        sql101 = await GD4Unit_101.dataDrug(b[i].orderitemcode);
        sql101 = sql101.recordset;
        if (sql101.length !== 0 && Number(b[i].orderqty.trim()) > 0) {
          let drug = {
            Name: b[i].orderitemname.trim(),
            Qty: b[i].orderqty.trim(),
            alias: "",
            code: b[i].orderitemcode.trim(),
            firmName: sql101[0].firmname,
            method: "",
            note: "",
            spec: sql101[0].Strength,
            type: "",
            unit: b[i].orderunitcode,
          };
          drugarr.push(drug);
        }
      }
      console.log(c);
      getdataHomc(drugarr, c).then((value) => {
        if (value.dih === 1 && value.jvm === 1) {
          let val = {
            prescriptionno: b[0].prescriptionno,
            hn: b[0].hn,
          };
          gd4unit101.fill(val).then((result) => {
            if (result.affectedRows > 0) {
              b.forEach(async function (b) {
                await gd4unit101.insertDrug(b);
              });
              console.log("HN : " + b[0].hn.trim() + " :success");
              res.status(200).json({
                // Authorization: Bearer,
                status: 1,
              });
            } else {
              sendv.status = 0;
              res.send(sendv);
            }
          });
        } else {
          sendv.status = 2;
          res.send(sendv);
        }
      });
    } else {
      sendv.status = 3;
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
  // let sendv = {};
  // sendv.status = 0;
  // res.send(sendv);
  console.log(patient);
  let q = await center102.fill(patient.hn);
  patient.queue = q[0] ? q[0].QN : "";

  getdataHomc(data, patient).then((value) => {
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
  });
};

async function getdataHomc(data, etc) {
  const momentDate = new Date();
  let datePayment = moment(momentDate).format("YYYY-MM-DD");
  let dateA = moment(momentDate).format("YYMMDD");
  let dateB = moment(momentDate).add(543, "year").format("DD/MM/YYYY");
  let m = moment(etc.patientdob, "YYYYMMDD", "th", true);

  let birthDate = moment(m)
    .add(1, "month")
    .subtract(543, "year")
    .format("YYYY-MM-DD");

  // let numJV = "6400" + Math.floor(Math.random() * 1000000);
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
  let numBox = 0;
  let arrSE = new Array();
  let codeArrSE = new Array();

  for (let i = 0; i < data.length; i++) {
    let listDrugOPD = await pmpf.datadrug(data[i].code);

    if (listDrugOPD.length !== 0) {
      if (
        listDrugOPD[0].deviceCode.includes("Xmed1") &&
        listDrugOPD[0].isPrepack == "N" &&
        data[i].Qty >= Number(listDrugOPD[0].HisPackageRatio)
      ) {
        var qtyBox = data[i].Qty / listDrugOPD[0].HisPackageRatio;
        if (numBox + ~~qtyBox < 10) {
          numBox = numBox + ~~qtyBox;
          var se = {};
          se.code = listDrugOPD[0].drugCode;
          se.Name = data[i].Name;
          se.alias = data[i].alias;
          se.firmName = data[i].firmName;
          se.method = data[i].method;
          se.note = data[i].note;
          se.spec = data[i].spec;
          se.type = data[i].type;
          se.unit = data[i].unit;
          se.Qty =
            Math.floor(data[i].Qty / listDrugOPD[0].HisPackageRatio) *
            listDrugOPD[0].HisPackageRatio;
          data[i].Qty = data[i].Qty % listDrugOPD[0].HisPackageRatio;
          arrSE.push(se);
        } else {
          do {
            se = {};
            se.code = listDrugOPD[0].drugCode;
            se.Name = data[i].Name;
            se.alias = data[i].alias;
            se.firmName = data[i].firmName;
            se.method = data[i].method;
            se.note = data[i].note;
            se.spec = data[i].spec;
            se.type = data[i].type;
            se.unit = data[i].unit;
            se.Qty = Math.abs(numBox - 10) * listDrugOPD[0].HisPackageRatio;
            arrSE.push(se);
            codeArrSE.push(arrSE);
            arrSE = [];
            qtyBox = ~~qtyBox - Math.abs(numBox - 10);
            numBox = 0;
          } while (qtyBox > 9);
          if (qtyBox !== 0) {
            var seS = {};
            seS.code = listDrugOPD[0].drugCode;
            seS.Name = data[i].Name;
            seS.alias = data[i].alias;
            seS.firmName = data[i].firmName;
            seS.method = data[i].method;
            seS.note = data[i].note;
            seS.spec = data[i].spec;
            seS.type = data[i].type;
            seS.unit = data[i].unit;
            seS.Qty = qtyBox * listDrugOPD[0].HisPackageRatio;
            arrSE.push(seS);
            numBox = qtyBox;
          }
        }
        data[i].Qty = data[i].Qty % listDrugOPD[0].HisPackageRatio;
      }

      var pre = {};
      if (
        listDrugOPD[0].deviceCode.includes("Xmed1") &&
        listDrugOPD[0].isPrepack == "Y" &&
        data[i].Qty >= Number(listDrugOPD[0].HisPackageRatio)
      ) {
        var qtyBox = data[i].Qty / listDrugOPD[0].HisPackageRatio;
        if (numBox + ~~qtyBox < 10) {
          numBox = numBox + ~~qtyBox;
          pre.code = listDrugOPD[0].drugCode;
          pre.Name = data[i].Name;
          pre.alias = data[i].alias;
          pre.firmName = data[i].firmName;
          pre.method = data[i].method;
          pre.note = data[i].note;
          pre.spec = data[i].spec;
          pre.type = data[i].type;
          pre.unit = data[i].unit;
          pre.Qty =
            Math.floor(data[i].Qty / listDrugOPD[0].HisPackageRatio) *
            listDrugOPD[0].HisPackageRatio;
          data[i].Qty = data[i].Qty % listDrugOPD[0].HisPackageRatio;
          arrSE.push(pre);
        } else {
          do {
            pre.code = listDrugOPD[0].drugCode;
            pre.Name = data[i].Name;
            pre.alias = data[i].alias;
            pre.firmName = data[i].firmName;
            pre.method = data[i].method;
            pre.note = data[i].note;
            pre.spec = data[i].spec;
            pre.type = data[i].type;
            pre.unit = data[i].unit;
            pre.Qty = Math.abs(numBox - 10) * listDrugOPD[0].HisPackageRatio;
            arrSE.push(pre);
            codeArrSE.push(arrSE);
            arrSE = [];
            qtyBox = ~~qtyBox - Math.abs(numBox - 10);
            numBox = 0;
          } while (qtyBox > 9);
          if (qtyBox !== 0) {
            var preS = {};
            preS.code = listDrugOPD[0].drugCode;
            preS.Name = data[i].Name;
            preS.alias = data[i].alias;
            preS.firmName = data[i].firmName;
            preS.method = data[i].method;
            preS.note = data[i].note;
            preS.spec = data[i].spec;
            preS.type = data[i].type;
            preS.unit = data[i].unit;
            preS.Qty = qtyBox * listDrugOPD[0].HisPackageRatio;
            arrSE.push(preS);
            numBox = qtyBox;
          }
        }
        data[i].Qty = data[i].Qty % listDrugOPD[0].HisPackageRatio;
      }

      if (listDrugOPD[0].deviceCode.includes("JV")) {
        listDrugOPD.forEach((listDrugOPD) => {
          if (
            listDrugOPD.deviceCode.includes("LCA") &&
            Math.floor(data[i].Qty / listDrugOPD.HisPackageRatio) *
              listDrugOPD.HisPackageRatio >
              0
          ) {
            var lca = {};
            lca.code = listDrugOPD.drugCode;
            lca.Qty =
              Math.floor(data[i].Qty / listDrugOPD.HisPackageRatio) *
              listDrugOPD.HisPackageRatio;
            lca.Name = data[i].Name;
            lca.alias = data[i].alias;
            lca.firmName = data[i].firmName;
            lca.method = data[i].method;
            lca.note = data[i].note;
            lca.spec = data[i].spec;
            lca.type = data[i].type;
            lca.unit = data[i].unit;
            codeArrPush.push(lca);
            data[i].Qty = data[i].Qty % listDrugOPD.HisPackageRatio;
          }
        });
      }
    }

    let numMax = 0;
    if (data[i].Qty > 0) {
      if (listDrugOPD.length !== 0) {
        if (listDrugOPD[0].deviceCode.includes("JV")) {
          let dataonCube = await onCube.datadrug(data[i].code);
          let dateC = null;
          let date = new Date();
          date.setFullYear(date.getFullYear() + 1);

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
          }

          let amount = 0;
          let qty = data[i].Qty;
          do {
            j++;
            amount = qty > 400 ? 400 : qty;
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
              "00:0" +
              j +
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
              "|";

            codeArr.push(dataJVM);
            qty = qty - amount;
          } while (qty > 0);
        }
      }
      codeArrPush.push(data[i]);
    }
  }

  let DataJV = "";
  if (codeArr.length > 0) {
    for (let i = 0; i < codeArr.length; i++) {
      codeArr[i] = codeArr[i] + "(" + (i + 1) + "/" + codeArr.length + ")";
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

  let getDataJV = null;
  let getDataDIH = null;
  let value2 = [];
  let dih = 1;
  let jvm = 1;
  let numRandom = "9900" + Math.floor(Math.random() * 1000000000);

  for (let i = 0; i < op.length; i++) {
    for (let j = 0; j < op[i].length; j++) {
      let value = {
        drug: op[i][j],
      };
      value2.push(value);
    }

    let jsonDrug = {
      patient: {
        patID: etc.hn,
        patName:
          etc.name.length > 34
            ? etc.name.substring(0, 28) +
              ".." +
              etc.queue +
              " (" +
              (i + 1) +
              "/" +
              op.length +
              ")"
            : etc.name +
              " " +
              etc.queue +
              " (" +
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
    value2 = [];
    let xmlDrug = { xml: js2xmlparser.parse("outpOrderDispense", jsonDrug) };

    console.log("-------------------------------------------------");
    if (etc.dih) {
      // var now = new Date();
      // var fileName = moment(now).format("YYYYMMDDHHmmssSSS") + ".xml";
      // var fullName = "DIH_OPD/" + fileName;
      // dih = await createFile(fullName, xmlDrug);
      // if (!dih) {
      //   dih = 0;
      // }
      var url =
        "http://192.168.185.102:8788/axis2/services/DIHPMPFWebservice?wsdl";
      var client = await soap.createClientAsync(url);
      var result = await client.outpOrderDispenseAsync(xmlDrug);
      var val = await transform(result[0].return, { data: "//code" });
      if (val.data !== "0") {
        dih = 0;
      }
    }
  }

  if (etc.jvm) {
    if (DataJV) {
      var now = new Date();
      var fileName = moment(now).format("YYYYMMDDHHmmssSSS") + ".txt";
      var fullNameJVM = fileName;

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

            // the *entire* stdout and stderr (buffered)
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);
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

  let checkStatus = {
    dih: dih,
    jvm: jvm,
  };
  return checkStatus;
}

async function createFile(filename = "DIH/file.XML", text) {
  var now = new Date();
  var dateString = moment(now).format("YYYY-MM-DD");
  var timeStamp = moment(now).format("YYYY-MM-DD HH:mm:ss");
  let fs = require("fs");
  // let pathRoot = "\\\\192.168.185.164\\OCSReading\\";

  let pathRoot = "DATA/JVM_OPD/";
  let fullname = pathRoot + filename;
  let path = require("path").dirname(fullname);

  //ถ้ายังไม่มี Folder log ให้สร้างขึ้นใหม่
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
