const path = require("path");
const fs = require("fs");
const sharp = require('sharp');

const axios = require('axios');


class ImgProcess {
    constructor() {
        this.imagens = {};
        this.isProcess = {};
        this.isFull = {};
        this.jpgOptions = {
            quality: 80,
            progressive: true,
            format: 'webp',
        };
    }

    async startSaving(name) {
        if (!this.imagens[name]) {
            this.imagens[name] = true;
            let imagenes = this.isProcess[name];
            for (const image of imagenes) {
                let { ruta, url, id, callback, ...arg } = image;
                if (!this.isFull[id]) {
                    try {
                        await this.addImg(ruta, { url, id, ...arg }, callback)
                    } catch (error) {
                        this.isFull[id] = false;
                    }
                }
            }

            return true;
        }

    }

    async addImg(dest, { url, id, ...data }, callback = false) {
        this.jpgOptions = { ...this.jpgOptions, ...data };
        try {
            const imageBuffer = await this.downloadImage(url);
            const optimizedImageBuffer = await this.optimizeImage(imageBuffer);

            // Active
            this.isFull[id] = true;
            // callback
            if (typeof callback === "function") {
                callback(id, path.join(dest, id + ".json"), optimizedImageBuffer);
            } else {
                return optimizedImageBuffer;
            }
            return true;
        } catch (error) {
            this.isFull[id] = false;
            throw error;
        }
    }

    // Function to download an image from a URL
    async downloadImage(url) {
        try {
            const response = await axios.get(url, {
                responseType: 'arraybuffer', // Configure the response type to get an ArrayBuffer
            });

            if (response.status === 200) {
                return Buffer.from(response.data, 'binary'); // Convert the response into an image buffer
            } else {
                throw new Error(`Failed to download the image from ${url}`);
            }
        } catch (error) {
            throw error;
        }
    }

    async optimizeImage(imageBuffer) {
        try {
            // const { format } = await image.metadata(); // Get the format of the original image
            let { quality, format, width, height } = this.jpgOptions;

            if (width && height) {
                return await sharp(imageBuffer)
                    .resize(width, height, { fit: 'inside' })
                    .toFormat(format, { quality })
                    .toBuffer();
            } else {
                return await sharp(imageBuffer)
                    .resize(width, height)
                    .toFormat(format, { quality })
                    .toBuffer();
            }

        } catch (error) {
            throw error;
        }
    }
}

module.exports = new ImgProcess();