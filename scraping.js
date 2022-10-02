const cron = require('node-cron');
const puppeteer = require('puppeteer');
const dotenv = require('dotenv').config();
const sendNotification = require('./notifications');

const urlIntelProcessor = 'https://compragamer.com/producto/Procesador_Intel_Core_i9_12900KF_5_2GHz_Turbo_Socket_1700_12884';
// Si el i9 no tiene stock también se puede probar con este i7:
// 'https://compragamer.com/producto/Procesador_Intel_Core_i7_12700K_5_0GHz_Turbo_Socket_1700_12737'
const urlAllIntelProcessors = 'https://compragamer.com/?seccion=3&cate=48&sort=higher_price';
const pathToImage = 'images/processor.png';

let headless = process.env.NODE_ENV !== 'development';

let browserOptions = { 
    headless: headless, // true en docker / false en local
    defaultViewport: null,
    args: [
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-setuid-sandbox",
        "--no-sandbox",
    ] 
};

if (process.env.NODE_ENV !== 'development') browserOptions.executablePath = '/usr/bin/google-chrome';

const pageOptions = {
    waitUntil: 'networkidle2',
    // Remove the timeout
    timeout: 0
};

const scrapingData = async () => {
    try {
        const browser = await puppeteer.launch(browserOptions);
        const page = await browser.newPage();

        await page.setViewport({
            width: 1280,
            height: 1080,
        });
        const screenshotOptions = {
            path: pathToImage,
            fullpage: true,
            omitBackground: true,
        };

        await page.goto(urlIntelProcessor, pageOptions);
        
        const noStock = await page.evaluate(() => {
            let outOfStockMessage = document.querySelectorAll('.no-product');
            return outOfStockMessage.length;
        });

        // Si hay stock envío el precio por mail
        if (!noStock) {
            const processorPrice = await page.evaluate(() => {
                let price = document.querySelector('.precio-especial');
                if (price) {
                    return price.textContent;
                } else {
                    return false;
                }
            });

            if (processorPrice)  sendNotification(`Precio actual del producto deseado ${processorPrice}`);
        } else {
            // Si no hay stock saco captura del stock de Intel actual y lo envío por mail
            const newPage = await browser.newPage();
            await newPage.goto(urlAllIntelProcessors, pageOptions);
            await newPage.setViewport({
                width: 1200,
                height: 2600
            });
            await page.waitForTimeout(3000);
            await newPage.screenshot(screenshotOptions);
            await page.waitForTimeout(2000);

            sendNotification("No hay stock del producto deseado, stock actual:", pathToImage);
        }

        await browser.close();

    } catch (error) {
        console.log("Falló el proceso de scraping. Detalles:", error);
    }
};

// scrapingData();

// Se ejecuta todos los dias a las 11:00 UTC (8am Argentina)
module.exports = cron.schedule('0 11 * * *', scrapingData);