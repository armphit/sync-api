const { Console } = require("console");

module.exports = function () {
  const sql = require("mssql");
  //จริง
  this.config = {
    user: "sa",
    password: "jvm5822511",
    server: "192.168.185.164",
    database: "OnCube",
    requestTimeout: 180000, // for timeout setting
    connectionTimeout: 180000, // for timeout setting
    options: {
      encrypt: false, // need to stop ssl checking in case of local db
      enableArithAbort: true,
    },
  };

  const poolPromise = new sql.ConnectionPool(this.config)
    .connect()
    .then((pool) => {
      console.log("Connected to OnCube");
      return pool;
    })
    .catch((err) =>
      console.log("Database Connection Failed! Bad Config: ", err)
    );

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
      const result = await pool.request().query(sql);
      resolve(result.recordset);
    });
  };

  module.exports = {
    sql,
    poolPromise,
  };
};
