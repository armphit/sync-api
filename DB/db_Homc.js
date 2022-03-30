const { Console } = require("console");

module.exports = function () {
  const sql = require("mssql");
  //จริง
  this.config = {
    user: "robot",
    password: "Robot@MNRH2022",
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
 t.pay_typedes AS rightname,
 m.site
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

  module.exports = {
    sql,
    poolPromise,
  };
};
