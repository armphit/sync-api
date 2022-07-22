const db = require("../db/db");

class UserModel {
  constructor({ email = "", password = "", role = "" }) {
    this.email = email;
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
      "INSERT INTO users (user, password, createAt, updateAt, role) VALUES(?, ?, ?, ?, ?)",
      [this.email, this.password, this.createAt, this.updateAt, this.role]
    );
  }

  static findUserByEmail({ email = "" }) {
    let a = db.execute("SELECT * FROM users WHERE user = ?", [email]);

    return a;
  }
}

module.exports = UserModel;
