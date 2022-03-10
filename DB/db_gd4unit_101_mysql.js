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
        readdatetime
      )
      VALUES
        (
          '` +
      val.prescriptionno +
      `',
          '` +
      val.hn +
      `',
          CURDATE(),
          CURRENT_TIMESTAMP()
        )`;

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
      val.prescriptionno +
      `',
         '` +
      val.seq +
      `',
         '` +
      val.hn +
      `',
         '` +
      val.patientname +
      `',
         '` +
      val.sex +
      `',
         '` +
      val.patientdob +
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
      val.orderitemcode +
      `',
         '` +
      val.orderitemname +
      `',
         '` +
      val.orderqty +
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
