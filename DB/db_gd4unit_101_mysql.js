// const { Console } = require("console");

// module.exports = function () {
//   const mysql = require("mysql");
//   // จริง
//   // const connection = mysql.createConnection({
//   //   user: "root",
//   //   password: "cretem",
//   //   host: "192.168.185.102",
//   //   database: "gd4unit",
//   // });

//   // connection.connect(function (err) {
//   //   if (err) throw err;
//   //   console.log("Connected to GD4Unit 101 MySQL");
//   // });

//   let connection;
//   connectDatabase();
//   function connectDatabase() {
//     connection = mysql.createPool({
//       user: "root",
//       password: "cretem",
//       host: "192.168.185.102",
//       database: "gd4unit",
//       queueLimit: 0,
//     });

//     return connection;
//   }
//   connection.on("connection", (connection) => {
//     console.log("Connected to gd4unit MySQL.");
//   });

//   connection.on("error", (err) => {
//     console.error("Error gd4unit MySQ:", err.message);
//     connectDatabase();
//   });

//   this.fill = function fill(val, DATA) {
//     var sql =
//       `INSERT INTO synclastupdate_opd (
//         prescriptionno,
//         hn,
//         createdate,
//         readdatetime,
//         status,
//         realdate

//       )
//       VALUES
//         (
//           '` +
//       val.prescriptionno.trim() +
//       `',
//           '` +
//       val.hn.trim() +
//       `',
//           CURDATE(),
//           CURRENT_TIMESTAMP(),
//           'Y',
//           '` +
//       val.date +
//       `'
//         )
//         ON DUPLICATE KEY UPDATE
//         readdatetime = CURRENT_TIMESTAMP(),
//         realdate  = '` +
//       val.date +
//       `'`;

//     // ,
//     // clicksend = (select * from (SELECT max(clicksend)+1 FROM synclastupdate_opd WHERE hn = '` +
//     // val.hn.trim() +
//     // `' LIMIT 1) t

//     return new Promise(function (resolve, reject) {
//       connection.query(sql, function (err, result, fields) {
//         if (err) throw err;
//         resolve(result);
//       });
//     });
//   };

//   this.insertDrug = function fill(val, DATA) {
//     let freetext2 = val.freetext2
//       ? val.freetext2.replace("'", " ")
//       : val.freetext2;

//     let freetext1 = val.freetext1
//       ? val.freetext1.replace("'", " ")
//       : val.freetext1;

//     let itemidentify = val.itemidentify
//       ? val.itemidentify.replace("'", " ")
//       : val.itemidentify;
//     let orderitemname = val.orderitemname
//       ? val.orderitemname.trim()
//       : val.orderitemname;
//     var sql =
//       `INSERT INTO  prescription  (
//         prescriptionno ,
//         seq ,
//         hn ,
//         patientname ,
//         sex ,
//         patientdob ,
//         lastmodified ,
//         takedate ,
//         ordercreatedate ,
//         orderitemcode ,
//         orderitemname ,
//         orderqty ,
//         orderunitcode ,
//         departmentcode ,
//         departmentdesc ,
//         freetext2 ,
//         itemidentify ,
//         rightname ,
//         datetimestamp,
//         dosage,
//         freetext1,
//         queue
//      )
//      VALUES
//        (
//          '` +
//       val.prescriptionno.trim() +
//       `',
//          '` +
//       val.seq.trim() +
//       `',
//          '` +
//       val.hn.trim() +
//       `',
//          '` +
//       val.patientname.trim() +
//       `',
//          '` +
//       val.sex +
//       `',
//          '` +
//       val.patientdob.trim() +
//       `',
//          '` +
//       val.lastmodified +
//       `',
//          '` +
//       val.takedate +
//       `',
//          '` +
//       val.ordercreatedate +
//       `',
//          '` +
//       val.orderitemcode.trim() +
//       `',
//          '` +
//       orderitemname +
//       `',
//          '` +
//       val.orderqty.trim() +
//       `',
//          '` +
//       val.orderunitcode +
//       `',
//       '` +
//       val.departmentcode +
//       `',
//       '` +
//       val.departmentdesc +
//       `',
//       '` +
//       freetext2 +
//       `',
//       '` +
//       itemidentify +
//       `',
//       '` +
//       val.rightname +
//       `',
//       CURRENT_TIMESTAMP,
//       '` +
//       val.dosage +
//       `',
//       '` +
//       freetext1 +
//       `',
//       '` +
//       val.queue +
//       `'
//       )`;

