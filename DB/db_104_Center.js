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

  this.connection = new sql.connect(this.config, function (err) {
    if (err) console.log("ERROR: " + err);
  });

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
      val.device +
      `')
      END`;

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      const result = await pool.request().query(sqlgetdrug);
      resolve(result);
    });
  };
};
