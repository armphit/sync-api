const { Console } = require("console");

module.exports = function () {
  const mysql = require("mysql");

  let connection;
  connectDatabase();
  function connectDatabase() {
    connection = mysql.createPool({
      user: "root",
      password: "Admin@gd4",
      host: "192.168.185.104",
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

  this.addPre = function fill(val, DATA) {
    let name = val.patientname ? val.patientname.split(" ") : [];
    var sql = `
INSERT INTO queue_phar.orders (
	queue,
	number,
	hn,
	vn,
	prescriptionno,
	titleName,
	firstName,
	lastName,
	sex,
	location,
	orderTimeStamp,
	createTime,
	lastModifile
) SELECT
	'${val.queue ? val.queue : ``}',
	NULL,
	'${val.hn ? val.hn : ``}',
	'${val.vn ? val.vn : ``}',
	'${val.prescriptionno ? val.prescriptionno : ``}',
	'${name.length ? name[0] : ``}',
	'${name.length > 1 ? name[1] : ``}',
	'${name.length > 2 ? name[2] : ``}',
	'${val.sex ? (val.sex == "M" ? "ชาย" : "หญิง") : ``}',
	${val.departmentcode ? `'${val.departmentcode}'` : NULL},
	${
    val.timeregit ? `'${val.timeregit}'` : "CURRENT_TIMESTAMP"
  }, CURRENT_TIMESTAMP,
	CURRENT_TIMESTAMP
WHERE
	NOT EXISTS (
		SELECT
			1
		FROM
			queue_phar.orders o
		WHERE
			o.prescriptionno = '${val.prescriptionno ? val.prescriptionno : ``}'
	);



`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
  this.updatePre = function fill(val, DATA) {
    var sql = `UPDATE queue_phar.dbo.prescription
SET prepare_time = CURRENT_TIMESTAMP
WHERE
	hn = '374821'
AND timeconfirm <> ''
AND FORMAT (ordercreate, 'yyyy-MM-dd') = FORMAT (GETDATE(), 'yyyy-MM-dd')`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
  this.getPre = function fill(val, DATA) {
    var sql = `SELECT
		TOP 1 hn AS patientNO,
	Rtrim(title) + ' ' + Rtrim(firstName) + ' ' + Rtrim(lastName) AS patientName,
	FORMAT (GETDATE(), 'yyyy-MM-dd') AS date,
	queue AS QN
FROM
	queue_phar.dbo.prescription o
WHERE
	(hn = '${val}') 
AND FORMAT (o.timeregit, 'yyyy-MM-dd') = FORMAT (GETDATE() - 1, 'yyyy-MM-dd')
ORDER BY
	timeconfirm DESC`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
  this.updatePresame = function fill(val, DATA) {
    var sql = `
UPDATE queue_phar.orders
SET lastModifile = CURRENT_TIMESTAMP
WHERE
	prescriptionno = '${val.prescriptionno ? val.prescriptionno : ``}';`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
};
