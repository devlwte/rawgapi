const { app } = require('electron')

const path = require("path");
const fs = require("fs");

// Init
const init = require("./modules/init")

// Img Process
const imgprocess = require("./modules/processimg")
// async function runcode() {
//     await init.run();
// }
// runcode()

// utilcode
const utilcode = require("../../modules/utilcodes/main")


// verificar search
async function verySearch(fileruta) {
    const filepath = path.join(fileruta);
    if (!fs.existsSync(filepath)) {
        return false;
    }
    const searchfile = await utilcode.fsRead(filepath);
    return utilcode.jsonParse(searchfile);
}



async function veryFiles(raiz, ruta, cog = false) {
    await utilcode.createFolderRecursive(raiz, ruta);

    // verificar si existe el archivo de configuracion
    if (cog) {
        const fileCog = path.join(raiz, ruta, "cog.json");
        if (!fs.existsSync(fileCog)) {
            await utilcode.fsWrite(fileCog, JSON.stringify({}, null, 2));
        }
    }

}

// package
let pakContainer = require("../../package.json")
let pak = require("./package.json")

// Appdata
const appDataPath = app.getPath('appData')
let fileCog = path.join(path.normalize(appDataPath), pakContainer.name, "apps", pak.name, "json", "cog.json");

veryFiles(path.normalize(appDataPath), `${pakContainer.name}/apps/` + pak.name + "/json", true);
veryFiles(path.normalize(appDataPath), `${pakContainer.name}/apps/` + pak.name + "/cache/img");


// Libreria
const lib = require("../../modules/util-libraries")

const routes = [
    {
        method: "get",
        path: "/",
        handler: async (req, res) => {
            await init.run();
            await init.mod.update(false, {
                raiz: path.normalize(appDataPath),
                pack: pakContainer,
                packApp: pak,
                key: "oEPn94f22fJSyW08bfaKBob81fc8stkzx493dWS7Rtbc15vdWrj6b460HvME83edwCxrYbf15",
            }, utilcode)

            // Renderer
            res.render(path.join(__dirname, "views", "index"), { pak, maxr: init.mod.maxr, rto: init.mod.gettok });
        },
    },
    {
        method: "get",
        path: "/cog",
        handler: async (req, res) => {
            const readCog = await utilcode.fsRead(fileCog);
            let parse = utilcode.jsonParse(readCog);
            res.json(parse);
        },
    },
    {
        method: "post",
        path: "/save-cog",
        handler: async (req, res) => {
            let value = req.body;
            try {
                const readCog = await utilcode.fsRead(fileCog);
                let parse = utilcode.jsonParse(readCog);

                // set API
                if (value.thekey) {
                    value.thekey = utilcode.replaceCharsWithRandom(value.thekey, 4, 5);
                }

                parse = {
                    ...parse,
                    ...value
                }

                await utilcode.fsWrite(fileCog, JSON.stringify(parse, null, 2));
                res.send(true);
            } catch (error) {
                res.send(false);
            }
        },
    },
    {
        method: "get",
        path: "/rawg",
        handler: async (req, res) => {
            let qs = req.query;
            const folderpath = path.join(path.normalize(appDataPath), pakContainer.name, "apps", pak.name, "cache", `${utilcode.clearSymbols(qs.searchText)}_${qs.page}.json`);
            try {
                const readCog = await utilcode.fsRead(fileCog);
                let { cache = "on" } = utilcode.jsonParse(readCog);

                const urlKey = `https://api.rawg.io/api/games?key=key_user&search=${qs.searchText}&page=${qs.page}&page_size=${qs.size}`;
                let result;
                if (cache == "on") {
                    let very = await verySearch(folderpath);
                    if (!very) {
                        result = await init.mod.toget(utilcode, { url: urlKey, fileruta: folderpath, cache: true });
                    } else {
                        result = very;
                    }
                } else {
                    result = await init.mod.toget(utilcode, { url: urlKey });
                }


                res.json(result)
            } catch (error) {
                console.log(error);
                res.json(false)
            }
        },
    },
    {
        method: "post",
        path: "/saveimg",
        handler: async (req, res) => {
            let { url, id, name, ...data } = req.body;
            const ruta = path.join(path.normalize(appDataPath), pakContainer.name, "apps", pak.name, "cache", "img");
            if (!imgprocess.isProcess[utilcode.clearSymbols(name)]) {
                imgprocess.isProcess[utilcode.clearSymbols(name)] = [];
            }
            if (!fs.existsSync(path.join(ruta, id + ".json"))) {
                imgprocess.isProcess[utilcode.clearSymbols(name)].push({
                    id,
                    ruta,
                    url,
                    callback: async (id, dest, buffer) => {
                        let imageSet = {
                            id,
                            iamge: `data:image/jpeg;base64,${buffer.toString('base64')}`
                        }
                        await utilcode.fsWrite(dest, JSON.stringify(imageSet, null, 2));
                    },
                    ...data
                });
            }

            res.end();

        },
    },
    {
        method: "post",
        path: "/start-process",
        handler: async (req, res) => {
            await imgprocess.startSaving(utilcode.clearSymbols(req.body.name));
            res.send(true);
        },
    },
    {
        method: "post",
        path: "/load-img",
        handler: async (req, res) => {
            const ruta = path.join(path.normalize(appDataPath), pakContainer.name, "apps", pak.name, "cache", "img");
            let imagepath = path.join(ruta, req.body.slug + ".json");
            if (fs.existsSync(imagepath)) {
                const readCog = await utilcode.fsRead(imagepath);
                let { iamge } = utilcode.jsonParse(readCog);
                res.send(iamge);
            } else {
                res.send(req.body.bg);
            }
        },
    }
];

module.exports = [...routes, ...lib];