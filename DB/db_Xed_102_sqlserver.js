module.exports = function () {
  const sql = require("mssql");

  this.config = {
    user: "Robot",
    password: "p@ssw0rd",
    server: "192.168.185.102",
    database: "center",
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
      console.log("Connected to XMed");
      return pool;
    })
    .catch((err) =>
      console.log("Database Connection Failed! Bad Config: ", err)
    );

  this.dataDrugSize = async function fill(val, DATA) {
    var sqlgetdrug =
      `SELECT
      val.Code,
      FLOOR(
        (Length / 100) * (Width / 100) * (Height / 100)
      ) AS Item,
      Quantity
    FROM
      (
        SELECT
          MAX (xm.Code) Code,
          MAX (xm.Length) Length,
          MAX (xm.Width) Width,
          MAX (xm.Height) Height,
          SUM (sp.Quantity) AS Quantity
        FROM
          XMed.dbo.Spaces sp
        LEFT JOIN XMed.dbo.Products xm ON sp.ProductId = xm.Id
        WHERE
          xm.Length IS NOT NULL
        AND sp.ProductId IS NOT NULL
        GROUP BY
          sp.ProductId
      ) AS val
       WHERE
      val.Code = '` +
      val +
      `'`;
    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      try {
        const request = await pool.request();
        const result = await request.query(sqlgetdrug);
        resolve(result.recordset);
      } catch (error) {
        // await pool.close();
        console.log("XMed:" + error);
      }
    });
  };

  this.dataDrugSizePre = async function fill(val, DATA) {
    var sqlgetdrug =
      `SELECT
      drugCode,
      FLOOR(
        (Length / 100) * (Width / 100) * (Height / 100)
      ) AS Item,
      Quantity
    FROM
      (
        SELECT
          MAX (dd.drugID) drugID,
          MAX (dd.drugCode) drugCode,
          MAX (dd.drugName) drugName,
          MAX (xm.Code) Code,
          MAX (xm.Length) Length,
          MAX (xm.Width) Width,
          MAX (xm.Height) Height
        FROM
          XMed.dbo.Spaces sp
        LEFT JOIN XMed.dbo.Products xm ON sp.ProductId = xm.Id
        LEFT JOIN dictdrug_102mySQL dd ON dd.drugID COLLATE SQL_Latin1_General_CP1_CI_AS = xm.Code COLLATE SQL_Latin1_General_CP1_CI_AS
        WHERE
          xm.Length IS NOT NULL
        AND sp.ProductId IS NOT NULL
        GROUP BY
          sp.ProductId
      ) AS val
      WHERE drugCode  LIKE '` +
      val +
      `%'`;
    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      try {
        const request = await pool.request();
        const result = await request.query(sqlgetdrug);
        resolve(result.recordset);
      } catch (error) {
        // await pool.close();
        console.log("XMed:" + error);
      }
    });
  };

  // this.dataDrugMain = async function fill(val, DATA) {
  //   var sqlgetdrug =
  //     `SELECT
  //     MAX (dd.drugID) drugID,
  //     MAX (dd.drugCode) drugCode,
  //     MAX (dd.drugName) drugName,
  //     MAX (dd.HisPackageRatio) HisPackageRatio,
  //     CASE
  //   WHEN CHARINDEX('-', MAX(dd.drugCode)) > 0
  //   AND MAX (dd.drugCode) <> 'CYCL-'
  //   AND MAX (dd.drugCode) <> 'DEX-O'
  //   AND MAX (dd.drugCode) <> 'POLY-1' THEN
  //     'Y'
  //   ELSE
  //     'N'
  //   END AS isPrepack
  //   FROM
  //     XMed.dbo.Spaces sp
  //   LEFT JOIN XMed.dbo.Products xm ON sp.ProductId = xm.Id
  //   LEFT JOIN center.dbo.dictdrug dd ON dd.drugID COLLATE SQL_Latin1_General_CP1_CI_AS = xm.Code
  //   WHERE
  //     xm.Length IS NOT NULL
  //   AND sp.ProductId IS NOT NULL
  //   AND sp.State <> 0
  //   AND dd.drugCode = '` +
  //     val.code +
  //     `'
  //   GROUP BY
  //     sp.ProductId
  //   ORDER BY
  //     CONVERT(int, MAX(dd.HisPackageRatio)) DESC`;
  //   return new Promise(async (resolve, reject) => {
  //     const pool = await poolPromise;
  //     try {
  //       const request = await pool.request();
  //       const result = await request.query(sqlgetdrug);
  //       resolve(result.recordset);
  //     } catch (error) {
  //       // await pool.close();
  //       console.log("XMed:" + error);
  //     }
  //   });
  // };

  // this.datadrugX = async function fill(val, DATA) {
  //   var sqlgetdrug =
  //     `SELECT
  //     MAX (dd.drugID) drugID,
  //     MAX (dd.drugCode) drugCode,
  //     MAX (dd.drugName) drugName,
  //     MAX (dd.HisPackageRatio) HisPackageRatio,
  //     CASE
  //   WHEN CHARINDEX('-', MAX(dd.drugCode)) > 0
  //   AND MAX (dd.drugCode) <> 'CYCL-'
  //   AND MAX (dd.drugCode) <> 'DEX-O'
  //   AND MAX (dd.drugCode) <> 'POLY-1' THEN
  //     'Y'
  //   ELSE
  //     'N'
  //   END AS isPrepack
  //   FROM
  //     XMed.dbo.Spaces sp
  //   LEFT JOIN XMed.dbo.Products xm ON sp.ProductId = xm.Id
  //   LEFT JOIN center.dbo.dictdrug dd ON dd.drugID COLLATE SQL_Latin1_General_CP1_CI_AS = xm.Code
  //   WHERE
  //     xm.Length IS NOT NULL
  //   AND sp.ProductId IS NOT NULL
  //   AND sp.State <> 0
  //   AND dd.drugCode LIKE '` +
  //     val.code +
  //     `%'
  //   GROUP BY
  //     sp.ProductId
  //   ORDER BY
  //     CONVERT(int, MAX(dd.HisPackageRatio)) DESC`;
  //   return new Promise(async (resolve, reject) => {
  //     const pool = await poolPromise;
  //     try {
  //       const request = await pool.request();
  //       const result = await request.query(sqlgetdrug);
  //       resolve(result.recordset);
  //     } catch (error) {
  //       // await pool.close();
  //       console.log("XMed:" + error);
  //     }
  //   });
  // };

  this.dataDrugMain = async function fill(val, DATA) {
    // var sqlgetdrug =
    //   `SELECT
    //   MAX (dd.drugID) drugID,
    //   MAX (dd.drugCode) drugCode,
    //   MAX (dd.drugName) drugName,
    //   MAX (dd.HisPackageRatio) HisPackageRatio,
    //   CASE
    // WHEN CHARINDEX('-', MAX(dd.drugCode)) > 0
    // AND MAX (dd.drugCode) <> 'CYCL-'
    // AND MAX (dd.drugCode) <> 'DEX-O'
    // AND MAX (dd.drugCode) <> 'POLY-1' THEN
    //   'Y'
    // ELSE
    //   'N'
    // END AS isPrepack
    // FROM
    //   XMed.dbo.Spaces sp
    // LEFT JOIN XMed.dbo.Products xm ON sp.ProductId = xm.Id
    // LEFT JOIN center.dbo.dictdrug dd ON dd.drugID COLLATE SQL_Latin1_General_CP1_CI_AS = xm.Code
    // WHERE
    //   xm.Length IS NOT NULL
    // AND sp.ProductId IS NOT NULL
    // AND sp.State <> 0
    // AND dd.drugCode = '` +
    //   val.code +
    //   `'
    // GROUP BY
    //   sp.ProductId
    // ORDER BY
    //   CONVERT(int, MAX(dd.HisPackageRatio)) DESC`;
    let sqlgetdrug =
      `SELECT
      val.Code,
      dd.drugID,
      dd.drugCode,
      dd.drugName,
      dd.HISPackageRatio AS HisPackageRatio,
    FLOOR(
      (Length / 100) * (Width / 100) * (Height / 100)
    ) AS Item,
    Quantity,
    CASE
    WHEN CHARINDEX('-', (dd.drugCode)) > 0
    AND  (dd.drugCode) <> 'CYCL-'
    AND  (dd.drugCode) <> 'DEX-O'
    AND  (dd.drugCode) <> 'POLY-1' THEN
      'Y'
    ELSE
      'N'
    END AS isPrepack
  FROM
    (
      SELECT
        MAX (xm.Code) Code,
        MAX (xm.Length) Length,
        MAX (xm.Width) Width,
        MAX (xm.Height) Height,
        SUM (sp.Quantity) AS Quantity
      FROM
        XMed.dbo.Spaces sp
      LEFT JOIN XMed.dbo.Products xm ON sp.ProductId = xm.Id
      WHERE
        xm.Length IS NOT NULL
      AND sp.ProductId IS NOT NULL
      AND sp.State <> 0
      GROUP BY
        sp.ProductId
    ) AS val
  LEFT JOIN center.dbo.dictdrug dd ON val.Code = dd.drugID COLLATE SQL_Latin1_General_CP1_CI_AS
  WHERE
    dd.drugCode = '` +
      val.code +
      `'`;

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      try {
        const request = await pool.request();
        const result = await request.query(sqlgetdrug);
        resolve(result.recordset);
      } catch (error) {
        // await pool.close();
        console.log("XMed:" + error);
      }
    });
  };

  this.datadrugX = async function fill(val, DATA) {
    // var sqlgetdrug =
    //   `SELECT
    //   MAX (dd.drugID) drugID,
    //   MAX (dd.drugCode) drugCode,
    //   MAX (dd.drugName) drugName,
    //   MAX (dd.HisPackageRatio) HisPackageRatio,
    //   CASE
    // WHEN CHARINDEX('-', MAX(dd.drugCode)) > 0
    // AND MAX (dd.drugCode) <> 'CYCL-'
    // AND MAX (dd.drugCode) <> 'DEX-O'
    // AND MAX (dd.drugCode) <> 'POLY-1' THEN
    //   'Y'
    // ELSE
    //   'N'
    // END AS isPrepack
    // FROM
    //   XMed.dbo.Spaces sp
    // LEFT JOIN XMed.dbo.Products xm ON sp.ProductId = xm.Id
    // LEFT JOIN center.dbo.dictdrug dd ON dd.drugID COLLATE SQL_Latin1_General_CP1_CI_AS = xm.Code
    // WHERE
    //   xm.Length IS NOT NULL
    // AND sp.ProductId IS NOT NULL
    // AND sp.State <> 0
    // AND dd.drugCode LIKE '` +
    //   val.code +
    //   `%'
    // GROUP BY
    //   sp.ProductId
    // ORDER BY
    //   CONVERT(int, MAX(dd.HisPackageRatio)) DESC`;
    let sqlgetdrug =
      `SELECT
  val.Code,
  dd.drugID,
  dd.drugCode,
  dd.drugName,
  dd.HISPackageRatio AS HisPackageRatio,
  FLOOR(
    (Length / 100) * (Width / 100) * (Height / 100)
  ) AS Item,
  Quantity,
  CASE
  WHEN CHARINDEX('-', (dd.drugCode)) > 0
  AND  (dd.drugCode) <> 'CYCL-'
  AND  (dd.drugCode) <> 'DEX-O'
  AND  (dd.drugCode) <> 'POLY-1' THEN
    'Y'
  ELSE
    'N'
  END AS isPrepack
FROM
  (
    SELECT
      MAX (xm.Code) Code,
      MAX (xm.Length) Length,
      MAX (xm.Width) Width,
      MAX (xm.Height) Height,
      SUM (sp.Quantity) AS Quantity
    FROM
      XMed.dbo.Spaces sp
    LEFT JOIN XMed.dbo.Products xm ON sp.ProductId = xm.Id
    WHERE
      xm.Length IS NOT NULL
    AND sp.ProductId IS NOT NULL
    AND sp.State <> 0
    GROUP BY
      sp.ProductId
  ) AS val
LEFT JOIN center.dbo.dictdrug dd ON val.Code = dd.drugID COLLATE SQL_Latin1_General_CP1_CI_AS
WHERE
    dd.drugCode LIKE '` +
      val.code +
      `%'
    ORDER BY
    CONVERT(int, dd.HisPackageRatio) DESC`;
    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      try {
        const request = await pool.request();
        const result = await request.query(sqlgetdrug);
        resolve(result.recordset);
      } catch (error) {
        // await pool.close();
        console.log("XMed:" + error);
      }
    });
  };

  this.updateDicdrug = async function fill(val, DATA) {
    var sqlgetdrug =
      `IF EXISTS (SELECT * FROM dictdrug WHERE drugCode = N'` +
      val.code +
      `')
      BEGIN
        UPDATE dictdrug
      SET ` +
      val.update +
      `
      WHERE
        drugCode = N'` +
      val.code +
      `'
      END
      ELSE
      
      BEGIN
        INSERT INTO dictdrug 
      VALUES
        (
          ` +
      val.insert +
      `
        ) ;
      END `;
    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      try {
        const request = await pool.request();
        const result = await request.query(sqlgetdrug);
        resolve(result.recordset);
      } catch (error) {
        // await pool.close();
        console.log("XMed:" + error);
      }
    });
  };
};
