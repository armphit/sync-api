const js2xmlparser = require("js2xmlparser");
const soap = require("soap");
const { transform } = require("camaro");
const moment = require("moment");
var db_Homc = require("../DB/db_Homc");
var homc = new db_Homc();
var db_mysql102 = require("../DB/db_center_102_mysql");
var center102 = new db_mysql102();
var db_pmpf = require("../DB/db_pmpf_thailand_mnrh");
var pmpf = new db_pmpf();
var db_Xmed = require("../DB/db_Xed_102_sqlserver");
var Xmed = new db_Xmed();
var db_GD4Unit_101 = require("../DB/db_GD4Unit_101_sqlserver");
var GD4Unit_101 = new db_GD4Unit_101();
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
      let datadrug = await pmpf.druginsert(req.body.drug.code);
      datadrug[0].drugName = datadrug[0].HISDrugName;
      let keys = Object.keys(datadrug[0]);
      let value = Object.values(datadrug[0]);
      value[36] = moment(value[36]).format("YYYY-MM-DD HH:mm:ss");
      value[37] = moment(value[37]).format("YYYY-MM-DD HH:mm:ss");
      let arrSql = [];
      let valSql = [];
      for (let index = 0; index < keys.length; index++) {
        arrSql[index] = `${keys[index]} = N'${
          value[index] == null ? "" : value[index]
        }'`;
        valSql[index] = `N'${value[index] == null ? "" : value[index]}'`;
      }

      let send = {
        update: arrSql.join(","),
        insert: valSql.join(","),
        code: req.body.drug.code,
      };

      await Xmed.updateDicdrug(send);
      await GD4Unit_101.updatePack101(req.body);

      res.status(200).json({
        // Authorization: Bearer,
        status: "success",
      });
    }
  }
};

exports.prinstickerDataController = async (req, res, next) => {
  if (req.body) {
    let datasite = await center102.site_maharat(req.body);

    req.body.date = moment(req.body.date).add(543, "year").format("YYYYMMDD");
    let getintruction = await homc.intruction(req.body);

    res.send({ datasite: datasite, intruction: getintruction });
  }
};
