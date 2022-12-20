const db = require("../db/db");

class UserModel {
  constructor({ email = "", name = "", password = "", role = "", ip = "" }) {
    this.email = email;
    this.name = name;
    this.password = password;
    this.role = role;
    this.ip = ip;
    this.createAt = new Date();
    this.updateAt = new Date();
  }

  updateLogin() {
    return db.execute("UPDATE users SET updateAt= ? WHERE user = ?", [
      this.updateAt,
      this.email,
    ]);
  }
  registerUser() {
    return db.execute(
      "INSERT INTO users (user, name, password, createAt, updateAt, role, status) VALUES(?, ?, ?, ?, ?, ?, 'N')",
      [
        this.email,
        this.name,
        this.password,
        this.createAt,
        this.updateAt,
        this.role,
      ]
    );
  }

  async findUserByEmail() {
    let insertip = await db.execute(
      "INSERT INTO printer (" +
        "ip," +
        " print_ip," +
        " print_name," +
        " createdDT," +
        " updateDT" +
        ")" +
        "VALUES" +
        " (" +
        " ?," +
        " ?," +
        " 'TSC TTP-247'," +
        " CURRENT_TIMESTAMP()," +
        " CURRENT_TIMESTAMP()" +
        ")ON DUPLICATE KEY UPDATE " +
        "updateDT = CURRENT_TIMESTAMP()",
      [this.ip, this.ip]
    );
    if (insertip[0].affectedRows) {
      let getlogin = await db.execute(
        "SELECT * FROM users LEFT JOIN printer ON ip = ? WHERE user = ? AND status = 'Y'",
        [this.ip, this.email]
      );

      return getlogin;
    } else {
      return [];
    }
  }

  updateUser() {
    return db.execute(`UPDATE users SET password = ? WHERE user = ?`, [
      this.password,
      this.email,
    ]);
  }
}

module.exports = UserModel;
