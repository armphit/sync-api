const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const UserModel = require("../model/userModel");
const os = require("os");

exports.registerController = (req, res, next) => {
  const { email, name, password, role } = req.body;
  bcrypt
    .hash(password, 10)
    .then((hash) => {
      const User = new UserModel({
        email: email,
        name: name,
        password: hash,
        role: role,
      });
      User.registerUser()
        .then(() => {
          res.status(201).json({
            message: "success",
          });
        })
        .catch((error) => {
          console.log(1);
          res.status(500).json({
            message: error,
          });
        });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({
        message: error,
      });
    });
};

exports.updatePasswordController = (req, res, next) => {
  const { email, password } = req.body;

  bcrypt
    .hash(password, 10)
    .then((hash) => {
      const User = new UserModel({
        email: email,
        password: hash,
      });
      User.updateUser()
        .then(() => {
          res.status(201).json({
            message: "success",
          });
        })
        .catch((error) => {
          res.status(500).json({
            message: error,
          });
        });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({
        message: error,
      });
    });
};

exports.loginController = (req, res, next) => {
  const { email = "", password, ip } = req.body;
  const User = new UserModel({ email: email, ip: ip });
  User.findUserByEmail()
    .then(([row]) => {
      if (row.length !== 0) {
        return bcrypt
          .compare(password, row[0].password)
          .then((result) => {
            if (!result) {
              res.status(401).json({
                message: "Authentication failed 101",
              });
            } else {
              let jwtToken = jwt.sign(
                {
                  email: row[0].email,
                  userId: row[0].id,
                },
                "create-authen-nodejs",
                {
                  expiresIn: "1h",
                }
              );
              res.status(200).json({
                // Authorization: Bearer,
                token: jwtToken,
                expiresIn: 3600,
                role: row[0].role,
                user: row[0].user,
                name: row[0].name,
                ip: row[0].ip,
                print_ip: row[0].print_ip,
                print_name: row[0].print_name,
              });
              const User = new UserModel({ email: email });
              User.updateLogin();
            }
          })
          .catch((error) => {
            res.status(401).json({
              message: "Authentication failed 102",
              error: error,
            });
          });
      } else {
        res.status(401).json({
          message: "Authentication failed 103",
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        message: error,
      });
    });
};
