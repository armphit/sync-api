const moment = require("moment");
var db_mysql101center = require("../DB/db_center_101_mysql");
var center101 = new db_mysql101center();
var db_Homc = require("../DB/db_Homc");
var homc = new db_Homc();
var jimp = require("jimp");
var qrCode = require("qrcode-reader");
var db_pmpf = require("../DB/db_pmpf_thailand_mnrh");
var pmpf = new db_pmpf();

exports.checkpatientController = async (req, res, next) => {
  if (req.body) {
    let dataPatient = await center101.checkdelete(req.body.hn);
    if (!dataPatient.length) {
      await center101.insertPatient(req.body.hn);
      dataPatient = await center101.getpatient(req.body.hn);
    }

    if (dataPatient.length) {
      dataPatient = dataPatient[0];
      let allTimeOld = "";
      let time = await center101.checkPatientcheckmed(dataPatient.id);
      if (time.length != 0) {
        for (let d of time) {
          allTimeOld = allTimeOld + `'` + d.ordertime + `',`;
        }
        allTimeOld = allTimeOld.substring(0, allTimeOld.length - 1);
      } else {
        allTimeOld = `''`;
      }

      let datasend = req.body;
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
            : "";
          data.freetext1 = data.freetext1
            ? data.freetext1.replace("'", " ")
            : "";
          data.freetext2 = data.freetext2
            ? data.freetext2.replace("'", " ")
            : "";
          data.itemidentify = data.itemidentify
            ? data.itemidentify.replace("'", " ")
            : "";
          let comma = Object.keys(data)
            .map(function (k) {
              return data[k];
            })
            .join("','");

          comma = `'${comma}'`;
          await center101.insertDrugcheck({
            comma: comma,
            qty: data.qty,
            count: b.length,
            date: datecurrent,
            cmp_id: dataPatient.id,
          });
        }
      }
      let datadrugpatient = await center101.selectcheckmed(dataPatient.id);
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
      let patientDrug = await pmpf.drugSEPack(drugjoin);
      res.send({ datadrugpatient, patientDrug });
    } else {
      res.send({});
    }
  } else {
    res.send({});
  }
};

exports.deletecheckmedController = async (req, res, next) => {
  let dataDelete = await center101.deletcheckmed(req.body);
  res.send({ dataDelete });
};

exports.updatecheckmedController = async (req, res, next) => {
  let update_med = await center101.updatecheckmed(req.body);
  if (update_med.affectedRows) {
    let insertloginsertlogcheckmed = await center101.insertlogcheckmed(
      req.body
    );
    if (insertloginsertlogcheckmed.affectedRows) {
      let datadrugpatient = await center101.selectcheckmed(req.body.cmp_id);
      for (let data of datadrugpatient) {
        data.ordercreatedate = data.ordercreatedate
          ? moment(data.ordercreatedate).format("YYYY-MM-DD HH:mm:ss")
          : "";
        data.lastmodified = data.lastmodified
          ? moment(data.lastmodified).format("YYYY-MM-DD HH:mm:ss")
          : "";
      }
      res.send({ datadrugpatient });
    } else {
      res.send({});
    }
  } else {
    res.send({});
  }
};
