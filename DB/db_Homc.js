const { Console } = require("console");

module.exports = function () {
  const sql = require("mssql");
  //จริง
  this.config = {
    user: "robot",
    password: "57496208",
    server: "192.168.41.1",
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
    let site = val.check.sitew1 ? `W9` : `W8`;
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
AND m.site = '${site}'
AND m.revFlag IS NULL
AND FORMAT(p.lastIssTime,'hh:mm') not in (` +
      val.allTimeOld +
      `)
ORDER BY
	p.lastIssTime`;

    return new Promise(async (resolve, reject) => {
      try {
        const pool = await poolPromise;
        const result = await pool.request().query(sqlCommand);
        resolve(result);
      } catch (error) {
        console.log(sqlCommand);
        console.log(error);
      }
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

  this.getDrugip2000 = async function fill(val, DATA) {
    var cid = `SELECT
      m.code AS orderitemcode,
      m.name AS tradename,
      NULL AS orderitemTHname,
      NULL AS orderitemENname,
      m.gen_name genericname,
      CASE
    WHEN m.hideSelect = ''
    OR m.hideSelect = 'N'
    OR m.hideSelect IS NULL THEN
      'Y'
    ELSE
      'N'
    END AS unused,
     NULL AS barcode,
     isnull(m.strgth, '') + isnull(m.strgth_u, '') AS Strength,
     m.unit AS dosageunitcode,
     NULL AS capacity,
     NULL AS capacity_unit,
     NULL AS capacity_orderunit,
     m.unit AS orderunitcode,
     NULL AS drugshape,
     NULL AS description,
     m.lastEditDate AS dateupdate,
     NULL AS locationcode,
     CASE
    WHEN m.HAD = '1' THEN
      'Y'
    ELSE
      'N'
    END AS highalert,
     NULL AS multidose,
     NULL AS shelfzone,
     NULL AS shelfname,
     NULL AS shelfzone2,
     NULL AS shelfname2,
     CASE
    WHEN m.charge_c IN ('ED', 'ED*') THEN
      '0'
    ELSE
      '1'
    END AS edned,
     NULL AS stdcode,
     NULL AS drugaccountcode,
     d.dform_des dosegeform,
     m.color AS displaycolour,
     NULL AS GFMIScode,
     NULL AS GPOcode,
     m.code AS Inventorycode,
     m.buy_prc AS cost,
     m.ipd_prc AS IPDprice,
     m.opd_prc AS OPDprice,
     'Y' AS sendmachine,
     NULL AS sendmix,
     NULL AS print_ipd_injection_sticker,
     NULL AS pharmacoindex,
     NULL AS pharmacoindexaddition1,
     NULL AS pharmacoindexaddition2,
     NULL AS pharmacoindexaddition3,
     m.def_dose AS instructioncode_ipd,
     l.unit_lamed_c AS dispensedose_ipd,
     l.code_unit AS dosageunitcode_ipd,
     l.code_time AS frequencycode_ipd,
     NULL AS timecode_ipd,
     m.def_dose AS instructioncode_opd,
     l.unit_lamed_c AS dispensedose_opd,
     l.code_unit AS dosageunitcode_opd,
     l.code_time AS frequencycode_opd,
     NULL AS timecode_opd,
     NULL AS notify_text,
     NULL AS agestart,
     NULL AS ageend,
     NULL AS age_text,
     NULL AS spesification_text,
     NULL AS adverse_reaction_text,
     NULL AS contraindications_text,
     NULL AS precaution_text,
     NULL AS storage_text,
     NULL AS maxdoseperdose,
     m.maxdose AS maxdoseperday,
     NULL AS maxduration,
     NULL AS mintimenextdose,
     'Y' AS medicalsupplies,
     NULL AS picname,
     '1' AS drugtype,
     NULL AS locationname1,
     NULL AS locationname2,
     NULL AS pricedoseunitstatus,
     NULL AS priceunitstatus,
     m.def_dose AS drugusagecodeIPD,
     m.def_dose AS drugusagecodeOPD,
     NULL AS diluentstatus,
     NULL AS continuestatus,
     NULL AS freezestatus,
     NULL AS lightstatus,
     NULL AS dispensedoseqty_opd,
     NULL AS priceunittotalstatus,
     NULL AS logstatus,
     NULL AS paystatus,
     d.dform_des AS drugform,
     NULL AS orderqty_status,
     NULL AS orderqty_ipd,
     'Y' AS printstatus,
     NULL AS pack,
     NULL AS sendStore,
     NULL AS sendF3F4
    FROM
      Med_inv m (NOLOCK)
    LEFT JOIN Dform d (NOLOCK) ON (d.dform_key = m.dform)
    LEFT JOIN Lamed_c l (NOLOCK) ON (m.def_dose = l.code_lamed)
    WHERE
      m.site = '1'`;
    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(cid);
      resolve(result.recordset);
    });
  };

  this.getQP = async function fill(val, DATA) {
    var cid = `SELECT
    o.hn AS patientNO,
    MIN (
        Rtrim(ti.titleName) + ' ' + Rtrim(pt.firstName) + ' ' + Rtrim(pt.lastName)
    ) AS patientName,
    CONVERT(varchar, MIN(p.lastIssTime), 20)  AS createdDT,
    null AS QN,
    null AS 'timestamp',
    null AS cid,
    null AS 'check',
    null AS status
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
mh.invdate  BETWEEN '${val.datethai1}' AND '${val.datethai2}'
AND m.pat_status = 'O'
AND m.site = 'W8'
AND m.revFlag IS NULL
AND TRIM(o.hn) NOT IN (${val.hn})
GROUP BY
    o.hn
ORDER BY createdDT`;

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(cid);
      resolve(result.recordset);
    });
  };
};
