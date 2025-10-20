const chokidar = require("chokidar");
const fs = require("fs");
const EventEmitter = require("events");

const receiveFolder = "D:\\LED\\Button_Event";
if (!fs.existsSync(receiveFolder)) fs.mkdirSync(receiveFolder);

class Watcher extends EventEmitter {
  constructor() {
    super();
    this.batchQueue = [];
    this.batchTimeout = null;
    this.init();
    console.log("Watcher initialized and listening for file changes...");
  }

  init() {
    const watcher = chokidar.watch(receiveFolder, { persistent: true });
    watcher.on("add", (filePath) => this.onAdd(filePath));
    console.log("File watcher started...");
  }

  onAdd(filePath) {
    console.log(`File added: ${filePath}`);

    this.batchQueue.push(filePath);
    if (this.batchTimeout) clearTimeout(this.batchTimeout);

    this.batchTimeout = setTimeout(() => {
      this.batchQueue.forEach((file) => {
        fs.readFile(file, "utf-8", (err, data) => {
          if (err) return console.error(err);

          // let result = file.replace(`${receiveFolder}\\ID`, "");
          let result = data.match(/#\|0*(\d+)\|/);
          result = result ? parseInt(result[1], 10) : null;
          // result = result.substr(0, result.lastIndexOf("_")).split("_");
          console.log(result);
          // ส่งข้อมูลผ่าน EventEmitter
          this.emit("fileAdded", { file, result, data });
        });
      });
      this.batchQueue = [];
    }, 200);
  }
}

module.exports = new Watcher();
