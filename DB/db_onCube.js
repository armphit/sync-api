const { Console } = require("console");
module.exports = function () {
  const sql = require("mssql");
  //จริง
  // this.config = {
  //   user: "sa",
  //   password: "jvm5822511",
  //   server: "192.168.185.164",
  //   database: "OnCube",
  //   // requestTimeout: 180000, // for timeout setting
  //   // connectionTimeout: 180000, // for timeout setting
  //   options: {
  //     encrypt: false, // need to stop ssl checking in case of local db
  //     enableArithAbort: true,
  //   },
  // };
  let poolPromise;
  let num = 0;
  connectDB();
  function connectDB() {
    poolPromise = new sql.ConnectionPool({
      user: "sa",
      password: "jvm5822511",
      server: "192.168.185.164",
      database: "OnCube",
      // requestTimeout: 180000, // for timeout setting
      // connectionTimeout: 180000, // for timeout setting
      options: {
        encrypt: false, // need to stop ssl checking in case of local db
        enableArithAbort: true,
      },
    })
      .connect()
      .then((pool) => {
        console.log("Connected to OnCube");
        return pool;
      })
      .catch((err) => {
        num++;
        console.log("Database Connection Failed! Bad Config: ", err);
        setTimeout(() => {
          if (num <= 5) {
            console.log('OnCube Error: '+ num)
            connectDB();
          }
        }, 60000)

      });
  }
  this.datadrug = function fill(val, DATA) {
    var sql =
      `SELECT
        Item.Mnemonic,
        InventoryContainer.ExpiredDate,
        QuantityMaximum
    FROM
        Item,
        InventoryContainer
    WHERE
        Item.RawID = InventoryContainer.ItemID
        AND Item.Mnemonic = '` +
      val +
      `'
        AND InventoryContainer.ContainerID IS NOT NULL`;

    return new Promise(async (resolve, reject) => {
      const pool = await poolPromise;
      try {
        const request = await pool.request();
        const result = await request.query(sql);
        resolve(result.recordset);
      } catch (error) {
        num = 0
        console.log("OnCube datadrug:" + error);
        connectDB();
      }
    });
  };

  module.exports = {
    sql,
    poolPromise,
  };
};
