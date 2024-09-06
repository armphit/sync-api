const { Console } = require("console");

module.exports = function () {
  const mysql = require("mysql");
  // จริง
  // const connection = mysql.createConnection({
  //   user: "root",
  //   password: "cretem",
  //   host: "192.168.185.102",
  //   database: "center_db",
  // });

  // connectDatabase();
  // function connectDatabase() {
  //   connection.connect(function (err, conn) {
  //     if (err) {
  //       connectDatabase();
  //     } else {
  //       console.log("Connected to CenterDB 102 MySQL");
  //     }
  //   });
  // }
  // connection.connect(function (err) {
  //   if (err) throw err;
  //   console.log("Connected to Center 101 MySQL");
  // });
  let connection;
  connectDatabase();
  function connectDatabase() {
    connection = mysql.createPool({
      user: "root",
      password: "cretem",
      host: "192.168.185.102",
      database: "center_db",
      queueLimit: 0,
    });

    return connection;
  }
  connection.on("connection", (connection) => {
    console.log("Connected to center_db MySQL.");
  });

  connection.on("error", (err) => {
    console.error("Error center_db MySQ:", err.message);
    connectDatabase();
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
