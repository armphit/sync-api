const { Console } = require("console");

module.exports = function () {
  const sql = require("mssql");

  this.config = {
    user: "Robot",
    password: "p@ssw0rd",
    server: "192.168.185.101",
    database: "GD4Unit",
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
      console.log("Connected to GD4Unit");
      return pool;
    })
    .catch((err) =>
      console.log("Database Connection Failed! Bad Config: ", err)
    );

  this.dataDrug = async function fill(val, DATA) {
    var sqlgetdrug =
      `SELECT orderitemcode,Strength,firmname,pack,dosageunitcode
      FROM ms_drug
      WHERE orderitemcode = '` +
      val +
      `'`;
    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sqlgetdrug);
      resolve(result);
    });
  };

  this.updatePack101 = async function fill(val, DATA) {
    var sqlgetdrug =
      `UPDATE ms_drug
      SET ms_drug.pack ='` +
      val.drug.packageRatio +
      `',
      readdatetime = CURRENT_TIMESTAMP
      WHERE ms_drug.orderitemcode = '` +
      val.drug.code +
      `'`;
    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sqlgetdrug);
      resolve(result);
    });
  };

  this.doorReport = async function fill(val, DATA) {
    let val_type = val.type == "in" ? "MIN" : "MAX";
    var sqlgetdrug =
      `SELECT
      MAX (u.Badgenumber) AS USERID,
      CASE
    WHEN MAX (u.lastname) <> '' THEN
      MAX (u.Name) + ' ' + MAX (u.lastname)
    ELSE
      MAX (u.Name)
    END AS Name,
     MAX (d.DEPTNAME) DEPTNAME,
     MAX (aml.device_name) deviceName,
     CONVERT(varchar, ` +
      val_type +
      `(aml. TIME), 120) datetime
    FROM
      ZKAccess.dbo.acc_monitor_log aml
    LEFT JOIN ZKAccess.dbo.USERINFO u ON u.Badgenumber = aml.pin
    LEFT JOIN ZKAccess.dbo.DEPARTMENTS d ON d.DEPTID = u.DEFAULTDEPTID
    WHERE
      CONVERT (DATE, aml. TIME) BETWEEN '` +
      val.date1 +
      `'
    AND '` +
      val.date2 +
      `'
    AND USERID IS NOT NULL
    AND aml.device_name = 'MHR-OPD1'
    AND u.Badgenumber NOT IN (68,70,29252,69,72,208,212,29237)
    GROUP BY
      CONVERT (DATE, aml. TIME),
      u.Badgenumber`;

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sqlgetdrug);
      resolve(result);
    });
  };
  this.freqdoorReport = async function fill(val, DATA) {
    let val_type = val.type == "in" ? "MIN" : "MAX";
    let num =
      val.type == "in"
        ? {
            one: "07",
            two: "08",
          }
        : {
            one: "16",
            two: "17",
          };
    var sqlgetdrug =
      `SELECT
      MAX (u.Badgenumber) USERID,
      MAX (a.device_name) deviceName,
      MAX (d.DEPTNAME) DEPTNAME,
      CASE
  WHEN MAX (u.lastname) <> '' THEN
      MAX (u.Name) + ' ' + MAX (u.lastname)
  ELSE
      MAX (u.Name)
  END AS Name,
   COUNT (
      CASE
      WHEN a.ti < CAST ('` +
      num.one +
      `:30:00.0000000' AS TIME) THEN
          1
      ELSE
          NULL
      END
  ) 'time1',
   COUNT (
      CASE
      WHEN a.ti > CAST ('` +
      num.one +
      `:30:00.0000000' AS TIME)
      AND a.ti < CAST ('` +
      num.one +
      `:45:00.0000000' AS TIME) THEN
          1
      ELSE
          NULL
      END
  ) 'time2',
   COUNT (
      CASE
      WHEN a.ti > CAST ('` +
      num.one +
      `:45:00.0000000' AS TIME)
      AND a.ti < CAST ('` +
      num.two +
      `:00:00.0000000' AS TIME) THEN
          1
      ELSE
          NULL
      END
  ) 'time3',
   COUNT (
      CASE
      WHEN a.ti > CAST ('` +
      num.two +
      `:00:00.0000000' AS TIME)
      AND a.ti < CAST ('` +
      num.two +
      `:15:00.0000000' AS TIME) THEN
          1
      ELSE
          NULL
      END
  ) 'time4',
   COUNT (
      CASE
      WHEN a.ti > CAST ('` +
      num.two +
      `:15:00.0000000' AS TIME)
      AND a.ti < CAST ('` +
      num.two +
      `:30:00.0000000' AS TIME) THEN
          1
      ELSE
          NULL
      END
  ) 'time5',
   COUNT (
      CASE
      WHEN a.ti > CAST ('` +
      num.two +
      `:30:00.0000000' AS TIME) THEN
          1
      ELSE
          NULL
      END
  ) 'time6'
  FROM
      (
          SELECT
              pin,
              CAST (` +
      val_type +
      `(TIME) AS TIME) AS ti,
              device_id,
              MAX (device_name) AS device_name
          FROM
          ZKAccess.dbo.acc_monitor_log
          WHERE
          CAST (TIME AS DATE) BETWEEN '` +
      val.date1 +
      `'
          AND '` +
      val.date2 +
      `'
          GROUP BY
              pin,
              device_id,
              CAST (TIME AS DATE)
      ) AS a
  LEFT JOIN ZKAccess.dbo.USERINFO u ON a.pin = u.Badgenumber
  LEFT JOIN ZKAccess.dbo.DEPARTMENTS d ON d.DEPTID = u.DEFAULTDEPTID
  WHERE
      u.Badgenumber IS NOT NULL
  AND u.Badgenumber NOT IN (68,70,29252,69,72,208,212,29237)
  GROUP BY
      a.pin,
      a.device_id
  ORDER BY
      CAST (pin AS INT)`;
    console.log(sqlgetdrug);
    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sqlgetdrug);
      resolve(result);
    });
  };
};
