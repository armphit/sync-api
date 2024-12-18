var db_mysql102 = require("../DB/db_center_102_mysql");
var center102 = new db_mysql102();

const axios = require("axios");
const https = require("https");
const fs = require("fs");
var file = fs.readFileSync(
  "D:\\GitHub\\MHRdashboard\\node\\model\\token.txt",
  "utf-8"
);
exports.testController = async (req, res, next) => {
  // var db_mysql102 = require("../DB/db_center_102_mysql");
  // var center102 = new db_mysql102();
  // const fs = require("node:fs");
  // let data = await center102.getDrugIPD();
  // var js2xmlparser = require("js2xmlparser");
  // data = data.map((val) => {
  //   let a = {
  //     ...val,
  //     MedItemDose: {
  //       DoseList: val.DoseList,
  //       TakeDays: val.TakeDays,
  //       TakeDt: val.TakeDt,
  //     },
  //   };
  //   delete a.DoseList;
  //   delete a.TakeDays;
  //   delete a.TakeDt;
  //   const date = new Date();

  //   const year = date.getUTCFullYear();
  //   const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  //   const day = String(date.getUTCDate()).padStart(2, "0");

  //   const hour = String(date.getUTCHours()).padStart(2, "0");
  //   const minute = String(date.getUTCMinutes()).padStart(2, "0");
  //   const second = String(date.getUTCSeconds()).padStart(2, "0");

  //   const strDate = `${year}${month}${day}${hour}${minute}${second}`;

  //   var obj = {
  //     HsptCd: "1",
  //     DptmtCd: "MED",
  //     WardCd: "01",
  //     DataClsf: "N",
  //     InOutClsf: "I",
  //     MdctNum: parseInt(Math.random().toFixed(8).replace("0.", "")),
  //     OrderDt: strDate.substring(0, 8),
  //     OrderDtm: strDate,
  //     OrderNum: `TEST${parseInt(Math.random().toFixed(6).replace("0.", ""))}`,
  //     RoomNum: "0",
  //     BedNum: "อญ 3/อญ3-1",
  //     PtntNum: "000000000",
  //     AllergyNm: parseInt(Math.random().toFixed(9).replace("0.", "")),
  //     Note: "",
  //     PtntNm: "TEST",
  //     Sex: "F",
  //     DoctorNm: "104677",
  //     Birthday: "19420101",
  //     MedItem: a,
  //   };

  //   fs.writeFile(
  //     `order/${val.MedCd} ${obj.OrderNum}.xml`,
  //     js2xmlparser.parse("OrderInfo", obj),
  //     (err) => {
  //       if (err) {
  //         console.error(err);
  //       } else {
  //         // file written successfully
  //       }
  //     }
  //   );
  //   return a;
  // });
  // let data = await center102.getDrugIPD();
  // res.send(data);

  const cid = "3309900080159";
  const url = `https://smarthealth.service.moph.go.th/phps/api/drugallergy/v1/find_by_cid?cid=${Number(
    cid
  )}`;
  const instance = axios.create({
    httpsAgent: new https.Agent({
      rejectUnauthorized: false,
    }),
  });
  instance.defaults.headers.get["jwt-token"] = file;
  let dataAllegy = await instance.get(url);
  console.log(dataAllegy.data);
  res.send(dataAllegy.data.data);
};
exports.testController2 = async (req, res, next) => {

  let getData = await center102.gettimedis();
// let dataAllegy = await instance.post(url, data);
console.log(getData);
  res.send(getData);

};

async function getToken() {
  const data = {
    username: "m2000ka@gmail.com",
    password: "123456",
  };
  const url = `https://smarthealth.service.moph.go.th/phps/public/api/v3/gettoken`;
  const instance = axios.create({
    // httpsAgent: new https.Agent({
    //   rejectUnauthorized: false,
    //   keepAlive: true,
    // }),
    // baseURL: url,
    // timeout: 1000,
  });

  let dataAllegy = await instance.post(url, data);
  // if (dataAllegy.data.jwt_token) {

  //   await fs.writeFile(
  //     "D:\\Projacts\\NodeJS\\MHRdashboard\\node\\model\\token.txt",
  //     dataAllegy.data.jwt_token,
  //     (err) => {
  //       token = dataAllegy.data.jwt_token;
  //       if (err) throw err;
  //       console.log("----------------------------------");
  //       console.log(
  //         `GET TOKEN SUCCESS : ${new Date().toLocaleTimeString("en-US", {
  //           hour12: false,
  //           hour: "numeric",
  //           minute: "numeric",
  //           second: "numeric",
  //         })}`
  //       );
  //       console.log("----------------------------------");
  //     }
  //   );
  // }
}
// function reData() {
//   token = { data: 12345678 };
//   console.log();
// }
