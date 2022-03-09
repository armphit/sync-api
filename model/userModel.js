const db = require("../db/db");

class UserModel {
  constructor({ email = "", password = "", id = 0 }) {
    this.email = email;
    this.password = password;
    this.id = id;
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
    value = [];
    let a = db.execute(
      "INSERT INTO users (user, password, createAt, updateAt) VALUES(?, ?, ?, ?)",
      [this.email, this.password, this.createAt, this.updateAt]
    );
  }

  static findUserByEmail({ email = "" }) {
    let a = db.execute("SELECT * FROM users WHERE user = ?", [email]);

    return a;
  }
}

module.exports = UserModel;
