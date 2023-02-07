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

  this.checkdelete = function fill(val, DATA) {
    var sql =
      `SELECT
			*
		FROM
			center.checkmedpatient 
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

  this.insertPatient = function fill(val, DATA) {
    var sql =
      `INSERT INTO checkmedpatient  (
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
        );`;
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
      checkmedpatient 
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

  this.checkPatientcheckmed = function fill(val, DATA) {
    var sql =
      `SELECT
      hn,
      DATE_FORMAT(p.lastmodified, '%h:%i') AS ordertime
   FROM
      checkmed  p
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
  this.insertDrugcheck = function fill(val, DATA) {
    let sql = `INSERT INTO checkmed  (
      id,
      cmp_id,
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
      VALUES(uuid(),'${val.cmp_id}',${val.count},${val.comma},null,'${val.qty}','${val.date}' )
       
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
            checkmed 
        
            WHERE
            cmp_id = '` +
      val +
      `'
        GROUP BY hn) AS countDrug,
      pc.*,img.pathImage
FROM
    checkmed  pc
LEFT JOIN (
    SELECT
        drugCode,
        MIN(pathImage) AS pathImage
    FROM
        drug_image
    GROUP BY
        drugCode
) img ON TRIM(pc.drugCode) = TRIM(img.drugCode)
WHERE cmp_id = '` +
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

  this.deletcheckmed = function fill(val, DATA) {
    let sql =
      `UPDATE checkmedpatient 
      SET isDelete = CURRENT_TIMESTAMP() , userDelete = '` +
      val.user +
      `'
      WHERE
        (id = '` +
      val.cmp_id +
      `')
      `;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
  this.updatecheckmed = function fill(val, DATA) {
    let sql =
      `
      UPDATE checkmed 
        SET checkqty = '` +
      val.currentqty +
      `',
        checkstamp = CURRENT_TIMESTAMP ()
        WHERE
            (id = '` +
      val.id +
      `')`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
  this.insertlogcheckmed = function fill(val, DATA) {
    let sql =
      `INSERT INTO checkmed_log  (id, cm_id, qty, user, createDT)
      VALUES
        (
          uuid(),
          '` +
      val.id +
      `',
      '` +
      val.qty +
      `',
      '` +
      val.user +
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
