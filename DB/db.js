const db = require("mysql2");

const Database = db.createPool({
  host: "192.168.185.101",
  user: "root",
  database: "center",
  password: "Admin@gd4",
});

module.exports = Database.promise();
