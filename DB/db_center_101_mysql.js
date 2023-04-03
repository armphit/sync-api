const { Console } = require("console");

module.exports = function () {
  const mysql = require("mysql");
  // จริง
  const connection = mysql.createConnection({
    user: "root",
    password: "Admin@gd4",
    host: "192.168.185.101",
    database: "center",
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
      users`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
};
