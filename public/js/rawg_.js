const { ipcRenderer } = require('electron');
const path = require("path");
const fs = require("fs");


class _Rawg {
    constructor() {
        this.save = {};
    }

    async sendMessage(ipc, ...message) {
        try {
            const reply = await ipcRenderer.invoke(ipc, ...message);
            return reply;
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    async fet(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                return false;
            }
            return await response.json();
        } catch (error) {
            return false;
        }
    }

    async fsWrite(ruta, text) {
        try {
            await fs.promises.writeFile(ruta, text);
            return true;
        } catch (error) {
            throw error;
        }
    }

    clearSymbols(text, type = "namefile") {
        const invalidCharacters = /[~“#%&*:<>\?\/\\{|}'´\*\+`']/g;
        const cleanedText = text.replace(invalidCharacters, '');

        switch (type) {
            case "namefile":
                return cleanedText.replace(/\s+/g, '_').toLowerCase();

            case "toLowerCase":
                return cleanedText.toLowerCase();

            case "toUpperCase":
                return cleanedText.toUpperCase();

            default:
                return cleanedText;
        }
    }

    async appFolders() {
        // All folders
        return await this.sendMessage("all-folders");
    }

    async saveConfig(data) {
        let { save, appSelect, ...arg } = data;
        let parse = await this.fet("/json/config.json");

        // set API
        if (arg.thekey) {
            arg.thekey = this.replaceCharsWithRandom(arg.thekey, 4, 5);
        }

        parse = {
            ...parse,
            ...arg
        }

        try {
            await this.fsWrite(path.join(saved.getSaved("folders")[save], appSelect), JSON.stringify(parse, null, 2));
            window.location.reload()
        } catch (error) {
            console.log(error);
        }
    }

    randoChar(length) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; // Caracteres válidos (letras mayúsculas, letras minúsculas y dígitos)
        let result = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            result += characters.charAt(randomIndex);
        }
        return result;
    }
    replaceCharsWithRandom(inputString, groupSize, randomSize) {
        const gruposDe4 = inputString.match(new RegExp(`.{1,${groupSize}}`, 'g'));
        let newData = [];
        gruposDe4.forEach((element, index) => {
            if (index !== gruposDe4.length - 1) {
                newData.push(element + this.randoChar(randomSize));
            } else {
                newData.push(element);
            }
        });
        return this.randoChar(6) + newData.join('');
    }
    extractOriginalString(inputString, groupSize, randomSize) {
        inputString = inputString.slice(6)
        const groups = inputString.match(new RegExp(`.{1,${groupSize + randomSize}}`, 'g'));
        let originalData = [];
        groups.forEach((group, index) => {
            if (index !== groups.length - 1) {
                originalData.push(group.substr(0, groupSize));
            } else {
                originalData.push(group);
            }
        });
        return originalData.join('');
    }

    getPartAfter(cadena, after) {
        const index = cadena.indexOf(after);

        if (index !== -1) {
            return cadena.substring(index + after.length); // Sumamos 6 para omitir "media/"
        }

        return null;
    }


    async loadImg(image, id, totalIMG, callback = false) {
        if (!this.save["listdownload"]) {
            this.save["listdownload"] = [];
        }

        this.save["listdownload"].push({ id, image });


        // Ejecutar cuando no haya más cambios en this.save["listdownload"]
        if (this.save["listdownload"].length === totalIMG) {
            // Iniciar Descarga
            this.downloadImg(this.save["listdownload"], totalIMG, callback);
            this.save["listdownload"] = [];
        }

    }

    async downloadImg(image, totalIMG, callback) {
        if (!this.save["processimg"]) {
            this.save["processimg"] = [];
        }

        for (const img of image) {
            this.save["processimg"].push(img.id)
            if (img.image) {
                const downloadimg = await this.fet(img.image);
                // console.log(document.querySelector(`#id_${img.id}`));
                if (downloadimg.img) {
                    const addimg = document.querySelector(`#id_${img.id}`);
                    addimg.style = `background-image: url(${downloadimg.img})`;
                }
            }

            if (this.save["processimg"].length === totalIMG) {
                if (callback) {
                    callback();
                    this.save["processimg"] = [];
                }
            }

        }

    }

}
