const { Console } = require("console");

module.exports = function () {
  const mysql = require("mysql");
  // จริง
  const connection = mysql.createConnection({
    user: "root",
    password: "cretem",
    host: "192.168.185.102",
    database: "center_db",
  });

  connection.connect(function (err) {
    if (err) throw err;
    console.log("Connected to Center 101 MySQL");
  });

  this.getUser = function fill(val, DATA) {
    var sql = `SELECT
      user,
      name
    FROM
      users
    WHERE status = "Y"
    AND user NOT IN ('test','admin')`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
};
