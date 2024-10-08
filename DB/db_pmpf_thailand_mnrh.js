const { Console } = require("console");

module.exports = function () {
  const mysql = require("mysql");
  // จริง
  // const connection = mysql.createConnection({
  //   user: "root",
  //   password: "cretem",
  //   host: "192.168.185.102",
  //   database: "pmpf_thailand_mnrh",
  // });

  // connection.connect(function (err) {
  //   if (err) throw err;
  //   console.log("Connected to Pmpf_Thailand_MNRH");
  // });
  let connection;
  connectDatabase();
  function connectDatabase() {
    connection = mysql.createPool({
      user: "root",
      password: "cretem",
      host: "192.168.185.102",
      database: "pmpf_thailand_mnrh",
      queueLimit: 0,
    });

    return connection;
  }
  connection.on("connection", (connection) => {
    console.log("Connected to pmpf_thailand_mnrh MySQL.");
  });

  connection.on("error", (err) => {
    console.error("Error pmpf_thailand_mnrh MySQ:", err.message);
    connectDatabase();
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
    var sql = `SELECT
      dd.drugCode,
      de.deviceCode,
      dg.group_id
    FROM
      dictdrug dd
    LEFT JOIN devicedrugsetting ds ON dd.drugID = ds.drugID
    LEFT JOIN device de ON ds.deviceID = de.deviceID
    LEFT JOIN center.device_group dg ON de.deviceCode = dg.deviceCode
    WHERE
      de.deviceCode IN (${val})
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
  this.cutbarmanual = function fill(val, DATA) {
    let sql = `SELECT
        b.barCode,
        b.drugCode,
        d.drugName,
      
      IF (
        (
          b.drugCode <> 'CYCL-'
          AND b.drugCode <> 'DEX-O'
          AND b.drugCode <> 'POLY-1'
          AND SUBSTRING(
            b.drugCode,
            LOCATE('-', b.drugCode),
            1
          ) = '-'
        ),
        'Y',
        'N'
      ) AS isPrepack
      FROM
        center.barcode_drug b
      LEFT JOIN pmpf_thailand_mnrh.dictdrug d ON d.drugCode = b.drugCode
      WHERE
        b.barCode = '${val.barcode}'`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
};
