const moment = require("moment");
const js2xmlparser = require("js2xmlparser");
const soap = require("soap");
const { transform } = require("camaro");

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
      let q = await center102.fill(b[0].hn.trim());

      let c = {
        hn: b[0].hn.trim(),
        name: b[0].patientname.trim(),
        sex: b[0].sex.trim(),
        prescriptionno: b[0].prescriptionno.trim(),
        patientdob: b[0].patientdob.trim(),
        queue: q[0] ? q[0].QN : "",
        jvm: check.jvm,
        dih: check.dih,
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
            unit: sql101[0].dosageunitcode,
            dosage: b[i].dosage ? b[i].dosage.trim() : "",
            freetext1: b[i].freetext1 ? b[i].freetext1.trim() : "",
          };
          drugarr.push(drug);
        }
      }
      console.log(c);

      getdataHomc(drugarr, c)
        .then((value) => {
          // res.status(200).json({
          //   status: 1,
          // });
          if (value.dih === 1 && value.jvm === 1) {
            let val = {
              prescriptionno: b[0].prescriptionno,
              hn: b[0].hn,
              date: moment(data.date)
                .subtract(543, "year")
                .format("YYYY-MM-DD"),
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
                sendv.status = 0;
                res.send(sendv);
              }
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

  // sendv.status = 0;
  // res.send(sendv);

  for (let i = 0; i < data.length; i++) {
    let unit = await pmpf.dataUnit(data[i].code);
    data[i].unit = unit[0].miniUnit;
  }

  let q = await center102.fill(patient.hn);
  patient.queue = q[0] ? q[0].QN : "";

  console.log(patient);
  getdataHomc(data, patient)
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
  try {
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
      let datadrugMain = await pmpf.datadrugMain(seD);
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
      let datadrugPre = await pmpf.datadrugX(seP);
      if (datadrugPre.length > 0) {
        for (let index = 0; index < datadrugPre.length; index++) {
          if (data[i].Qty >= datadrugPre[index].HisPackageRatio) {
            datadrugPre[index].lo = "pre";
            listDrugSE.push(datadrugPre[index]);
          }
        }
      }

      if (listDrugSE.length > 0) {
        listDrugSE = listDrugSE.sort((a, b) =>
          a.HisPackageRatio < b.HisPackageRatio
            ? 1
            : a.HisPackageRatio > b.HisPackageRatio
            ? -1
            : 0
        );

        if (listDrugSE.length > 1) {
          let qty_box = null;
          let qty_mod = null;
          let mod_val = null;
          let indexdrug = 0;
          let data_qty = data[i].Qty;
          let qty = data[i].Qty;
          let icheck = 0;

          for (let index = 0; index < listDrugSE.length; index++) {
            icheck = index;
            let datamodzero = [];
            let qtydowhile = data[i].Qty;

            if (mod_val === 0) {
              break;
            } else {
              do {
                if (qty >= listDrugSE[icheck].HisPackageRatio) {
                  qty = qty % Number(listDrugSE[icheck].HisPackageRatio);
                  datamodzero.push(listDrugSE[icheck]);

                  datamodzero[datamodzero.length - 1].qty = qtydowhile - qty;
                  qtydowhile = qty;
                }
                icheck++;
              } while (qty != 0 && listDrugSE[icheck] != undefined);

              if (qty === 0) {
                listDrugSE = datamodzero;
                listDrugSE = listDrugSE.filter((val) => val.qty);
                data[i].Qty = 0;
                break;
              } else {
                listDrugSE = listDrugSE.map((val) => ({
                  drugID: val.drugID,
                  drugCode: val.drugCode,
                  drugName: val.drugName,
                  HisPackageRatio: val.HisPackageRatio,
                  deviceCode: val.deviceCode,
                  isPrepack: val.isPrepack ? val.isPrepack : "N",
                  lo: val.lo,
                }));
                qty_box = ~~(data_qty / listDrugSE[index].HisPackageRatio);
                qty_mod = data_qty % listDrugSE[index].HisPackageRatio;

                if (qty_mod === 0) {
                  let val = listDrugSE[index];
                  val.qty = Number(data_qty);
                  data[i].Qty = data_qty % listDrugSE[index].HisPackageRatio;
                  listDrugSE = [];
                  listDrugSE.push(val);
                  break;
                }
                let count_box_while = qty_box;
                let count_qty_while = qty_mod;
                indexdrug = index + 1;

                if (listDrugSE[indexdrug]) {
                  do {
                    mod_val =
                      count_qty_while % listDrugSE[indexdrug].HisPackageRatio;

                    if (mod_val == 0) {
                      listDrugSE[index].qty =
                        count_box_while * listDrugSE[index].HisPackageRatio;
                      listDrugSE[indexdrug].qty = count_qty_while;
                      listDrugSE = listDrugSE.filter((d) => d.qty);
                      data[i].Qty = 0;
                    } else {
                      if (count_box_while == 1) {
                        count_box_while = qty_box;
                        count_qty_while = qty_mod;
                        indexdrug++;
                      } else {
                        count_qty_while =
                          count_qty_while + listDrugSE[index].HisPackageRatio;
                        count_box_while--;
                      }
                    }
                  } while (mod_val != 0 && listDrugSE[indexdrug] != undefined);
                } else {
                  listDrugSE = listDrugSE.filter((o) => {
                    if (o.lo === "main") {
                      o.qty =
                        ~~(data[i].Qty / o.HisPackageRatio) * o.HisPackageRatio;
                      data[i].Qty = data[i].Qty % o.HisPackageRatio;
                      return o;
                    } else {
                      listDrugSE = [];
                    }
                  });
                }
              }
            }
          }
        } else {
          if (listDrugSE.length) {
            if (listDrugSE[0].lo === "main") {
              listDrugSE[0].qty =
                ~~(data[i].Qty / listDrugSE[0].HisPackageRatio) *
                listDrugSE[0].HisPackageRatio;
              data[i].Qty = data[i].Qty % listDrugSE[0].HisPackageRatio;
            } else {
              if (data[i].Qty % listDrugSE[0].HisPackageRatio === 0) {
                listDrugSE[0].qty =
                  ~~(data[i].Qty / listDrugSE[0].HisPackageRatio) *
                  listDrugSE[0].HisPackageRatio;
                data[i].Qty = data[i].Qty % listDrugSE[0].HisPackageRatio;
              } else {
                listDrugSE = [];
              }
            }
          }
        }

        for (let x = 0; x < listDrugSE.length; x++) {
          if (listDrugSE[x].qty >= Number(listDrugSE[x].HisPackageRatio)) {
            if (
              Math.floor(
                listDrugSE[x].qty / Number(listDrugSE[x].HisPackageRatio)
              ) < 15
            ) {
              let getdrugSize = await Xmed.dataDrugSize(listDrugSE[x].drugID);

              if (
                listDrugSE[x].qty <=
                getdrugSize[0].Quantity * listDrugSE[x].HisPackageRatio
              ) {
                let drugSize =
                  ~~(listDrugSE[x].qty / listDrugSE[x].HisPackageRatio) *
                  getdrugSize[0].Item;

                if (numSize + drugSize < 4500) {
                  numSize = numSize + drugSize;

                  var se = {};
                  se.code = listDrugSE[x].drugCode;
                  se.Name = data[i].Name;
                  se.alias = data[i].alias;
                  se.firmName = data[i].firmName;
                  se.method = data[i].method;
                  se.note = data[i].note;
                  se.spec = data[i].spec;
                  se.type = data[i].type;
                  se.unit = data[i].unit;
                  se.Qty =
                    Math.floor(
                      listDrugSE[x].qty / listDrugSE[x].HisPackageRatio
                    ) * listDrugSE[x].HisPackageRatio;
                  // data[i].Qty = listDrugSE[x].qty - se.Qty;

                  arrSE.push(se);
                } else {
                  do {
                    se = {};
                    se.code = listDrugSE[x].drugCode;
                    se.Name = data[i].Name;
                    se.alias = data[i].alias;
                    se.firmName = data[i].firmName;
                    se.method = data[i].method;
                    se.note = data[i].note;
                    se.spec = data[i].spec;
                    se.type = data[i].type;
                    se.unit = data[i].unit;

                    se.Qty =
                      ~~(Math.abs(numSize - 4500) / getdrugSize[0].Item) *
                      listDrugSE[x].HisPackageRatio;

                    drugSize =
                      ~~(
                        (listDrugSE[x].qty - se.Qty) /
                        listDrugSE[x].HisPackageRatio
                      ) * getdrugSize[0].Item;
                    listDrugSE[x].qty = listDrugSE[x].qty - se.Qty;
                    // data[i].Qty = listDrugSE[x].qty;
                    arrSE.push(se);
                    codeArrSE.push(arrSE);
                    arrSE = [];
                    numSize = 0;
                  } while (drugSize > 4500);
                  // console.log(getdrugSize[0].Item);
                  if (drugSize >= getdrugSize[0].Item) {
                    var seS = {};
                    seS.code = listDrugSE[x].drugCode;
                    seS.Name = data[i].Name;
                    seS.alias = data[i].alias;
                    seS.firmName = data[i].firmName;
                    seS.method = data[i].method;
                    seS.note = data[i].note;
                    seS.spec = data[i].spec;
                    seS.type = data[i].type;
                    seS.unit = data[i].unit;
                    seS.Qty =
                      ~~(drugSize / getdrugSize[0].Item) *
                      listDrugSE[x].HisPackageRatio;
                    // data[i].Qty = data[i].Qty - seS.Qty;
                    arrSE.push(seS);
                    numSize =
                      ~~(drugSize / getdrugSize[0].Item) * getdrugSize[0].Item;
                  }
                }
              } else {
                if (listDrugSE[x].lo === "main") {
                  data[i].Qty = data[i].Qty + listDrugSE[x].qty;
                } else {
                  let a = listDrugSE.find((o) => {
                    if (o.lo === "main") {
                      data[i].Qty =
                        data[i].Qty + (listDrugSE[x].qty % o.HisPackageRatio);
                      o.qty =
                        ~~(listDrugSE[x].qty / o.HisPackageRatio) *
                        listDrugSE[x].HisPackageRatio;
                      return o;
                    } else {
                      data[i].Qty = data[i].Qty + listDrugSE[x].qty;
                    }
                  });
                  if (a) {
                    listDrugSE.push(a);
                  }
                }
              }
            } else {
              data[i].Qty = data[i].Qty + listDrugSE[x].qty;
            }
          } else {
            data[i].Qty = data[i].Qty + listDrugSE[x].qty;
          }
        }
      }

      let lcaD = { code: data[i].code + "-", lo: "LCA" };
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
          let r = /\d+/;
          let s = data[i].freetext1;
          let warning = "";
          if (dataonCube[0].dateDiff && data[i].freetext1 && data[i].dosage) {
            if (
              dataonCube[0].dateDiff -
                data[i].Qty / (Number(s.match(r)) * Number(data[i].dosage)) <
              0
            ) {
              warning = "";
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
        codeArr[i] = codeArr[i] + "(" + (i + 1) + "/" + codeArr.length + ")";
      }

      DataJV = codeArr.join("\r\n");
    }

    let op = [];
    for (let i = 0; i < codeArrSE.length; i++) {
      op.push(codeArrSE[i]);
    }

    op.push(arrSE.concat(codeArrPush));
    let numtext = 0;
    var orderNo =
      etc.prescriptionno +
      "_" +
      ("0" + momentDate.getHours()).slice(-2) +
      +("0" + momentDate.getMinutes()).slice(-2) +
      +("0" + momentDate.getSeconds()).slice(-2);

    let value2 = [];
    let dih = 1;
    let jvm = 1;

    for (let i = 0; i < op.length; i++) {
      for (let j = 0; j < op[i].length; j++) {
        let { dosage, freetext1, ...updatedObject } = op[i][j];
        let value = {
          drug: updatedObject,
        };

        value2.push(value);
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

      let xmlDrug = {
        xml: js2xmlparser.parse("outpOrderDispense", jsonDrug),
      };
      console.log(xmlDrug);
      console.log("-------------------------------------------------");

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
    }
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
  } catch (error) {
    // getdataHomc(data, etc);
    console.error(error); // from creation or business logic
  }
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
