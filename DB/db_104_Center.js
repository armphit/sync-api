const { Console } = require("console");

module.exports = function () {
  const sql = require("mssql");

  this.config = {
    user: "Robot",
    password: "p@ssw0rd",
    server: "192.168.185.104",
    database: "center",
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
      console.log("Connected to 104Center");
      return pool;
    })
    .catch((err) =>
      console.log("Database Connection Failed! Bad Config: ", err)
    );

  this.hn_moph_patient = async function fill(val, DATA) {
    var sqlgetdrug =
      `SELECT
      drugcode,
      drugname
  FROM
      moph_patient,
      moph_drugs
  WHERE
      moph_patient.personId = moph_drugs.cid
      AND moph_drugs.hospcode <> 10666
  AND moph_patient.hn = '` +
      val +
      `'`;
    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sqlgetdrug);
      resolve(result.recordset);
    });
  };

  module.exports = {
    sql,
    poolPromise,
  };
};
