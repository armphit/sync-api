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

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sqlgetdrug);
      resolve(result);
    });
  };

  this.getDispend = async function fill(val, DATA) {
    var sqlgetdrug = `SELECT
      *
    FROM
      (
        SELECT
          sdp.[user] phar,
          COUNT (DISTINCT sdp.hn) numHN,
          COUNT (sdd.drugCode) drungCount
        FROM
        msr.dbo.smart_dispend_phar sdp
        LEFT JOIN msr.dbo.smart_dispend_drug sdd ON sdd.sdp_id = sdp.id
        WHERE
          sdp.[date] BETWEEN '${val.date1}'
          AND '${val.date2}'
        GROUP BY
          sdp.[user]
      ) AS a
    LEFT JOIN (
      SELECT
        sde.user_check,
        COUNT (sde.id) errorCount,
        ISNULL(SUM(drp1), 0) drp1,
        ISNULL(SUM(drp2), 0) drp2,
        ISNULL(SUM(drp3), 0) drp3,
        ISNULL(SUM(drp4), 0) drp4,
        ISNULL(SUM(drp5), 0) drp5,
        ISNULL(SUM(drp6), 0) drp6,
        ISNULL(SUM(drp7), 0) drp7,
        ISNULL(SUM(drp8_1), 0) drp8_1,
        ISNULL(SUM(drp8_2), 0) drp8_2,
        ISNULL(SUM(drp8_3), 0) drp8_3,
        ISNULL(SUM(drp8_4), 0) drp8_4,
        ISNULL(SUM(drp8_5), 0) drp8_5,
        ISNULL(SUM(drp9), 0) drp9,
        ISNULL(SUM(it1), 0) it1,
        ISNULL(SUM(it2), 0) it2,
        ISNULL(SUM(doi1), 0) doi1,
        ISNULL(SUM(doi2), 0) doi2,
        ISNULL(SUM(doi3), 0) doi3,
        ISNULL(SUM(doi4), 0) doi4,
        ISNULL(SUM(doi5), 0) doi5,
        ISNULL(SUM(doi6), 0) doi6,
        ISNULL(SUM(doi7), 0) doi7,
        ISNULL(SUM(doi8), 0) doi8,
        ISNULL(SUM(doi9), 0) doi9,
        ISNULL(SUM(roi1), 0) roi1,
        ISNULL(SUM(roi2), 0) roi2,
        ISNULL(SUM(roi3), 0) roi3
      FROM
      msr.dbo.smart_dispend_error sde
      LEFT JOIN msr.dbo.smart_dispend_drp drp ON drp.sde_id = sde.id
      LEFT JOIN msr.dbo.smart_dispend_it it ON it.sde_id = sde.id
      LEFT JOIN msr.dbo.smart_dispend_doi doi ON doi.sde_id = sde.id
      LEFT JOIN msr.dbo.smart_dispend_roi roi ON roi.sde_id = sde.id
      WHERE
        CAST (sde.time_stamp AS DATE) BETWEEN '${val.date1}'
        AND '${val.date2}'
      GROUP BY
        sde.user_check
    ) AS e ON a.phar = e.user_check`;
    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sqlgetdrug);
      resolve(result.recordset);
    });
  };
};
