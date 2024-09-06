const { Console } = require("console");

module.exports = function () {
  const mysql = require("mysql");
  // จริง

  let connection;
  connectDatabase();
  function connectDatabase() {
    connection = mysql.createPool({
      user: "root",
      password: "cretem",
      host: "192.168.185.102",
      database: "center",
      queueLimit: 0,
    });

    return connection;
  }
  connection.on("connection", (connection) => {
    console.log("Connected to 102 MySQL.");
  });

  connection.on("error", (err) => {
    console.error("Error 102 MySQ:", err.message);
    connectDatabase();
  });

  this.fill = function fill(val, DATA) {
    let site =
      val.site == "W8" ? `'PHAR_A2'` : val.site == "W18" ? `'PHAR_A3'` : `''`;
    var sql = ``;
    if (val.site == "W8") {
      sql = `SELECT
        p.queue QN
      FROM
        gd4unit.prescription p
      WHERE
        p.takedate = '${val.dateEN}'
          AND hn = '${val.hn.trim()}'
      GROUP BY
        p.takedate,
        p.hn,p.queue
      UNION
        SELECT
          p.queue QN
        FROM
          gd4unit_bk.prescription p
        WHERE
          p.takedate   = '${val.dateEN}'
            AND hn = '${val.hn.trim()}'
        GROUP BY
          p.takedate,
          p.hn,p.queue`;
    } else {
      sql = `SELECT
            QN
          FROM
            hospitalq
          WHERE
            date = '${val.dateEN}'
          AND locationQ = ${site}
          AND patientNO = '${val.hn.trim()}'
      ORDER BY
        createDT DESC`;
    }

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
    //   var sql =
    //     `SELECT
    //   q.patientNO,
    //   MAX(q.QN) AS QN,
    //   c.timestamp,
    //   s.cid,
    //   s.createdDT,
    //   s.drugAllergy,
    //   d.drugcode
    // FROM
    //   hospitalq q
    // LEFT JOIN (
    //   SELECT
    //     timestamp,
    //     hn,
    //     queue
    //   FROM
    //     moph_confirm
    //   WHERE
    //     CAST(timestamp AS Date) = CURDATE()
    // ) c ON q.QN = c.queue
    // LEFT JOIN moph_sync s ON s.patientID = q.patientNO
    // LEFT JOIN moph_drugs d ON  s.cid = d.cid AND d.hospcode <> 10666
    // WHERE
    //   patientNO =  '` +
    //     val +
    //     `'
    // AND date = CURDATE()
    // AND QN LIKE '2%'

    // GROUP BY
    //   patientNO`;
    let site = val.sitew1 ? `W9` : `W8`;
    var sql = `SELECT
    s.patientID,
    GROUP_CONCAT(d.drugcode) drugcode,
    c.timestamp
  FROM
    moph_sync s
  LEFT JOIN moph_drugs d ON s.CID = d.cid
  AND d.hospcode <> '10666'
  LEFT JOIN (
    SELECT
      TIMESTAMP,
      hn,
      queue,
      site
    FROM
      moph_confirm
    WHERE
      CAST(TIMESTAMP AS Date) = CURDATE()
    AND site = '${site}'
  ) AS c ON TRIM(c.hn) = TRIM(s.patientID)
  WHERE
    CAST(s.updateDT AS Date) = CURDATE()
  AND patientID = '${val.hn}'
  GROUP BY
    s.CID
  ORDER BY
    drugcode DESC`;
    console.log(sql);

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
    let checkq = val.queue ? `AND queue = '` + val.queue + `'` : ``;
    var sql =
      `SELECT
			*
		FROM
			center.checkmedpatient 
	WHERE
		hn = '` +
      val.hn +
      `'
	AND date = '` +
      val.dateEN +
      `'
  ` +
      checkq +
      `    
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
        userDelete,
        checkComplete,
        queue
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
      '` +
      val.dateEN +
      `',
          CURRENT_TIMESTAMP (),
          NULL,
          NULL,
          NULL,
          '` +
      val.queue +
      `'
        );`;
    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
  this.getpatient = function fill(val, DATA) {
    let checkq = val.queue ? `AND queue = '` + val.queue + `'` : ``;
    var sql =
      `SELECT
      *
    FROM
      checkmedpatient 
    WHERE
      hn = '` +
      val.hn +
      `'
    AND date = '` +
      val.dateEN +
      `'
      ` +
      checkq +
      ` 
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
      p.cmp_id = '` +
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
      VALUES(uuid(),'${val.cmp_id}',${val.count},${val.comma},null,'${val.qty}',CURRENT_TIMESTAMP() )
       
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
      val.id +
      `'
      GROUP BY
        hn
    ) AS countDrug,
  
  IF (
    TRIM(pc.drugCode) IN (
      'CYCLO3',
      'TDF+2',
      'LEVO25',
      'DESOX',
      'ISOSO3',
      'TRIA5'
    ),
    1,
    0
  ) checkLength,
   pc.id,
   pc.cmp_id,
   pc.rowNum,
   pc.prescriptionno,
   pc.seq,
   pc.hn,
   pc.patientname,
   pc.sex,
   pc.patientdob,
   pc.drugCode,
  
  IF (
    TRIM(pc.drugCode) IN ('OLAZA'),
    CONCAT(
      SUBSTRING(pc.drugName, 1, 36),
      '...'
    ),
    pc.drugName
  ) drugName,
   pc.drugNameTh,
   IF('${val.site}'='W8',IF(dc.qty_cut<>'',IF(pc.qty >  dc.qty_cut,dc.qty_cut,pc.qty),pc.qty),pc.qty) qty,
   pc.unitCode,
   pc.departmentcode,
   pc.righttext1,
   pc.righttext2,
   pc.righttext3,
   pc.lamedName,
   pc.dosage,
   pc.freetext0,
   pc.freetext1,
   pc.freetext2,
   pc.itemidentify,
   pc.indication,
   pc.qrCode,
   pc.ordercreatedate,
   pc.lastmodified,
   pc.lamedEng,
   pc.freetext1Eng,
   pc.checkstamp,
   IF('${val.site}'='W8',IF(dc.qty_cut<>'',IF(pc.checkqty >  dc.qty_cut,dc.qty_cut,pc.checkqty),pc.checkqty),pc.checkqty) checkqty,
   pc.scantimestamp,
  
  IF (
    sortDrug.sortOrder IS NULL,
    (
      SELECT
        MAX(sortOrder)
      FROM
        pmpf_thailand_mnrh.devicedescription
    ),
    sortDrug.sortOrder
  ) sortOrder,
   GROUP_CONCAT(
    img.pathImage
    ORDER BY
      img.typeNum ASC
  ) pathImage,
   GROUP_CONCAT(
    img.typeNum
    ORDER BY
      img.typeNum ASC
  ) typeNum,
   bdg.barCode,
   sortDrug.device,
   mp.drugCode checkDrug,
   IF('${val.site}'='W8',IF(dc.qty_cut<>'',IF(pc.qty >  dc.qty_cut, pc.qty-dc.qty_cut, 0),0),0) cur_qty
  FROM
    checkmed pc
  LEFT JOIN images_drugs img ON img.drugCode = pc.drugCode
  LEFT JOIN barcode_drug bdg ON pc.drugCode = bdg.drugCode
  LEFT JOIN med_print mp ON pc.drugCode = mp.drugCode
  LEFT JOIN (
    SELECT
      drugCode,
      drugName,
      device,
      sortOrder
    FROM
      (
        SELECT
          dd.drugCode,
          dd.drugName,
          dv.deviceCode AS device,
          pd.sortOrder
        FROM
          pmpf_thailand_mnrh.devicedrugsetting ds
        LEFT JOIN pmpf_thailand_mnrh.device dv ON ds.deviceID = dv.deviceID
        LEFT JOIN pmpf_thailand_mnrh.dictdrug dd ON ds.drugID = dd.drugID
        LEFT JOIN pmpf_thailand_mnrh.devicedescription pd ON pd.shortName =
        IF (
          dv.deviceCode = 'CDMed1',
          'C',
          dv.deviceCode
        )
        WHERE
          ds.drugID IS NOT NULL
        AND (
          dv.deviceCode NOT IN (
            'AP',
            'CDMed2',
            'Xmed1',
            'ตู้ฉร',
            'C',
            'CATV'
          )
          AND dv.deviceCode NOT LIKE 'INJ%'
        )
        AND dv.deviceCode NOT LIKE 'H%'
        AND dd.drugCode IS NOT NULL
        AND dv.pharmacyCode <> 'IPD'
        GROUP BY
          dd.drugCode,
          dv.deviceCode
      ) sortDrug
    GROUP BY
      sortDrug.drugCode
    ORDER BY
      sortDrug.sortOrder
  ) sortDrug ON sortDrug.drugCode = pc.drugCode
   LEFT JOIN center_db.drug_cut dc ON dc.drugCode = pc.drugCode
  WHERE
    cmp_id = '` +
      val.id +
      `'
  GROUP BY
    pc.drugCode,
    pc.seq,
    pc.lastmodified
  ORDER BY
    sortOrder
     
    `;
    console.log(sql);
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
      a.countdrugCode,
      SUBSTR(SEC_TO_TIME(AVG(TIMEDIFF(
        TIME(p.checkComplete),
        TIME(p.timestamp)
      ))) , 1, POSITION("." IN SEC_TO_TIME(AVG(TIMEDIFF(
        TIME(p.checkComplete),
        TIME(p.timestamp)
      ))) )-1)   AS time
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
      AND p.checkComplete IS NOT NULL
      AND p.isDelete IS NULL
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
    AND p.checkComplete IS NOT NULL
    AND p.isDelete IS NULL
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

  this.get_compiler = function fill(val, DATA) {
    val.queue = val.queue ? val.queue : "";
    let q = val.queue
      ? val.queue == "W8"
        ? `AND (LEFT(queue,1) = '2'  OR LEFT(queue,1) = 'P')`
        : val.queue == "W18"
        ? `AND (LEFT(queue,1) = '3')`
        : `AND cmp.queue = '${val.queue}'`
      : ``;
    let sql =
      `SELECT
      cm.drugCode,
      GROUP_CONCAT(DISTINCT cml. USER) userCheck
    FROM
      checkmedpatient cmp
    LEFT JOIN checkmed cm ON cm.cmp_id = cmp.id
    LEFT JOIN checkmed_log cml ON cml.cm_id = cm.id
    WHERE
      cmp.hn = '` +
      val.hn.trim() +
      `'
    AND cmp.date = '` +
      val.date +
      `'
    ${q}
    AND cmp.isDelete IS NULL
    GROUP BY
      cml.cm_id`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
  // this.insert_mederror = function fill(val, DATA) {
  //   let sql =
  //     `INSERT INTO med_error (
  //       id,
  //       hn,
  //       hnDT,
  //       med,
  //       med_good,
  //       med_wrong,
  //       med_good_text,
  //       med_wrong_text,
  //       position_text,
  //       type_text,
  //       interceptor_id,
  //       interceptor_name,
  //       offender_id,
  //       offender_name,
  //       note,
  //       location,
  //       createDT,
  //       level,
  //       occurrence,
  //       source,
  //       error_type,
  //       site,
  //       type_pre
  //     )
  //     VALUES
  //       (
  //         UUID(),
  //         '` +
  //     val.hn.hn +
  //     `',
  //         '` +
  //     val.hn.hnDT +
  //     `',
  //         '` +
  //     val.med.code +
  //     `',
  //         '` +
  //     val.medGood.code +
  //     `',
  //         '` +
  //     val.medWrong.code +
  //     `',
  //         '` +
  //     val.medGood_text +
  //     `',
  //         '` +
  //     val.medWrong_text +
  //     `',
  //         '` +
  //     val.position_text +
  //     `',
  //         '` +
  //     val.type_text +
  //     `',
  //         '` +
  //     val.interceptor.user +
  //     `',
  //         '` +
  //     val.interceptor.name +
  //     `',
  //         '` +
  //     val.offender.user +
  //     `',
  //         '` +
  //     val.offender.name +
  //     `',
  //         '` +
  //     val.note +
  //     `',
  //     '` +
  //     val.location +
  //     `',
  //         CURRENT_TIMESTAMP,
  //     '${val.level}',
  //     '${val.occurrence}',
  //     '${val.source}',
  //     '${val.error_type}',
  //     '${val.site}',
  //     '${val.type_pre ? val.type_pre : ``}'
  //       )`;

  //   return new Promise(function (resolve, reject) {
  //     connection.query(sql, function (err, result, fields) {
  //       if (err) throw err;
  //       resolve(result);
  //     });
  //   });
  // };
  // this.checkmederror = (val) => {
  //   let sql = `SELECT
  //                 *
  //               FROM
  //                 med_error
  //               WHERE
  //                 CAST(hnDT AS Date) = CAST('${val.hn.hnDT}' AS Date)
  //               AND TRIM(hn) = TRIM('${val.hn.hn}')
  //               AND med = '${val.med.code}'
  //               AND position_text = '${val.position_text}'
  //               AND type_text = '${val.type_text}'`;

  //   return new Promise(function (resolve, reject) {
  //     connection.query(sql, function (err, result, fields) {
  //       if (err) throw err;
  //       resolve(result);
  //     });
  //   });
  // };

  // this.get_mederror = function fill(val, DATA) {
  //   let sql = "";
  //   let time = val.time1
  //     ? `    AND TIME_FORMAT(createDT, '%H:%i:%s') BETWEEN '` +
  //       val.time1 +
  //       `' AND '` +
  //       val.time2 +
  //       `' `
  //     : ``;

  //   if (!val.choice) {
  //     sql =
  //       `SELECT
  //       id,
  //       hn,
  //       DATE_FORMAT(
  //         hnDT,
  //         '%Y-%m-%d %H:%i:%s'
  //       ) hnDT,
  //       med,
  //       med_good,
  //       med_wrong,
  //       med_good_text,
  //       med_wrong_text,
  //       position_text,
  //       if(name_type <> '',name_type,type_text) AS type_text,
  //       interceptor_id,
  //       interceptor_name,
  //       offender_id,
  //       offender_name,
  //       note,
  //       location,
  //       DATE_FORMAT(
  //         createDT,
  //         '%Y-%m-%d %H:%i:%s'
  //       ) createDT,
  //       level,
  //       occurrence,
  //       source,
  //       error_type,
  //       site,
  //       type_pre,
  //       IF(cause, cause, '') cause
  //   FROM
  //     med_error
  //   LEFT JOIN med_error_type on type_text = id_type
  //   WHERE
  //     hn = '` +
  //       val.hn.hn +
  //       `'

  //   AND CAST(hnDT AS Date) = '` +
  //       val.hn.hnDT.substr(0, val.hn.hnDT.indexOf(" ")) +
  //       `'
  //   ${time}
  //       AND deleteID is null
  //   ORDER BY createDT desc`;
  //   } else {
  //     let checkid = val.id
  //       ? `
  //   AND position_text = '` +
  //         val.type +
  //         `'
  //   AND      IF (
  //           UPPER(SUBSTR(offender_id, 1, 1)) = 'P',

  //         IF (
  //           LOCATE(
  //             ' ',
  //             SUBSTR(
  //               offender_id,
  //               2,
  //               LENGTH(offender_id)
  //             )
  //           ),
  //           SUBSTRING(
  //             SUBSTR(
  //               offender_id,
  //               2,
  //               LENGTH(offender_id)
  //             ),
  //             1,
  //             LOCATE(
  //               ' ',
  //               SUBSTR(
  //                 offender_id,
  //                 2,
  //                 LENGTH(offender_id)
  //               )
  //             )
  //           ),
  //           SUBSTR(
  //             offender_id,
  //             2,
  //             LENGTH(offender_id)
  //           )
  //         ),
  //          offender_id
  //         )= IF (
  //     UPPER(SUBSTR('` +
  //         val.id +
  //         `', 1, 1)) = 'P',
  //     SUBSTR(
  //       '` +
  //         val.id +
  //         `',
  //       2,
  //       LENGTH('` +
  //         val.id +
  //         `')
  //     ),
  //     '` +
  //         val.id +
  //         `'
  //   )`
  //       : ``;
  //     sql =
  //       `SELECT	id,
  //       hn,
  //       DATE_FORMAT(
  //         hnDT,
  //         '%Y-%m-%d %H:%i:%s'
  //       ) hnDT,
  //       med,
  //       med_good,
  //       med_wrong,
  //       med_good_text,
  //       med_wrong_text,
  //       position_text,
  //       if(name_type <> '',name_type,type_text) AS type_text,
  //       interceptor_id,
  //       interceptor_name,
  //       offender_id,
  //       offender_name,
  //       note,
  //       location,
  //       DATE_FORMAT(
  //         createDT,
  //         '%Y-%m-%d %H:%i:%s'
  //       ) createDT,
  //       level,
  //       occurrence,
  //       source,
  //       error_type,
  //       site,
  //       type_pre,
  //       (
  //         SELECT
  //           drugName
  //         FROM
  //           pmpf_thailand_mnrh.dictdrug
  //         WHERE
  //           drugCode = med_good
  //         GROUP BY
  //           drugCode
  //       ) med_good_name,
  //        (
  //         SELECT
  //           drugName
  //         FROM
  //           pmpf_thailand_mnrh.dictdrug
  //         WHERE
  //           drugCode = med_wrong
  //         GROUP BY
  //           drugCode
  //       ) med_wrong_name,
  //        IF(cause, cause, '') cause
  //   FROM
  //     med_error
  //   LEFT JOIN med_error_type on type_text = id_type
  //   WHERE
  //     CAST(createDT AS Date)  BETWEEN '` +
  //       val.datestart +
  //       `'
  //     AND '` +
  //       val.dateend +
  //       `'` +
  //       checkid +
  //       `
  //       ${time}
  //     AND deleteID is null
  //       ORDER BY createDT desc`;
  //   }

  //   return new Promise(function (resolve, reject) {
  //     connection.query(sql, function (err, result, fields) {
  //       if (err) throw err;
  //       resolve(result);
  //     });
  //   });
  // };

  this.insert_mederror = function fill(val, DATA) {
    let sql =
      `INSERT INTO med_error (
        id,
        hn,
        hnDT,
        med,
        med_good,
        med_wrong,
        med_good_text,
        med_wrong_text,
        position_text,
        type_text,
        interceptor_id,
        interceptor_name,
        offender_id,
        offender_name,
        note,
        location,
        createDT,
        level,
        occurrence,
        source,
        error_type,
        site,
        type_pre,
        drugAllergy
      )
      VALUES
        (
          UUID(),
          '` +
      val.hn.hn +
      `',
          '` +
      val.hn.hnDT +
      `',
          '` +
      val.med.code +
      `',
          '` +
      val.medGood.code +
      `',
          '` +
      val.medWrong.code +
      `',
          '` +
      val.medGood_text +
      `',
          '` +
      val.medWrong_text +
      `',
          '` +
      val.position_text +
      `',
          '` +
      val.type_text +
      `',
          '` +
      val.interceptor.user +
      `',
          '` +
      val.interceptor.name +
      `',
          '` +
      val.offender.user +
      `',
          '` +
      val.offender.name +
      `',
          '` +
      val.note +
      `',
      '` +
      val.location +
      `',
          CURRENT_TIMESTAMP,
      '${val.level}',
      '${val.occurrence}',
      '${val.source}',
      '${val.error_type}',
      '${val.site}',
      '${val.type_pre ? val.type_pre : ``}',
      '${val.medcode_err ? val.medcode_err : ``}'    
        )`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
  this.get_mederror = function fill(val, DATA) {
    let sql = "";
    let time = val.time1
      ? `    AND TIME_FORMAT(createDT, '%H:%i:%s') BETWEEN '` +
        val.time1 +
        `' AND '` +
        val.time2 +
        `' `
      : ``;
    if (!val.choice) {
      sql =
        `SELECT
        id,
        hn,
        DATE_FORMAT(
          hnDT,
          '%Y-%m-%d %H:%i:%s'
        ) hnDT,
        med,
        med_good,
        med_wrong,
        med_good_text,
        med_wrong_text,
        position_text,
        if(name_type <> '',name_type,type_text) AS type_text,
        interceptor_id,
        interceptor_name,
        offender_id,
        offender_name,
        note,
        location,
        DATE_FORMAT(
          createDT,
          '%Y-%m-%d %H:%i:%s'
        ) createDT,
        level,
        occurrence,
        source,
        error_type,
        site,
        type_pre,
        IF(cause <> '' ,cause,'') cause,
                (
          SELECT
            drugName
          FROM
            pmpf_thailand_mnrh.dictdrug
          WHERE
            drugCode = med_good
          GROUP BY
            drugCode
        ) med_good_name,
         (
          SELECT
            drugName
          FROM
            pmpf_thailand_mnrh.dictdrug
          WHERE
            drugCode = med_wrong
          GROUP BY
            drugCode
        ) med_wrong_name,
        IF(cause <> '' ,cause,'') cause,
        IF (
          (
            SELECT
              COUNT(*)
            FROM
              pmpf_thailand_mnrh.dictdrug
            WHERE
              drugCode = drugAllergy
          ),
          (
            SELECT
              drugName
            FROM
              pmpf_thailand_mnrh.dictdrug
            WHERE
              drugCode = drugAllergy
          ),
          drugAllergy
        ) drugAllergy
    FROM
      med_error
    LEFT JOIN med_error_type on type_text = id_type
    WHERE
      hn = '` +
        val.hn.hn +
        `'
          
    AND CAST(hnDT AS Date) = '` +
        val.hn.hnDT.substr(0, val.hn.hnDT.indexOf(" ")) +
        `'
    ${time}
        AND deleteID is null    
    ORDER BY createDT desc`;
    } else {
      let checkid = val.id
        ? `
    AND position_text = '` +
          val.type +
          `'
    AND      IF (
            UPPER(SUBSTR(offender_id, 1, 1)) = 'P',
          
          IF (
            LOCATE(
              ' ',
              SUBSTR(
                offender_id,
                2,
                LENGTH(offender_id)
              )
            ),
            SUBSTRING(
              SUBSTR(
                offender_id,
                2,
                LENGTH(offender_id)
              ),
              1,
              LOCATE(
                ' ',
                SUBSTR(
                  offender_id,
                  2,
                  LENGTH(offender_id)
                )
              )
            ),
            SUBSTR(
              offender_id,
              2,
              LENGTH(offender_id)
            )
          ),
           offender_id
          )= IF (
      UPPER(SUBSTR('` +
          val.id +
          `', 1, 1)) = 'P',
      SUBSTR(
        '` +
          val.id +
          `',
        2,
        LENGTH('` +
          val.id +
          `')
      ),
      '` +
          val.id +
          `'
    )`
        : ``;
      sql =
        `SELECT	id,
        hn,
        DATE_FORMAT(
          hnDT,
          '%Y-%m-%d %H:%i:%s'
        ) hnDT,
        med,
        med_good,
        med_wrong,
        med_good_text,
        med_wrong_text,
        position_text,
        if(name_type <> '',name_type,type_text) AS type_text,
        interceptor_id,
        interceptor_name,
        offender_id,
        offender_name,
        note,
        location,
        DATE_FORMAT(
          createDT,
          '%Y-%m-%d %H:%i:%s'
        ) createDT,
        level,
        occurrence,
        source,
        error_type,
        site,
        type_pre,
        (
          SELECT
            drugName
          FROM
            pmpf_thailand_mnrh.dictdrug
          WHERE
            drugCode = med_good
          GROUP BY
            drugCode
        ) med_good_name,
         (
          SELECT
            drugName
          FROM
            pmpf_thailand_mnrh.dictdrug
          WHERE
            drugCode = med_wrong
          GROUP BY
            drugCode
        ) med_wrong_name,
        IF(cause <> '' ,cause,'') cause,
                (
          SELECT
            drugName
          FROM
            pmpf_thailand_mnrh.dictdrug
          WHERE
            drugCode = med_good
          GROUP BY
            drugCode
        ) med_good_name,
         (
          SELECT
            drugName
          FROM
            pmpf_thailand_mnrh.dictdrug
          WHERE
            drugCode = med_wrong
          GROUP BY
            drugCode
        ) med_wrong_name,
        IF(cause <> '' ,cause,'') cause,
        IF (
          (
            SELECT
              COUNT(*)
            FROM
              pmpf_thailand_mnrh.dictdrug
            WHERE
              drugCode = drugAllergy
          ),
          (
            SELECT
              drugName
            FROM
              pmpf_thailand_mnrh.dictdrug
            WHERE
              drugCode = drugAllergy
          ),
          drugAllergy
        ) drugAllergy
    FROM
      med_error
    LEFT JOIN med_error_type on type_text = id_type
    WHERE
      CAST(createDT AS Date)  BETWEEN '` +
        val.datestart +
        `'
      AND '` +
        val.dateend +
        `'` +
        checkid +
        `
        ${time}
      AND deleteID is null
        ORDER BY createDT desc`;
    }
    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
  this.checkmederror = (val) => {
    let sql = `SELECT
                  *
                FROM
                  med_error
                WHERE
                  CAST(hnDT AS Date) = CAST('${val.hn.hnDT}' AS Date)
                AND TRIM(hn) = TRIM('${val.hn.hn}')
                AND med = '${val.med.code}'
                AND position_text = '${val.position_text}'
                AND type_text = '${val.type_text}'`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };

  this.dataCheckQ = function fill(val, DATA) {
    var sql =
      `SELECT
      CONCAT(checker_id, " ", checker_name) AS userName,
      CONCAT(dispenser_id, " ", dispenser_name) AS userDispen 
  FROM
      hospitalQ
  
  WHERE
  date = '` +
      val.createdDT +
      `'
  AND patientNO = '` +
      val.patientNO +
      `'
  AND QN = '` +
      val.QN +
      `'      
  ORDER BY createDT desc`;
    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
  this.manage_mederror = function fill(val, DATA) {
    var sql = ``;
    if (val.check === "edit") {
      sql =
        `UPDATE center.med_error
      SET id = '` +
        val.id +
        `',
       hn = '${val.hn ? val.hn.trim() : ""}',
       med = '` +
        val.med +
        `',
       med_good = '` +
        val.medGood.code +
        `',
       med_wrong = '` +
        val.medWrong.code +
        `',
       med_good_text = '` +
        val.medGood_text +
        `',
       med_wrong_text = '` +
        val.medWrong_text +
        `',
       position_text = '` +
        val.position_text +
        `',
       type_text = '` +
        val.type_text +
        `',
       interceptor_id = '` +
        val.interceptor.user +
        `',
       interceptor_name = '` +
        val.interceptor.name +
        `',
       offender_id = '` +
        val.offender.user +
        `',
       offender_name = '` +
        val.offender.name +
        `',
       note = '` +
        val.note +
        `',
       updateDT = CURRENT_TIMESTAMP,
       deleteDT = NULL,
       deleteID = NULL,
       level = '${val.level}',
        occurrence = '${val.occurrence}',
        source = '${val.source}',
        error_type = '${val.error_type}',
        site = '${val.site}',
        type_pre = '${val.type_pre ? val.type_pre : ``}'
      WHERE
        (
          id = '` +
        val.id +
        `'
        );
      `;
    } else {
      sql =
        `UPDATE center.med_error
      SET id = '` +
        val.id +
        `',
       updateDT = CURRENT_TIMESTAMP,
       deleteDT = CURRENT_TIMESTAMP,
       deleteID = '` +
        val.userLogin +
        `'
      WHERE
        (
          id = '` +
        val.id +
        `'
        );
      `;
    }

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };

  this.getQ = function fill(val, DATA) {
    var sql =
      `
    SELECT
	h.QN,
	h.patientName,

IF (
	c.checkComplete,
	CONVERT (c.checkComplete, CHAR),
	CONVERT (h.completeDT, CHAR)
) checkComplete,
 h.date
FROM
	hospitalq h
LEFT JOIN checkmedpatient c ON h.QN = c.queue
AND h.date = c.date
WHERE
h.date  BETWEEN '` +
      val.datestart +
      `'
AND '` +
      val.dateend +
      `'
AND h.locationQ = 'PHAR_A2'`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
  this.getQGroupby = function fill(val, DATA) {
    let checkdata = val.choice == 1 ? "checker" : "dispenser";
    let position_text = val.choice == 1 ? "check" : "จ่าย";
    let pharma = val.site
      ? val.site == "W8"
        ? "PHAR_A2"
        : val.site == "W9"
        ? "PHAR_A1"
        : val.site == "W18"
        ? "PHAR_A3"
        : val.site == "W19"
        ? "PHAR_M-Park"
        : ""
      : "";
    let getsite = {
      h: "",
      l: "",
      s: "",
    };
    if (pharma) {
      getsite.l = `AND location = '${val.site}'`;
      getsite.h = `AND locationQ =  '${pharma}'`;
      getsite.s = `AND site = '${val.site}'`;
    }
    var sql = `
    SELECT
	${checkdata}_id,
  ${checkdata}_name,
	a.order,
	SUM(h.item) item,
	e.error
FROM
	hospitalq q
LEFT JOIN (
	SELECT
		hn,
		COUNT(hn) item,
    createDate
	FROM
		hospital_order_his
	WHERE
		createDate BETWEEN '${val.date1}'
    AND '${val.date2}' 
    ${getsite.s}
	GROUP BY
  createDate,hn
) AS h ON h.hn = q.patientNO AND h.createDate = q.date 
LEFT JOIN (
	SELECT
		${checkdata}_id AS id,
		COUNT(${checkdata}_id) 'order'
	FROM
		hospitalq
	WHERE
  date BETWEEN '${val.date1}'
  AND '${val.date2}'
  AND TIME_FORMAT(createDT, '%H:%i:%s') BETWEEN '${val.time1}'
  AND '${val.time2}'
	AND ${checkdata}_id <> '' 
  AND ${checkdata}_id <> 'M' 
  ${getsite.h}
	GROUP BY
		${checkdata}_id
) a ON a.id = q.${checkdata}_id
LEFT JOIN (
	SELECT
		offender_id,
		SUBSTRING_INDEX(offender_id, " ", 1),

	IF (
		UPPER(
			SUBSTR(
				SUBSTRING_INDEX(offender_id, " ", 1),
				1,
				1
			)
		) = 'P',
		SUBSTR(
			SUBSTRING_INDEX(offender_id, " ", 1),
			2,
			LENGTH(
				SUBSTRING_INDEX(offender_id, " ", 1)
			)
		),
		SUBSTRING_INDEX(offender_id, " ", 1)
	) of_id,
	COUNT(*) error
FROM
	med_error
WHERE
	position_text = '${position_text}'
AND deleteDT IS NULL
AND CAST(hnDT AS Date) BETWEEN '${val.date1}'
AND '${val.date2}'
AND TIME_FORMAT(hnDT, '%H:%i:%s') BETWEEN '${val.time1}'
AND '${val.time2}' 
${getsite.l}
AND (
	UPPER(
		SUBSTR(
			SUBSTRING_INDEX(offender_id, " ", 1),
			1,
			1
		)
	) = 'P'
	OR SUBSTR(
		SUBSTRING_INDEX(offender_id, " ", 1),
		1,
		1
	) REGEXP '^[0-9]+$' = 1
)
GROUP BY
	of_id
) e ON e.of_id =
IF (
	UPPER(SUBSTR(q.${checkdata}_id, 1, 1)) = 'P',
	SUBSTR(
		q.${checkdata}_id,
		2,
		LENGTH(q.${checkdata}_id)
	),
	q.${checkdata}_id
)
WHERE
	date BETWEEN '${val.date1}'
  AND '${val.date2}'
AND TIME_FORMAT(createDT, '%H:%i:%s') BETWEEN '${val.time1}'
AND '${val.time2}'
AND ${checkdata}_id <> ''
AND ${checkdata}_id <> 'M' 

AND patientNO <> 'test' 
${getsite.h}
GROUP BY
	${checkdata}_id
`;
    console.log(sql);

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
  this.get_moph = function fill(val, DATA) {
    var sql = `
    SELECT
	@rownum := @rownum + 1 AS indexrow,
	a.*
FROM
	(
		SELECT
			s.patientID,
			s.CID,
			GROUP_CONCAT(d.drugcode) drugcode,
			GROUP_CONCAT(d.drugname) drugname,
			DATE_FORMAT(
				s.updateDT,
				'%Y-%m-%d %H:%i:%s'
			) updateDT
		FROM
			moph_sync s
		LEFT JOIN moph_drugs d ON s.CID = d.cid
		AND d.hospcode <> '10666'
		WHERE
			CAST(s.updateDT AS date) = '${val.date}'
		GROUP BY
			s.patientID
		ORDER BY
			s.updateDT DESC
	) AS a,
	(SELECT @rownum := 0) r`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
  this.check_moph = function fill(val, DATA) {
    var sql = `
    SELECT
			s.patientID,
			s.CID,
      COUNT(d.hospcode) num
		FROM
			moph_sync s
		LEFT JOIN moph_drugs d ON s.CID = d.cid  AND d.hospcode <> '10666'
		
		WHERE
			CAST(s.updateDT AS date) = '${val.date}'
    AND s.patientID = '${val.hn}' 
   
		GROUP BY
			s.patientID 
    `;
    console.log(sql);

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
  this.insertSync = function fill(val, DATA) {
    var sql =
      `INSERT INTO moph_sync (
      patientID,
      CID,
      sync_status,
      createdDT,
      drugAllergy,
      updateDT
    )
    VALUES
      (
        '` +
      val.hn +
      `',
      '` +
      val.cid +
      `',
        'Y',
        CURRENT_TIMESTAMP(),
        '` +
      val.check +
      `',
      CURRENT_TIMESTAMP()
      )ON DUPLICATE KEY UPDATE CID = '${val.cid}',updateDT = CURRENT_TIMESTAMP (),drugAllergy = '${val.check}'`;
    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };

  // this.insertDrugAllergy = function fill(val, DATA) {
  //   var sql =
  //     `INSERT INTO moph_drugs (
  //       cid,
  //       hospcode,
  //       drugcode,
  //       drugname,
  //       daterecord,
  //       createdDT,
  //       typedx,
  //       allerglevelcode,
  //       typedxcode,
  //       allerglevelnum,
  //       informat
  //     )
  //   VALUES
  //     (
  //       '` +
  //     val.cid +
  //     `',
  //       '` +
  //     val.hcode +
  //     `',
  //       '` +
  //     (val.typedxcode ? val.typedxcode : "") +
  //     `',
  //       N'` +
  //     val.drugName +
  //     `',
  //     CURRENT_TIMESTAMP (),
  //     CURRENT_TIMESTAMP (),
  //     '${val.typexxcode ? val.typexxcode : ""}',
  //     '${val.allergyLevel ? val.allergyLevel : ""}',
  //     '${val.typedxcode ? val.typedxcode : ""}',
  //     '${val.allergyCode ? val.allergyCode : ""}',
  //     '${val.information ? val.information : ""}'
  //     )ON DUPLICATE KEY UPDATE drugname = '` +
  //     val.drugname +
  //     `',
  //     createdDT = CURRENT_TIMESTAMP ()`;

  //   return new Promise(function (resolve, reject) {
  //     connection.query(sql, function (err, result, fields) {
  //       if (err) throw err;
  //       resolve(result);
  //     });
  //   });
  // };

  // this.insertDrugAllergy = function fill(val, DATA) {
  //   var sql =
  //     `INSERT INTO moph_drugs (
  //       cid,
  //       hospcode,
  //       drugcode,
  //       drugname,
  //       daterecord,
  //       createdDT,
  //       typedx,
  //       allerglevelcode,
  //       typedxcode,
  //       allerglevelnum,
  //       informat,
  //       allergsymptom
  //     )
  //   VALUES
  //     (
  //       '` +
  //     val.cid +
  //     `',
  //       '` +
  //     val.hospcode +
  //     `',
  //       '` +
  //     val.drugcode +
  //     `',
  //       N'` +
  //     val.drugname +
  //     `',
  //       '` +
  //     val.daterecord.replace(/T/, " ").replace(/\..+/, "") +
  //     `',
  //     CURRENT_TIMESTAMP (),
  //     '${val.typedx ? val.typedx : ""}',
  //     '${val.allerglevel ? val.allerglevel : ""}',
  //     '${val.typedxcode ? val.typedxcode : ""}',
  //     '${val.allerglevelcode ? val.allerglevelcode : ""}',
  //     '${val.informat ? val.informat : ""}',
  //     '${val.allergsymptom ? val.allergsymptom : ""}'
  //     )ON DUPLICATE KEY UPDATE drugname = '` +
  //     val.drugname +
  //     `',
  //      daterecord = '` +
  //     val.daterecord.replace(/T/, " ").replace(/\..+/, "") +
  //     `',
  //     createdDT = CURRENT_TIMESTAMP ()`;

  //   return new Promise(function (resolve, reject) {
  //     connection.query(sql, function (err, result, fields) {
  //       if (err) throw err;
  //       resolve(result);
  //     });
  //   });
  // };
  this.insertDrugAllergy = function fill(val, DATA) {
    var sql =
      `INSERT INTO moph_drugs (
        cid,
        hospcode,
        drugcode,
        drugname,
        daterecord,
        createdDT,
        typedx,
        allerglevelcode,
        typedxcode,
        allerglevelnum,
        informat,
        allergsymptom
      )
    VALUES
      (
        '` +
      val.cid +
      `',
        '` +
      val.hospcode +
      `',
        '` +
      val.drugcode +
      `',
        N'` +
      val.drugname +
      `',
        '` +
      val.daterecord.replace(/T/, " ").replace(/\..+/, "") +
      `',
      CURRENT_TIMESTAMP (),
      '${val.typedx ? val.typedx : ""}',
      '${val.allerglevel ? val.allerglevel : ""}',
      '${val.typedxcode ? val.typedxcode : ""}',
      '${val.allerglevelcode ? val.allerglevelcode : ""}',
      '${val.informat ? val.informat : ""}',
      '${val.allergsymptom ? val.allergsymptom : ""}'
      )ON DUPLICATE KEY UPDATE drugname = '` +
      val.drugname +
      `',
       daterecord = '` +
      val.daterecord.replace(/T/, " ").replace(/\..+/, "") +
      `',
      createdDT = CURRENT_TIMESTAMP ()`;
    console.log(sql);

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
  this.deleteAllgerlic = function fill(val, DATA) {
    var sql = `DELETE FROM moph_drugs WHERE cid = '` + val + `'`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
  this.queue = function fill(val, DATA) {
    let sql = val.select
      ? `SELECT QN
    FROM hospitalq
    WHERE  CONVERT(createDT,DATE) = CURRENT_DATE()
    AND locationQ = 'PHAR_A3'
    AND patientNO = '` +
        val.hn.trim() +
        `'
    ORDER BY createDT DESC`
      : `SELECT QN
    FROM hospitalq
    WHERE  CONVERT(createDT,DATE) = CURRENT_DATE()
    AND locationQ = 'PHAR_A2'
    AND patientNO = '` +
        val.hn.trim() +
        `'
    ORDER BY createDT DESC`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
  this.checkqueue = function fill(val, DATA) {
    var sql = `SELECT patientNO
      FROM hospitalq
      WHERE  date = CURRENT_DATE()
      AND locationQ = 'PHAR_A2'
      ORDER BY createDT DESC`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
  this.get_cut_dispend_drug = function fill(val, DATA) {
    var sql = `SELECT
    hn as patientNO,
    status
FROM
    cut_dispend_drug
WHERE
    STATUS = 'Y'
AND deleteDT IS NULL
AND departmentcode = 'W8'
GROUP BY
    hn`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
  this.get_moph_sync = function fill(val, DATA) {
    var sql = `SELECT
    s.CID,
    s.patientID 'patientNO',
    'Y' AS 'check',
    CAST(c.timestamp AS char) timestamp
FROM
    moph_sync s
LEFT JOIN moph_drugs d ON s.CID = d.cid
LEFT JOIN (
    SELECT
        TIMESTAMP,
        hn,
        queue,
        site
    FROM
        moph_confirm
    WHERE
        CAST(TIMESTAMP AS Date) = CURDATE()
    AND site = 'W8'
) AS c ON TRIM(c.hn) = TRIM(s.patientID)
WHERE
    CAST(s.updateDT AS Date) = CURDATE()
AND d.hospcode <> '10666'
GROUP BY
    s.CID `;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };

  this.listPatientQpost = function fill(val, DATA) {
    var sql = `SELECT
  q.patientNO,
  q.QN,
  q.patientName,
  CAST(q.createDT AS char)  createdDT,
  CAST(c.timestamp AS char) timestamp,
  s.cid,
  d.check,
  cdd. STATUS as status
FROM
(SELECT
*
FROM
(
  SELECT
    q.QN,
    q.patientNO,
    q.patientName,
    q.date,
    q.createDT
  FROM
    hospitalq q
  WHERE
    q.createDT BETWEEN '${val.date1}'
    AND '${val.date2}'
  AND locationQ = 'PHAR_A2'
  UNION
    SELECT
      q.QN,
      q.patientNO,
      q.patientName,
      q.date,
      q.updateDT 'createDT'
    FROM
      queue_p q
    WHERE
      q.updateDT BETWEEN '${val.date1}'
      AND '${val.date2}'
      AND (q.QN LIKE 'P%' OR q.QN = '')
) AS a
ORDER BY
createDT DESC) AS q
  LEFT JOIN moph_sync s ON q.patientNO = s.patientID
  AND CAST(s.updateDT AS Date) = CURDATE()
  
  LEFT JOIN (
    SELECT
      cid,
      'Y' as 'check'
    FROM
      moph_drugs d
    WHERE
      d.hospcode <> '10666'
    GROUP BY
      cid
  ) AS d ON s.CID = d.cid
LEFT JOIN (
  SELECT
      TIMESTAMP,
      hn,
      queue
  FROM
      moph_confirm
  WHERE
      CAST(TIMESTAMP AS Date) BETWEEN CAST('${val.date1}' AS Date)
      AND CAST('${val.date2}' AS Date)
      AND site = 'W8'
) AS c ON q.patientNO = c.hn
LEFT JOIN (
  SELECT
      hn,
      STATUS
  FROM
      cut_dispend_drug
  WHERE
      STATUS = 'Y'
  AND deleteDT IS NULL
  AND departmentcode = 'W8'
  GROUP BY
      hn
) AS cdd ON trim(q.patientNO) = trim(cdd.hn)

ORDER BY
  q.createDT`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };

  this.addQP = function fill(val, DATA) {
    var sql =
      `INSERT INTO center.queue_p (
      QN,
      patientNO,
      patientName,
      date,
      createDT,
      updateDT
    )
    VALUES
      (
        '` +
      val.QN +
      `',
      TRIM('` +
      val.patientNO +
      `'),
      '` +
      val.patientName +
      `',
      '` +
      val.date +
      `',
      CURRENT_TIMESTAMP (),
      CURRENT_TIMESTAMP ()
      ) ON DUPLICATE KEY UPDATE updateDT = CURRENT_TIMESTAMP (),
      QN = '` +
      val.QN +
      `';`;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
  this.getTimecheck = function fill(val, DATA) {
    let sql = ``;
    if (val.site == "W8") {
      sql = `SELECT
    a.hn,a.patientname,
    DATE_FORMAT(a.starttime, '%Y-%m-%d %H:%i:%s') AS starttime,
    DATE_FORMAT(c.checkComplete, '%Y-%m-%d %H:%i:%s') AS endtime, 
    TIMEDIFF(
      TIME(c.checkComplete),
      TIME(a.starttime)
    ) AS time
  FROM
    (
      SELECT
        p.hn,
        p.patientname,
        p.datetimestamp AS 'starttime',
        p.takedate,p.queue
      FROM
        gd4unit.prescription p
      WHERE
        p.takedate BETWEEN '${val.datestart}' 
      AND '${val.dateend}'
      GROUP BY
        p.takedate,
        p.hn,p.queue
      UNION
        SELECT
          p.hn,
          p.patientname,
          p.datetimestamp AS 'starttime',
          p.takedate,p.queue
        FROM
          gd4unit_bk.prescription p
        WHERE
          p.takedate BETWEEN '${val.datestart}'
        AND '${val.dateend}'
        GROUP BY
          p.takedate,
          p.hn,p.queue
    ) a
  LEFT JOIN center.checkmedpatient c ON a.hn = c.hn
  AND a.takedate = c.date AND a.queue = c.queue
  WHERE
    c.hn <> ''
  AND c.checkComplete <> '' 
  ORDER BY a.starttime
  `;
    } else {
      let qn = val.site == "W18" ? `like '3%'` : `= '${val.site}'`;
      sql = `SELECT
	p.patientNO hn,
	p.patientName patientname,
	DATE_FORMAT(
		p.createDT,
		'%Y-%m-%d %H:%i:%s'
	) AS starttime,
	DATE_FORMAT(
		c.checkComplete,
		'%Y-%m-%d %H:%i:%s'
	) AS endtime,
	TIMEDIFF(
		TIME(c.checkComplete),
		TIME(p.createDT)
	) AS time
FROM
	center.queue_p p
LEFT JOIN center.checkmedpatient c ON p.patientNO = c.hn
AND p.QN = c.queue
AND p.date = c.date
WHERE
	p.date BETWEEN  '${val.datestart}'
        AND '${val.dateend}'
AND p.QN  ${qn}
AND c.hn <> ''
AND c.checkComplete <> ''
ORDER BY
	p.createDT`;
    }

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
  this.getHosp = function fill(val, DATA) {
    let sql = `SELECT NAME as hospname
    FROM hospcode
    WHERE OFF_ID = '${val}'
    `;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };

  this.getcut = function fill(val, DATA) {
    let sql = `SELECT *
FROM cut_dispend_drug d
WHERE deleteDT IS NULL
AND CAST(createdDT AS Date) BETWEEN '2024-04-01' AND '2024-05-31' 
AND balanceamount <> 0
AND departmentcode = 'W8'

    `;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
  this.insertcut = function fill(val, DATA) {
    let sql = `INSERT INTO cut_dispend_owe (id, cdd_id, amount, phar, createDT)
    VALUES
        (
            uuid(),
            '${val.id}',
            '${val.balanceamount}',
            'Robot',
            CURRENT_TIMESTAMP()
        )
    `;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
  this.updatecut = function fill(val, DATA) {
    let sql = `UPDATE cut_dispend_drug
SET balanceamount = '0',updateDT = CURRENT_TIMESTAMP(),status = 'N'
WHERE
	(
		id = '${val.id}'
	)
    `;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
  this.getDrugIPD = function fill(val, DATA) {
    let sql = `SELECT
	c.cst_num,
	c.tblt_cd MedCd,
	d.drugName MedNm,
	'ก่อนอาหารเช้า' MedNote,
	'' MedNote2,
	d.miniSpec MedSpec,
	d.miniUnit MedUnit,
	'0800:5' DoseList,
	'1' TakeDays,
	DATE_FORMAT(CURDATE(), "%Y%m%d") TakeDt
FROM
	atms.cassette_info c
LEFT JOIN pmpf_thailand_mnrh.dictdrug d ON c.tblt_cd = d.drugCode
WHERE
	c.cst_num <> ''
AND c.tblt_cd <> ''

    `;

    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        resolve(result);
      });
    });
  };
};
