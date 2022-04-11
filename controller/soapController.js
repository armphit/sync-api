const js2xmlparser = require("js2xmlparser");
const soap = require("soap");
const { transform } = require("camaro");

exports.soapDIHController = async (req, res, next) => {
  if (req.body) {
    let xmlDrug = { xml: js2xmlparser.parse("drugDict", req.body) };
    var url =
      "http://192.168.185.102:8788/axis2/services/DIHPMPFWebservice?wsdl";
    var client = await soap.createClientAsync(url);
    var result = await client.drugDictAsync(xmlDrug);
    var val = await transform(result[0].return, { data: "//code" });
    if (val.data !== "0") {
      res.send("error");
    } else {
      res.status(200).json({
        // Authorization: Bearer,
        status: "success",
      });
    }
  }
};
