const { Console } = require("console");

module.exports = function () {
  const sql = require("mssql");

  let poolPromise;
  let num = 0;
  conDB();
  function conDB() {
    poolPromise = new sql.ConnectionPool({
      user: "sa",
      password: "123456",
      server: "192.168.181.45",
      requestTimeout: 180000, // for timeout setting
      connectionTimeout: 180000, // for timeout setting
      options: {
        encrypt: false, // need to stop ssl checking in case of local db
        enableArithAbort: true,
      },
    })
      .connect()
      .then((pool) => {
        console.log(
          `Connected to YULIM ${new Date().toLocaleString("en-GB", {
            hour12: false,
          })}`
        );
        // updateEXP();
        return pool;
      })
      .catch((err) => {
        num++;
        console.log("Database Connection Failed! Bad Config: ", err);
        const thaiTime = new Intl.DateTimeFormat("th-TH", {
          timeZone: "Asia/Bangkok",
          hour: "2-digit",
        }).format(new Date());
        setTimeout(() => {
          if (Number(thaiTime) >= 8 && Number(thaiTime) < 20 && num < 6) {
            let todayDate = formatDate(new Date());
            console.log(todayDate + " YULIM Error: " + num);

            conDB();
          }
        }, 10000);
      });
  }
  this.dataDrug = async function fill(val, DATA) {
    var sqlgetdrug = `SELECT
	p.Code orderitemcode,
	CONCAT ('YU-', m.Code) location,
  21 sortOrder
FROM
	CLFBJ20241127.dbo.Products p
INNER JOIN CLFBJ20241127.dbo.Spaces s ON s.ProductId = p.Id
LEFT JOIN CLFBJ20241127.dbo.MedBoxs m ON m.ProductId = p.Id`;
    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sqlgetdrug);
      resolve(result.recordset);
    });
  };
  function updateEXP(val, DATA) {
    var sqlgetdrug = `IF (
    SELECT
      COUNT (ProductId)
    FROM
      CLFBJ20241127.dbo.MedBoxs
    WHERE
      ProductId IS NOT NULL
    AND FORMAT (
      ProductExpirationDate,
      'yyyy-MM-dd'
    ) = FORMAT (
      DATEADD(YEAR, 1, GETDATE()),
      'yyyy-MM-dd'
    )
  ) = (
    SELECT
      COUNT (ProductId)
    FROM
      CLFBJ20241127.dbo.MedBoxs
    WHERE
      ProductId IS NOT NULL
  ) SELECT
    NULL
  ELSE
    UPDATE [CLFBJ20241127].[dbo].[MedBoxs]
  SET [ProductExpirationDate] = FORMAT (
    DATEADD(YEAR, 1, GETDATE()),
    'yyyy-MM-dd'
  )
  WHERE
    ProductId IS NOT NULL`;
    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sqlgetdrug);
      console.log(result);

      resolve(result);
    });
  }
};

function formatDate(date) {
  return (
    [
      date.getFullYear(),
      padTo2Digits(date.getMonth() + 1),
      padTo2Digits(date.getDate()),
    ].join("-") +
    " " +
    [
      padTo2Digits(date.getHours()),
      padTo2Digits(date.getMinutes()),
      padTo2Digits(date.getSeconds()),
    ].join(":")
  );
}
function padTo2Digits(num) {
  return num.toString().padStart(2, "0");
}