//     return new Promise(function (resolve, reject) {
//       resolve(sql);
//       connection.query(sql, function (err, result, fields) {
//         if (err) throw err;
//         resolve(result);
//       });
//     });
//   };

//   this.checkPatient = function fill(val, DATA) {
//     var sql =
//       `SELECT
//       hn,
//       DATE_FORMAT(p.lastmodified, '%H:%i') AS ordertime
//    FROM
//       prescription p
//    WHERE
//       date_format(datetimestamp, '%Y-%m-%d') = CURRENT_DATE
//    AND p.hn = '` +
//       val +
//       `'
//    GROUP BY
//       date_format(p.lastmodified, '%H:%i')`;

//     return new Promise(function (resolve, reject) {
//       connection.query(sql, function (err, result, fields) {
//         if (err) throw err;
//         resolve(result);
//       });
//     });
//   };

//   this.checkPatientcheckmed = function fill(val, DATA) {
//     var sql =
//       `SELECT
//       hn,
//       DATE_FORMAT(p.lastmodified, '%h:%i') AS ordertime
//    FROM
//       center_db.checkmed p
//    WHERE
//       date_format(p.lastmodified, '%Y-%m-%d') = CURRENT_DATE
//    AND p.hn = '` +
//       val +
//       `'
//    GROUP BY
//       date_format(p.lastmodified, '%H:%i')`;

//     return new Promise(function (resolve, reject) {
//       connection.query(sql, function (err, result, fields) {
//         if (err) throw err;
//         resolve(result);
//       });
//     });
//   };

//   this.getPatientSync = function fill(val, DATA) {
//     var sql =
//       `SELECT
//       @rn :=@rn + 1 AS indexrow,
//       t1.hn,
//       t1.patientname,
//       t1.prescriptionno,
//       t1.patientdob,
//       t1.age,
//       t1.sex,
//       t1.readdatetime,
//       t1.sendMachine,
//       t1.birthTH
//   FROM
//       (
//         SELECT
//         pre.patientdob AS birthTH,
//         syn.prescriptionno,
//         syn.hn,
//         pre.patientname,
//         syn.readdatetime,
//         syn. STATUS AS sendMachine,
//         DATE_SUB(
//           pre.patientdob,
//           INTERVAL 543 YEAR
//         ) AS patientdob,
//         YEAR (
//           FROM_DAYS(
//             DATEDIFF(
//               NOW(),
//               DATE_SUB(
//                 pre.patientdob,
//                 INTERVAL 543 YEAR
//               )
//             )
//           )
//         ) AS age,
//         MAX(pre.sex) AS sex
//       FROM
//         synclastupdate_OPD AS syn,
//         prescription AS pre
//       WHERE
//         syn.hn = pre.hn
//       AND CAST(syn.readdatetime AS Date) = '` +
//       val +
//       `'
//       GROUP BY
//         syn.hn,
//         syn.readdatetime,
//         pre.patientname,
//         pre.patientdob
//       UNION
//         SELECT
//           pre2.patientdob AS birthTH,
//           syn2.prescriptionno,
//           syn2.hn,
//           pre2.patientname,
//           syn2.readdatetime,
//           syn2. STATUS AS sendMachine,
//           DATE_SUB(
//             pre2.patientdob,
//             INTERVAL 543 YEAR
//           ) AS patientdob,
//           YEAR (
//             FROM_DAYS(
//               DATEDIFF(
//                 NOW(),
//                 DATE_SUB(
//                   pre2.patientdob,
//                   INTERVAL 543 YEAR
//                 )
//               )
//             )
//           ) AS age,
//           MAX(pre2.sex) AS sex
//         FROM
//           gd4unit_bk.synclastupdate_OPD AS syn2,
//           gd4unit_bk.prescription AS pre2
//         WHERE
//           syn2.hn = pre2.hn
//           AND CAST(syn2.readdatetime AS Date) = '` +
//       val +
//       `'
//         GROUP BY
//           syn2.hn,
//           syn2.readdatetime,
//           pre2.patientname,
//           pre2.patientdob
//         ORDER BY
//           readdatetime DESC) t1, (SELECT @rn:=0) t2`;

