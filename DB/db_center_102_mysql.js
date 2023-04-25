const { Console } = require("console");

module.exports = function () {
  const mysql = require("mysql");
  // จริง
  const connection = mysql.createConnection({
    user: "root",
    password: "cretem",
    host: "192.168.185.102",
    database: "center",
  });

  connection.connect(function (err) {
    if (err) throw err;
    console.log("Connected to Center 102 MySQL");
  });

  this.fill = function fill(val, DATA) {
    var sql =
      `SELECT QN
      FROM hospitalq
      WHERE  CONVERT(createDT,DATE) = CURRENT_DATE()
      AND SUBSTRING(QN, 1, 1) = 2
      AND patientNO = '` +
      val +
      `'
      ORDER BY createDT DESC`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };

  this.dataQ = function fill(val, DATA) {
    var sql =
      `SELECT
      patientNO,QN,patientName,createDT,timestamp
  FROM
      hospitalQ LEFT JOIN moph_confirm on qn = queue and patientNO = hn
  
  WHERE
  date = '` +
      val.date +
      `'
  AND patientNO = '` +
      val.hn +
      `'
  ORDER BY createDT`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };

  this.hn_moph_patient = function fill(val, DATA) {
    var sql =
      //   `SELECT
      //   s.patientID,
      //   drugAllergy,
      //   timestamp,
      //   cid
      // FROM
      //   moph_sync s
      //   LEFT JOIN (SELECT
      //     TIMESTAMP,hn
      //   FROM
      //     moph_confirm
      //   WHERE
      //     CAST(timestamp AS Date) = CURDATE())c ON s.patientID = c.hn
      // WHERE s.patientID = ` +
      //   val +
      //   `
      // ORDER BY
      //   drugAllergy`;
      `SELECT
    q.patientNO,
    MAX(q.QN) AS QN,
    c. timestamp,
    s.cid,
    s.createdDT,
    s.drugAllergy
  FROM
    hospitalq q
  LEFT JOIN (
    SELECT
      timestamp,
      hn,
      queue
    FROM
      moph_confirm
    WHERE
      CAST(timestamp AS Date) = CURDATE()
  ) c ON q.QN = c.queue
  LEFT JOIN moph_sync s ON s.patientID = q.patientNO
  WHERE
    patientNO =   '` +
      val +
      `'
  AND date = CURDATE()
  AND QN like '2%'
  GROUP BY
    patientNO`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };

  this.hn_moph_maharat = function fill(val, DATA) {
    var sql =
      `SELECT
      drugcode
    FROM
      moph_drugs
    WHERE
      moph_drugs.hospcode <> 10666
    AND cid = '` +
      val +
      `'
    LIMIT 1
    `;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };

  this.site_maharat = function fill(val, DATA) {
    var sql =
      `SELECT site_name,site_tel
      FROM mhr_site
      WHERE site_code = '` +
      val.floor +
      `'
    `;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };

  this.insertPhar = function fill(val, DATA) {
    var sql =
      `INSERT INTO pharmacist (
        id_phar,
        name_phar,
        createtimestamp
      )
      VALUES
        (
          '` +
      val.id +
      `',
      '` +
      val.name +
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
      val.hn +
      `',
      '` +
      val.user +
      `',
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
      indication,
      qrCode,
      ordercreatedate,
      lastmodified,
      lamedEng,
      freetext1Eng,
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
      (
        SELECT
          MAX(seq)
        FROM
          checkmed
        WHERE
          cmp_id = '` +
      val +
      `'
        GROUP BY
          hn
      ) AS countDrug,
      IF (
        TRIM(pc.drugCode) IN ('CYCLO3','TDF+2','LEVO25'),
        1,
        0
      ) checkLength,
      pc.*, 
      GROUP_CONCAT(img.pathImage ORDER BY img.typeNum ASC) pathImage,
      GROUP_CONCAT(img.typeNum ORDER BY img.typeNum ASC) typeNum
    FROM
      checkmed pc
    LEFT JOIN images_drugs img ON img.drugCode = pc.drugCode
    WHERE
      cmp_id = '` +
      val +
      `'
    AND CAST(pc.ordercreatedate AS Date) = CURDATE()
    GROUP BY
      pc.drugCode,pc.seq
    ORDER BY
      checkstamp
       
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
  this.updatePatient = function fill(val, DATA) {
    let sql =
      `UPDATE checkmedpatient
      SET checkComplete = ${val.status ? "CURRENT_TIMESTAMP()" : "null"}
      WHERE
        (
          id = '` +
      val.patient +
      `')`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };

  this.getCountcheck = function fill(val, DATA) {
    let sql =
      `SELECT
      p.userCheck,
      count(p.userCheck) countuserCheck,
      a.countdrugCode
    FROM
      checkmedpatient p
    LEFT JOIN (
      SELECT
        p.userCheck,
        count(c.drugCode) countdrugCode
      FROM
        checkmedpatient p
      LEFT JOIN checkmed c ON p.id = c.cmp_id
      WHERE
        p.userCheck NOT IN ('admin', 'opd')
      AND p.date BETWEEN '` +
      val.datestart +
      `'
      AND '` +
      val.dateend +
      `'
      GROUP BY
        p.userCheck
    ) AS a ON p.userCheck = a.userCheck
    WHERE
      p.userCheck NOT IN ('admin', 'opd')
    AND p.date BETWEEN '` +
      val.datestart +
      `'
    AND '` +
      val.dateend +
      `'
    GROUP BY
      p.userCheck`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
};
