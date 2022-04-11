const { Console } = require("console");

module.exports = function () {
  const mysql = require("mysql");
  // จริง
  const connection = mysql.createConnection({
    user: "root",
    password: "Admin@gd4",
    host: "192.168.185.101",
    database: "gd4unit",
  });

  connection.connect(function (err) {
    if (err) throw err;
    console.log("Connected to GD4Unit 101 MySQL");
  });

  this.fill = function fill(val, DATA) {
    var sql =
      `INSERT INTO synclastupdate_opd (
        prescriptionno,
        hn,
        createdate,
        readdatetime,
        status,
        realdate
      )
      VALUES
        (
          '` +
      val.prescriptionno.trim() +
      `',
          '` +
      val.hn.trim() +
      `',
          CURDATE(),
          CURRENT_TIMESTAMP(),
          'Y',
          '` +
      val.date +
      `'
        )
        ON DUPLICATE KEY UPDATE 
        readdatetime = CURRENT_TIMESTAMP(),
        realdate  = '` +
      val.date +
      `'`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };

  this.insertDrug = function fill(val, DATA) {
    var sql =
      `INSERT INTO  prescription  (
        prescriptionno ,
        seq ,
        hn ,
        patientname ,
        sex ,
        patientdob ,
        lastmodified ,
        takedate ,
        ordercreatedate ,
        orderitemcode ,
        orderitemname ,
        orderqty ,
        orderunitcode ,
        departmentcode ,
        departmentdesc ,
        freetext2 ,
        itemidentify ,
        rightname ,
        datetimestamp
     )
     VALUES
       (
         '` +
      val.prescriptionno.trim() +
      `',
         '` +
      val.seq.trim() +
      `',
         '` +
      val.hn.trim() +
      `',
         '` +
      val.patientname.trim() +
      `',
         '` +
      val.sex +
      `',
         '` +
      val.patientdob.trim() +
      `',
         '` +
      val.lastmodified +
      `',
         '` +
      val.takedate +
      `',
         '` +
      val.ordercreatedate +
      `',
         '` +
      val.orderitemcode.trim() +
      `',
         '` +
      val.orderitemname.trim() +
      `',
         '` +
      val.orderqty.trim() +
      `',
         '` +
      val.orderunitcode +
      `',
      '` +
      val.departmentcode +
      `',
      '` +
      val.departmentdesc +
      `',
      '` +
      val.freetext2 +
      `',
      '` +
      val.itemidentify +
      `',
      '` +
      val.rightname +
      `',
      CURRENT_TIMESTAMP
      )`;

    return new Promise(function (resolve, reject) {
      resolve(sql);
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };

  this.checkPatient = function fill(val, DATA) {
    var sql =
      `SELECT
      hn,
      DATE_FORMAT(p.lastmodified, '%h:%i') AS ordertime
   FROM
      prescription p
   WHERE
      date_format(datetimestamp, '%Y-%m-%d') = CURRENT_DATE
   AND p.hn = '` +
      val +
      `'
   GROUP BY
      date_format(p.lastmodified, '%H:%i')`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };

  String.prototype.padL = function padL(n) {
    var target = this;
    while (target.length < 7) {
      target = n + target;
    }
    return target;
  };
};
