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
      `SELECT
      s.patientID,
      drugAllergy,
      timestamp
    FROM
      moph_sync s
    LEFT JOIN moph_confirm c ON s.patientID = c.hn
    WHERE s.patientID = '` +
      val +
      `'
    ORDER BY
      drugAllergy`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
};
