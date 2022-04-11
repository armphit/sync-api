module.exports = function () {
  const sql = require("mssql");

  this.config = {
    user: "Robot",
    password: "p@ssw0rd",
    server: "192.168.185.102",
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
      console.log("Connected to XMed");
      return pool;
    })
    .catch((err) =>
      console.log("Database Connection Failed! Bad Config: ", err)
    );

  this.dataDrugSize = async function fill(val, DATA) {
    var sqlgetdrug =
      `SELECT
      drugCode,
      FLOOR(
        (Length / 100) * (Width / 100) * (Height / 100)
      ) AS Item
    FROM
      (
        SELECT
          MAX (dd.drugID) drugID,
          MAX (dd.drugCode) drugCode,
          MAX (dd.drugName) drugName,
          MAX (xm.Code) Code,
          MAX (xm.Length) Length,
          MAX (xm.Width) Width,
          MAX (xm.Height) Height
        FROM
          XMed.dbo.Spaces sp
        LEFT JOIN XMed.dbo.Products xm ON sp.ProductId = xm.Id
        LEFT JOIN dictdrug_102mySQL dd ON dd.drugID COLLATE SQL_Latin1_General_CP1_CI_AS = xm.Code COLLATE SQL_Latin1_General_CP1_CI_AS
        WHERE
          xm.Length IS NOT NULL
        AND sp.ProductId IS NOT NULL
        GROUP BY
          sp.ProductId
      ) AS val
      WHERE drugCode  = N'` +
      val +
      `'`;
    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      try {
        const request = await pool.request();
        const result = await request.query(sqlgetdrug);
        resolve(result.recordset);
      } catch (error) {
        // await pool.close();
        console.log("XMed:" + error);
      }
    });
  };

  this.dataDrugSizePre = async function fill(val, DATA) {
    var sqlgetdrug =
      `SELECT
      drugCode,
      FLOOR(
        (Length / 100) * (Width / 100) * (Height / 100)
      ) AS Item
    FROM
      (
        SELECT
          MAX (dd.drugID) drugID,
          MAX (dd.drugCode) drugCode,
          MAX (dd.drugName) drugName,
          MAX (xm.Code) Code,
          MAX (xm.Length) Length,
          MAX (xm.Width) Width,
          MAX (xm.Height) Height
        FROM
          XMed.dbo.Spaces sp
        LEFT JOIN XMed.dbo.Products xm ON sp.ProductId = xm.Id
        LEFT JOIN dictdrug_102mySQL dd ON dd.drugID COLLATE SQL_Latin1_General_CP1_CI_AS = xm.Code COLLATE SQL_Latin1_General_CP1_CI_AS
        WHERE
          xm.Length IS NOT NULL
        AND sp.ProductId IS NOT NULL
        GROUP BY
          sp.ProductId
      ) AS val
      WHERE drugCode  LIKE '` +
      val +
      `%'`;
    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      try {
        const request = await pool.request();
        const result = await request.query(sqlgetdrug);
        resolve(result.recordset);
      } catch (error) {
        // await pool.close();
        console.log("XMed:" + error);
      }
    });
  };

  module.exports = {
    sql,
    poolPromise,
  };
};
