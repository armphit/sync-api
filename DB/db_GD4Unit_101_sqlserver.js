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

  // this.connection = new sql.connect(this.config, function (err) {
  //   if (err) console.log("ERROR: " + err);
  // });

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
      `
      WITH Dates AS (
	  	SELECT
		CAST('${val.date1}' AS DATE) AS dateday
	UNION ALL
		SELECT
			DATEADD(DAY, 1, dateday)
		FROM
			Dates
		WHERE
			dateday < CAST('${val.date2}' AS DATE) 
) SELECT
	val.USERID,
	val.userName,
	CONVERT(VARCHAR(10), val.dateday, 120) datestamp,
	CONVERT(VARCHAR(19), ud.check_in, 120) check_in,
	CONVERT(VARCHAR(19), ud.check_out, 120)   check_out,
  lu.type_leave,
	lu.leave_note,
  lu.leave_time
FROM
	(
		SELECT
			d.dateday,
			u.USERID,
			userName
		FROM
			Dates d
		CROSS JOIN (
			SELECT
				u.Badgenumber USERID,
				CASE
			WHEN (u.lastname) <> '' THEN
				(u.Name) + ' ' + (u.lastname)
			ELSE
				(u.Name)
			END AS userName
			FROM
				ZKAccess.dbo.USERINFO u
			WHERE
				u.Badgenumber IN (
					15358,
					202,
					3793,
					62150,
					36161,
					4507,
					45942
				)
			AND u.DEFAULTDEPTID = 2
		) u
		WHERE
			DATENAME(WEEKDAY, d.dateday) NOT IN ('Saturday', 'Sunday')
	) AS val
LEFT JOIN (
	SELECT
		CONVERT (DATE, aml. TIME) datestamp,
		MAX (u.Badgenumber) AS USERID,
		CASE
	WHEN MAX (u.lastname) <> '' THEN
		MAX (u.Name) + ' ' + MAX (u.lastname)
	ELSE
		MAX (u.Name)
	END AS Name,
	MAX (d.DEPTNAME) DEPTNAME,
	MAX (aml.device_name) deviceName,
	CONVERT (VARCHAR, MIN(aml. TIME), 120) check_in,
	CONVERT (VARCHAR, MAX(aml. TIME), 120) check_out
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
AND u.Badgenumber NOT IN (
	68,
	70,
	29252,
	69,
	72,
	208,
	212,
	29237,
	62662
)
AND d.DEPTNAME = 'ROBOT'
GROUP BY
	CONVERT (DATE, aml. TIME),
	u.Badgenumber
) AS ud ON val.USERID = ud.USERID
AND val.dateday = ud.datestamp
LEFT JOIN msr.dbo.leave_user lu ON lu.user_id = val.USERID
AND lu.leave_date =  val.dateday
ORDER BY
	val.USERID,
	val.dateday OPTION (MAXRECURSION 0);
      
      
      
      
      
    `;

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
  this.checkDrugPatient = async function fill(val, DATA) {
    var sql = `SELECT
    MAX(hn) hn,
    MAX(drugCode) drugCode,
    MAX(FORMAT(p.makerDT, 'HH:mm:ss')) AS ordertime
 FROM
    opd.dbo.prescription p
 WHERE
    FORMAT(p.createDT, 'yyyy-MM-dd') = FORMAT(GETDATE(), 'yyyy-MM-dd')
 AND p.hn = '${val}'
 GROUP BY
    FORMAT(p.makerDT, 'HH:mm:ss')`;

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sql);
      resolve(result.recordset);
    });
  };
  this.insertSys = async function fill(val, DATA) {
    var sql = `
IF (
	SELECT
		hn
	FROM
		 [opd].[dbo].[syslastupdate]
	WHERE
		hn = TRIM('${val.hn}')
	AND queue = '${val.qn}'
	AND dateindex = FORMAT (GetDate(), 'yyyyMMdd')
) IS NOT NULL UPDATE [opd].[dbo].[syslastupdate]
SET [updateDT] = GetDate()
WHERE
	hn = TRIM('${val.hn}')
AND queue = '${val.qn}'
AND dateindex = FORMAT (GetDate(), 'yyyyMMdd')
ELSE
	INSERT INTO [opd].[dbo].[syslastupdate] (
		[id],
		[hn],
		[queue],
		[maker],
		[dateindex],
		[timeindex],
		[createDT],
		[site],
		[patientName],
		[patientDob],
		[sex]
	)
VALUES
	(
		NEWID(),
		TRIM('${val.hn}'),
		'${val.qn}',
		'${val.maker}',
		FORMAT (GetDate(), 'yyyyMMdd'),
		FORMAT (GetDate(), 'HHmm'),
		GetDate(),
		'${val.site}',
		'${val.patientname}',
		'${val.patientdob}',
		'${val.sex}'
	)`;

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sql);
      resolve(result);
    });
  };

  this.insertPre = async function fill(val, DATA) {
    var sql = `
INSERT INTO [opd].[dbo].[prescription] (
	[id],
	[sys_id],
	[seq],
	[drugCode],
	[drugName],
	[qty],
	[unit],
	[makerDT],
	[createDT],
	[dateindex],
	[timeindex],
	[prescriptionNo],
	[hn]
)
VALUES
	${val}`;

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sql);
      resolve(result);
    });
  };
  this.getSys = async function fill(val, DATA) {
    var sql = `SELECT
	id
FROM
	opd.dbo.syslastupdate
WHERE
	hn = ${val.hn}
AND queue = '${val.qn}'
AND dateindex = FORMAT (GetDate(), 'yyyyMMdd')`;

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sql);
      resolve(result.recordset);
    });
  };
  //   this.interfaceSys = async function fill(val, DATA) {
  //     var sql = `SELECT
  // 	ROW_NUMBER () OVER (ORDER BY createDT DESC) indexrow,
  // 	hn,
  // 	patientName patientname,
  // 	CONVERT (
  // 		CHAR (10),
  // 		DATEADD(
  // 			YEAR ,- 543,
  // 			CONVERT (CHAR, patientDob)
  // 		),
  // 		120
  // 	) patientdob,
  // 	FLOOR(
  // 		DATEDIFF(
  // 			DAY,
  // 			CONVERT (
  // 				CHAR (10),
  // 				DATEADD(
  // 					YEAR ,- 543,
  // 					CONVERT (CHAR, patientDob)
  // 				),
  // 				120
  // 			),
  // 			GETDATE()
  // 		) / 365.25
  // 	) age,
  // 	sex,
  // 	CONVERT (VARCHAR(25), createDT, 120) readdatetime,
  // 	'Y' sendMachine,
  // 	patientDob birthTH,
  //   id
  // FROM
  // 	opd.dbo.syslastupdate
  // WHERE
  // 	dateindex = FORMAT (GetDate(), 'yyyyMMdd')
  //   AND site = '${val.site}'`;

  //     return new Promise(async (resolve, reject) => {
  //       const pool = await poolPromise;
  //       const result = await pool.request().query(sql);
  //       resolve(result.recordset);
  //     });
  //   };
  this.interfaceSys = async function fill(val, DATA) {
    var sql = `SELECT
ROW_NUMBER () OVER (ORDER BY createDT DESC) indexrow,
hn,
patientName patientname,
-- CONVERT (
-- 	CHAR (10),
-- 	DATEADD(
-- 		YEAR ,- 543,
-- 		CONVERT (CHAR, patientDob)
-- 	),
-- 	120
-- ) patientdob,
-- FLOOR(
-- 	DATEDIFF(
-- 		DAY,
-- 		CONVERT (
-- 			CHAR (10),
-- 			DATEADD(
-- 				YEAR ,- 543,
-- 				CONVERT (CHAR, patientDob)
-- 			),
-- 			120
-- 		),
-- 		GETDATE()
-- 	) / 365.25
-- ) age,
 '' patientdob,
'' age,
sex,
CONVERT (VARCHAR(25), createDT, 120) readdatetime,
'Y' sendMachine,
patientDob birthTH,
id
FROM
opd.dbo.syslastupdate
WHERE
dateindex = FORMAT (GetDate(), 'yyyyMMdd')
AND site = '${val.site}'`;

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sql);
      resolve(result.recordset);
    });
  };
  this.interfaceDrug = async function fill(val, DATA) {
    var sql = `SELECT
	p.prescriptionNo prescriptionno,
	s.sex,
	CONVERT (
		CHAR (10),
		DATEADD(
			YEAR ,- 543,
			CONVERT (CHAR, patientDob)
		),
		120
	) patientdob,
	patientDob birthTH,
	p.drugCode orderitemcode,
	p.drugName orderitemname,
	p.qty orderqty,
	p.unit orderunitcode,
	CONVERT (VARCHAR(25), p.makerDT, 120) ordercreatedate,
	'true' AS STATUS
FROM
	opd.dbo.syslastupdate s
LEFT JOIN opd.dbo.prescription p ON p.sys_id = s.id
WHERE
	s.dateindex = FORMAT (GetDate(), 'yyyyMMdd')
AND sys_id = '${val.id}'`;

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sql);
      resolve(result.recordset);
    });
  };
  this.opd3Location = async function fill(val, DATA) {
    console.log(val);

    var sql = `SELECT
	CONCAT (
		d.deviceCode,
		'-',
		s.row,
		'-',
		s.[column]
	) location,
   s.drugCode orderitemcode,
   d.sortOrder
FROM
	opd.dbo.device d
INNER JOIN [opd].[dbo].[devicedrugsetting] s ON d.id = s.device_id
WHERE
	d.site = '${
    val.queue
      ? val.queue.substring(0, 1) == "2"
        ? "W8"
        : val.queue.substring(0, 1) == "3"
        ? "W18"
        : val.queue
      : val.queue
      ? val.queue
      : "W18"
  }'`;

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sql);
      resolve(result.recordset);
    });
  };
  this.packYurim = async function fill(val, DATA) {
    var sql = `SELECT
	*, 'YU' location,
	22 sortOrder
FROM
	opd.dbo.pack_yurim_copy`;

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sql);
      resolve(result.recordset);
    });
  };
  this.dataPatient = async function fill(val, DATA) {
    var sql = `SELECT
	queue,
	hn,
	patientName patientname,
	dateindex,
	FORMAT (
		createDT,
		'yyyy-MM-dd HH:mm:ss'
	) AS starttime
FROM
	opd.dbo.syslastupdate
WHERE
	dateindex BETWEEN 
    CAST(REPLACE('${val.datestart}', '-', '') AS INT) 
AND CAST(REPLACE('${val.dateend}', '-', '') AS INT) 
`;

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sql);
      resolve(result.recordset);
    });
  };
  this.addLeave = async function fill(val, DATA) {
    var sql = `INSERT INTO [msr].[dbo].[leave_user] (
	[user_id],
	[leave_note],
	[leave_date],
	[create_dt],
	[update_dt],
	[dateindex],
	[leave_time],
	[type_leave],
	[leave_num],
  [user_name]
)
VALUES
	(
		'${val.USERID}',
		'${val.leave_note}',
				'${val.datestamp}',
		GETDATE(),
		GETDATE(),
				'${val.datestamp.replace(/-/g, "")}',
		'${val.leave_time}',
		'${val.type_leave}',
		'${val.leave_num}',
    '${val.userName}'
	);
`;

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sql);
      resolve(result.recordset);
    });
  };
  this.getdrugdupl = async function fill(val, DATA) {
    var sql = `SELECT  * FROM [opd].[dbo].[drug_duplication]
`;

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sql);
      resolve(result.recordset);
    });
  };

  this.Inserthn = async function fill(val, DATA) {
    var sql = `DECLARE @result TABLE (
    id UNIQUEIDENTIFIER,
    prescription VARCHAR(50),
    hn VARCHAR(50),
    statusCheck INT
);

MERGE [opd].[dbo].[drug_interaction] AS target
USING (
    SELECT
        '${val.reqNo}' AS prescription,
        '${val.hn}' AS hn,
        '${val.lastIssTime}' AS keyCreateDT,
        '${val.statusCheck}' AS statusCheck
) AS source
ON target.prescription = source.prescription

WHEN NOT MATCHED THEN
    INSERT (
        id,
        prescription,
        hn,
        keyCreateDT,
        statusCheck,
        scanDT
    )
    VALUES (
        NEWID(),
        source.prescription,
        source.hn,
        source.keyCreateDT,
        source.statusCheck,
        CURRENT_TIMESTAMP
    )

OUTPUT
    inserted.id,
    inserted.prescription,
    inserted.hn,
    inserted.statusCheck
INTO @result;

SELECT * FROM @result;

`;

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sql);
      resolve(result.recordset);
    });
  };
  this.getPatient = async function fill(val, DATA) {
    var sql = `SELECT
	*
FROM
	[opd].[dbo].[drug_interaction]
WHERE
	prescription = 	'${val.hn}'
`;

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sql);
      resolve(result.recordset);
    });
  };
};
