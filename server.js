const express = require("express");
const bodyParser = require("body-parser");
const app = express();

var {
  registerController,
  loginController,
  syncOPDController,
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

app.post("/register", registerController);
app.post("/login", loginController);
app.post("/syncOPD", syncOPDController);

module.exports = app;
// app.post("/syncOPD", async (req, res) => {
//   const hn = req.body.data;
//   const date = req.body.date;
//   // res.send(req.params);
//   // const top = req.body.top;
//   // res.end(top);

//   var sqlCommand =
//     `SELECT
//     m.batch_no As prescriptionno,
//     m.detail_no As seq,
//     o.hn As hn,
//     o.VisitNo As an,
//     Rtrim(ti.titleName) + ' ' +Rtrim(pt.firstName) + ' ' + Rtrim(pt.lastName) As patientname,
//     CASE When pt.sex='ช' then 'M' else 'F' END as sex,
//     pt.birthDay as patientdob,
//     pt.marital as  maritalstatus,
//     'H' As prioritycode,
//     FORMAT(p.lastIssDate,'yyyy-MM-dd hh:mm:ss') As takedate,
//     FORMAT(mh.lastUpd,'yyyy-MM-dd hh:mm:ss') AS ordercreatedate,
//     m.inv_code As orderitemcode,
//     v.gen_name as orderitemname,
//     m.quant As orderqty,
//     p.unit as orderunitcode,
//     p.lamedHow as instructioncode,
//     (SELECT max(value) FROM STRING_SPLIT(p.lamedQty,'-')) as dosage,
//     -- p.lamedQty as dosage,
//     p.lamedUnit as dosageunitcode,
//     p.lamedTime as timecode,
//     '1' As durationcode,
//     m.maker As usercreatecode,
//     m.site As departmentcode,
//     si.site_addr As departmentdesc,
//     p.lamedTimeText as  freetext1,
//     p.lamedText as freetext2,
//     FORMAT(p.lastIssTime,'yyyy-MM-dd hh:mm:ss') as  lastmodified,
//     m.invTMTCode10 As tmtcode,
//     ( SELECT Rtrim(LTRIM(mi.Description))+','-- ,mif.Med_Inv_Code
//      FROM Med_Info_Group mi
//      LEFT JOIN Med_Info mif on (mif.Med_Info_Code = mi.Code)
//      where mif.Med_Inv_Code =m.inv_code
//      FOR XML PATH('')
//     ) as itemidentify,
//     m.cost As cost,
//     m.amount As totalprice,
//     v.remarks As orderitemnameTh,
//     b.useDrg AS rightid,
//     t.pay_typedes AS rightname,
//     m.site

//     FROM
//     OPD_H o
//     LEFT JOIN Med_logh mh On o.hn = mh.hn AND o.regNo = mh.regNo
//     left join Med_log m on mh.batch_no = m.batch_no
//     left join Bill_h b on b.hn = mh.hn AND b.regNo = mh.regNo
//     left join Paytype t on t.pay_typecode = b.useDrg
//     left join Med_inv v on (v.code = m.inv_code  and v.[site]='1')
//     left join Patmed p (NOLOCK) on (p.hn = mh.hn and p.registNo = mh.regNo and p.invCode = m.inv_code and m.quant_diff = p.runNo)
//     left join PATIENT pt  on (pt.hn = o.hn)
//     left join PTITLE ti on (ti.titleCode = pt.titleCode)
//     left join Site si On m.site = si.site_key
//     WHERE
//     mh.hn='` +
//     hn.padL(" ") +
//     `'
//     AND mh.invdate = '` +
//     date +
//     `'
//     AND m.pat_status = 'O'
//     AND m.revFlag IS NULL
//     -- AND m.override_code = 'Y'
//     AND m.site IN ('W8','W9')
//     order by m.date DESC`;

//   try {
//     if (parseInt(hn) != NaN) {
//       let x = {};
//       x = await homc.fill(sqlCommand);
//       let b = x.recordset;
//       res.send("ssss");
//       let drugarr = [];
//       let q = await center102.fill(b[0].hn.trim());

//       let c = {
//         hn: b[0].hn.trim(),
//         name: b[0].patientname.trim(),
//         sex: b[0].sex.trim(),
//         prescriptionno: b[0].prescriptionno.trim(),
//         patientdob: b[0].patientdob.trim(),
//         queue: q[0].QN,
//       };

//       for (let i = 0; i < b.length; i++) {
//         var sqlgetdrug =
//           `SELECT orderitemcode,Strength,firmname,pack,dosageunitcode
//       FROM ms_drug
//       WHERE orderitemcode = '` +
//           b[i].orderitemcode +
//           `'`;
//         sql101 = await GD4Unit_101.dataDrug(sqlgetdrug);
//         sql101 = sql101.recordset;

//         if (sql101.length !== 0 && Number(b[i].orderqty.trim()) > 0) {
//           let drug = {
//             Name: b[i].orderitemname.trim(),
//             Qty: b[i].orderqty.trim(),
//             alias: "",
//             code: b[i].orderitemcode.trim(),
//             firmName: sql101[0].firmname,
//             method: "",
//             note: "",
//             spec: sql101[0].Strength,
//             type: "",
//             unit: b[i].orderunitcode,
//           };
//           drugarr.push(drug);
//         }
//       }

//       getdataHomc(drugarr, c);
//     } else {
//       x = {};
//       x.data = "0";
//       res.send(x);
//     }
//     // res.send(getData(sqlCommand))
//   } catch (error) {
//     x = {};
//     x.data = "0";
//     res.send(x);
//   }
// });

// app.post("/syncOPDManual", async (req, res) => {
//   let data = req.body.data;

//   let c = {
//     hn: "0000",
//     name: "TEST",
//     sex: "M",
//     prescriptionno: 9999999999,
//     patientdob: "25210401",
//   };
//   res.send("1");
//   getdataHomc(data, c);
// });

app.get("/", (req, res) => {
  res.end("welcom to root path");
});

app.listen(2000, () => {
  console.log("Web Service Online:2000");
});

// String.prototype.padL = function padL(n) {
//   var target = this;
//   while (target.length < 7) {
//     target = n + target;
//   }
//   return target;
// };

// async function getdataHomc(data, etc) {
//   const momentDate = new Date();
//   let datePayment = moment(momentDate).format("YYYY-MM-DD");
//   let dateA = moment(momentDate).format("YYMMDD");
//   let dateB = moment(momentDate).add(543, "year").format("DD/MM/YYYY");
//   // let hn = etc.hn;
//   // let sex = etc.sex;
//   // let prescriptionno = etc.prescriptionno;
//   let m = moment(etc.patientdob, "YYYYMMDD", "th", true);

//   let birthDate = moment(m)
//     .add(1, "month")
//     .subtract(543, "year")
//     .format("YYYY-MM-DD");

//   // let numJV = "6400" + Math.floor(Math.random() * 1000000);
//   let getAge = new Date().getFullYear() - 2020;
//   let codeArr = new Array();
//   let codeArrPush = new Array();
//   let numDontKnow = Math.floor(Math.random() * 10000);
//   let dateBirthConvert = moment(birthDate).format("DD/MM/YYYY");

//   var dateParts = birthDate.split("-");
//   var dateObject = new Date(+dateParts[0], +dateParts[1], +dateParts[2]);
//   var timeDiff = Math.abs(Date.now() - new Date(dateObject).getTime());
//   var age = Math.floor(timeDiff / (1000 * 3600 * 24) / 365.25);

//   let j = 0;
//   let p = 0;
//   let numBox = 0;
//   let arrSE = new Array();
//   let codeArrSE = new Array();
//   // let DataQue: any = await this.http.post('DataQ', formData);

//   // if (getData2.connect) {
//   //   if (getData2.response.rowCount > 0) {
//   //     dataQ = getData2.response.result[0].QN;
//   //   } else {
//   //     dataQ = "";
//   //   }
//   // } else {
//   //   Swal.fire("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้!", "", "error");
//   // }

//   // console.log(data[0].code);
//   for (let i = 0; i < data.length; i++) {
//     let listDrugOPD = await pmpf.datadrug(data[i].code);

//     if (listDrugOPD.length !== 0) {
//       if (
//         listDrugOPD[0].deviceCode.includes("Xmed1") &&
//         listDrugOPD[0].isPrepack == "N" &&
//         data[i].Qty >= Number(listDrugOPD[0].HisPackageRatio)
//       ) {
//         var qtyBox = data[i].Qty / listDrugOPD[0].HisPackageRatio;
//         if (numBox + ~~qtyBox < 10) {
//           numBox = numBox + ~~qtyBox;
//           var se = {};
//           se.code = listDrugOPD[0].drugCode;
//           se.Name = data[i].Name;
//           se.alias = data[i].alias;
//           se.firmName = data[i].firmName;
//           se.method = data[i].method;
//           se.note = data[i].note;
//           se.spec = data[i].spec;
//           se.type = data[i].type;
//           se.unit = data[i].unit;
//           se.Qty =
//             Math.floor(data[i].Qty / listDrugOPD[0].HisPackageRatio) *
//             listDrugOPD[0].HisPackageRatio;
//           data[i].Qty = data[i].Qty % listDrugOPD[0].HisPackageRatio;
//           arrSE.push(se);
//         } else {
//           do {
//             se = {};
//             se.code = listDrugOPD[0].drugCode;
//             se.Name = data[i].Name;
//             se.alias = data[i].alias;
//             se.firmName = data[i].firmName;
//             se.method = data[i].method;
//             se.note = data[i].note;
//             se.spec = data[i].spec;
//             se.type = data[i].type;
//             se.unit = data[i].unit;
//             se.Qty = Math.abs(numBox - 10) * listDrugOPD[0].HisPackageRatio;
//             arrSE.push(se);
//             codeArrSE.push(arrSE);
//             arrSE = [];
//             qtyBox = ~~qtyBox - Math.abs(numBox - 10);
//             numBox = 0;
//           } while (qtyBox > 9);
//           if (qtyBox !== 0) {
//             var seS = {};
//             seS.code = listDrugOPD[0].drugCode;
//             seS.Name = data[i].Name;
//             seS.alias = data[i].alias;
//             seS.firmName = data[i].firmName;
//             seS.method = data[i].method;
//             seS.note = data[i].note;
//             seS.spec = data[i].spec;
//             seS.type = data[i].type;
//             seS.unit = data[i].unit;
//             seS.Qty = qtyBox * listDrugOPD[0].HisPackageRatio;
//             arrSE.push(seS);
//             numBox = qtyBox;
//           }
//         }
//         data[i].Qty = data[i].Qty % listDrugOPD[0].HisPackageRatio;
//       }

//       var pre = {};
//       if (
//         listDrugOPD[0].deviceCode.includes("Xmed1") &&
//         listDrugOPD[0].isPrepack == "Y" &&
//         data[i].Qty >= Number(listDrugOPD[0].HisPackageRatio)
//       ) {
//         var qtyBox = data[i].Qty / listDrugOPD[0].HisPackageRatio;
//         if (numBox + ~~qtyBox < 10) {
//           numBox = numBox + ~~qtyBox;
//           pre.code = listDrugOPD[0].drugCode;
//           pre.Name = data[i].Name;
//           pre.alias = data[i].alias;
//           pre.firmName = data[i].firmName;
//           pre.method = data[i].method;
//           pre.note = data[i].note;
//           pre.spec = data[i].spec;
//           pre.type = data[i].type;
//           pre.unit = data[i].unit;
//           pre.Qty =
//             Math.floor(data[i].Qty / listDrugOPD[0].HisPackageRatio) *
//             listDrugOPD[0].HisPackageRatio;
//           data[i].Qty = data[i].Qty % listDrugOPD[0].HisPackageRatio;
//           arrSE.push(pre);
//         } else {
//           do {
//             pre.code = listDrugOPD[0].drugCode;
//             pre.Name = data[i].Name;
//             pre.alias = data[i].alias;
//             pre.firmName = data[i].firmName;
//             pre.method = data[i].method;
//             pre.note = data[i].note;
//             pre.spec = data[i].spec;
//             pre.type = data[i].type;
//             pre.unit = data[i].unit;
//             pre.Qty = Math.abs(numBox - 10) * listDrugOPD[0].HisPackageRatio;
//             arrSE.push(pre);
//             codeArrSE.push(arrSE);
//             arrSE = [];
//             qtyBox = ~~qtyBox - Math.abs(numBox - 10);
//             numBox = 0;
//           } while (qtyBox > 9);
//           if (qtyBox !== 0) {
//             var preS = {};
//             preS.code = listDrugOPD[0].drugCode;
//             preS.Name = data[i].Name;
//             preS.alias = data[i].alias;
//             preS.firmName = data[i].firmName;
//             preS.method = data[i].method;
//             preS.note = data[i].note;
//             preS.spec = data[i].spec;
//             preS.type = data[i].type;
//             preS.unit = data[i].unit;
//             preS.Qty = qtyBox * listDrugOPD[0].HisPackageRatio;
//             arrSE.push(preS);
//             numBox = qtyBox;
//           }
//         }
//         data[i].Qty = data[i].Qty % listDrugOPD[0].HisPackageRatio;
//       }

//       if (listDrugOPD[0].deviceCode.includes("JV")) {
//         listDrugOPD.forEach((listDrugOPD) => {
//           if (
//             listDrugOPD.deviceCode.includes("LCA") &&
//             Math.floor(data[i].Qty / listDrugOPD.HisPackageRatio) *
//               listDrugOPD.HisPackageRatio >
//               0
//           ) {
//             var lca = {};
//             lca.code = listDrugOPD.drugCode;
//             lca.Qty =
//               Math.floor(data[i].Qty / listDrugOPD.HisPackageRatio) *
//               listDrugOPD.HisPackageRatio;
//             lca.Name = data[i].Name;
//             lca.alias = data[i].alias;
//             lca.firmName = data[i].firmName;
//             lca.method = data[i].method;
//             lca.note = data[i].note;
//             lca.spec = data[i].spec;
//             lca.type = data[i].type;
//             lca.unit = data[i].unit;
//             codeArrPush.push(lca);
//             data[i].Qty = data[i].Qty % listDrugOPD.HisPackageRatio;
//           }
//         });
//       }
//     }

//     let numMax = 0;
//     if (data[i].Qty > 0) {
//       if (listDrugOPD.length !== 0) {
//         if (listDrugOPD[0].deviceCode.includes("JV")) {
//           let dataonCube = await onCube.datadrug(data[i].code);
//           let dateC = null;
//           let date = new Date();
//           date.setFullYear(date.getFullYear() + 1);

//           if (dataonCube.length !== 0) {
//             if (dataonCube[0].ExpiredDate) {
//               dateC = moment(dataonCube[0].ExpiredDate)
//                 .add(543, "year")
//                 .format("DD/MM/YYYY");
//             } else {
//               dateC = moment(date).add(543, "year").format("DD/MM/YYYY");
//             }

//             if (Number(dataonCube[0].QuantityMaximum)) {
//               numMax = Number(dataonCube[0].QuantityMaximum);
//             } else {
//               numMax = data[i].Qty;
//             }
//           }

//           // let c = {
//           //   hn: "0000",
//           //   name: "TEST",
//           //   sex: "M",
//           //   prescriptionno: 9999999999,
//           //   patientdob: "25210401",
//           // };

//           let amount = 0;
//           let qty = data[i].Qty;
//           do {
//             j++;
//             amount = qty > 400 ? 400 : qty;
//             let dataJVM =
//               etc.name +
//               "|" +
//               etc.hn +
//               j +
//               "|" +
//               etc.prescriptionno +
//               "|" +
//               dateBirthConvert +
//               " 0:00:00|OPD|||" +
//               age +
//               "||" +
//               numDontKnow +
//               "|I|" +
//               amount +
//               "|" +
//               data[i].code +
//               "|" +
//               data[i].Name +
//               "|" +
//               dateA +
//               "|" +
//               dateA +
//               "|" +
//               "00:0" +
//               j +
//               "|||โรงพยาบาลมหาราชนครราชสีมา|||" +
//               etc.prescriptionno +
//               data[i].code +
//               "|||" +
//               dateB +
//               "|" +
//               dateC +
//               "|" +
//               etc.hn +
//               "|" +
//               etc.queue +
//               "|";

//             codeArr.push(dataJVM);
//             qty = qty - amount;
//           } while (qty > 0);
//         }
//       }
//       codeArrPush.push(data[i]);
//     }
//   }
//   let DataJV = "";
//   if (codeArr.length > 0) {
//     for (let i = 0; i < codeArr.length; i++) {
//       codeArr[i] = codeArr[i] + "(" + (i + 1) + "/" + codeArr.length + ")";
//     }

//     DataJV = codeArr.join("\r\n");
//   }

//   let op = [];
//   for (let i = 0; i < codeArrSE.length; i++) {
//     op.push(codeArrSE[i]);
//   }

//   op.push(arrSE.concat(codeArrPush));

//   let getDataJV = null;
//   let getDataDIH = null;
//   let value2 = [];
//   let dih = 1;
//   let jvm = 1;
//   let numRandom = "9900" + Math.floor(Math.random() * 1000000000);

//   for (let i = 0; i < op.length; i++) {
//     for (let j = 0; j < op[i].length; j++) {
//       let value = {
//         drug: op[i][j],
//       };
//       value2.push(value);
//     }

//     let jsonDrug = {
//       patient: {
//         patID: etc.hn,
//         patName:
//           etc.name.length > 40
//             ? etc.name.substring(0, 30) +
//               "..." +
//               "(" +
//               (i + 1) +
//               "/" +
//               op.length +
//               ")"
//             : etc.name + " (" + (i + 1) + "/" + op.length + ")",
//         gender: etc.sex,
//         birthday: birthDate,
//         age: age,
//         identity: "",
//         insuranceNo: "",
//         chargeType: "",
//       },
//       prescriptions: {
//         prescription: {
//           orderNo: numRandom,
//           ordertype: "M",
//           pharmacy: "OPD",
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
//     value2 = [];
//     let xmlDrug = js2xmlparser.parse("outpOrderDispense", jsonDrug);

//     // console.log(xmlDrug);
//     console.log("-------------------------------------------------");
//     var now = new Date();
//     var fileName = moment(now).format("YYYYMMDDHHmmssSSS") + ".xml";
//     var fullName = "DIH_OPD/" + fileName;

//     // createFile(fullName, xmlDrug)
//     //   .then(() => {
//     //     dih = 1;
//     //     console.log("dih = " + dih);
//     //   })
//     //   .catch((error) => {
//     //     dih = error;
//     //     console.log(error);
//     //   });
//   }

//   // var now = new Date();
//   // var fileName = moment(now).format("YYYYMMDDHHmmssSSS") + ".txt";
//   // var fullNameJVM = "JVM_OPD/" + fileName;

//   // createFile(fullNameJVM, DataJV)
//   //   .then(() => {
//   //     jvm = 1;
//   //     console.log("jvm = " + jvm);
//   //   })
//   //   .catch((error) => {
//   //     jvm = error;
//   //     console.log(error);
//   //   });

//   // console.log(arrSE);
//   // console.log("-------------------------------------------------");
//   // console.log(codeArrSE);
//   // console.log("-------------------------------------------------");
//   // console.log(codeArrPush);
//   // console.log("-------------------------------------------------");
//   // console.log(codeArr);
// }

// async function createFile(filename = "DIH/file.XML", text) {
//   var now = new Date();
//   var dateString = moment(now).format("YYYY-MM-DD");
//   var timeStamp = moment(now).format("YYYY-MM-DD HH:mm:ss");
//   let fs = require("fs");
//   let pathRoot = "./DATA/";
//   let fullname = pathRoot + filename;
//   let path = require("path").dirname(fullname);
//   //ถ้ายังไม่มี Folder log ให้สร้างขึ้นใหม่
//   if (!fs.existsSync(pathRoot)) {
//     fs.mkdirSync(pathRoot);
//   }

//   if (!fs.existsSync(path)) {
//     fs.mkdirSync(path);
//   }
//   fs.appendFileSync(fullname, text + "\r\n", (err) => {
//     if (err) throw err;
//   });
// }
