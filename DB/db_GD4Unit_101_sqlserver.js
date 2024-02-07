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
    *, (
      drp1 + drp2 + drp3 + drp4 + drp5 + drp6 + drp7 + drp8_1 + drp8_2 + drp8_2 + drp8_3 + drp8_4 + drp8_5 + drp9
    ) num_drp,
    (
      doi1 + doi2 + doi3 + doi4 + doi5 + doi6 + doi7 + doi8 + doi9
    ) num_doi,
    (it1 + it2) num_it,
    (roi1 + roi2 + roi3) num_roi
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
  ) AS e ON a.phar = e.user_check
  UNION
    SELECT
      'รวม' phar,
      SUM (numHN) numHN,
      SUM (drungCount) drungCount,
      NULL user_check,
      SUM (errorCount) errorCount,
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
      ISNULL(SUM(roi3), 0) roi3,
      ISNULL(SUM(num_drp), 0) num_drp,
      ISNULL(SUM(num_doi), 0) num_doi,
      ISNULL(SUM(num_it), 0) num_it,
      ISNULL(SUM(num_roi), 0) num_roi
    FROM
      (
        SELECT
          *, (
            drp1 + drp2 + drp3 + drp4 + drp5 + drp6 + drp7 + drp8_1 + drp8_2 + drp8_2 + drp8_3 + drp8_4 + drp8_5 + drp9
          ) num_drp,
          (
            doi1 + doi2 + doi3 + doi4 + doi5 + doi6 + doi7 + doi8 + doi9
          ) num_doi,
          (it1 + it2) num_it,
          (roi1 + roi2 + roi3) num_roi
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
        ) AS e ON a.phar = e.user_check
      ) AS b
    UNION
      SELECT
        'ร้อยละ' phar,
        NULL numHN,
        NULL drungCount,
        NULL user_check,
        NULL errorCount,
        IIF (
          num_drp > 0,
          CAST (
            ROUND(
              CAST (drp1 AS DECIMAL(10, 2)) / CAST (num_drp AS DECIMAL(10, 2)) * 100,
              2
            ) AS DECIMAL (10, 2)
          ),
          0
        ) drp1,
        IIF (
          num_drp > 0,
          CAST (
            ROUND(
              CAST (drp2 AS DECIMAL(10, 2)) / CAST (num_drp AS DECIMAL(10, 2)) * 100,
              2
            ) AS DECIMAL (10, 2)
          ),
          0
        ) drp2,
        IIF (
          num_drp > 0,
          CAST (
            ROUND(
              CAST (drp3 AS DECIMAL(10, 2)) / CAST (num_drp AS DECIMAL(10, 2)) * 100,
              2
            ) AS DECIMAL (10, 2)
          ),
          0
        ) drp3,
        IIF (
          num_drp > 0,
          CAST (
            ROUND(
              CAST (drp4 AS DECIMAL(10, 2)) / CAST (num_drp AS DECIMAL(10, 2)) * 100,
              2
            ) AS DECIMAL (10, 2)
          ),
          0
        ) drp4,
        IIF (
          num_drp > 0,
          CAST (
            ROUND(
              CAST (drp5 AS DECIMAL(10, 2)) / CAST (num_drp AS DECIMAL(10, 2)) * 100,
              2
            ) AS DECIMAL (10, 2)
          ),
          0
        ) drp5,
        IIF (
          num_drp > 0,
          CAST (
            ROUND(
              CAST (drp6 AS DECIMAL(10, 2)) / CAST (num_drp AS DECIMAL(10, 2)) * 100,
              2
            ) AS DECIMAL (10, 2)
          ),
          0
        ) drp6,
        IIF (
          num_drp > 0,
          CAST (
            ROUND(
              CAST (drp7 AS DECIMAL(10, 2)) / CAST (num_drp AS DECIMAL(10, 2)) * 100,
              2
            ) AS DECIMAL (10, 2)
          ),
          0
        ) drp7,
        IIF (
          num_drp > 0,
          CAST (
            ROUND(
              CAST (drp8_1 AS DECIMAL(10, 2)) / CAST (num_drp AS DECIMAL(10, 2)) * 100,
              2
            ) AS DECIMAL (10, 2)
          ),
          0
        ) drp8_1,
        IIF (
          num_drp > 0,
          CAST (
            ROUND(
              CAST (drp8_2 AS DECIMAL(10, 2)) / CAST (num_drp AS DECIMAL(10, 2)) * 100,
              2
            ) AS DECIMAL (10, 2)
          ),
          0
        ) drp8_2,
        IIF (
          num_drp > 0,
          CAST (
            ROUND(
              CAST (drp8_3 AS DECIMAL(10, 2)) / CAST (num_drp AS DECIMAL(10, 2)) * 100,
              2
            ) AS DECIMAL (10, 2)
          ),
          0
        ) drp8_3,
        IIF (
          num_drp > 0,
          CAST (
            ROUND(
              CAST (drp8_4 AS DECIMAL(10, 2)) / CAST (num_drp AS DECIMAL(10, 2)) * 100,
              2
            ) AS DECIMAL (10, 2)
          ),
          0
        ) drp8_4,
        IIF (
          num_drp > 0,
          CAST (
            ROUND(
              CAST (drp8_5 AS DECIMAL(10, 2)) / CAST (num_drp AS DECIMAL(10, 2)) * 100,
              2
            ) AS DECIMAL (10, 2)
          ),
          0
        ) drp8_5,
        IIF (
          num_drp > 0,
          CAST (
            ROUND(
              CAST (drp9 AS DECIMAL(10, 2)) / CAST (num_drp AS DECIMAL(10, 2)) * 100,
              2
            ) AS DECIMAL (10, 2)
          ),
          0
        ) drp9,
        IIF (
          num_it > 0,
          CAST (
            ROUND(
              CAST (it1 AS DECIMAL(10, 2)) / CAST (num_it AS DECIMAL(10, 2)) * 100,
              2
            ) AS DECIMAL (10, 2)
          ),
          0
        ) it1,
        IIF (
          num_it > 0,
          CAST (
            ROUND(
              CAST (it2 AS DECIMAL(10, 2)) / CAST (num_it AS DECIMAL(10, 2)) * 100,
              2
            ) AS DECIMAL (10, 2)
          ),
          0
        ) it2,
        IIF (
          num_doi > 0,
          CAST (
            ROUND(
              CAST (doi1 AS DECIMAL(10, 2)) / CAST (num_doi AS DECIMAL(10, 2)) * 100,
              2
            ) AS DECIMAL (10, 2)
          ),
          0
        ) doi1,
        IIF (
          num_doi > 0,
          CAST (
            ROUND(
              CAST (doi2 AS DECIMAL(10, 2)) / CAST (num_doi AS DECIMAL(10, 2)) * 100,
              2
            ) AS DECIMAL (10, 2)
          ),
          0
        ) doi2,
        IIF (
          num_doi > 0,
          CAST (
            ROUND(
              CAST (doi3 AS DECIMAL(10, 2)) / CAST (num_doi AS DECIMAL(10, 2)) * 100,
              2
            ) AS DECIMAL (10, 2)
          ),
          0
        ) doi3,
        IIF (
          num_doi > 0,
          CAST (
            ROUND(
              CAST (doi4 AS DECIMAL(10, 2)) / CAST (num_doi AS DECIMAL(10, 2)) * 100,
              2
            ) AS DECIMAL (10, 2)
          ),
          0
        ) doi4,
        IIF (
          num_doi > 0,
          CAST (
            ROUND(
              CAST (doi5 AS DECIMAL(10, 2)) / CAST (num_doi AS DECIMAL(10, 2)) * 100,
              2
            ) AS DECIMAL (10, 2)
          ),
          0
        ) doi5,
        IIF (
          num_doi > 0,
          CAST (
            ROUND(
              CAST (doi6 AS DECIMAL(10, 2)) / CAST (num_doi AS DECIMAL(10, 2)) * 100,
              2
            ) AS DECIMAL (10, 2)
          ),
          0
        ) doi6,
        IIF (
          num_doi > 0,
          CAST (
            ROUND(
              CAST (doi7 AS DECIMAL(10, 2)) / CAST (num_doi AS DECIMAL(10, 2)) * 100,
              2
            ) AS DECIMAL (10, 2)
          ),
          0
        ) doi7,
        IIF (
          num_doi > 0,
          CAST (
            ROUND(
              CAST (doi8 AS DECIMAL(10, 2)) / CAST (num_doi AS DECIMAL(10, 2)) * 100,
              2
            ) AS DECIMAL (10, 2)
          ),
          0
        ) doi8,
        IIF (
          num_doi > 0,
          CAST (
            ROUND(
              CAST (doi9 AS DECIMAL(10, 2)) / CAST (num_doi AS DECIMAL(10, 2)) * 100,
              2
            ) AS DECIMAL (10, 2)
          ),
          0
        ) doi9,
        IIF (
          num_roi > 0,
          CAST (
            ROUND(
              CAST (roi1 AS DECIMAL(10, 2)) / CAST (num_roi AS DECIMAL(10, 2)) * 100,
              2
            ) AS DECIMAL (10, 2)
          ),
          0
        ) roi1,
        IIF (
          num_roi > 0,
          CAST (
            ROUND(
              CAST (roi2 AS DECIMAL(10, 2)) / CAST (num_roi AS DECIMAL(10, 2)) * 100,
              2
            ) AS DECIMAL (10, 2)
          ),
          0
        ) roi2,
        IIF (
          num_roi > 0,
          CAST (
            ROUND(
              CAST (roi3 AS DECIMAL(10, 2)) / CAST (num_roi AS DECIMAL(10, 2)) * 100,
              2
            ) AS DECIMAL (10, 2)
          ),
          0
        ) roi3,
        NULL num_drp,
        NULL num_doi,
        NULL num_it,
        NULL num_roi
      FROM
        (
          SELECT
            NULL phar,
            SUM (numHN) numHN,
            SUM (drungCount) drungCount,
            NULL user_check,
            SUM (errorCount) errorCount,
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
            ISNULL(SUM(roi3), 0) roi3,
            ISNULL(SUM(num_drp), 0) num_drp,
            ISNULL(SUM(num_doi), 0) num_doi,
            ISNULL(SUM(num_it), 0) num_it,
            ISNULL(SUM(num_roi), 0) num_roi
          FROM
            (
              SELECT
                *, (
                  drp1 + drp2 + drp3 + drp4 + drp5 + drp6 + drp7 + drp8_1 + drp8_2 + drp8_2 + drp8_3 + drp8_4 + drp8_5 + drp9
                ) num_drp,
                (
                  doi1 + doi2 + doi3 + doi4 + doi5 + doi6 + doi7 + doi8 + doi9
                ) num_doi,
                (it1 + it2) num_it,
                (roi1 + roi2 + roi3) num_roi
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
              ) AS e ON a.phar = e.user_check
            ) AS b
        ) AS c`;

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sqlgetdrug);
      resolve(result.recordset);
    });
  };
};
