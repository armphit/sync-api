const { Console } = require("console");

module.exports = function () {
  const sql = require("mssql");
  //จริง
  this.config = {
    user: "robot",
    password: "57496208",
    server: "192.168.44.1",
    database: "MHR",
    timezone: "utc",
    requestTimeout: 180000, // for timeout setting
    connectionTimeout: 180000, // for timeout setting
    options: {
      encrypt: false, // need to stop ssl checking in case of local db
      enableArithAbort: true,
    },
  };

  this.connection = new sql.connect(this.config, function (err) {
    if (err) console.log("ERROR: " + err);
  });

  const poolPromise = new sql.ConnectionPool(this.config)
    .connect()
    .then((pool) => {
      console.log("Connected to Homc");
      return pool;
    })
    .catch((err) =>
      console.log("Database Connection Failed! Bad Config: ", err)
    );

  String.prototype.padL = function padL(n) {
    var target = this;
    while (target.length < 7) {
      target = n + target;
    }
    return target;
  };

  this.fill = function fill(CMD, DATA) {
    // // create Request object
    new this.sql.Request(this.connection).query(CMD, function (err, recordset) {
      if (err) console.log("ERROR: " + err);

      // send records as a response
      // res.send(recordset);
      DATA(recordset);
    });
  };

  this.fill = async function fill(val, DATA) {
    var sqlCommand =
      `SELECT
	m.batch_no AS prescriptionno,
	m.detail_no AS seq,
	o.hn AS hn,
	o.VisitNo AS an,
	Rtrim(ti.titleName) + ' ' + Rtrim(pt.firstName) + ' ' + Rtrim(pt.lastName) AS patientname,
	CASE
WHEN pt.sex = 'ช' THEN
	'M'
ELSE
	'F'
END AS sex,
 pt.birthDay AS patientdob,
 pt.marital AS maritalstatus,
 'H' AS prioritycode,
 p.lastIssDate AS takedate,
 mh.lastUpd AS ordercreatedate,
p.lastIssTime AS lastmodified,
 m.inv_code AS orderitemcode,
 v.gen_name AS orderitemname,
 m.quant AS orderqty,
 p.unit AS orderunitcode,
 p.lamedHow AS instructioncode,
 p.lamedQty AS dosage,
 p.lamedUnit AS dosageunitcode,
 p.lamedTime AS timecode,
 m.maker AS usercreatecode,
 m.site AS departmentcode,
 si.site_addr AS departmentdesc,
 p.lamedTimeText AS freetext1,
 p.lamedText AS freetext2,
 m.invTMTCode10 AS tmtcode,
 (
	SELECT
		Rtrim(LTRIM(mi.Description)) + ',' -- ,mif.Med_Inv_Code
	FROM
		Med_Info_Group mi
	LEFT JOIN Med_Info mif ON (mif.Med_Info_Code = mi.Code)
	WHERE
		mif.Med_Inv_Code = m.inv_code FOR XML PATH ('')
) AS itemidentify,
 m.cost AS cost,
 m.amount AS totalprice,
 v.remarks AS orderitemnameTh,
 b.useDrg AS rightid,
 t.pay_typedes AS rightname

FROM
	OPD_H o
LEFT JOIN Med_logh mh ON o.hn = mh.hn
AND o.regNo = mh.regNo
LEFT JOIN Med_log m ON mh.batch_no = m.batch_no
LEFT JOIN Bill_h b ON b.hn = mh.hn
AND b.regNo = mh.regNo
LEFT JOIN Paytype t ON t.pay_typecode = b.useDrg
LEFT JOIN Med_inv v ON (
	v.code = m.inv_code
	AND v.[site] = '1'
)
LEFT JOIN Patmed p (NOLOCK) ON (
	p.hn = mh.hn
	AND p.registNo = mh.regNo
	AND p.invCode = m.inv_code
	AND m.quant_diff = p.runNo
)
LEFT JOIN PATIENT pt ON (pt.hn = o.hn)
LEFT JOIN PTITLE ti ON (ti.titleCode = pt.titleCode)
LEFT JOIN Site si ON m.site = si.site_key
WHERE
	mh.hn = '` +
      val.data.padL(" ") +
      `'
AND mh.invdate = '` +
      val.date +
      `'
AND m.pat_status = 'O'
AND m.site = 'W8'
AND m.revFlag IS NULL
AND FORMAT(p.lastIssTime,'hh:mm') not in (` +
      val.allTimeOld +
      `)
ORDER BY
	p.lastIssTime`;

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sqlCommand);
      resolve(result);
    });
  };

  this.dataDrug = async function fill(CMD, DATA) {
    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(CMD);

      resolve(result);
    });
  };

  this.checkmed = async function fill(val, DATA) {
    let hn = String(val.hn);
    for (let i = 0; i < 7 - String(val.hn).length; i++) {
      hn = " " + hn;
    }

    var sqlCommand =
      `SELECT
      m.batch_no AS prescriptionno,
      ROW_NUMBER () OVER (
        PARTITION BY o.hn,
        mh.lastUpd
      ORDER BY
        p.lastIssTime 
      ) AS seq,
      o.hn AS hn,
      Rtrim(ti.titleName) + ' ' + Rtrim(pt.firstName) + ' ' + Rtrim(pt.lastName) AS patientname,
      CASE
    WHEN pt.sex = 'ช' THEN
      'M'
    ELSE
      'F'
    END AS sex,
     pt.birthDay AS patientdob,
     m.inv_code AS drugCode,
     v.gen_name AS drugName,
     v.remarks AS drugNameTh,
     m.quant AS qty,
     p.unit AS unitCode,
     m.site AS departmentcode,
     dy.priceGroupDesc,
     v.charge_c,
     v.Category,
     la.lamed_name AS lamed_name,
     p.lamedQty AS dosage,
     (
      SELECT
        lamed_name
      FROM
        Lamed lam
      WHERE
        lam.lamed_code = p.lamedUnit
    ) AS freetext0,
     p.lamedTimeText AS freetext1,
     p.lamedText AS freetext2,
     '( ' + (
      SELECT
        DISTINCT(Rtrim(LTRIM(mi.Description))) + ' '
      FROM
        Med_Info_Group mi
      LEFT JOIN Med_Info mif ON (mif.Med_Info_Code = mi.Code)
      WHERE
        mif.Med_Inv_Code = m.inv_code
      AND (
        mi.InfoGroup LIKE '%สี%'
        OR mi.InfoGroup IS NULL
      ) FOR XML PATH ('')
    ) + ')' AS itemidentify,
     (
      SELECT
        DISTINCT(Rtrim(LTRIM(mi.Description))) + ' '
      FROM
        Med_Info_Group mi
      LEFT JOIN Med_Info mif ON (mif.Med_Info_Code = mi.Code)
      WHERE
        mif.Med_Inv_Code = m.inv_code
      AND mi.Description <> ''
      AND mi.InfoGroup = 'Indication' FOR XML PATH ('')
    ) AS indication,
    qr.QRCode,
     mh.lastUpd AS ordercreatedate,
     p.lastIssTime AS lastmodified,
     la.lamed_eng,
     (
      SELECT
        lamed_eng
      FROM
        Lamed lam
      WHERE
        lam.lamed_code = p.lamedUnit
    ) AS freetext1_eng
    FROM
      OPD_H o
    LEFT JOIN Med_logh mh ON o.hn = mh.hn
    AND o.regNo = mh.regNo
    LEFT JOIN Med_log m ON mh.batch_no = m.batch_no
    LEFT JOIN Bill_h b ON b.hn = mh.hn
    AND b.regNo = mh.regNo
    LEFT JOIN Paytype t ON t.pay_typecode = b.useDrg
    LEFT JOIN Med_inv v ON (
      v.code = m.inv_code
      AND v.[site] = '1'
    )
    LEFT JOIN Patmed p (NOLOCK) ON (
      p.hn = mh.hn
      AND p.registNo = mh.regNo
      AND p.invCode = m.inv_code
      AND m.quant_diff = p.runNo
    )
    LEFT JOIN PATIENT pt ON (pt.hn = o.hn)
    LEFT JOIN PTITLE ti ON (ti.titleCode = pt.titleCode)
    LEFT JOIN Site si ON m.site = si.site_key
    LEFT JOIN Lamed la ON p.lamedHow = la.lamed_code
    LEFT JOIN DynPriceGroup dy ON t.medGroupCode = dy.priceGroupCode
    LEFT JOIN Med_QRCode qr ON m.inv_code = qr.inv_code
    WHERE
      mh.hn = '` +
      hn +
      `'
    AND mh.invdate = ` +
      val.date +
      `
    AND m.pat_status = 'O'
    AND m.site = '${val.site}'
    AND m.revFlag IS NULL 
        AND FORMAT(p.lastIssTime,'hh:mm') not in (` +
      val.allTimeOld +
      `)
    ORDER BY
      p.lastIssTime`;
    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sqlCommand);
      resolve(result);
    });
  };

  this.intruction = async function fill(val, DATA) {
    let hn = String(val.hn);
    for (let i = 0; i < 7 - String(val.hn).length; i++) {
      hn = " " + hn;
    }
    // var sqlCommand =
    //   `SELECT
    //     TRIM (pt.titleName) + ' ' + pa.firstName + ' ' + TRIM(pa.lastName) AS name_patient,
    //     p.invCode,
    //     la.lamed_name AS lamedName,
    //     p.lamedQty AS dosage,
    //     (
    //         SELECT
    //             lamed_name
    //         FROM
    //             Lamed lam
    //         WHERE
    //             lam.lamed_code = p.lamedUnit
    //     ) AS freetext0,
    //     p.lamedTimeText AS freetext1,
    //     p.lastIssTime,
    //     p.lamedText AS freetext2,
    //     '( ' + (
    //      SELECT
    //        DISTINCT(Rtrim(LTRIM(mi.Description))) + ' '
    //      FROM
    //        Med_Info_Group mi
    //      LEFT JOIN Med_Info mif ON (mif.Med_Info_Code = mi.Code)
    //      WHERE
    //        mif.Med_Inv_Code = '` +
    //   val.code +
    //   `'
    //      AND (
    //        mi.InfoGroup LIKE '%สี%'
    //        OR mi.InfoGroup IS NULL
    //      ) FOR XML PATH ('')
    //    ) + ')' AS itemidentify
    // FROM
    //     Patmed p
    // LEFT JOIN Lamed la ON p.lamedHow = la.lamed_code
    // LEFT JOIN PATIENT pa ON p.hn = pa.hn
    // LEFT JOIN PTITLE pt ON pa.titleCode = pt.titleCode
    // WHERE
    //     p.hn = '` +
    //   hn +
    //   `'
    //     AND p.invCode = '` +
    //   val.code +
    //   `'
    // AND TRY_CONVERT (DATE, p.firstIssDate) = '` +
    //   val.date +
    //   `'`;
    let sqlCommand =
      `SELECT
      TRIM (ti.titleName) + ' ' + pt.firstName + ' ' + TRIM (pt.lastName) AS name_patient,
      p.invCode,
      la.lamed_name AS lamedName,
      p.lamedQty AS dosage,
      (
        SELECT
          lamed_name
        FROM
          Lamed lam
        WHERE
          lam.lamed_code = p.lamedUnit
      ) AS freetext0,
      p.lamedTimeText AS freetext1,
      p.lastIssTime,
      p.lamedText AS freetext2,
      '( ' + (
        SELECT DISTINCT
          (
            Rtrim(LTRIM(mi.Description))
          ) + ' '
        FROM
          Med_Info_Group mi
        LEFT JOIN Med_Info mif ON (mif.Med_Info_Code = mi.Code)
        WHERE
          mif.Med_Inv_Code = p.invCode
        AND (
          mi.InfoGroup LIKE '%สี%'
          OR mi.InfoGroup IS NULL
        ) FOR XML PATH ('')
      ) + ')' AS itemidentify
    FROM
      OPD_H o
    LEFT JOIN Med_logh mh ON o.hn = mh.hn
    AND o.regNo = mh.regNo
    LEFT JOIN Med_log m ON mh.batch_no = m.batch_no
    LEFT JOIN Bill_h b ON b.hn = mh.hn
    AND b.regNo = mh.regNo
    LEFT JOIN Paytype t ON t.pay_typecode = b.useDrg
    LEFT JOIN Med_inv v ON (
      v.code = m.inv_code
      AND v.[site] = '1'
    )
    LEFT JOIN Patmed p (NOLOCK) ON (
      p.hn = mh.hn
      AND p.registNo = mh.regNo
      AND p.invCode = m.inv_code
      AND m.quant_diff = p.runNo
    )
    LEFT JOIN PATIENT pt ON (pt.hn = o.hn)
    LEFT JOIN PTITLE ti ON (ti.titleCode = pt.titleCode)
    LEFT JOIN Site si ON m.site = si.site_key
    LEFT JOIN Lamed la ON p.lamedHow = la.lamed_code
    LEFT JOIN DynPriceGroup dy ON t.medGroupCode = dy.priceGroupCode
    LEFT JOIN Med_QRCode qr ON m.inv_code = qr.inv_code
    WHERE
      mh.hn = '` +
      hn +
      `'
    AND mh.invdate = ` +
      val.date +
      `
    AND m.pat_status = 'O'
    AND m.site = '` +
      val.floor +
      `'
    AND m.revFlag IS NULL
    AND TRIM (m.inv_code) = '` +
      val.code +
      `'
    ORDER BY
      p.lastIssTime`;

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sqlCommand);
      resolve(result.recordset);
    });
  };
  this.getDrugstar = async function fill(val, DATA) {
    var sqlCommand =
      `SELECT
      IIF (
        SUBSTRING (
          gen_name,
          LEN(TRIM(gen_name)),
          LEN(TRIM(gen_name))
        ) = '*',
        1,
        0
      ) val,     
      TRIM (code) code,
      TRIM (name) name,
      TRIM (gen_name) gen_name
    FROM
      Med_inv
    WHERE
      code = '` +
      val +
      `'`;

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sqlCommand);
      resolve(result.recordset);
    });
  };
  this.getDrughomc = async function fill(val, DATA) {
    var sqlCommand = `SELECT
      TRIM (code) code,
      TRIM (name) name
    FROM
      Med_inv
    WHERE
      site = '1'`;

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sqlCommand);
      resolve(result.recordset);
    });
  };
  this.getMaker = async function fill(val, DATA) {
    let hn = String(val.patientNO);
    while (hn.length < 7) {
      hn = " " + hn;
    }
    var sqlCommand =
      `SELECT
    mlh.hn,
    ml.inv_code,
    TRIM (pf.firstName) +' '+ TRIM (pf.lastName) name,
    TRIM (pf.firstName) + TRIM (pf.lastName) maker,
    TRIM (d.docName) + ' ' + TRIM (d.docLName) pe
    FROM
      Med_logh mlh
    LEFT JOIN Med_log ml ON mlh.batch_no = ml.batch_no
    LEFT JOIN profile pf ON ml.maker = pf.UserCode
    LEFT JOIN Patmed p (NOLOCK) ON (
      p.hn = mlh.hn
      AND p.registNo = mlh.regNo
      AND p.invCode = ml.inv_code
      AND ml.quant_diff = p.runNo
    )
    LEFT JOIN DOCC d on d.docCode = p.orderDoc
  WHERE
    mlh.hn = '` +
      hn +
      `'
  AND ml.makeDate = ` +
      val.date +
      `
  AND ml.pat_status = 'O'
  AND ml.site = '` +
      val.site +
      `'
  AND ml.revFlag IS NULL
  AND TRIM (ml.inv_code) = TRIM('` +
      val.drugCode +
      `')`;
    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sqlCommand);
      resolve(result.recordset);
    });
  };

  this.getCid = async function fill(val, DATA) {
    var cid =
      `SELECT CardID
      FROM PatSS
      WHERE hn = ` +
      val +
      ``;
    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(cid);
      resolve(result.recordset);
    });
  };
};
