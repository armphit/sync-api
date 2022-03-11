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
      NULL As itemindex,
      m.batch_no As prescriptionno,
      m.detail_no As seq,
      NULL As seqmax,
      o.hn As hn,
      o.VisitNo As an,
      Rtrim(ti.titleName) + ' ' +Rtrim(pt.firstName) + ' ' + Rtrim(pt.lastName) As patientname,
      CASE When pt.sex='ช' then 'M' else 'F' END as sex,
      pt.birthDay as patientdob,
      pt.marital as  maritalstatus,
      'H' As prioritycode,
      FORMAT(p.lastIssDate,'yyyy-MM-dd HH:mm:ss') As takedate,
      FORMAT(mh.lastUpd,'yyyy-MM-dd HH:mm:ss') AS ordercreatedate,
      m.inv_code As orderitemcode,
      v.gen_name as orderitemname,
      m.quant As orderqty,
      p.unit as orderunitcode,
      p.lamedHow as instructioncode,
      (SELECT max(value) FROM STRING_SPLIT(p.lamedQty,'-')) as dosage,
      p.lamedUnit as dosageunitcode,
      NULL as  frequencycode,
      p.lamedTime as timecode,
      NULL As timecount,
      '1' As durationcode,
      m.maker As usercreatecode,
      NULL As orderacceptfromip,
      null As computername,
      m.site As departmentcode,
      si.site_addr As departmentdesc,
      NULL As itemlotcode,
      NULL As itemlotexpire,
      NULL As doctorcode,
      NULL as doctorname,
      p.lamedTimeText as  freetext1,
      p.lamedText as freetext2,
      FORMAT(p.lastIssTime,'yyyy-MM-dd HH:mm:ss') as  lastmodified,
      NULL As [language],
      NULL As ordertype,
      NULL As highalert,
      NULL As shelfzone,
      NULL As shelfname,
      NULL As varymeal,
      NULL As varymealtime,
      NULL As voiddatetime,
      NULL As sendmachine,
      NULL As sendmix,
      NULL As drugusagecode,
      m.invTMTCode10 As tmtcode,
      NULL As startdate,
      NULL As enddate,
      NULL As offstatus,
      NULL As groupdrug,
      NULL As sendmixcode,
      NULL As sendmixname,
      NULL As Vol,
      NULL As dosageunitforVol,
      NULL As calprice,
      NULL As genorderdatetime,
      NULL As screendatetime,
      NULL As printstatus,
      ( SELECT Rtrim(LTRIM(mi.Description))+','
       FROM Med_Info_Group mi
       LEFT JOIN Med_Info mif on (mif.Med_Info_Code = mi.Code)
       where mif.Med_Inv_Code =m.inv_code
       FOR XML PATH('')
      ) as itemidentify,
      NULL As printdrp,
      NULL As meditemindex,
      NULL As firstdose,
      NULL As diluentadd,
      NULL As orderfrom,
      NULL As holddatetime,
      NULL As varymealstatus,
      NULL As odddatetime,
      NULL As diluentseq,
      NULL As oddday,
      NULL As freetext3,
      NULL As paytype,
      null As edned,
      NULL As edneddetail,
      NULL As DIDcode,
      NULL As continuestatus,
      NULL As codetype,
      m.cost As cost,
      NULL As [value],
      NULL As price,
      m.amount As totalprice,
      NULL As discount,
      NULL As dosagetext,
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
      AND m.site IN ('W8','W9')
      AND FORMAT(p.lastIssTime,'hh:mm') not in (` +
      val.allTimeOld +
      `)
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
