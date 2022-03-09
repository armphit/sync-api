const { Console } = require("console");

module.exports = function () {
  this.sql = require("mysql");
  // จริง
  this.config = {
    user: "root",
    password: "cretem",
    host: "192.168.185.102",
    database: "center",
  };

  // Local Test
  // this.config = {
  //     user: 'root',
  //     password: 'Admingd4',
  //     host: '127.0.0.1',
  //     database: 'pmpf_thailand_mnrh' ,
  //     connectionLimit: 15,
  //     queueLimit: 30
  // };

  this.DataReturn = null;

  this.fill = function fill(CMD, DATA) {
    // // create Request object
    this.connection.query(CMD, function (err, recordset) {
      if (err) console.log("ERROR: " + err);

      // send records as a response
      // res.send(recordset);
      DATA(recordset);
    });
  };

  this.insert = function fill(CMD, DATA) {
    // // create Request object
    this.connection.query(CMD, function (err, recordset) {
      if (err) console.log("ERROR: " + err);

      // send records as a response
      // res.send(recordset);
      DATA(recordset);
      // console.log("affectedRows: " + recordset.affectedRows);
    });
  };

  this.delete = function fill(CMD, DATA) {
    // // create Request object
    this.connection.query(CMD, function (err, recordset) {
      if (err) console.log("ERROR: " + err);
      console.log("affectedRows: " + recordset.affectedRows);
    });
  };

  this.insertAll = async (CMD_ARR) => {
    await CMD_ARR.forEach((CMD) => {
      // console.log(CMD);
      try {
        this.connection.query(CMD, function (err, recordset) {
          if (err) console.log("ERROR: " + err);
          console.log("affectedRows: " + recordset.affectedRows);
        });
      } catch (error) {
        console.log(error);
      }
    });
    // console.log("TXT: "+ CMD ); //+ " / " + JSON.stringify(VALUE));
  };
};
