const db = require("../db/db");

class UserModel {
  constructor({ email = "", name = "", password = "", role = "" }) {
    this.email = email;
    this.name = name;
    this.password = password;
    this.role = role;

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
      "INSERT INTO users (user, name, password, createAt, updateAt, role) VALUES(?, ?, ?, ?, ?, ?)",
      [this.email, this.name, this.password, this.createAt, this.updateAt, this.role]
    );
  }

  static findUserByEmail({ email = "" }) {
    let a = db.execute("SELECT * FROM users WHERE user = ?", [email]);

    return a;
  }

  updateUser() {
    return db.execute(`UPDATE users SET password = ? WHERE user = ?`, [
      this.password,
      this.email,
    ]);
  }
}

module.exports = UserModel;