//     return new Promise(function (resolve, reject) {
//       connection.query(sql, function (err, result, fields) {
//         if (err) throw err;
//         resolve(result);
//       });
//     });
//   };

//   this.getDrugSync = function fill(val, DATA) {
//     var sql =
//       `SELECT
//       prescriptionno,
//       sex,

//     IF (
//       DATE_SUB(patientdob, INTERVAL 543 YEAR),
//       DATE_SUB(patientdob, INTERVAL 543 YEAR),
//       DATE_SUB(
//         DATE_SUB(
//           patientdob - 1,
//           INTERVAL 543 YEAR
//         ),
//         INTERVAL - 1 DAY
//       )
//     ) AS patientdob,
//      patientdob AS birth,
//      orderitemcode,
//      orderitemname,
//      FLOOR(orderqty) AS orderqty,
//      orderunitcode,
//      lastmodified AS ordercreatedate,
//      'true' AS STATUS
//     FROM
//       prescription
//     WHERE
//       hn = '` +
//       val.hn +
//       `'
//     AND CAST(lastmodified AS DATE) = '` +
//       val.date +
//       `'
//     UNION
//       SELECT
//         prescriptionno,
//         sex,

//       IF (
//         DATE_SUB(patientdob, INTERVAL 543 YEAR),
//         DATE_SUB(patientdob, INTERVAL 543 YEAR),
//         DATE_SUB(
//           DATE_SUB(
//             patientdob - 1,
//             INTERVAL 543 YEAR
//           ),
//           INTERVAL - 1 DAY
//         )
//       ) AS patientdob,
//       patientdob AS birth,
//       orderitemcode,
//       orderitemname,
//       FLOOR(orderqty) AS orderqty,
//       orderunitcode,
//       lastmodified AS ordercreatedate,
//       'true' AS STATUS
//     FROM
//       gd4unit_bk.prescription gb
//     WHERE
//       gb.hn = '` +
//       val.hn +
//       `'
//     AND CAST(gb.lastmodified AS DATE) = '` +
//       val.date +
//       `'`;

//     return new Promise(function (resolve, reject) {
//       connection.query(sql, function (err, result, fields) {
//         if (err) throw err;
//         resolve(result);
//       });
//     });
//   };

//   String.prototype.padL = function padL(n) {
//     var target = this;
//     while (target.length < 7) {
//       target = n + target;
//     }
//     return target;
//   };

//   this.datadrugX = function fill(val, DATA) {
//     var sql =
//       `SELECT
//       dd.drugID,
//       dd.drugCode,
//       dd.drugName,
//       dd.HisPackageRatio,
//       GROUP_CONCAT(de.deviceCode) AS deviceCode,
//       CASE
//     WHEN locate('-', drugCode) > 0
//     AND dd.drugCode <> 'CYCL-'
//     AND dd.drugCode <> 'DEX-O'
//     AND dd.drugCode <> 'POLY-1'
//     AND de.deviceCode = 'Xmed1' THEN
//       'Y'
//     ELSE
//       'N'
//     END AS isPrepack
//     FROM
//     center_db.devicedrugsetting ds
//     INNER JOIN center_db.device de ON ds.deviceID = de.deviceID
//     LEFT JOIN center_db.dictdrug dd ON dd.drugID = ds.drugID
//     WHERE
//       dd.drugCode IS NOT NULL
//       AND de.deviceCode = '` +
//       val.lo +
//       `'
//   AND dd.drugCode like '` +
//       val.code +
//       `%'
//     GROUP BY
//       dd.drugCode
//     ORDER BY
//       dd.HisPackageRatio DESC`;

