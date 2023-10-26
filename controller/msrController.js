var db_pmpf = require("../DB/db_pmpf_thailand_mnrh");
var pmpf = new db_pmpf();

var db_GD4Unit_101 = require("../DB/db_GD4Unit_101_sqlserver");
var GD4Unit_101 = new db_GD4Unit_101();

exports.getDispenseDaterangeController = async (req, res, next) => {
  let getDispense = await pmpf.getDispense(req.body);
  res.send(getDispense);
};

exports.doorreportController = async (req, res, next) => {
  let getDoorreport = null;
  if (req.body.choice === 1) {
    getDoorreport = await GD4Unit_101.doorReport(req.body);
    for (let data of getDoorreport.recordset) {
      console.log(typeof data.datetime);
    }
    // if (getDoorreport.recordset.length) {
    //   for (let data of getDoorreport.recordset) {
    //     let time = JSON.stringify(data.datetime)
    //       .toString()
    //       .replaceAll('"', "")
    //       .split("T");
    //     data.datetime = data.datetime
    //       ? time[0] +
    //         " " +
    //         time[1].split("Z")[0].substring(0, time[1].length - 5)
    //       : "";
    //   }
    // }
  } else {
    getDoorreport = await GD4Unit_101.freqdoorReport(req.body);
  }
  res.send(getDoorreport);
};

exports.onuspharController = async (req, res, next) => {
  let getdata = await pmpf.onusphar(req.body);
  res.send(getdata);
};

exports.dispendController = async (req, res, next) => {
  let getdata = await GD4Unit_101.getDispend(req.body);
  res.send(getdata);
};
