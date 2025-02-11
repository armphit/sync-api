const { Console } = require("console");

module.exports = function () {
  const sql = require("mssql");

  this.config = {
    user: "sa",
    password: "123456",
    server: "192.168.180.161",
    requestTimeout: 180000, // for timeout setting
    connectionTimeout: 180000, // for timeout setting
    options: {
      encrypt: false, // need to stop ssl checking in case of local db
      enableArithAbort: true,
    },
  };

  // this.connection = new sql.connect(this.config, function (err) {
  //   if (err) console.log("ERROR: " + err);
  // });

  const poolPromise = new sql.ConnectionPool(this.config)
    .connect()
    .then((pool) => {
      console.log("Connected to Yurim");
      return pool;
    })
    .catch((err) =>
      console.log("Database Connection Failed! Bad Config: ", err)
    );

  this.dataDrug = async function fill(val, DATA) {
    var sqlgetdrug = `SELECT
	p.Code orderitemcode,
	CONCAT ('YU-', m.Code) location
FROM
	CLFBJ20241127.dbo.Products p
INNER JOIN CLFBJ20241127.dbo.Spaces s ON s.ProductId = p.Id
LEFT JOIN CLFBJ20241127.dbo.MedBoxs m ON m.ProductId = p.Id`;
    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sqlgetdrug);
      resolve(result.recordset);
    });
  };
};
