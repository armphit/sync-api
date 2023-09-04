const moment = require("moment");
var db_mysql101center = require("../DB/db_center_101_mysql");
var center101 = new db_mysql101center();
var db_mysql102 = require("../DB/db_center_102_mysql");
var center102 = new db_mysql102();
var db_Homc = require("../DB/db_Homc");
var homc = new db_Homc();
var jimp = require("jimp");
var qrCode = require("qrcode-reader");
var db_pmpf = require("../DB/db_pmpf_thailand_mnrh");
var pmpf = new db_pmpf();

exports.checkpatientController = async (req, res, next) => {
  if (req.body) {
    let allTimeOld = "";
    let datasend = req.body;
    datasend.allTimeOld = `''`;
    let checkpatientdruglength = await homc.checkmed(datasend);
    let dataPatient = await center102.checkdelete(datasend);
    if (!dataPatient.length && checkpatientdruglength.recordset.length) {
      await center102.insertPatient(datasend);
      dataPatient = await center102.getpatient(datasend);
    }

    if (dataPatient.length) {
      dataPatient = dataPatient[0];

      let time = await center102.checkPatientcheckmed(dataPatient.id);
      if (time.length != 0) {
        for (let d of time) {
          allTimeOld = allTimeOld + `'` + d.ordertime + `',`;
        }
        allTimeOld = allTimeOld.substring(0, allTimeOld.length - 1);
      } else {
        allTimeOld = `''`;
      }

      datasend.allTimeOld = allTimeOld;

      let x = {};

      x = await homc.checkmed(datasend);

      let b = x.recordset;

      if (b.length) {
        let datecurrent = moment().format("YYYY-MM-DD HH:mm:ss");
        for (let data of b) {
          if (data.QRCode) {
            try {
              const img = await jimp.read(data.QRCode);
              const qr = new qrCode();
              const value = await new Promise((resolve, reject) => {
                qr.callback = (err, v) =>
                  err != null ? reject(err) : resolve(v);
                qr.decode(img.bitmap);
              });

              data.QRCode = value.result;
            } catch (error) {
              data.QRCode = "";
            }
          }
          data.lastmodified = data.lastmodified
            ? data.lastmodified
                .toISOString()
                .replace(/T/, " ")
                .replace(/\..+/, "")
            : "";
          data.ordercreatedate = data.ordercreatedate
            ? data.ordercreatedate
                .toISOString()
                .replace(/T/, " ")
                .replace(/\..+/, "")
            : data.lastmodified;
          data.freetext1 = data.freetext1
            ? data.freetext1.replace("'", "''")
            : "";
          data.freetext2 = data.freetext2
            ? data.freetext2.replace("'", "''")
            : "";
          data.itemidentify = data.itemidentify
            ? data.itemidentify.replace("'", "''")
            : "";
          data.freetext1_eng = data.freetext1_eng
            ? data.freetext1_eng.replace("'", "''")
            : "";
          data.lamed_eng = data.lamed_eng
            ? data.lamed_eng.replace("'", "''")
            : "";
          data.drugName = data.drugName ? data.drugName.replace("'", "''") : "";
          let comma = Object.keys(data)
            .map(function (k) {
              return data[k];
            })
            .join("','");

          comma = `'${comma}'`;

          await center102.insertDrugcheck({
            comma: comma,
            qty: data.qty,
            count: b.length,
            date: datecurrent,
            cmp_id: dataPatient.id,
          });
        }
      }
      let datadrugpatient = await center102.selectcheckmed(dataPatient.id);
      for (let data of datadrugpatient) {
        data.ordercreatedate = data.ordercreatedate
          ? moment(data.ordercreatedate).format("YYYY-MM-DD HH:mm:ss")
          : "";
        data.lastmodified = data.lastmodified
          ? moment(data.lastmodified).format("YYYY-MM-DD HH:mm:ss")
          : "";
      }
      let drugjoin = Array.prototype.map
        .call(datadrugpatient, (s) => s.drugCode.trim())
        .join("','");
      // let imgDrug = await pmpf.drugImage(drugjoin);
      datadrugpatient.map((item) => {
        if (item.pathImage) {
          item.pathImage = item.pathImage.split(",");
          item.typeNum = item.typeNum.split(",");
          return item;
        }
      });

      // datadrugpatient = datadrugpatient.map((emp) => ({
      //   ...emp,
      //   ...(imgDrug.find(
      //     (item) => item.drugCode.trim() === emp.drugCode.trim()
      //   ) ?? {
      //     pathImage: null,
      //     typeNum: null,
      //   }),
      // }));
      let patientDrug = await pmpf.drugSEPack(drugjoin);
      res.send({ datadrugpatient, patientDrug });

      if (datadrugpatient.length) {
        let checkTime = datadrugpatient.every((item) => item.checkqty === 0);
        if (checkTime && !dataPatient.checkComplete) {
          let data = {
            status: 1,
            patient: dataPatient.id,
          };
          await center102.updatePatient(data);
        } else if (!checkTime && dataPatient.checkComplete) {
          let data = {
            status: 0,
            patient: dataPatient.id,
          };
          await center102.updatePatient(data);
        }
      }
    } else {
      res.send({ datadrugpatient: [], patientDrug: [] });
    }
  } else {
    res.send({ datadrugpatient: [], patientDrug: [] });
  }
};