//     return new Promise(function (resolve, reject) {
//       connection.query(sql, function (err, result, fields) {
//         if (err) throw err;
//         resolve(result);
//       });
//     });
//   };

//   this.datadrugMain = function fill(val, DATA) {
//     var sql =
//       `SELECT
//       dd.drugID,
//       dd.drugCode,
//       dd.drugName,
//       dd.HisPackageRatio,
//       GROUP_CONCAT(de.deviceCode) AS deviceCode
//   FROM
//   center_db.devicedrugsetting ds
//   INNER JOIN center_db.device de ON ds.deviceID = de.deviceID
//   LEFT JOIN center_db.dictdrug dd ON dd.drugID = ds.drugID
//   WHERE
//   (
//     dd.drugCode NOT LIKE '%-1%'
//       AND dd.drugCode NOT LIKE '%-2%'
//       AND dd.drugCode NOT LIKE '%-3%'
//       AND dd.drugCode NOT LIKE '%-4%'
//       AND dd.drugCode NOT LIKE '%-5%'
//       OR dd.drugCode = 'poly-1'
//   )
//   AND    dd.drugCode IS NOT NULL
//   AND de.deviceCode = '` +
//       val.lo +
//       `'
//   AND dd.drugCode = '` +
//       val.code +
//       `'
//   GROUP BY
//       dd.drugCode`;

//     return new Promise(function (resolve, reject) {
//       connection.query(sql, function (err, result, fields) {
//         if (err) throw err;
//         resolve(result);
//       });
//     });
//   };

//   this.insertDrugcheck = function fill(val, DATA) {
//     let sql = `INSERT INTO center_db.checkmed (
//       rowNum,
//       prescriptionno,
//       seq,
//       hn,
//       patientname,
//       sex,
//       patientdob,
//       drugCode,
//       drugName,
//       drugNameTh,
//       qty,
//       unitCode,
//       departmentcode,
//       righttext1,
//       righttext2,
//       righttext3,
//       lamedName,
//       dosage,
//       freetext0,
//       freetext1,
//       freetext2,
//       itemidentify,
//       qrCode,
//       ordercreatedate,
//       lastmodified,
//       checkstamp,
//       checkqty,
//       scantimestamp
//       )
//       VALUES(${val.count},${val.comma},null,'${val.qty}','${val.date}' )

//       `;

//     return new Promise(function (resolve, reject) {
//       connection.query(sql, function (err, result, fields) {
//         if (err) throw err;
//         resolve(result);
//       });
//     });
//   };

//   this.selectcheckmed = function fill(val, DATA) {
//     let sql =
//       `SELECT
//       (SELECT
//         MAX(seq)
//             FROM
//             center_db.checkmed

//             WHERE
//               hn = '` +
//       val +
//       `'
//         GROUP BY hn) AS countDrug,
//       pc.*,img.pathImage
// FROM
//     center_db.checkmed pc
// LEFT JOIN (
//     SELECT
//         drugCode,
//         MIN(pathImage) AS pathImage
//     FROM
//         center_db.drug_image
//     GROUP BY
//         drugCode
// ) img ON TRIM(pc.drugCode) = TRIM(img.drugCode)
// WHERE hn = '` +
//       val +
//       `'
// AND CAST(pc.ordercreatedate AS Date) = CURDATE()
// ORDER BY checkstamp

//       `;

//     return new Promise(function (resolve, reject) {
//       connection.query(sql, function (err, result, fields) {
//         if (err) throw err;
//         resolve(result);
//       });
//     });
//   };

//   this.insertPatient = function fill(val, DATA) {
//     var sql =
//       `
//       INSERT INTO center_db.checkmedpatient (hn, STATUS, date, TIMESTAMP)
//       VALUES
//         (
//           '` +
//       val +
//       `',
//           NULL,
//           CURRENT_DATE (),
//           CURRENT_TIMESTAMP ()
//         ) ON DUPLICATE KEY UPDATE TIMESTAMP = CURRENT_TIMESTAMP ()`;

