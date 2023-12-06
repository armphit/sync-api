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
    let freetext2 = val.freetext2
      ? val.freetext2.replace("'", " ")
      : val.freetext2;

    let freetext1 = val.freetext1
      ? val.freetext1.replace("'", " ")
      : val.freetext1;

    let itemidentify = val.itemidentify
      ? val.itemidentify.replace("'", " ")
      : val.itemidentify;
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
        datetimestamp,
        dosage,
        freetext1,
        queue
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
      freetext2 +
      `',
      '` +
      itemidentify +
      `',
      '` +
      val.rightname +
      `',
      CURRENT_TIMESTAMP,
      '` +
      val.dosage +
      `',
      '` +
      freetext1 +
      `',
      '` +
      val.queue +
      `'
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
        pre.patientdob AS birthTH,
        syn.prescriptionno,
        syn.hn,
        pre.patientname,
        syn.readdatetime,
        syn. STATUS AS sendMachine,
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
      UNION
        SELECT
          pre2.patientdob AS birthTH,
          syn2.prescriptionno,
          syn2.hn,
          pre2.patientname,
          syn2.readdatetime,
          syn2. STATUS AS sendMachine,
          DATE_SUB(
            pre2.patientdob,
            INTERVAL 543 YEAR
          ) AS patientdob,
          YEAR (
            FROM_DAYS(
              DATEDIFF(
                NOW(),
                DATE_SUB(
                  pre2.patientdob,
                  INTERVAL 543 YEAR
                )
              )
            )
          ) AS age,
          MAX(pre2.sex) AS sex
        FROM
          gd4unit_bk.synclastupdate_OPD AS syn2,
          gd4unit_bk.prescription AS pre2
        WHERE
          syn2.hn = pre2.hn
        AND syn2.realdate = '` +
      val +
      `'
        GROUP BY
          syn2.hn,
          syn2.readdatetime,
          pre2.patientname,
          pre2.patientdob
        ORDER BY
          readdatetime DESC) t1, (SELECT @rn:=0) t2`;

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
     lastmodified AS ordercreatedate,
     'true' AS STATUS
    FROM
      prescription
    WHERE
      hn = '` +
      val.hn +
      `'
    AND CAST(lastmodified AS DATE) = '` +
      val.date +
      `'
    UNION
      SELECT
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
      lastmodified AS ordercreatedate,
      'true' AS STATUS
    FROM
      gd4unit_bk.prescription gb
    WHERE
      gb.hn = '` +
      val.hn +
      `'
    AND CAST(gb.lastmodified AS DATE) = '` +
      val.date +
      `'`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };

  this.getDrug101 = function fill(val, DATA) {
    var sql =
      `SELECT
    queue,
    hn,
    CONVERT(	DATE_SUB(
      datetimestamp,
      INTERVAL 4 MINUTE
    ),CHAR) timestamp,
    CONVERT(CAST(p.datetimestamp AS DATE), CHAR) date
  FROM
    prescription p
  WHERE
    CAST(p.datetimestamp AS DATE)  BETWEEN '` +
      val.datestart +
      `'
      AND '` +
      val.dateend +
      `'
      AND TIME_FORMAT(p.datetimestamp , '%H:%i:%s') BETWEEN '` +
      val.time1 +
      `' AND '` +
      val.time2 +
      `'
  UNION
    SELECT
      queue,
      hn,
      CONVERT(	DATE_SUB(
        datetimestamp,
        INTERVAL 4 MINUTE
      ),CHAR) datetimestamp,
      CONVERT(CAST(gb.datetimestamp AS DATE), CHAR) date
    FROM
      gd4unit_bk.prescription gb
    WHERE
      CAST(gb.datetimestamp AS DATE) BETWEEN '` +
      val.datestart +
      `'
        AND '` +
      val.dateend +
      `'
      AND TIME_FORMAT(gb.datetimestamp , '%H:%i:%s') BETWEEN '` +
      val.time1 +
      `' AND '` +
      val.time2 +
      `'`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };

  this.getDrugQ = function fill(val, DATA) {
    var sql = `SELECT
      queue,
      COUNT(*) item
    FROM
      prescription
    WHERE
      CAST(lastmodified AS DATE) BETWEEN '${val.date1}'
      AND '${val.date2}'
      AND TIME_FORMAT(lastmodified, '%H:%i:%s') BETWEEN '${val.time1}'
      AND '${val.time2}'
    GROUP BY
      queue
    UNION
      SELECT
        queue,
        COUNT(*)
      FROM
        gd4unit_bk.prescription
      WHERE
        CAST(lastmodified AS DATE) BETWEEN '${val.date1}'
        AND '${val.date2}'
        AND TIME_FORMAT(lastmodified, '%H:%i:%s') BETWEEN '${val.time1}'
        AND '${val.time2}'
      GROUP BY
        queue`;
    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
  this.getsiteQ = function fill(val, DATA) {
    var sql = `
    SELECT
    queue,
    CONVERT (
      SUBSTR(queue, 2, LENGTH(queue)),
      UNSIGNED
    ) num
  FROM
    prescription
  WHERE
    departmentcode = 'W9'
  GROUP BY
    queue
  ORDER BY
    num DESC
  LIMIT 1`;
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

  this.getqp = function fill(val, DATA) {
    var sql = `
    SELECT
                hn 'patientNO',
                queue 'QN'
            FROM
                prescription
            WHERE
                CAST(datetimestamp AS Date) BETWEEN '${val.date1}'
            AND '${val.date2}'
            AND queue LIKE 'P%'
            GROUP BY QN
            UNION
                SELECT
                hn 'patientNO',
                queue 'QN'
                FROM
                    gd4unit_bk.prescription
                WHERE
                    CAST(datetimestamp AS Date) BETWEEN '${val.date1}'
                    AND '${val.date2}'
                AND queue LIKE 'P%'
                GROUP BY QN`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
};
