const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const UserModel = require("../model/userModel");
// const moment = require("moment");
// const js2xmlparser = require("js2xmlparser");

// var db_Homc = require("../DB/db_Homc");
// var homc = new db_Homc();
// var db_pmpf = require("../DB/db_pmpf_thailand_mnrh");
// var pmpf = new db_pmpf();
// var db_GD4Unit_101 = require("../DB/db_GD4Unit_101_sqlserver");
// var GD4Unit_101 = new db_GD4Unit_101();
// var db_onCube = require("../DB/db_onCube");
// var onCube = new db_onCube();
// var db_mysql102 = require("../DB/db_center_102_mysql");
// var center102 = new db_mysql102();
// var db_mysql101 = require("../DB/db_gd4unit_101_mysql");
// var gd4unit101 = new db_mysql101();

exports.registerController = (req, res, next) => {
  const { email, password } = req.body;
  bcrypt
    .hash(password, 10)
    .then((hash) => {
      const User = new UserModel({ email: email, password: hash });
      User.registerUser()
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
      res.status(500).json({
        message: error,
      });
    });
};

exports.loginController = (req, res, next) => {
  const { email = "", password } = req.body;
  UserModel.findUserByEmail({ email: email })
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