exports.deletecheckmedController = async (req, res, next) => {
  let dataDelete = await center102.deletcheckmed(req.body);
  res.send({ dataDelete });
};

exports.updatecheckmedController = async (req, res, next) => {
  let update_med = await center102.updatecheckmed(req.body);
  if (update_med.affectedRows) {
    let insertloginsertlogcheckmed = await center102.insertlogcheckmed(
      req.body
    );
    if (insertloginsertlogcheckmed.affectedRows) {
      let datadrugpatient = await center102.selectcheckmed(req.body.cmp_id);
      // let drugjoin = Array.prototype.map
      //   .call(datadrugpatient, (s) => s.drugCode.trim())
      //   .join("','");
      // let imgDrug = await pmpf.drugImage(drugjoin);
      datadrugpatient.map((item) => {
        if (item.pathImage) {
          item.pathImage = item.pathImage.split(",");
          item.typeNum = item.typeNum.split(",");
          return item;
        }
      });

      // datadrugpatient = datadrugpatient.map((emp) => ({
      //   ...emp,
      //   ...(imgDrug.find(
      //     (item) => item.drugCode.trim() === emp.drugCode.trim()
      //   ) ?? {
      //     pathImage: null,
      //     typeNum: null,
      //   }),
      // }));
      for (let data of datadrugpatient) {
        data.ordercreatedate = data.ordercreatedate
          ? moment(data.ordercreatedate).format("YYYY-MM-DD HH:mm:ss")
          : "";
        data.lastmodified = data.lastmodified
          ? moment(data.lastmodified).format("YYYY-MM-DD HH:mm:ss")
          : "";
      }
      res.send({ datadrugpatient });
      if (datadrugpatient.length) {
        let checkTime = datadrugpatient.every((item) => item.checkqty === 0);

        if (checkTime) {
          let send = {
            status: 1,
            patient: req.body.cmp_id,
          };
          await center102.updatePatient(send);
        }
      }
    } else {
      res.send({ datadrugpatient: [] });
    }
  } else {
    res.send({ datadrugpatient: [] });
  }
};

exports.reportcheckmedController = async (req, res, next) => {
  let datadrugcheck = [];
  if (req.body.choice == "1") {
    // let countcheck = await center102.getCountcheck(req.body);
    // let user = await center101.getUser();

    // if (countcheck.length) {
    //   datadrugcheck = countcheck.map((emp) => ({
    //     ...emp,
    //     ...user.find((item) => item.user.trim() === emp.userCheck.trim()),
    //   }));

    // }
    let get_mederror = await center102.get_mederror(req.body);
    if (get_mederror.length) {
      for (let data of get_mederror) {
        data.createDT = data.createDT
          ? moment(data.createDT).format("YYYY-MM-DD HH:mm:ss")
          : "";
      }
      datadrugcheck = get_mederror;
    }
    res.send({ datadrugcheck });
  } else {
    let data = await center102.getTimecheck(req.body);
    for (let i of data) {
      i.timestamp = i.timestamp
        ? moment(i.timestamp).format("YYYY-MM-DD HH:mm:ss")
        : "";
      i.checkComplete = i.checkComplete
        ? moment(i.checkComplete).format("YYYY-MM-DD HH:mm:ss")
        : "";
    }
    datadrugcheck = data;
    res.send({ datadrugcheck });
  }
};

exports.getCompilerController = async (req, res, next) => {
  let get_compiler = await center102.get_compiler(req.body);
  let user_list = await center101.getUser();
  let drug_list = await homc.getDrughomc();
  res.send({ get_compiler: get_compiler, user: user_list, drug: drug_list });
};

exports.mederrorController = async (req, res, next) => {
  let insertMederror = await center102.insert_mederror(req.body);
  let get_data = [];
  if (insertMederror.affectedRows) {
    get_data = await center102.get_mederror(req.body);
    res.send(get_data);
  } else {
    res.send(get_data);
  }
};

exports.positionerrorController = async (req, res, next) => {
  let data = req.body;
  data.createdDT = moment(data.createdDT).format("YYYY-MM-DD");
  let getCheck = await center102.dataCheckQ(data);
  let key = null;
  data.date = moment(data.createdDT).add(543, "year").format("YYYYMMDD");

  let dataKey = await homc.getMaker(data);

  if (dataKey.length) {
    let dataUser = await center101.getUser();
    key = dataUser.find(
      (val) => val.name.replace(" ", "") === dataKey[0].maker
    ) ?? { user: "", name: dataKey[0].name };
  }

  let datasend = {
    key: key ? key.user + " " + key.name : "",
    check: getCheck.length ? getCheck[0].userName : "",
  };

  res.send(datasend);
};
