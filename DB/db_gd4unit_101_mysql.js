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

    // ,
    // clicksend = (select * from (SELECT max(clicksend)+1 FROM synclastupdate_opd WHERE hn = '` +
    // val.hn.trim() +
    // `' LIMIT 1) t

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

  this.getPatientSync = function fill(val, DATA) {
    var sql =
      `SELECT
      @rn :=@rn + 1 AS indexrow,
      t1.hn,
      t1.patientname,
      t1.prescriptionno,
      t1.patientdob,
      t1.age,
      t1.sex,
      t1.readdatetime,
      t1.sendMachine,
      t1.birthTH
  FROM
      (
          SELECT
              pre.patientdob as birthTH,
              syn.prescriptionno,
              syn.hn,
              pre.patientname,
              syn.readdatetime,
  
      syn.status as sendMachine,
      DATE_SUB(
          pre.patientdob,
          INTERVAL 543 YEAR
      ) AS patientdob,
      YEAR (
          FROM_DAYS(
              DATEDIFF(
                  NOW(),
                  DATE_SUB(
                      pre.patientdob,
                      INTERVAL 543 YEAR
                  )
              )
          )
      ) AS age,
      MAX(pre.sex) AS sex
  FROM
      synclastupdate_OPD AS syn,
      prescription AS pre
  WHERE
      syn.hn = pre.hn
      AND syn.realdate = '` +
      val +
      `'
  GROUP BY
      syn.hn,
      syn.readdatetime,
      pre.patientname,
      pre.patientdob
  ORDER BY syn.readdatetime DESC) t1, (SELECT @rn:=0) t2`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };

  this.getDrugSync = function fill(val, DATA) {
    var sql =
      `SELECT
      prescriptionno,
      sex,
      IF (
          DATE_SUB(patientdob, INTERVAL 543 YEAR),
          DATE_SUB(patientdob, INTERVAL 543 YEAR),
          DATE_SUB(
              DATE_SUB(
                  patientdob - 1,
                  INTERVAL 543 YEAR
              ),
              INTERVAL - 1 DAY
          )
      ) AS patientdob,
      patientdob AS birth,
      orderitemcode,
      orderitemname,
      FLOOR(orderqty) AS orderqty,
      orderunitcode,
      lastmodified as ordercreatedate,
      'true' AS status
  FROM
      prescription
  WHERE
      hn = '` +
      val.hn +
      `'
  AND CAST(lastmodified AS DATE) = '` +
      val.date +
      `'`;

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
