const SyncModel = require("../model/syncModel");

exports.syncOPDController = async (req, res, next) => {
  const hn = req.body.data;
  const date = req.body.date;
  SyncModel.getHomc(req.body)
    .then((result) => {
      console.log(result);
    })
    .catch((error) => {
      res.status(401).json({
        message: "Authentication failed 102",
        error: error,
      });
    });
};
