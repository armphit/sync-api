const express = require("express");
const bodyParser = require("body-parser");
const moment = require("moment");
// const { SSL_OP_NO_QUERY_MTU } = require('constants');
// const moment = require("moment");
const UserModel = require("../NodeJS-api/model/userModel");
const app = express();
const { Promise } = require("mssql");
// const utils = require('./utils');
// var ut = new utils();

var db_Homc = require("./DB/db_Homc");
var homc = new db_Homc();
var db_pmpf = require("./DB/db_pmpf_thailand_mnrh");
var pmpf = new db_pmpf();
var db_GD4Unit_101 = require("./DB/db_GD4Unit_101_sqlserver");
var GD4Unit_101 = new db_GD4Unit_101();
var db_mysql102 = require("./DB/db_center_102_mysql");
var center102 = new db_mysql102();
const {
  registerController,
  loginController,
} = require("./controller/userController");

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methode", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-HEADERS", "content-type, x-access-token");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

app.post("/syncOPD", async (req, res) => {
  const hn = req.body.data;
  const date = req.body.date;
  // res.send(req.params);
  // const top = req.body.top;
  // res.end(top);

  var sqlCommand =
    `SELECT
    m.batch_no As prescriptionno,
    m.detail_no As seq,
    o.hn As hn,
    o.VisitNo As an,
    Rtrim(ti.titleName) + ' ' +Rtrim(pt.firstName) + ' ' + Rtrim(pt.lastName) As patientname,
    CASE When pt.sex='ช' then 'M' else 'F' END as sex,
    pt.birthDay as patientdob,
    pt.marital as  maritalstatus,
    'H' As prioritycode,
    FORMAT(p.lastIssDate,'yyyy-MM-dd hh:mm:ss') As takedate,
    FORMAT(mh.lastUpd,'yyyy-MM-dd hh:mm:ss') AS ordercreatedate,
    m.inv_code As orderitemcode,
    v.gen_name as orderitemname,
    m.quant As orderqty,
    p.unit as orderunitcode,
    p.lamedHow as instructioncode,
    (SELECT max(value) FROM STRING_SPLIT(p.lamedQty,'-')) as dosage,
    -- p.lamedQty as dosage,
    p.lamedUnit as dosageunitcode,
    p.lamedTime as timecode,
    '1' As durationcode,
    m.maker As usercreatecode,
    m.site As departmentcode,
    si.site_addr As departmentdesc,
    p.lamedTimeText as  freetext1,
    p.lamedText as freetext2,
    FORMAT(p.lastIssTime,'yyyy-MM-dd hh:mm:ss') as  lastmodified,
    m.invTMTCode10 As tmtcode,
    ( SELECT Rtrim(LTRIM(mi.Description))+','-- ,mif.Med_Inv_Code
     FROM Med_Info_Group mi
     LEFT JOIN Med_Info mif on (mif.Med_Info_Code = mi.Code)
     where mif.Med_Inv_Code =m.inv_code
     FOR XML PATH('')
    ) as itemidentify,
    m.cost As cost,
    m.amount As totalprice,
    v.remarks As orderitemnameTh,
    b.useDrg AS rightid,
    t.pay_typedes AS rightname,
    m.site
    
    FROM
    OPD_H o
    LEFT JOIN Med_logh mh On o.hn = mh.hn AND o.regNo = mh.regNo
    left join Med_log m on mh.batch_no = m.batch_no
    left join Bill_h b on b.hn = mh.hn AND b.regNo = mh.regNo
    left join Paytype t on t.pay_typecode = b.useDrg
    left join Med_inv v on (v.code = m.inv_code  and v.[site]='1')
    left join Patmed p (NOLOCK) on (p.hn = mh.hn and p.registNo = mh.regNo and p.invCode = m.inv_code and m.quant_diff = p.runNo)
    left join PATIENT pt  on (pt.hn = o.hn)
    left join PTITLE ti on (ti.titleCode = pt.titleCode)
    left join Site si On m.site = si.site_key
    WHERE
    mh.hn='` +
    hn.padL(" ") +
    `'
    AND mh.invdate = '` +
    date +
    `'
    AND m.pat_status = 'O'
    AND m.revFlag IS NULL
    -- AND m.override_code = 'Y'
    AND m.site IN ('W8','W9')
    order by m.date DESC`;

  try {
    if (parseInt(hn) != NaN) {
      let x = {};
      x = await homc.fill(sqlCommand);
      let b = x.recordset;
      res.send("ssss");
      let drugarr = [];

      let c = {
        hn: b[0].hn.trim(),
        sex: b[0].sex.trim(),
        prescriptionno: b[0].prescriptionno.trim(),
        patientdob: b[0].patientdob.trim(),
      };
      for (let i = 0; i < b.length; i++) {
        var sqlgetdrug =
          `SELECT orderitemcode,Strength,firmname,pack,dosageunitcode
      FROM ms_drug
      WHERE orderitemcode = '` +
          b[i].orderitemcode +
          `'`;
        sql101 = await GD4Unit_101.dataDrug(sqlgetdrug);
        sql101 = sql101.recordset;
        if (sql101 !== [] && Number(b[i].totalprice.trim()) > 0) {
          let drug = {
            Name: b[i].patientname.trim(),
            Qty: b[i].totalprice.trim(),
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
      // console.log(drugarr);
      getdataHomc(drugarr, c);
    } else {
      x = {};
      x.data = "0";
      res.send(x);
    }
    // res.send(getData(sqlCommand))
  } catch (error) {
    x = {};
    x.data = "0";
    res.send(x);
  }
});

app.get("/", (req, res) => {
  res.end("welcom to root path");
});

app.listen(2000, () => {
  console.log("Web Service Online:2000");
});

String.prototype.padL = function padL(n) {
  var target = this;
  while (target.length < 7) {
    target = n + target;
  }
  return target;
};

async function getdataHomc(data, etc) {
  const momentDate = new Date();
  let datePayment = moment(momentDate).format("YYYY-MM-DD");
  let dateA = moment(momentDate).format("YYMMDD");
  let dateB = moment(momentDate).add(543, "year").format("DD/MM/YYYY");
  let hn = etc.hn;
  let sex = etc.sex;
  let prescriptionno = etc.prescriptionno;
  let m = moment(etc.patientdob, "YYYYMMDD", "th", true);

  let birthDate = moment(m)
    .add(1, "month")
    .subtract(543, "year")
    .format("YYYY-MM-DD");

  let numJV = "6400" + Math.floor(Math.random() * 1000000);
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
  let p = 0;
  let numBox = 0;
  let arrSE = new Array();
  let codeArrSE = new Array();

  for (let i = 0; i < data.length; i++) {
    let listDrugOPD = await pmpf.datadrug(data[i].code);

    if (listDrugOPD.length !== 0) {
      console.log(listDrugOPD);
      //   if (
      //     listDrugOPD[0].deviceCode.includes("Xmed1") &&
      //     listDrugOPD[0].isPrepack == "N" &&
      //     data[i].Qty >= Number(listDrugOPD[0].HisPackageRatio)
      //   ) {
      //     var qtyBox = data[i].Qty / listDrugOPD[0].HisPackageRatio;
      //     if (numBox + ~~qtyBox < 10) {
      //       numBox = numBox + ~~qtyBox;
      //       var se = {};
      //       se.code = listDrugOPD[0].drugCode;
      //       se.Name = data[i].Name;
      //       se.alias = data[i].alias;
      //       se.firmName = data[i].firmName;
      //       se.method = data[i].method;
      //       se.note = data[i].note;
      //       se.spec = data[i].spec;
      //       se.type = data[i].type;
      //       se.unit = data[i].unit;
      //       se.Qty =
      //         Math.floor(data[i].Qty / listDrugOPD[0].HisPackageRatio) *
      //         listDrugOPD[0].HisPackageRatio;
      //       data[i].Qty = data[i].Qty % listDrugOPD[0].HisPackageRatio;
      //       arrSE.push(se);
      //     } else {
      //       do {
      //         se = {};
      //         se.code = listDrugOPD[0].drugCode;
      //         se.Name = data[i].Name;
      //         se.alias = data[i].alias;
      //         se.firmName = data[i].firmName;
      //         se.method = data[i].method;
      //         se.note = data[i].note;
      //         se.spec = data[i].spec;
      //         se.type = data[i].type;
      //         se.unit = data[i].unit;
      //         se.Qty = Math.abs(numBox - 10) * listDrugOPD[0].HisPackageRatio;
      //         arrSE.push(se);
      //         codeArrSE.push(arrSE);
      //         arrSE = [];
      //         qtyBox = ~~qtyBox - Math.abs(numBox - 10);
      //         numBox = 0;
      //       } while (qtyBox > 9);
      //       if (qtyBox !== 0) {
      //         var seS = {};
      //         seS.code = listDrugOPD[0].drugCode;
      //         seS.Name = data[i].Name;
      //         seS.alias = data[i].alias;
      //         seS.firmName = data[i].firmName;
      //         seS.method = data[i].method;
      //         seS.note = data[i].note;
      //         seS.spec = data[i].spec;
      //         seS.type = data[i].type;
      //         seS.unit = data[i].unit;
      //         seS.Qty = qtyBox * listDrugOPD[0].HisPackageRatio;
      //         arrSE.push(seS);
      //         numBox = qtyBox;
      //       }
      //     }
      //     data[i].Qty = data[i].Qty % listDrugOPD[0].HisPackageRatio;
      //   }
      //   console.log(arrSE);
      //   console.log(codeArrSE);
      // var pre = {};
      // if (
      //   listDrugOPD[0].deviceCode.includes("Xmed1") &&
      //   listDrugOPD[0].isPrepack == "Y" &&
      //   data[i].Qty >= Number(listDrugOPD[0].HisPackageRatio) &&
      //   data[i].Qty <= Number(seCheckOutOfStock[0].Quantity)
      // ) {
      //   var qtyBox = data[i].Qty / listDrugOPD[0].HisPackageRatio;
      //   if (numBox + ~~qtyBox < 10) {
      //     numBox = numBox + ~~qtyBox;
      //     pre.code = listDrugOPD[0].drugCode;
      //     pre.Name = data[i].Name;
      //     pre.alias = data[i].alias;
      //     pre.firmName = data[i].firmName;
      //     pre.method = data[i].method;
      //     pre.note = data[i].note;
      //     pre.spec = data[i].spec;
      //     pre.type = data[i].type;
      //     pre.unit = data[i].unit;
      //     pre.Qty =
      //       Math.floor(data[i].Qty / listDrugOPD[0].HisPackageRatio) *
      //       listDrugOPD[0].HisPackageRatio;
      //     data[i].Qty = data[i].Qty % listDrugOPD[0].HisPackageRatio;
      //     arrSE.push(pre);
      //   } else {
      //     do {
      //       pre.code = listDrugOPD[0].drugCode;
      //       pre.Name = data[i].Name;
      //       pre.alias = data[i].alias;
      //       pre.firmName = data[i].firmName;
      //       pre.method = data[i].method;
      //       pre.note = data[i].note;
      //       pre.spec = data[i].spec;
      //       pre.type = data[i].type;
      //       pre.unit = data[i].unit;
      //       pre.Qty = Math.abs(numBox - 10) * listDrugOPD[0].HisPackageRatio;
      //       arrSE.push(pre);
      //       codeArrSE.push(arrSE);
      //       arrSE = [];
      //       qtyBox = ~~qtyBox - Math.abs(numBox - 10);
      //       numBox = 0;
      //     } while (qtyBox > 9);
      //     if (qtyBox !== 0) {
      //       var preS = {};
      //       preS.code = listDrugOPD[0].drugCode;
      //       preS.Name = data[i].Name;
      //       preS.alias = data[i].alias;
      //       preS.firmName = data[i].firmName;
      //       preS.method = data[i].method;
      //       preS.note = data[i].note;
      //       preS.spec = data[i].spec;
      //       preS.type = data[i].type;
      //       preS.unit = data[i].unit;
      //       preS.Qty = qtyBox * listDrugOPD[0].HisPackageRatio;
      //       arrSE.push(preS);
      //       numBox = qtyBox;
      //     }
      //   }
      //   data[i].Qty = data[i].Qty % listDrugOPD[0].HisPackageRatio;
      // }
      // // let listDrugLCA: any = await this.http.post('listDrugLCA', formData);
      // listDrugOPD.forEach((listDrugOPD) => {
      //   if (
      //     listDrugOPD.deviceCode.includes("LCA") &&
      //     Math.floor(data[i].Qty / listDrugOPD.HisPackageRatio) *
      //       listDrugOPD.HisPackageRatio >
      //       0
      //   ) {
      //     var lca = {};
      //     lca.code = listDrugOPD.drugCode;
      //     lca.Qty =
      //       Math.floor(data[i].Qty / listDrugOPD.HisPackageRatio) *
      //       listDrugOPD.HisPackageRatio;
      //     lca.Name = data[i].Name;
      //     lca.alias = data[i].alias;
      //     lca.firmName = data[i].firmName;
      //     lca.method = data[i].method;
      //     lca.note = data[i].note;
      //     lca.spec = data[i].spec;
      //     lca.type = data[i].type;
      //     lca.unit = data[i].unit;
      //     codeArrPush.push(lca);
      //     data[i].Qty = data[i].Qty % listDrugOPD.HisPackageRatio;
      //   }
      // });
    }
  }
}
