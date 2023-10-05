const { Console } = require("console");

module.exports = function () {
  const mysql = require("mysql");
  // จริง
  const connection = mysql.createConnection({
    user: "root",
    password: "cretem",
    host: "192.168.185.102",
    database: "pmpf_thailand_mnrh",
  });

  connection.connect(function (err) {
    if (err) throw err;
    console.log("Connected to Pmpf_Thailand_MNRH");
  });

  this.fill = function fill(val, DATA) {
    var sql =
      `SELECT
  dd.drugCode,
  dd.drugName,
  dd.HisPackageRatio,
  GROUP_CONCAT(de.deviceCode) AS deviceCode,
  CASE
WHEN locate('-', drugCode) > 0
AND dd.drugCode <> 'CYCL-'
AND dd.drugCode <> 'DEX-O'
AND dd.drugCode <> 'POLY-1'
AND de.deviceCode = 'Xmed1' THEN
  'Y'
ELSE
  'N'
END AS isPrepack
FROM
  devicedrugsetting ds
INNER JOIN device de ON ds.deviceID = de.deviceID
LEFT JOIN dictdrug dd ON dd.drugID = ds.drugID
WHERE
  dd.drugCode IS NOT NULL
AND de.deviceCode IN ('Xmed1', 'LCA', 'JV')
AND dd.drugCode LIKE '` +
      val.trim() +
      `'
GROUP BY
  dd.drugCode`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };

  this.datadrug = function fill(val, DATA) {
    var sql =
      `SELECT
      dd.drugCode,
      dd.drugName,
      dd.HisPackageRatio,
      GROUP_CONCAT(de.deviceCode) AS deviceCode,
      CASE
  WHEN locate('-', drugCode) > 0
  AND dd.drugCode <> 'CYCL-'
  AND dd.drugCode <> 'DEX-O'
  AND dd.drugCode <> 'POLY-1'
  AND de.deviceCode = 'Xmed1' THEN
      'Y'
  ELSE
      'N'
  END AS isPrepack
  FROM
      devicedrugsetting ds
  INNER JOIN device de ON ds.deviceID = de.deviceID
  LEFT JOIN dictdrug dd ON dd.drugID = ds.drugID
  WHERE
      dd.drugCode IS NOT NULL
  AND de.deviceCode IN ('Xmed1', 'LCA', 'JV')
  AND dd.drugCode LIKE '` +
      val +
      `%'
  GROUP BY
      dd.drugCode`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };

  this.dataUnit = function fill(val, DATA) {
    var sql =
      `SELECT dd.miniUnit
      FROM dictdrug dd
      WHERE dd.drugCode = '` +
      val +
      `'`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };

  this.datadrugX = function fill(val, DATA) {
    var sql =
      `SELECT
      dd.drugID,
      dd.drugCode,
      dd.drugName,
      dd.HisPackageRatio,
      GROUP_CONCAT(de.deviceCode) AS deviceCode,
      CASE
    WHEN locate('-', drugCode) > 0
    AND dd.drugCode <> 'CYCL-'
    AND dd.drugCode <> 'DEX-O'
    AND dd.drugCode <> 'POLY-1'
    AND de.deviceCode = 'Xmed1' THEN
      'Y'
    ELSE
      'N'
    END AS isPrepack
    FROM
      devicedrugsetting ds
    INNER JOIN device de ON ds.deviceID = de.deviceID
    LEFT JOIN dictdrug dd ON dd.drugID = ds.drugID
    WHERE
      dd.drugCode IS NOT NULL
      AND de.deviceCode = '` +
      val.lo +
      `'
  AND dd.drugCode like '` +
      val.code +
      `%'
    GROUP BY
      dd.drugCode
    ORDER BY
      dd.HisPackageRatio DESC`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };

  this.datadrugMain = function fill(val, DATA) {
    var sql =
      `SELECT
      dd.drugID,
      dd.drugCode,
      dd.drugName,
      dd.HisPackageRatio,
      GROUP_CONCAT(de.deviceCode) AS deviceCode,
      CASE
  WHEN locate('-', drugCode) > 0
  AND dd.drugCode <> 'CYCL-'
  AND dd.drugCode <> 'DEX-O'
  AND dd.drugCode <> 'POLY-1'
  AND de.deviceCode = 'Xmed1' THEN
      'Y'
  ELSE
      'N'
  END AS isPrepack
  FROM
      devicedrugsetting ds
  INNER JOIN device de ON ds.deviceID = de.deviceID
  LEFT JOIN dictdrug dd ON dd.drugID = ds.drugID
  WHERE
      dd.drugCode IS NOT NULL
  AND de.deviceCode = '` +
      val.lo +
      `'
  AND dd.drugCode = '` +
      val.code +
      `'
  GROUP BY
      dd.drugCode`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };

  this.dataZone = function fill(val, DATA) {
    var sql =
      `SELECT
      dd.drugCode,
      de.deviceCode,
      dg.group_id
    FROM
      dictdrug dd
    LEFT JOIN devicedrugsetting ds ON dd.drugID = ds.drugID
    LEFT JOIN device de ON ds.deviceID = de.deviceID
    LEFT JOIN center.device_group dg ON de.deviceCode = dg.deviceCode
    WHERE
      dd.drugCode = '` +
      val +
      `'
    AND group_id IS NOT NULL
    GROUP BY
      de.deviceCode`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };

  this.allDrug = function fill(val, DATA) {
    var sql = ``;
    if (val) {
      sql =
        `SELECT
        CASE
      WHEN dd.drugCode = 'CYCL-' THEN
        'CYCL-'
      WHEN dd.drugCode = 'DEX-O' THEN
        'DEX-O'
      WHEN dd.drugCode = 'DEX-E' THEN
        'DEX-E'
      WHEN dd.drugCode = 'POLY-1' THEN
        'LPOLY-1'
      ELSE
        SUBSTRING_INDEX(dd.drugCode, '-', 1)
      END AS code,
       dd.drugName AS Name,
       dd.miniSpec AS spec,
       dd.HISPackageRatio AS pack,
       dd.firmName AS firmName,
       dd.miniUnit AS unit,
       GROUP_CONCAT(DISTINCT dv.deviceCode) AS location
      FROM
        
          dictdrug dd
          LEFT JOIN devicedrugsetting dt ON dt.drugID = dd.drugID
        
      LEFT JOIN device dv ON dv.deviceID = dt.deviceID
      AND 
      dv.deviceCode NOT IN ('AP','CDMed2')
      AND dv.isDeleted = 'N'
      AND dv.isEnabled = 'Y'
      WHERE dd.drugCode = '` +
        val +
        `'
      GROUP BY
        code`;
    } else {
      sql = `SELECT
      CASE
      WHEN dd.drugCode = 'CYCL-' THEN
        'CYCL-'
      WHEN dd.drugCode = 'DEX-O' THEN
        'DEX-O'
      WHEN dd.drugCode = 'DEX-E' THEN
        'DEX-E'
      WHEN dd.drugCode = 'POLY-1' THEN
        'POLY-1'
      WHEN dd.drugCode = 'CO-TR3' THEN
        'CO-TR3'
      WHEN dd.drugCode = 'CO-TR2' THEN
        'CO-TR2'
      WHEN dd.drugCode = 'CO-TR1' THEN
        'CO-TR1'
      WHEN dd.drugCode = 'L-ASPA' THEN
        'L-ASPA'
      WHEN dd.drugCode = 'RIS-1' THEN
        'RIS-1'
      WHEN dd.drugCode = 'RIS-2' THEN
        'RIS-2'
      WHEN dd.drugCode = 'N-ACE' THEN
        'N-ACE'
      WHEN dd.drugCode = 'ANTI-D' THEN
        'ANTI-D'
      WHEN dd.drugCode = 'CIS-P2' THEN
        'CIS-P2'
      WHEN dd.drugCode = 'CO-TR3-1' THEN
        'CO-TR3'
      WHEN dd.drugCode = 'CO-TR3-2' THEN
        'CO-TR3'
      ELSE
        SUBSTRING_INDEX(dd.drugCode, '-', 1)
    END AS code,
      (
	SELECT
		drugName
	FROM
		pmpf_thailand_mnrh.dictdrug
	WHERE
		drugCode = code
) AS Name,
     dd.miniSpec AS spec,
     dd.HISPackageRatio AS pack,
     dd.firmName AS firmName,
     dd.miniUnit AS unit,
     GROUP_CONCAT(DISTINCT dv.deviceCode) AS location
    FROM
      
        dictdrug dd
        LEFT JOIN devicedrugsetting dt ON dt.drugID = dd.drugID
      
    LEFT JOIN device dv ON dv.deviceID = dt.deviceID
    AND 
		dv.deviceCode NOT IN ('AP','CDMed2')
		AND dv.isDeleted = 'N'
		AND dv.isEnabled = 'Y'
		
    GROUP BY
      code`;
    }

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };

  this.drugSEPack = function fill(val, DATA) {
    var sql =
      `SELECT
    *
  FROM
    (
      SELECT
        dd.drugID,
        dd.drugCode AS realDrugCode,
        dd.HisPackageRatio,
        CASE
      WHEN locate('-', drugCode) > 0
      AND dd.drugCode <> 'CYCL-'
      AND dd.drugCode <> 'DEX-O'
      AND dd.drugCode <> 'POLY-1'
      AND de.deviceCode = 'Xmed1' THEN
        SUBSTRING(
          dd.drugCode,
          1,
          locate('-', dd.drugCode) - 1
        )
      ELSE
        dd.drugCode
      END AS drugCode,
      CASE
    WHEN locate('-', drugCode) > 0
    AND dd.drugCode <> 'CYCL-'
    AND dd.drugCode <> 'DEX-O'
    AND dd.drugCode <> 'POLY-1'
    AND de.deviceCode = 'Xmed1' THEN
      'Y'
    ELSE
      'N'
    END AS prePack
    FROM
      devicedrugsetting ds
    INNER JOIN device de ON ds.deviceID = de.deviceID
    LEFT JOIN dictdrug dd ON dd.drugID = ds.drugID
    WHERE
      dd.drugCode IS NOT NULL
    -- AND de.deviceCode = 'XMed1'
    GROUP BY
      dd.drugCode
    ) AS a
  WHERE a.drugCode  IN ('` +
      val +
      `') 
  `;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };

  this.druginsert = function fill(val, DATA) {
    var sql =
      `SELECT
    *
  FROM
  dictdrug
  WHERE drugCode = '` +
      val +
      `'
  `;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
  this.drugImage = function fill(val, DATA) {
    var sql =
      `SELECT
      d.drugCode,
      GROUP_CONCAT(i.typeNum) typeNum,
      GROUP_CONCAT(i.pathImage) pathImage,
      b.barCode
    FROM
      pmpf_thailand_mnrh.dictdrug d
    LEFT JOIN center.images_drugs i ON i.drugCode = d.drugCode
    LEFT JOIN center.barcode_drug b ON b.drugCode = d.drugCode
    WHERE
      d.drugCode <> ''
      AND d.drugCode IN ('` +
      val +
      `') 
    GROUP BY
      drugCode
  `;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
  this.getDrug = function fill(val, DATA) {
    var sql =
      `SELECT
      dd.drugCode,
      dd.drugName,
      dd.miniSpec AS Strength,
      dd.firmName AS firmname,
      dd.HISPackageRatio AS pack,
      dd.miniUnit AS dosageunitcode,
      dv.deviceCode,
    IF (
      GROUP_CONCAT(dv.deviceCode) LIKE '%Xmed1%',
      1,
      0
    ) checkLocation
    FROM
      dictdrug dd
    LEFT JOIN devicedrugsetting ds ON ds.drugID = dd.drugID
    LEFT JOIN device dv ON ds.deviceID = dv.deviceID AND (
      dv.deviceCode NOT IN (
        'AP',
        'CDMed2',
        'Xmed1',
        'ตู้ฉร',
        'C',
        'CATV'
      )
      AND dv.deviceCode NOT LIKE 'INJ%'
      AND dv.pharmacyCode <> 'IPD'
    )
    WHERE
      dd.drugCode = '` +
      val +
      `'
    GROUP BY
      dd.drugCode
  `;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
  this.getDispense = function fill(val, DATA) {
    let sql =
      `CALL DispensingOPD( '` +
      val.date1 +
      `' ,
      '` +
      val.date2 +
      `' )`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
  this.onusphar = function fill(val, DATA) {
    var sql =
      `SELECT
  a.userCheck staff,
  '' AS 'staffName',
  '' AS 'order',
  COUNT(*) AS item
FROM
  (
      SELECT
          cmp.id,
          cm.id cm_id,
          cm.drugCode,
          cml.user userCheck
      FROM
          center.checkmedpatient cmp
      LEFT JOIN center.checkmed cm ON cm.cmp_id = cmp.id
      LEFT JOIN center.checkmed_log cml ON cml.cm_id = cm.id
      WHERE
          cmp.timestamp BETWEEN '` +
      val.date1 +
      `` +
      " " +
      val.time1 +
      `'
          AND '` +
      val.date2 +
      `` +
      " " +
      val.time2 +
      `'
      AND cmp.isDelete IS NULL
      AND cml.user IS NOT NULL
      GROUP BY
          cml.cm_id,
          cml.user
      ORDER BY
          cml.cm_id,
          cm.drugCode
  ) AS a
GROUP BY
  a.userCheck`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
};
