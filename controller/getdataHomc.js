const moment = require("moment");
const js2xmlparser = require("js2xmlparser");
const soap = require("soap");
const { transform } = require("camaro");
const {
  Xmed,
  pmpf,
  mathSE,
  onCube,
  homc,
  createFile,
} = require("./syncController");

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
  data = data.sort((a, b) => (a.Qty < b.Qty ? 1 : a.Qty > b.Qty ? -1 : 0));
  for (let i = 0; i < data.length; i++) {
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

            if (numSize + drugSize < 3800) {
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
                    ~~(Math.abs(numSize - 3800) / listDrugSE[x].Item) *
                    listDrugSE[x].HisPackageRatio,
                };
                // se.Qty =
                //   ~~(Math.abs(numSize - 3800) / listDrugSE[x].Item) *
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
                  drugSize < 3800 &&
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
              } while (drugSize > 3800);

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
        if (dataonCube[0].dateDiff) {
          if (dataonCube[0].dateDiff < 365) {
            warning = "*";
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
  let value3 = [];
  let ex = null;
  for (let i = 0; i < op.length; i++) {
    for (let j = 0; j < op[i].length; j++) {
      let value = {
        drug: op[i][j],
      };

      value2.push(value);
      value3.push(value);
    }
    ex = value3.map((a) => a.drug.device).filter(Boolean);
    ex = let;
    sendzone = value3
      .map((a) => a.drug.device)
      .filter(Boolean)
      .map((item) => (item == "XMed" ? "Xmed1" : item));
    sendzone = Array.from(new Set(sendzone));
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
    console.log(zone);
    zone = [3];

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

  arrJson.map(async function (item) {
    item.prescriptions.prescription.windowNo =
      etc.user.toLowerCase().charAt(0) === "c" ? 4 : 3;
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
    console.log("WindowNo : " + item.prescriptions.prescription.windowNo);
    // console.log("Locataion : " + ex);
    if (etc.dih) {
      var url =
        "http://192.168.185.102:8788/axis2/services/DIHPMPFWebservice?wsdl";
      var client = await soap.createClientAsync(url);
      var result = await client.outpOrderDispenseAsync(xmlDrug);
      // console.log(result);
      var val = await transform(result[0].return, { data: "//code" });
      // console.log(val);
      if (val.data !== "0") {
        dih = 0;
      }
    }
    return item;
  });
  value3 = [];
  dataZone = null;
  zone = [];
  sendzone = null;
  nullex = null;
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
exports.getdataHomc = getdataHomc;
