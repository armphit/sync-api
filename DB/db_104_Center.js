module.exports = function () {
  const sql = require("mssql");
  //จริง
  this.config = {
    user: "Robot",
    password: "p@ssw0rd",
    server: "192.168.185.104",
    database: "center",
    requestTimeout: 180000, // for timeout setting
    connectionTimeout: 180000, // for timeout setting
    options: {
      encrypt: false, // need to stop ssl checking in case of local db
      enableArithAbort: true,
    },
  };

  // this.connection = new sql.connect(this.config, function (err) {
  //   if (err) console.log("ERROR: " + err);
  // });

  const poolPromise = new sql.ConnectionPool(this.config)
    .connect()
    .then((pool) => {
      console.log("Connected to 104Center");
      return pool;
    })
    .catch((err) =>
      console.log("Database Connection Failed! Bad Config: ", err)
    );

  this.insertLED = async function fill(val, DATA) {
    var sqlgetdrug =
      `IF EXISTS (
          SELECT
            *
          FROM
            LED.dbo.ms_box
          WHERE
            ipmain = '` +
      val.ipmain +
      `'
        )
        BEGIN
        
        IF EXISTS (
          SELECT
            *
          FROM
          LED.dbo.ms_OpenLEDTime
          WHERE
            PrescriptionNo = '` +
      val.PrescriptionNo +
      `'
          AND ipmain = '` +
      val.ipmain +
      `'
        )
        BEGIN
          UPDATE [LED].[dbo].[ms_OpenLEDTime]
        SET [readdatetime] = NULL
        WHERE
         
            [PrescriptionNo] = '` +
      val.PrescriptionNo +
      `'
        AND ipmain = '` +
      val.ipmain +
      `'
        END
        ELSE
        
        BEGIN
          INSERT INTO [LED].[dbo].[ms_OpenLEDTime] (
            [PrescriptionNo],
            [ipmain],
            [userid]
          )
        VALUES
          (
            '` +
      val.PrescriptionNo +
      `',
        '` +
      val.ipmain +
      `',
        '` +
      val.user +
      `'     
          ) ;
        END
        END`;

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sqlgetdrug);
      resolve(result);
    });
  };
  this.update_led = async function fill(val, DATA) {
    let de = val.device == "CR" ? "LED15" : val.device;
    var sqlgetdrug =
      `IF EXISTS (
        SELECT
          *
        FROM
          LED.dbo.ms_box
        WHERE
          ipmain = '` +
      val.ip +
      `'
      )
      BEGIN
        UPDATE LED.dbo.ms_LEDTime
      SET DispensTime = DATEADD(mi ,- 10, GETDATE()),
       [position] = '` +
      val.drugCode +
      `'
      WHERE
        (boxid = '` +
      de +
      `')
      END`;

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sqlgetdrug);
      resolve(result);
    });
  };

  this.checkdelete = function fill(val, DATA) {
    let checkq = val.queue ? `AND queue = '` + val.queue + `'` : ``;
    var sql =
      `SELECT
			*
		FROM
			msr.dbo.checkmedpatient
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

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sql);
      resolve(result.recordset);
    });
  };
  this.insertPatient = function fill(val, DATA) {
    var sql =
      `INSERT INTO msr.dbo.checkmedpatient  (
        id,
        hn,
        userCheck,
        date,
        timestamp,
        isDelete,
        userDelete,
        checkComplete,
        queue,
        indexdate,
        indextime
      )
      VALUES
        (
          NEWID(),
              '` +
      val.hn +
      `',
      '` +
      val.user +
      `',
      '` +
      val.dateEN +
      `',
          CURRENT_TIMESTAMP,
          NULL,
          NULL,
          NULL,
          '` +
      val.queue +
      `',
      FORMAT(CURRENT_TIMESTAMP, 'yyyyMMdd'),
      FORMAT(CURRENT_TIMESTAMP, 'HHmm')
        );`;
    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sql);
      resolve(result.recordset);
    });
  };
  this.checkPatientcheckmed = function fill(val, DATA) {
    var sql = `SELECT
      MAX(hn) hn,
      FORMAT (p.lastmodified, 'HH:mm') AS ordertime
   FROM
      msr.dbo.checkmed  p
   WHERE
      p.cmp_id = '${val}'
   GROUP BY
      FORMAT (p.lastmodified, 'HH:mm')
 `;

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sql);
      resolve(result.recordset);
    });
  };
  this.insertDrugcheck = function fill(val, DATA) {
    let sql = `INSERT INTO msr.dbo.checkmed  (
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
      scantimestamp,
      indexdate,
      indextime
      )
      VALUES(NEWID(),'${val.cmp_id}',${val.count},${val.comma},null,'${val.qty}',CURRENT_TIMESTAMP,FORMAT(CURRENT_TIMESTAMP, 'yyyyMMdd'),
      FORMAT(CURRENT_TIMESTAMP, 'HHmm'))
       
      `;

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sql);
      resolve(result.recordset);
    });
  };
  this.selectcheckmed = function fill(val, DATA) {
    let sql = `
      SELECT
	(
		SELECT
			MAX (seq)
		FROM
			msr.dbo.checkmed
		WHERE
			cmp_id = '${val}'
		GROUP BY
			hn
	) AS countDrug,
	IIF (
		TRIM (pc.drugCode) IN (
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
	MAX (pc.id) id,
	MAX (pc.cmp_id) cmp_id,
	MAX (pc.rowNum) rowNum,
	MAX (pc.prescriptionno) prescriptionno,
	pc.seq seq,
	MAX (pc.hn) hn,
	MAX (pc.patientname) patientname,
	MAX (pc.sex) sex,
	MAX (pc.patientdob) patientdob,
	pc.drugCode drugCode,
	IIF (
		TRIM (pc.drugCode) IN ('OLAZA'),
		CONCAT (
			SUBSTRING (MAX(pc.drugName), 1, 36),
			'...'
		),
		MAX (pc.drugName)
	) drugName,
	MAX (pc.drugNameTh) drugNameTh,

		IIF (
			MAX (dc.qty_cut) <> '',
			IIF (
				MAX (pc.qty) > MAX (dc.qty_cut),
				MAX (dc.qty_cut),
				MAX (pc.qty)
			),
			MAX (pc.qty)
		)
	 qty,
	MAX (pc.unitCode) unitCode,
	MAX (pc.departmentcode) departmentcode,
	MAX (pc.righttext1) righttext1,
	MAX (pc.righttext2) righttext2,
	MAX (pc.righttext3) righttext3,
	MAX (pc.lamedName) lamedName,
	MAX (pc.dosage) dosage,
	MAX (pc.freetext0) freetext0,
	MAX (pc.freetext1) freetext1,
	MAX (pc.freetext2) freetext2,
	MAX (pc.itemidentify) itemidentify,
	MAX (pc.indication) indication,
	MAX (pc.qrCode) qrCode,
	MAX (pc.ordercreatedate) ordercreatedate,
	pc.lastmodified,
	MAX (pc.lamedEng) lamedEng,
	MAX (pc.freetext1Eng) freetext1Eng,
	MAX (pc.checkstamp) checkstamp,
		IIF (
			MAX (dc.qty_cut) <> '',
			IIF (
				MAX (pc.checkqty) > MAX (dc.qty_cut),
				MAX (dc.qty_cut),
				MAX (pc.checkqty)
			),
			MAX (pc.checkqty)
		)
	 checkqty,
	MAX (pc.scantimestamp) scantimestamp,
	IIF (
		MAX (sortDrug.sortOrder) IS NULL,
		(
			SELECT
				MAX (sortOrder)
			FROM
				msr.dbo.devicedescription
		),
		MAX (sortDrug.sortOrder)
	) sortOrder,
	STRING_AGG (img.pathImage, ',') WITHIN GROUP (ORDER BY img.pathImage ASC) AS pathImage,
	STRING_AGG (img.typeNum, ',') AS typeNum,
	MAX (bdg.barCode) barCode,
	MAX (sortDrug.device) device,
	MAX (mp.drugCode) checkDrug,

		IIF (
			MAX (dc.qty_cut) <> '',
			IIF (
				MAX (pc.qty) > MAX (dc.qty_cut),
				MAX (pc.qty) - MAX (dc.qty_cut),
				0
			),
			0
		)
	 cur_qty

FROM
	msr.dbo.checkmed pc
LEFT JOIN msr.dbo.images_drugs img ON img.drugCode = pc.drugCode
LEFT JOIN msr.dbo.barcode_drug bdg ON pc.drugCode = bdg.drugCode
LEFT JOIN msr.dbo.med_print mp ON pc.drugCode = mp.drugCode
LEFT JOIN (
	SELECT
		MAX (drugCode) drugCode,
		MAX (drugName) drugName,
		MAX (device) device,
		MAX (sortOrder) sortOrder
	FROM
		(
			SELECT
				MAX (dd.drugCode) drugCode,
				MAX (dd.drugName) drugName,
				dv.deviceCode AS device,
				MAX (pd.sortOrder) sortOrder
			FROM
				msr.dbo.devicedrugsetting ds
			LEFT JOIN msr.dbo.device dv ON ds.deviceID = dv.deviceID
			LEFT JOIN msr.dbo.dictdrug dd ON ds.drugID = dd.drugID
			LEFT JOIN msr.dbo.devicedescription pd ON pd.shortName = IIF (
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
) sortDrug ON sortDrug.drugCode = pc.drugCode
LEFT JOIN msr.dbo.drug_cut dc ON dc.drugCode = pc.drugCode
WHERE
	cmp_id = '${val}'
GROUP BY
	pc.drugCode,
	pc.seq,
	pc.lastmodified
ORDER BY
	MAX (sortOrder)
 
    `;

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sql);
      resolve(result.recordset);
    });
  };

  this.updatePatient = function fill(val, DATA) {
    let sql =
      `UPDATE msr.dbo.checkmedpatient
      SET checkComplete = ${val.status ? "CURRENT_TIMESTAMP" : "null"}
      WHERE
        (
          id = '` +
      val.patient +
      `')`;

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sql);
      resolve(result.recordset);
    });
  };
  this.deletcheckmed = function fill(val, DATA) {
    let sql =
      `UPDATE msr.dbo.checkmedpatient 
      SET isDelete = CURRENT_TIMESTAMP , userDelete = '` +
      val.user +
      `'
      WHERE
        (id = '` +
      val.cmp_id +
      `')
      `;

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sql);
      resolve(result);
    });
  };
  this.updatecheckmed = function fill(val, DATA) {
    let sql =
      `
      UPDATE msr.dbo.checkmed 
        SET checkqty = '` +
      val.currentqty +
      `',
        checkstamp = CURRENT_TIMESTAMP
        WHERE
            (id = '` +
      val.id +
      `')`;

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sql);
      resolve(result);
    });
  };
  this.insertlogcheckmed = function fill(val, DATA) {
    let sql =
      `INSERT INTO msr.dbo.checkmed_log  (id, cm_id, qty, [user], createDT,indexdate,indextime)
      VALUES
        (
          NEWID(),
          '` +
      val.id +
      `',
      '` +
      val.qty +
      `',
      '` +
      val.user +
      `',
      CURRENT_TIMESTAMP,
      FORMAT(CURRENT_TIMESTAMP, 'yyyyMMdd'),
      FORMAT(CURRENT_TIMESTAMP, 'HHmm')
        )`;

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sql);
      resolve(result);
    });
  };

  this.insertSync = function fill(val, DATA) {
    var sql =
      `
            IF (
        SELECT
          hn
        FROM
          GD4Unit.dbo.synclastupdate_opd
        WHERE
          hn = '` +
      val.hn.trim() +
      `'
      ) IS NULL
      BEGIN
          INSERT INTO GD4Unit.dbo.synclastupdate_opd (
              prescriptionno,
              hn,
              createdate,
              readdatetime,
              status,
              realdate,
              patientname
              
            )
            VALUES
              (
                '` +
      val.prescriptionno.trim() +
      `',
                '` +
      val.hn.trim() +
      `',
                CONVERT (DATE, GETDATE()),
                CURRENT_TIMESTAMP,
                'Y',
                '` +
      val.date +
      `',
      '${val.patientname}'
              )
      END
      ELSE
      BEGIN
          UPDATE GD4Unit.dbo.synclastupdate_opd
          SET realdate = '` +
      val.date +
      `', readdatetime = CURRENT_TIMESTAMP
          WHERE hn = '` +
      val.hn.trim() +
      `';
      END`;

    // ,
    // clicksend = (select * from (SELECT max(clicksend)+1 FROM synclastupdate_opd WHERE hn = '` +
    // val.hn.trim() +
    // `' LIMIT 1) t

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sql);
      resolve(result);
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
      `INSERT INTO  GD4Unit.dbo.prescription  (
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

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sql);
      resolve(result);
    });
  };
  this.checkCut = function fill(val, DATA) {
    var sql = `SELECT *
                FROM msr.dbo.drug_cut`;

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sql);
      resolve(result.recordset);
    });
  };
  this.checkPatient = function fill(val, DATA) {
    var sql =
      `
      SELECT
      MAX(hn) hn,
       CONVERT(VARCHAR(5),CONVERT(DATETIME, p.lastmodified, 0), 108)  AS ordertime
   FROM
      GD4Unit.dbo.prescription p
   WHERE
       takedate = FORMAT (GETDATE(), 'yyyy-MM-dd')
   AND p.hn = '` +
      val +
      `'
   GROUP BY
     CONVERT(VARCHAR(5),CONVERT(DATETIME, p.lastmodified, 0), 108)`;

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sql);
      resolve(result.recordset);
    });
  };
  this.getPatientSync = function fill(val, DATA) {
    var sql =
      `SELECT
	ROW_NUMBER() OVER(ORDER BY syn.readdatetime DESC) indexrow,
	MAX (syn.prescriptionno) prescriptionno,
	syn.hn,
	pre.patientname,
	syn.readdatetime,
	MAX (syn.status) AS sendMachine,
	DateAdd(
		yyyy,
		- 543,
		CAST (pre.patientdob AS DATE)
	) patientdob,
	pre.patientdob AS birthTH,
	FLOOR(
		DATEDIFF(
			DAY,
			DateAdd(
				yyyy,
				- 543,
				CAST (pre.patientdob AS DATE)
			),
			GETDATE()
		) / 365.25
	) age,
	MAX (pre.sex) AS sex
FROM
	GD4Unit.dbo.synclastupdate_OPD AS syn,
	GD4Unit.dbo.prescription AS pre
WHERE
	syn.hn = pre.hn
AND syn.createdate = '` +
      val +
      `'
GROUP BY
	syn.hn,
	syn.readdatetime,
	pre.patientname,
	pre.patientdob`;

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sql);
      resolve(result.recordset);
    });
  };
  this.getDrugSync = function fill(val, DATA) {
    var sql = `SELECT
      prescriptionno,
      sex,
    DateAdd(
		yyyy,
		- 543,
		CAST (patientdob AS DATE)
	) patientdob,
     patientdob AS birth,
     orderitemcode,
     orderitemname,
     FLOOR(orderqty) AS orderqty,
     orderunitcode,
     lastmodified AS ordercreatedate,
     'true' AS STATUS
    FROM
      GD4Unit.dbo.prescription
    WHERE
      hn = '${val.hn}'
    AND takedate = '${val.date}'`;

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sql);
      resolve(result.recordset);
    });
  };
  this.addReport = function fill(val, DATA) {
    var sql = `INSERT INTO [center].[dbo].[gd4_report] (
	[id],
	[department],
	[system],
	[status],
	[issue_reason],
	[solution],
	[username],
	[date_index],
	[time_index],
	[createDT]
)
VALUES
	${val}`;

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sql);
      resolve(result);
    });
  };
  this.getReport = function fill(val, DATA) {
    var sql = `SELECT
    	id,
	department,
	system,
	status,
	issue_reason,
	solution,
	username,
	date_index,
	time_index,
	CONVERT (VARCHAR(25), createDT, 120) createDT
    FROM
      [center].[dbo].[gd4_report]
    WHERE
      ${val}`;
    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sql);
      resolve(result.recordset);
    });
  };
  this.deleteReport = function fill(val, DATA) {
    var sql = `DELETE 
FROM
	center.dbo.gd4_report
WHERE
	date_index = ${val}`;

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sql);
      resolve(result);
    });
  };
};