//     return new Promise(function (resolve, reject) {
//       connection.query(sql, function (err, result, fields) {
//         if (err) throw err;
//         resolve(result);
//       });
//     });
//   };
//   this.dataPatient = function fill(val, DATA) {
//     var sql =
//       `SELECT
// 			*
// 		FROM
// 			center_db.checkmedpatient_copy
// 	WHERE
// 		hn = '` +
//       val +
//       `'
// 	AND date = CURRENT_DATE ()`;

//     return new Promise(function (resolve, reject) {
//       connection.query(sql, function (err, result, fields) {
//         if (err) throw err;
//         resolve(result);
//       });
//     });
//   };

//   this.insertPatient_copy = function fill(val, DATA) {
//     var sql =
//       `INSERT INTO center_db.checkmedpatient_copy (
//         id,
//         hn,
//         userCheck,
//         date,
//         timestamp,
//         isDelete,
//         userDelete
//       )
//       VALUES
//         (
//           uuid(),
//               '` +
//       val +
//       `',
//           'admin',
//           CURRENT_DATE (),
//           CURRENT_TIMESTAMP (),
//           NULL,
//           NULL
//         )`;
//     return new Promise(function (resolve, reject) {
//       connection.query(sql, function (err, result, fields) {
//         if (err) throw err;
//         resolve(result);
//       });
//     });
//   };
//   this.getpatient = function fill(val, DATA) {
//     var sql =
//       `SELECT
//       *
//     FROM
//       center_db.checkmedpatient_copy
//     WHERE
//       hn = '` +
//       val +
//       `'
//     AND date = CURRENT_DATE ()
//     AND isDelete IS NULL`;
//     return new Promise(function (resolve, reject) {
//       connection.query(sql, function (err, result, fields) {
//         if (err) throw err;
//         resolve(result);
//       });
//     });
//   };

//   this.checkPatientcheckmed_copy = function fill(val, DATA) {
//     var sql =
//       `SELECT
//       hn,
//       DATE_FORMAT(p.lastmodified, '%h:%i') AS ordertime
//    FROM
//       center_db.checkmed_copy p
//    WHERE
//       date_format(p.lastmodified, '%Y-%m-%d') = CURRENT_DATE
//    AND p.cmp_id = '` +
//       val +
//       `'
//    GROUP BY
//       date_format(p.lastmodified, '%H:%i')`;

//     return new Promise(function (resolve, reject) {
//       connection.query(sql, function (err, result, fields) {
//         if (err) throw err;
//         resolve(result);
//       });
//     });
//   };
//   this.getDrug101 = function fill(val, DATA) {
//     var sql =
//       `SELECT
//     queue,
//     hn,
//     CONVERT(	DATE_SUB(
//       datetimestamp,
//       INTERVAL 4 MINUTE
//     ),CHAR) timestamp,
//     CONVERT(CAST(p.datetimestamp AS DATE), CHAR) date
//   FROM
//     prescription p
//   WHERE
//     CAST(p.datetimestamp AS DATE)  BETWEEN '` +
//       val.datestart +
//       `'
//       AND '` +
//       val.dateend +
//       `'
//       AND TIME_FORMAT(p.datetimestamp , '%H:%i:%s') BETWEEN '` +
//       val.time1 +
//       `' AND '` +
//       val.time2 +
//       `'
//   UNION
//     SELECT
//       queue,
//       hn,
//       CONVERT(	DATE_SUB(
//         datetimestamp,
//         INTERVAL 4 MINUTE
//       ),CHAR) datetimestamp,
//       CONVERT(CAST(gb.datetimestamp AS DATE), CHAR) date
//     FROM
//       gd4unit_bk.prescription gb
//     WHERE
//       CAST(gb.datetimestamp AS DATE) BETWEEN '` +
//       val.datestart +
//       `'
//         AND '` +
//       val.dateend +
//       `'
//       AND TIME_FORMAT(gb.datetimestamp , '%H:%i:%s') BETWEEN '` +
//       val.time1 +
//       `' AND '` +
//       val.time2 +
//       `'`;

//     return new Promise(function (resolve, reject) {
//       connection.query(sql, function (err, result, fields) {
//         if (err) throw err;
//         resolve(result);
//       });
//     });
//   };

