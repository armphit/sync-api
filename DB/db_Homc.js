const { Console } = require("console");

module.exports = function () {
  const sql = require("mssql");
  //จริง
  this.config = {
    user: "robot",
    password: "Robot@MNRH2022",
    server: "192.168.44.1",
    database: "MHR",
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

  this.fill = async function fill(val, DATA) {
    var sqlCommand =
      `SELECT
    m.batch_no As prescriptionno,
    m.detail_no As seq,
    o.hn As hn,
    o.VisitNo As an,
    Rtrim(ti.titleName) + ' ' +Rtrim(pt.firstName) + ' ' + Rtrim(pt.lastName) As patientname,
    CASE When pt.sex='ช' then 'M' else 'F' END as sex,
    pt.birthDay as patientdob,
    pt.marital as  maritalstatus,
    'H' As prioritycode,
    FORMAT(p.lastIssDate,'yyyy-MM-dd hh:mm:ss') As takedate,
    FORMAT(mh.lastUpd,'yyyy-MM-dd hh:mm:ss') AS ordercreatedate,
    m.inv_code As orderitemcode,
    v.gen_name as orderitemname,
    m.quant As orderqty,
    p.unit as orderunitcode,
    p.lamedHow as instructioncode,
    (SELECT max(value) FROM STRING_SPLIT(p.lamedQty,'-')) as dosage,
    -- p.lamedQty as dosage,
    p.lamedUnit as dosageunitcode,
    p.lamedTime as timecode,
    '1' As durationcode,
    m.maker As usercreatecode,
    m.site As departmentcode,
    si.site_addr As departmentdesc,
    p.lamedTimeText as  freetext1,
    p.lamedText as freetext2,
    FORMAT(p.lastIssTime,'yyyy-MM-dd hh:mm:ss') as  lastmodified,
    m.invTMTCode10 As tmtcode,
    ( SELECT Rtrim(LTRIM(mi.Description))+','-- ,mif.Med_Inv_Code
     FROM Med_Info_Group mi
     LEFT JOIN Med_Info mif on (mif.Med_Info_Code = mi.Code)
     where mif.Med_Inv_Code =m.inv_code
     FOR XML PATH('')
    ) as itemidentify,
    m.cost As cost,
    m.amount As totalprice,
    v.remarks As orderitemnameTh,
    b.useDrg AS rightid,
    t.pay_typedes AS rightname,
    m.site

    FROM
    OPD_H o
    LEFT JOIN Med_logh mh On o.hn = mh.hn AND o.regNo = mh.regNo
    left join Med_log m on mh.batch_no = m.batch_no
    left join Bill_h b on b.hn = mh.hn AND b.regNo = mh.regNo
    left join Paytype t on t.pay_typecode = b.useDrg
    left join Med_inv v on (v.code = m.inv_code  and v.[site]='1')
    left join Patmed p (NOLOCK) on (p.hn = mh.hn and p.registNo = mh.regNo and p.invCode = m.inv_code and m.quant_diff = p.runNo)
    left join PATIENT pt  on (pt.hn = o.hn)
    left join PTITLE ti on (ti.titleCode = pt.titleCode)
    left join Site si On m.site = si.site_key
    WHERE
    mh.hn='` +
      val.data.padL(" ") +
      `'
    AND mh.invdate = '` +
      val.date +
      `'
    AND m.pat_status = 'O'
    AND m.revFlag IS NULL
    -- AND m.override_code = 'Y'
    AND m.site IN ('W8','W9')
    order by m.date DESC`;
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
