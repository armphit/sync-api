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
};
