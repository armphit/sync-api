const moment = require("moment");
// var db_mysql101center = require("../DB/db_center_101_mysql");
// var center101 = new db_mysql101center();
var db_mysql102 = require("../DB/db_center_102_mysql");
var center102 = new db_mysql102();

var db_Homc = require("../DB/db_Homc");
var homc = new db_Homc();
var jimp = require("jimp");
var qrCode = require("qrcode-reader");
var db_pmpf = require("../DB/db_pmpf_thailand_mnrh");
var pmpf = new db_pmpf();
var db_center104 = require("../DB/db_104_Center");
var center104 = new db_center104();
var db_mysql101center = require("../DB/db_center_101_mysql");
var center101 = new db_mysql101center();
var db_GD4Unit_101 = require("../DB/db_GD4Unit_101_sqlserver");
var GD4Unit_101 = new db_GD4Unit_101();
const net = require("net");

// const SERVER_HOST = "127.0.0.1"; // Receiver Server IP
// const SERVER_PORT = 5000; // Receiver Server Port

const client = new net.Socket();
// const db_gd4unit_101_mysql = require("../DB/db_gd4unit_101_mysql");
// var gd4unit_101_mysql = new db_gd4unit_101_mysql();
exports.checkpatientController = async (req, res, next) => {
  if (req.body) {
    let allTimeOld = "";
    let datasend = req.body;
    datasend.allTimeOld = `''`;
    if (datasend.site == "W8" || datasend.site == "W18") {
      let q = await center102.fill(datasend);
      datasend.queue = q[0] ? q[0].QN : datasend.site;
      // let checkhn = await gd4unit_101_mysql.getsiteQhn(dataPatient.hn);
      // if (checkhn.length) {
      //   if (q[0].QN != checkhn[0].queue) {
      //     datasend.queue = checkhn[0].queue;
      //   } else {
      //     datasend.queue = q[0] ? q[0].QN : datasend.site;
      //   }
      // } else {
      //   datasend.queue = q[0] ? q[0].QN : datasend.site;
      // }
    } else {
      datasend.queue = datasend.site;
    }
    let checkpatientdruglength = await homc.checkmed(datasend);
    let dataPatient = await center102.checkdelete(datasend);

    if (!dataPatient.length && checkpatientdruglength.recordset.length) {
      await center102.insertPatient(datasend);
      dataPatient = await center102.checkdelete(datasend);
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
              let qr = await center104.getQrcode(data.drugCode.trim());
              if (qr.length) {
                data.QRCode = qr[0].QrCode;
              } else {
                data.QRCode = "";
              }
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

      let datadrugpatient = await center102.selectcheckmed({
        id: dataPatient.id,
        site: datasend.site,
      });
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
      datadrugpatient.map((item) => {
        if (item.pathImage) {
          item.pathImage = item.pathImage.split(",");
          item.typeNum = item.typeNum.split(",");
          return item;
        }
      });
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

      datasend.PrescriptionNo =
        datadrugpatient[datadrugpatient.length - 1].prescriptionno;

      try {
        if (datasend.site == "W8") {
          // await center104.insertLED(datasend);
          // client.connect(SERVER_PORT, SERVER_PORT, () => {
          //   console.log(
          //     `Connected to Receiver Server at ${SERVER_HOST}:${SERVER_PORT}`
          //   );
          //   client.write(text);
          //   console.log(`Sent: ${text}`);
          // });
          // // Handle errors
          // client.on("error", (err) => {
          //   console.error(`Error: ${err.message}`);
          //   // setTimeout(() => {
          //   //   connectClient(text); // เชื่อมต่อใหม่
          //   // }, 5000);
          // });
        }
      } catch (e) {
        console.log("insertLED");
        console.log(datasend);
        console.error(e);
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
      // let datadrugpatient = await center102.selectcheckmed(req.body.cmp_id);
      let datadrugpatient = await center102.selectcheckmed({
        id: req.body.cmp_id,
        site: req.body.site,
      });
      datadrugpatient.map((item) => {
        if (item.pathImage) {
          item.pathImage = item.pathImage.split(",");
          item.typeNum = item.typeNum.split(",");
          return item;
        }
      });

      for (let data of datadrugpatient) {
        data.ordercreatedate = data.ordercreatedate
          ? moment(data.ordercreatedate).format("YYYY-MM-DD HH:mm:ss")
          : "";
        data.lastmodified = data.lastmodified
          ? moment(data.lastmodified).format("YYYY-MM-DD HH:mm:ss")
          : "";
      }
      if (req.body.currentqty == 0) {
        try {
          if (datadrugpatient.length) {
            if (datadrugpatient[0].departmentcode.trim() == "W8") {
              // await center104.update_led(req.body);
            }
          }
        } catch (e) {
          console.log("update_led");
          console.log(datasend);
          console.error(e);
        }
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
    let getname = [];
    if (get_mederror.length) {
      for (let data of get_mederror) {
        data.createDT = data.createDT
          ? moment(data.createDT).format("YYYY-MM-DD HH:mm:ss")
          : "";
        data.hnDT = data.hnDT
          ? moment(data.hnDT).format("YYYY-MM-DD HH:mm:ss")
          : "";
        if (!data.med_wrong_name) {
          getname = await homc.getDrugstar(data.med_wrong);
          if (getname.length) {
            data.med_wrong_name = getname[0].name;
          }
        }
        if (!data.med_good_name) {
          if (data.med_good == data.med_wrong) {
            if (getname.length) {
              data.med_good_name = getname[0].name;
            } else {
              getname = await homc.getDrugstar(data.med_good);

              if (getname.length) {
                data.med_good_name = getname[0].name;
              }
            }
          } else {
            getname = await homc.getDrugstar(data.med_good);

            if (getname.length) {
              data.med_good_name = getname[0].name;
            }
          }
        }
      }

      datadrugcheck = get_mederror;
    }
    res.send({ datadrugcheck });
  } else {
    res.send({ datadrugcheck: [] });
    //   let data101 = await gd4unit_101_mysql.getDrug101(req.body);
    //   let data = await center102.getQ(req.body);

    //   let result = data.map((val) => {
    //     return {
    //       ...val,
    //       ...data101.find((dt) => dt.queue == val.QN && dt.date == val.date),
    //     };
    //   });
    //   result = result.filter((val) => val.queue);

    //   datadrugcheck = result
    //     .map((val) => {
    //       return {
    //         ...val,
    //         time: get_time_difference(val.timestamp, val.checkComplete),
    //       };
    //     })
    //     .sort((a, b) => {
    //       let da = new Date(a.timestamp),
    //         db = new Date(b.timestamp);
    //       return db - da;
    //     });
    //   arr = datadrugcheck
    //     .map(({ time }) => time)
    //     .filter((t) => t !== null)
    //     .filter((i) => !i.includes("-"));

    //   let average = null;
    //   if (arr.length) {
    //     average = arr.reduce(function (a, b) {
    //       return a + +new Date("1970T" + b + "Z");
    //     }, 0);
    //     average = new Date(average / arr.length + 500).toJSON().slice(11, 19);
    //   }

    //   res.send({ datadrugcheck, average });
  }
};
exports.getCompilerController = async (req, res, next) => {
  let get_compiler = await center102.get_compiler(req.body);
  let user_list = await center101.getUser();
  let drug_list = await homc.getDrughomc();
  res.send({ get_compiler: get_compiler, user: user_list, drug: drug_list });
};

exports.mederrorController = async (req, res, next) => {
  console.log(req.body);

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
    // let dataUser = await center101.getUser();
    let dataUser = [];
    key = dataUser.find(
      (val) => val.name.replace(" ", "").trim() === dataKey[0].maker.trim()
    ) ?? { user: "", name: dataKey[0].name };
  }

  let datasend = {
    key: key ? key.user + " " + key.name : "",
    check: getCheck.length ? getCheck[0].userName : "",
    dispend: getCheck.length ? getCheck[0].userDispen : "",
    pe: dataKey.length ? dataKey[0].pe : "",
  };

  res.send(datasend);
};

exports.manageerrorController = async (req, res, next) => {
  let data = req.body;
  let manage_error = await center102.manage_mederror(data);
  manage_error.affectedRows ? res.send([1]) : [];
};
exports.timedispendController = async (req, res, next) => {
  let data = req.body;
  let gettime = await center102.getTimecheck(data);
  let averageTime = null;
  if (gettime.length) {
    try {
      if (data.site == "W18") {
        let starttimew18 = await GD4Unit_101.dataPatient(data);
        gettime = gettime
          .map((val) => {
            return (
              {
                ...val,
                ...starttimew18.find(
                  (val2) =>
                    val.hn == val2.hn &&
                    val.queue == val2.queue &&
                    val.dateindex == val2.dateindex
                ),
              } ?? {
                patientname: "",
                starttime: "",
              }
            );
          })
          .filter(
            (val3) =>
              val3.patientname &&
              new Date(val3.starttime) < new Date(val3.endtime)
          )
          .sort((a, b) => new Date(a.starttime) - new Date(b.starttime))
          .map((val4) => {
            return {
              ...val4,
              time: getTimeDiff(val4.starttime, val4.endtime),
            };
          });
      }

      const times = gettime.map((v) => v.time);

      // Helper function to convert "HH:MM:SS" to total seconds
      const timeToSeconds = (time) =>
        time.split(":").reduce((acc, time) => 60 * acc + +time, 0);

      // Helper function to convert total seconds to "HH:MM:SS"
      const secondsToTime = (seconds) =>
        new Date(seconds * 1000).toISOString().substr(11, 8);

      // Convert all times to seconds, sum them, and calculate the average
      const averageSeconds =
        times.map(timeToSeconds).reduce((a, b) => a + b) / times.length;

      // Convert the average time back to "HH:MM:SS"
      averageTime = secondsToTime(averageSeconds);
    } catch (error) {
      console.log(error);
    }
  }

  res.send({ gettime, averageTime: averageTime });
};

function get_time_difference(date1, date2) {
  if (date1 && date2) {
    date1 = new Date(date1);
    date2 = new Date(date2);
    var diff = date2.getTime() - date1.getTime();

    var msec = diff;
    var hh = Math.floor(msec / 1000 / 60 / 60);
    msec -= hh * 1000 * 60 * 60;
    var mm = Math.floor(msec / 1000 / 60);
    msec -= mm * 1000 * 60;
    var ss = Math.floor(msec / 1000);
    msec -= ss * 1000;

    return (
      (hh < 10 ? "0" + hh : hh) +
      ":" +
      (mm < 10 ? "0" + mm : mm) +
      ":" +
      (ss < 10 ? "0" + ss : ss)
    );
  } else {
    return null;
  }
}

function getTimeDiff(start, end) {
  const date1 = new Date(start);
  const date2 = new Date(end);

  let diffMs = Math.abs(date2 - date1); // Difference in milliseconds

  let hours = Math.floor(diffMs / 3600000);
  let minutes = Math.floor((diffMs % 3600000) / 60000);
  let seconds = Math.floor((diffMs % 60000) / 1000);

  // Format as HH:MM:SS
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}`;
}