//   this.getsiteQ = function fill(val, DATA) {
//     var sql = `
//     SELECT
//     queue,
//     CONVERT (
//       SUBSTR(queue, 2, LENGTH(queue)),
//       UNSIGNED
//     ) num
//   FROM
//     prescription
//   WHERE
//   departmentcode = 'W8'
// 	AND queue LIKE 'P%'
//   GROUP BY
//     queue
//   ORDER BY
//     num DESC
//   LIMIT 1`;
//     return new Promise(function (resolve, reject) {
//       connection.query(sql, function (err, result, fields) {
//         if (err) throw err;
//         resolve(result);
//       });
//     });
//   };
//   this.getqp = function fill(val, DATA) {
//     var sql = `
//     SELECT
//                 hn 'patientNO',
//                 queue 'QN'
//             FROM
//                 prescription
//             WHERE
//                 CAST(datetimestamp AS Date) BETWEEN '${val.date1}'
//             AND '${val.date2}'
//             AND queue LIKE 'P%'
//             GROUP BY QN
//             UNION
//                 SELECT
//                 hn 'patientNO',
//                 queue 'QN'
//                 FROM
//                     gd4unit_bk.prescription
//                 WHERE
//                     CAST(datetimestamp AS Date) BETWEEN '${val.date1}'
//                     AND '${val.date2}'
//                 AND queue LIKE 'P%'
//                 GROUP BY QN`;

//     return new Promise(function (resolve, reject) {
//       connection.query(sql, function (err, result, fields) {
//         if (err) throw err;
//         resolve(result);
//       });
//     });
//   };
//   this.getsiteQhn = function fill(val, DATA) {
//     var sql = `
//     SELECT
//     queue,
//     CONVERT (
//       SUBSTR(queue, 2, LENGTH(queue)),
//       UNSIGNED
//     ) num
//   FROM
//     prescription
//   WHERE
//     departmentcode = 'W8'
//   AND hn = '${val.hn.trim()}'
//   GROUP BY
//     queue
//   ORDER BY
//     num DESC
//   LIMIT 1`;
//     return new Promise(function (resolve, reject) {
//       connection.query(sql, function (err, result, fields) {
//         if (err) throw err;
//         resolve(result);
//       });
//     });
//   };
//   this.addDrugL = function fill(val, DATA) {
//     var sql = `INSERT INTO center_db.liquid_medicine (
//       hn,
//       queue,
//       date_key,
//       status_c,
//       createDT
//     )
//     VALUES
//       (
//         '${val.hn}',
//         '${val.queue}',
//         CURDATE(),
//         'N',
//         CURRENT_TIMESTAMP ()
//       )`;

//     return new Promise(function (resolve, reject) {
//       connection.query(sql, function (err, result, fields) {
//         if (err) throw err;
//         resolve(result);
//       });
//     });
//   };
//   this.updateDrugL = function fill(val, DATA) {
//     var sql = `UPDATE center_db.liquid_medicine
//     SET status_c = 'Y'
//     WHERE
//       (hn = '${val.hn}')
//     AND (queue = '${val.queue}')
//     AND (date_key = CURDATE ())`;

//     return new Promise(function (resolve, reject) {
//       connection.query(sql, function (err, result, fields) {
//         if (err) throw err;
//         resolve(result);
//       });
//     });
//   };
//   this.getUser2 = function fill(val, DATA) {
//     var sql = `SELECT
//       *
//     FROM
//       center_db.users
//     WHERE user NOT IN ('test','admin')`;

//     return new Promise(function (resolve, reject) {
//       connection.query(sql, function (err, result, fields) {
//         if (err) throw err;
//         resolve(result);
//       });
//     });
//   };
//   this.checkCut = function fill(val, DATA) {
//     var sql = `SELECT *
//                 FROM center_db.drug_cut`;

//     return new Promise(function (resolve, reject) {
//       connection.query(sql, function (err, result, fields) {
//         if (err) throw err;
//         resolve(result);
//       });
//     });
//   };
// };
const { Console } = require("console");

