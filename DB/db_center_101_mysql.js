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
  this.insertDrugreturn = function fill(val, DATA) {
    var sql = `INSERT INTO stock.card_93 (
	patientNo,
	patientName,
	patientBD,
	patientVD,
	patientVN,
	patientSex,
	patientAge,
	patientAdd,
	patientRight,
	docCode,
	deptCode,
	pharCode,
	marker,
	drugCode,
	drugName,
	returnQty,
	dosageunitcode,
	reason,
	createDT,
	location
)
VALUES
	(
		' 513129',
		'นายชื่น เที่ยงกระโทก',
		'',
		'',
		'0022',
		'',
		'',
		'',
		'',
		'',
		'',
		'P62',
		'P62',
		'ASAM',
		'ASPENT- M 81 MG [ร][*G*]*',
		'20',
		'TAB',
		'',
		'2024-11-29 16:36:05',
		'R93'
	);
    `;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
};
