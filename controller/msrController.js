var db_pmpf = require("../DB/db_pmpf_thailand_mnrh");
var pmpf = new db_pmpf();

var db_GD4Unit_101 = require("../DB/db_GD4Unit_101_sqlserver");
var GD4Unit_101 = new db_GD4Unit_101();

var db_mysql102 = require("../DB/db_center_102_mysql");
var center102 = new db_mysql102();

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
  try {
    let getdata = await center102.getQGroupby(req.body);
    // const ids = getdata.map((val) => val.checker_id);
    // let group_id = getdata.filter(
    //   (val, index) => !ids.includes(val.checker_id, index + 1)
    // );
    // let getdata2 = await gd4unit101.getDrugQ(req.body);

    // let getdata3 = getdata.map((val) => {
    //   return {
    //     ...val,
    //     ...(getdata2.find((item) => item.queue === val.QN) ?? {
    //       queue: "",
    //       item: 0,
    //     }),
    //   };
    // });
    // let getdata4 = [];
    // getdata3.reduce(function (res, value) {
    //   if (!res[value.checker_id]) {
    //     res[value.checker_id] = { checker_id: value.checker_id, item: 0 };
    //     getdata4.push(res[value.checker_id]);
    //   }
    //   res[value.checker_id].item += value.item;
    //   return res;
    // }, {});

    // let result = group_id.map((val) => {
    //   return {
    //     ...val,
    //     ...(getdata4.find((item) => item.checker_id === val.checker_id) ?? {
    //       item: 0,
    //     }),
    //   };
    // });
    res.send(getdata);
  } catch (error) {
    console.log(error);
    res.send([]);
  }
};

exports.dispendController = async (req, res, next) => {
  let getdata = await GD4Unit_101.getDispend(req.body);
  res.send(getdata);
};
exports.scanallergyController = async (req, res, next) => {};
