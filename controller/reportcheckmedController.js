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
      get_mederror = get_mederror.map((val) => {
        {
        }
      }, ...val);
    }
  }
  // for (let data of get_mederror) {
  //   data.createDT = data.createDT
  //     ? moment(data.createDT).format("YYYY-MM-DD HH:mm:ss")
  //     : "";
  //   data.hnDT = data.hnDT
  //     ? moment(data.hnDT).format("YYYY-MM-DD HH:mm:ss")
  //     : "";
  //   data.createdDT = data.createdDT
  //     ? moment(data.createdDT).format("YYYY-MM-DD HH:mm:ss")
  //     : "";
  //   for (let data of get_mederror) {
  //     data.createDT = data.createDT
  //       ? moment(data.createDT).format("YYYY-MM-DD HH:mm:ss")
  //       : "";
  //     data.hnDT = data.hnDT
  //       ? moment(data.hnDT).format("YYYY-MM-DD HH:mm:ss")
  //       : "";
  //     data.createdDT = data.createdDT
  //       ? moment(data.createdDT).format("YYYY-MM-DD HH:mm:ss")
  //       : "";
  //     if (!data.med_wrong_name) {
  //       getname = await homc.getDrugstar(data.med_wrong);
  //       if (getname.length) {
  //         data.med_wrong_name = getname[0].name;
  //       }
  //     }
  //     // if (!data.med_good_name) {
  //     //   if (data.med_good == data.med_wrong) {
  //     //     if (getname.length) {
  //     //       data.med_good_name = getname[0].name;
  //     //     } else {
  //     //       getname = await homc.getDrugstar(data.med_good);
  //     //       if (getname.length) {
  //     //         data.med_good_name = getname[0].name;
  //     //       }
  //     //     }
  //     //   } else {
  //     //     getname = await homc.getDrugstar(data.med_good);
  //     //     if (getname.length) {
  //     //       data.med_good_name = getname[0].name;
  //     //     }
  //     //   }
  //     // }
  //   }
  // }
  datadrugcheck = get_mederror;
};
