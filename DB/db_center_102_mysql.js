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
};
