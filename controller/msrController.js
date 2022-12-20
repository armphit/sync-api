const axios = require("axios");
const html2json = require("html2json").html2json;
exports.allergicController = async (req, res, next) => {
  let a = await axios.get(
    "http://164.115.23.100/test_token_php/index6.php?cid=" +
      req.body.cid +
      "&format=json"
  );

  let dataDrug = html2json(a.data).child[0].child[3].child[5].text;
  let dataDrug2 = html2json(a.data).child[0].child[3].child[6].text;
  console.log(html2json(a.data).child[0].child[3]);
  console.log(dataDrug2);
  if (dataDrug) {
    console.log("dataDrug");
    // console.log(JSON.parse(dataDrug).data);
    res.send(JSON.parse(dataDrug).data);
  } else if (dataDrug2) {
    console.log("dataDrug2");
    // console.log(JSON.parse(dataDrug2).data);
    res.send(JSON.parse(dataDrug2).data);
  } else {
    console.log("else");
    res.send({});
  }
};
