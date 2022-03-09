const { Console } = require("console");

module.exports = function () {
  const sql = require("mssql");
  //จริง
  this.config = {
    user: "robot",
    password: "Robot@MNRH2022",
    server: "192.168.44.1",
    database: "MHR",
    requestTimeout: 180000, // for timeout setting
    connectionTimeout: 180000, // for timeout setting
    options: {
      encrypt: false, // need to stop ssl checking in case of local db
      enableArithAbort: true,
    },
  };

  this.connection = new sql.connect(this.config, function (err) {
    if (err) console.log("ERROR: " + err);
  });

  const poolPromise = new sql.ConnectionPool(this.config)
    .connect()
    .then((pool) => {
      console.log("Connected to Homc");
      return pool;
    })
    .catch((err) =>
      console.log("Database Connection Failed! Bad Config: ", err)
    );

  this.fill = async function fill(CMD, DATA) {
    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(CMD);
      resolve(result);
    });
  };

  this.dataDrug = async function fill(CMD, DATA) {
    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(CMD);
      resolve(result);
    });
  };

  module.exports = {
    sql,
    poolPromise,
  };
};