module.exports = function () {
  const mysql = require("mysql");

  // const connection = mysql.createConnection({
  //   user: "root",
  //   password: "cretem",
  //   host: "192.168.185.102",
  //   database: "gd4unit",
  // });

  // connection.connect(function (err) {
  //   if (err) throw err;
  //   console.log("Connected to GD4Unit 101 MySQL");
  // });
  let connection;
  connectDatabase();
  function connectDatabase() {
    connection = mysql.createPool({
      user: "root",
      password: "cretem",
      host: "192.168.185.102",
      database: "gd4unit",
      queueLimit: 0,
    });

    return connection;
  }
  connection.on("connection", (connection) => {
    console.log("Connected to gd4unit MySQL.");
  });

  connection.on("error", (err) => {
    console.error("Error gd4unit MySQ:", err.message);
    connectDatabase();
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
    let orderitemname = val.orderitemname
      ? val.orderitemname.trim()
      : val.orderitemname;
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
      orderitemname +
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
      DATE_FORMAT(p.lastmodified, '%H:%i') AS ordertime
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

  this.checkPatientcheckmed = function fill(val, DATA) {
    var sql =
      `SELECT
      hn,
      DATE_FORMAT(p.lastmodified, '%h:%i') AS ordertime
   FROM
      center_db.checkmed p
   WHERE
      date_format(p.lastmodified, '%Y-%m-%d') = CURRENT_DATE
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
      AND CAST(syn.readdatetime AS Date) = '` +
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
          AND CAST(syn2.readdatetime AS Date) = '` +
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

  String.prototype.padL = function padL(n) {
    var target = this;
    while (target.length < 7) {
      target = n + target;
    }
    return target;
  };

  this.datadrugX = function fill(val, DATA) {
    var sql =
      `SELECT
      dd.drugID,
      dd.drugCode,
      dd.drugName,
      dd.HisPackageRatio,
      GROUP_CONCAT(de.deviceCode) AS deviceCode,
      CASE
    WHEN locate('-', drugCode) > 0
    AND dd.drugCode <> 'CYCL-'
    AND dd.drugCode <> 'DEX-O'
    AND dd.drugCode <> 'POLY-1'
    AND de.deviceCode = 'Xmed1' THEN
      'Y'
    ELSE
      'N'
    END AS isPrepack
    FROM
    center_db.devicedrugsetting ds
    INNER JOIN center_db.device de ON ds.deviceID = de.deviceID
    LEFT JOIN center_db.dictdrug dd ON dd.drugID = ds.drugID
    WHERE
      dd.drugCode IS NOT NULL
      AND de.deviceCode = '` +
      val.lo +
      `'
  AND dd.drugCode like '` +
      val.code +
      `%'
    GROUP BY
      dd.drugCode
    ORDER BY
      dd.HisPackageRatio DESC`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };

  this.datadrugMain = function fill(val, DATA) {
    var sql =
      `SELECT
      dd.drugID,
      dd.drugCode,
      dd.drugName,
      dd.HisPackageRatio,
      GROUP_CONCAT(de.deviceCode) AS deviceCode
  FROM
  center_db.devicedrugsetting ds
  INNER JOIN center_db.device de ON ds.deviceID = de.deviceID
  LEFT JOIN center_db.dictdrug dd ON dd.drugID = ds.drugID
  WHERE
  (
    dd.drugCode NOT LIKE '%-1%'
      AND dd.drugCode NOT LIKE '%-2%'
      AND dd.drugCode NOT LIKE '%-3%'
      AND dd.drugCode NOT LIKE '%-4%'
      AND dd.drugCode NOT LIKE '%-5%'
      OR dd.drugCode = 'poly-1'
  )
  AND    dd.drugCode IS NOT NULL
  AND de.deviceCode = '` +
      val.lo +
      `'
  AND dd.drugCode = '` +
      val.code +
      `'
  GROUP BY
      dd.drugCode`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };

  this.insertDrugcheck = function fill(val, DATA) {
    let sql = `INSERT INTO center_db.checkmed (
      rowNum,
      prescriptionno,
      seq,
      hn,
      patientname,
      sex,
      patientdob,
      drugCode,
      drugName,
      drugNameTh,
      qty,
      unitCode,
      departmentcode,
      righttext1,
      righttext2,
      righttext3,
      lamedName,
      dosage,
      freetext0,
      freetext1,
      freetext2,
      itemidentify,
      qrCode,
      ordercreatedate,
      lastmodified,
      checkstamp,
      checkqty,
      scantimestamp
      )
      VALUES(${val.count},${val.comma},null,'${val.qty}','${val.date}' )
       
      `;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };

  this.selectcheckmed = function fill(val, DATA) {
    let sql =
      `SELECT
      (SELECT
        MAX(seq) 
            FROM
            center_db.checkmed
        
            WHERE
              hn = '` +
      val +
      `'
        GROUP BY hn) AS countDrug,
      pc.*,img.pathImage
FROM
    center_db.checkmed pc
LEFT JOIN (
    SELECT
        drugCode,
        MIN(pathImage) AS pathImage
    FROM
        center_db.drug_image
    GROUP BY
        drugCode
) img ON TRIM(pc.drugCode) = TRIM(img.drugCode)
WHERE hn = '` +
      val +
      `'
AND CAST(pc.ordercreatedate AS Date) = CURDATE()      
ORDER BY checkstamp
       
      `;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };

  this.insertPatient = function fill(val, DATA) {
    var sql =
      `
      INSERT INTO center_db.checkmedpatient (hn, STATUS, date, TIMESTAMP)
      VALUES
        (
          '` +
      val +
      `',
          NULL,
          CURRENT_DATE (),
          CURRENT_TIMESTAMP ()
        ) ON DUPLICATE KEY UPDATE TIMESTAMP = CURRENT_TIMESTAMP ()`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
  this.dataPatient = function fill(val, DATA) {
    var sql =
      `SELECT
			*
		FROM
			center_db.checkmedpatient_copy
	WHERE
		hn = '` +
      val +
      `'
	AND date = CURRENT_DATE ()`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };

  this.insertPatient_copy = function fill(val, DATA) {
    var sql =
      `INSERT INTO center_db.checkmedpatient_copy (
        id,
        hn,
        userCheck,
        date,
        timestamp,
        isDelete,
        userDelete
      )
      VALUES
        (
          uuid(),
              '` +
      val +
      `',
          'admin',
          CURRENT_DATE (),
          CURRENT_TIMESTAMP (),
          NULL,
          NULL
        )`;
    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
  this.getpatient = function fill(val, DATA) {
    var sql =
      `SELECT
      *
    FROM
      center_db.checkmedpatient_copy
    WHERE
      hn = '` +
      val +
      `'
    AND date = CURRENT_DATE ()
    AND isDelete IS NULL`;
    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };

  this.checkPatientcheckmed_copy = function fill(val, DATA) {
    var sql =
      `SELECT
      hn,
      DATE_FORMAT(p.lastmodified, '%h:%i') AS ordertime
   FROM
      center_db.checkmed_copy p
   WHERE
      date_format(p.lastmodified, '%Y-%m-%d') = CURRENT_DATE
   AND p.cmp_id = '` +
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
  departmentcode = 'W8'
	AND queue LIKE 'P%'
  AND takedate = CURDATE()
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
  this.getsiteQhn = function fill(val, DATA) {
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
    departmentcode = 'W8'
  AND hn = ${val.hn.trim()}
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
  this.addDrugL = function fill(val, DATA) {
    var sql = `INSERT INTO center_db.liquid_medicine (
      hn,
      queue,
      date_key,
      status_c,
      createDT
    )
    VALUES
      (
        '${val.hn}',
        '${val.queue}',
        CURDATE(),
        'N',
        CURRENT_TIMESTAMP ()
      )`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
  this.updateDrugL = function fill(val, DATA) {
    var sql = `UPDATE center_db.liquid_medicine
    SET status_c = 'Y'
    WHERE
      (hn = '${val.hn}')
    AND (queue = '${val.queue}')
    AND (date_key = CURDATE ())`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
  this.checkCut = function fill(val, DATA) {
    var sql = `SELECT *
                FROM center_db.drug_cut`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
};
