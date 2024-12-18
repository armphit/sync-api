const { center102 } = require("./checkmedController");

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
    let data101 = await gd4unit_101_mysql.getDrug101(req.body);
    let data = await center102.getQ(req.body);

    let result = data.map((val) => {
      return {
        ...val,
        ...data101.find((dt) => dt.queue == val.QN && dt.date == val.date),
      };
    });
    result = result.filter((val) => val.queue);

    datadrugcheck = result
      .map((val) => {
        return {
          ...val,
          time: get_time_difference(val.timestamp, val.checkComplete),
        };
      })
      .sort((a, b) => {
        let da = new Date(a.timestamp),
          db = new Date(b.timestamp);
        return db - da;
      });
    arr = datadrugcheck
      .map(({ time }) => time)
      .filter((t) => t !== null)
      .filter((i) => !i.includes("-"));

    let average = null;
    if (arr.length) {
      average = arr.reduce(function (a, b) {
        return a + +new Date("1970T" + b + "Z");
      }, 0);
      average = new Date(average / arr.length + 500).toJSON().slice(11, 19);
    }

    res.send({ datadrugcheck, average });
  }
};
