const js2xmlparser = require("js2xmlparser");
const soap = require("soap");
const { transform } = require("camaro");
const moment = require("moment");
var db_mysql101 = require("../DB/db_gd4unit_101_mysql");
var gd4unit101 = new db_mysql101();
var db_Homc = require("../DB/db_Homc");
var homc = new db_Homc();
var jimp = require("jimp");
var qrCode = require("qrcode-reader");
var db_mysql102 = require("../DB/db_center_102_mysql");
var center102 = new db_mysql102();
exports.soapDIHController = async (req, res, next) => {
  if (req.body) {
    let xmlDrug = { xml: js2xmlparser.parse("drugDict", req.body) };
    var url =
      "http://192.168.185.102:8788/axis2/services/DIHPMPFWebservice?wsdl";
    var client = await soap.createClientAsync(url);
    var result = await client.drugDictAsync(xmlDrug);
    var val = await transform(result[0].return, { data: "//code" });
    if (val.data !== "0") {
      res.send("error");
    } else {
      res.status(200).json({
        // Authorization: Bearer,
        status: "success",
      });
    }
  }
};

exports.checkpatientController = async (req, res, next) => {
  if (req.body) {
    let allTimeOld = "";

    let time = await gd4unit101.checkPatientcheckmed(req.body.hn);
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
            console.log(error.message);
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
        let comma = Object.keys(data)
          .map(function (k) {
            return data[k];
          })
          .join("','");

        comma = `'${comma}'`;

        await gd4unit101.insertDrugcheck({
          comma: comma,
          qty: data.qty,
          count: b.length,
        });
      }
    }

    let datadrugpatient = await gd4unit101.selectcheckmed(req.body.hn);
    for (let data of datadrugpatient) {
      data.ordercreatedate = data.ordercreatedate
        ? moment(data.ordercreatedate).format("YYYY-MM-DD HH:mm:ss")
        : "";
      data.lastmodified = data.lastmodified
        ? moment(data.lastmodified).format("YYYY-MM-DD HH:mm:ss")
        : "";
    }
    res.send({ datadrugpatient });
  }
};

exports.prinstickerDataController = async (req, res, next) => {
  if (req.body) {
    let datasite = await center102.site_maharat(req.body);
    let getintruction = await homc.intruction(req.body);

    res.send({ datasite: datasite, intruction: getintruction });
  }
};
