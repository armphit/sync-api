const SyncModel = require("../model/syncModel");
const moment = require("moment");
const js2xmlparser = require("js2xmlparser");

var db_Homc = require("../DB/db_Homc");
var homc = new db_Homc();
var db_pmpf = require("../DB/db_pmpf_thailand_mnrh");
var pmpf = new db_pmpf();
var db_GD4Unit_101 = require("../DB/db_GD4Unit_101_sqlserver");
var GD4Unit_101 = new db_GD4Unit_101();
var db_onCube = require("../DB/db_onCube");
var onCube = new db_onCube();
var db_mysql102 = require("../DB/db_center_102_mysql");
var center102 = new db_mysql102();

exports.syncOPDController = async (req, res, next) => {
  const hn = req.body.data;
  const date = req.body.date;
  // res.send(req.params);
  // const top = req.body.top;
  // res.end(top);

  // var sqlCommand =
  //   `SELECT
  //   m.batch_no As prescriptionno,
  //   m.detail_no As seq,
  //   o.hn As hn,
  //   o.VisitNo As an,
  //   Rtrim(ti.titleName) + ' ' +Rtrim(pt.firstName) + ' ' + Rtrim(pt.lastName) As patientname,
  //   CASE When pt.sex='ช' then 'M' else 'F' END as sex,
  //   pt.birthDay as patientdob,
  //   pt.marital as  maritalstatus,
  //   'H' As prioritycode,
  //   FORMAT(p.lastIssDate,'yyyy-MM-dd hh:mm:ss') As takedate,
  //   FORMAT(mh.lastUpd,'yyyy-MM-dd hh:mm:ss') AS ordercreatedate,
  //   m.inv_code As orderitemcode,
  //   v.gen_name as orderitemname,
  //   m.quant As orderqty,
  //   p.unit as orderunitcode,
  //   p.lamedHow as instructioncode,
  //   (SELECT max(value) FROM STRING_SPLIT(p.lamedQty,'-')) as dosage,
  //   -- p.lamedQty as dosage,
  //   p.lamedUnit as dosageunitcode,
  //   p.lamedTime as timecode,
  //   '1' As durationcode,
  //   m.maker As usercreatecode,
  //   m.site As departmentcode,
  //   si.site_addr As departmentdesc,
  //   p.lamedTimeText as  freetext1,
  //   p.lamedText as freetext2,
  //   FORMAT(p.lastIssTime,'yyyy-MM-dd hh:mm:ss') as  lastmodified,
  //   m.invTMTCode10 As tmtcode,
  //   ( SELECT Rtrim(LTRIM(mi.Description))+','-- ,mif.Med_Inv_Code
  //    FROM Med_Info_Group mi
  //    LEFT JOIN Med_Info mif on (mif.Med_Info_Code = mi.Code)
  //    where mif.Med_Inv_Code =m.inv_code
  //    FOR XML PATH('')
  //   ) as itemidentify,
  //   m.cost As cost,
  //   m.amount As totalprice,
  //   v.remarks As orderitemnameTh,
  //   b.useDrg AS rightid,
  //   t.pay_typedes AS rightname,
  //   m.site

  //   FROM
  //   OPD_H o
  //   LEFT JOIN Med_logh mh On o.hn = mh.hn AND o.regNo = mh.regNo
  //   left join Med_log m on mh.batch_no = m.batch_no
  //   left join Bill_h b on b.hn = mh.hn AND b.regNo = mh.regNo
  //   left join Paytype t on t.pay_typecode = b.useDrg
  //   left join Med_inv v on (v.code = m.inv_code  and v.[site]='1')
  //   left join Patmed p (NOLOCK) on (p.hn = mh.hn and p.registNo = mh.regNo and p.invCode = m.inv_code and m.quant_diff = p.runNo)
  //   left join PATIENT pt  on (pt.hn = o.hn)
  //   left join PTITLE ti on (ti.titleCode = pt.titleCode)
  //   left join Site si On m.site = si.site_key
  //   WHERE
  //   mh.hn='` +
  //   hn.padL(" ") +
  //   `'
  //   AND mh.invdate = '` +
  //   date +
  //   `'
  //   AND m.pat_status = 'O'
  //   AND m.revFlag IS NULL
  //   -- AND m.override_code = 'Y'
  //   AND m.site IN ('W8','W9')
  //   order by m.date DESC`;

  // try {
  //   if (parseInt(hn) != NaN) {
  //     let x = {};
  //     x = await homc.fill(sqlCommand);
  //     let b = x.recordset;
  //     res.send("ssss");
  //     let drugarr = [];
  //     let q = await center102.fill(b[0].hn.trim());

  //     let c = {
  //       hn: b[0].hn.trim(),
  //       name: b[0].patientname.trim(),
  //       sex: b[0].sex.trim(),
  //       prescriptionno: b[0].prescriptionno.trim(),
  //       patientdob: b[0].patientdob.trim(),
  //       queue: q[0].QN,
  //     };

  //     for (let i = 0; i < b.length; i++) {
  //       var sqlgetdrug =
  //         `SELECT orderitemcode,Strength,firmname,pack,dosageunitcode
  //     FROM ms_drug
  //     WHERE orderitemcode = '` +
  //         b[i].orderitemcode +
  //         `'`;
  //       sql101 = await GD4Unit_101.dataDrug(sqlgetdrug);
  //       sql101 = sql101.recordset;

  //       if (sql101.length !== 0 && Number(b[i].orderqty.trim()) > 0) {
  //         let drug = {
  //           Name: b[i].orderitemname.trim(),
  //           Qty: b[i].orderqty.trim(),
  //           alias: "",
  //           code: b[i].orderitemcode.trim(),
  //           firmName: sql101[0].firmname,
  //           method: "",
  //           note: "",
  //           spec: sql101[0].Strength,
  //           type: "",
  //           unit: b[i].orderunitcode,
  //         };
  //         drugarr.push(drug);
  //       }
  //     }

  //     getdataHomc(drugarr, c);
  //   } else {
  //     x = {};
  //     x.data = "0";
  //     res.send(x);
  //   }
  // } catch (error) {
  //   x = {};
  //   x.data = "0";
  //   res.send(x);
  // }
};
