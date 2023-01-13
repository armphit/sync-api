const { Console } = require("console");

module.exports = function () {
  const mysql = require("mysql");
  // จริง
  const connection = mysql.createConnection({
    user: "root",
    password: "cretem",
    host: "192.168.185.102",
    database: "center",
  });

  connection.connect(function (err) {
    if (err) throw err;
    console.log("Connected to Center 102 MySQL");
  });

  this.fill = function fill(val, DATA) {
    var sql =
      `SELECT QN
      FROM hospitalq
      WHERE  CONVERT(createDT,DATE) = CURRENT_DATE()
      AND SUBSTRING(QN, 1, 1) = 2
      AND patientNO = '` +
      val +
      `'
      ORDER BY createDT DESC`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };

  this.dataQ = function fill(val, DATA) {
    var sql =
      `SELECT
      patientNO,QN,patientName,createDT,timestamp
  FROM
      hospitalQ LEFT JOIN moph_confirm on qn = queue and patientNO = hn
  
  WHERE
  date = '` +
      val.date +
      `'
  AND patientNO = '` +
      val.hn +
      `'
  ORDER BY createDT`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };

  this.hn_moph_patient = function fill(val, DATA) {
    var sql =
      //   `SELECT
      //   s.patientID,
      //   drugAllergy,
      //   timestamp,
      //   cid
      // FROM
      //   moph_sync s
      //   LEFT JOIN (SELECT
      //     TIMESTAMP,hn
      //   FROM
      //     moph_confirm
      //   WHERE
      //     CAST(timestamp AS Date) = CURDATE())c ON s.patientID = c.hn
      // WHERE s.patientID = ` +
      //   val +
      //   `
      // ORDER BY
      //   drugAllergy`;
      `SELECT
    q.patientNO,
    MAX(q.QN) AS QN,
    c. timestamp,
    s.cid,
    s.createdDT,
    s.drugAllergy
  FROM
    hospitalq q
  LEFT JOIN (
    SELECT
      timestamp,
      hn,
      queue
    FROM
      moph_confirm
    WHERE
      CAST(timestamp AS Date) = CURDATE()
  ) c ON q.QN = c.queue
  LEFT JOIN moph_sync s ON s.patientID = q.patientNO
  WHERE
    patientNO =   ` +
      val +
      `
  AND date = CURDATE()
  AND QN like '2%'
  GROUP BY
    patientNO`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };

  this.hn_moph_maharat = function fill(val, DATA) {
    var sql =
      `SELECT
      drugcode
    FROM
      moph_drugs
    WHERE
      moph_drugs.hospcode <> 10666
    AND cid = '` +
      val +
      `'
    LIMIT 1
    `;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };

  this.site_maharat = function fill(val, DATA) {
    var sql =
      `SELECT site_name,site_tel
      FROM mhr_site
      WHERE site_code = '` +
      val.floor +
      `'
    `;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };

  this.insertPhar = function fill(val, DATA) {
    var sql =
      `INSERT INTO pharmacist (
        id_phar,
        name_phar,
        createtimestamp
      )
      VALUES
        (
          '` +
      val.id +
      `',
      '` +
      val.name +
      `',
      CURRENT_TIMESTAMP()
        )`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
};
