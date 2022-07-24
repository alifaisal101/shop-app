const path = require(path);

const formidable = require("formidable");

const rootDir = require("./util/functions/path");

module.exports = (req, res, next) => {
  var form = new formidable.IncomingForm();

  form.parse(req);

  form.on("fileBegin", function (name, file) {
    file.path = path.join(
      rootDir,
      "public",
      "assets",
      "product-images",
      file.name
    );
  });

  form.on("file", function (name, file) {
    console.log("Uploaded " + file.name);
  });

  next();
};
