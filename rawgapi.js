// Electron
const { app, BrowserWindow } = require("electron")

const path = require("path");
const fs = require("fs");

// Saved
const saved = require('../../modules/saved')

// UserData
const userdata = app.getPath("userData");

// package main
const package_main = require("../../package.json")

// UtilCode
const utilcode = require("../../modules/utilcodes");

// Prompts
const prompts = require("./modules/prompts")

// fetch
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))

// Read Files Json
async function openFileJson(file, existfile = false, value = "") {
    try {
        if (existfile) {
            if (!fs.existsSync(file)) {
                await utilcode.fsWrite(file, JSON.stringify(value, null, 2));
            }
        }
        const filejsontext = await utilcode.fsRead(file)
        return utilcode.jsonParse(filejsontext);
    } catch (error) {
        return false;
    }
}

// Crear carpetas
async function setFolders(raiz, ruta) {
    try {
        await utilcode.createFolderRecursive(raiz, ruta);
        return true;
    } catch (error) {
        return false;
    }
}

// crear carpetas requeridas
async function folderReq() {
    await setFolders(userdata, "apps/rawgapi/json/covers");
    await setFolders(userdata, "apps/rawgapi/json/info");
    await setFolders(userdata, "apps/rawgapi/json/cog");

    // cargar json con los datos de los juego
    let articles = await openFileJson(path.join(userdata, "apps", "rawgapi", "json", "cog", "config.json"), true, {
        modalkey: "on",
        cache: "on"
    });

    // Save in Raiz
    await utilcode.fsWrite(path.join(__dirname, "public", "json", "config.json"), JSON.stringify(articles, null, 2));

}

// libraries
const lib = require("../../modules/util-libraries");

const routes = [
    {
        method: 'get',
        path: '/',
        handler: async (req, res) => {
            await folderReq();
            if (!prompts._get) {
                await prompts.run()
            }
            res.render(path.join(__dirname, "views", "index"));
        }
    },
    {
        method: "get",
        path: "/rawg",
        handler: async (req, res) => {
            let qs = req.query;
            const file_json = path.join(userdata, "apps", "rawgapi", "json", "info", `${utilcode.clearSymbols(qs.searchText)}_${qs.page}.json`);

            try {
                const urlKey = `https://api.rawg.io/api/games?key=key_user&search=${qs.searchText}&page=${qs.page}&page_size=${qs.size}`;
                res.json(await prompts._get.get(urlKey, file_json))
            } catch (error) {
                console.log(error);
                res.json(false)
            }
        },
    },
    {
        method: "get",
        path: "/proxy/:name/:type/:quality/:format/:width/:height/*",
        handler: async (req, res) => {
            let pr = req.params[0];
            // page
            let page = "https://media.rawg.io/media/" + pr;
            // res.send(req.params);
            // return

            let resp = await prompts.compressIMG(page, {
                saveIn: path.join(userdata, "apps", "rawgapi", "json", "covers"),
                name: req.params.name,
                saveTo: req.params.type,
                quality: parseInt(req.params.quality),
                format: req.params.format,
                width: parseInt(req.params.width),
                height: parseInt(req.params.height)
            });

            if (resp) {
                res.send({ img: resp });
            } else {
                res.send(false);
            }

        },
    }

];

module.exports = [...routes, ...lib];