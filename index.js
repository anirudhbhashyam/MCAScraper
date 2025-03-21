import puppeteer from "puppeteer";

import * as fs from "node:fs";

import {setTimeout} from "node:timers/promises";

async function clickAllDownloadIcons(page) {
    await page.waitForSelector(
        "img[src='/content/dam/mca_icons/download-icon-new.png']", 
        { timeout: 10000 },
    );
    await page.$$eval(
        "img[src='/content/dam/mca_icons/download-icon-new.png']",
        elementHandles => {
            elementHandles.forEach(
                el => el.click()
            );
        }
    );
}

async function hasNextButton(page) {
    const nextButton = await page.$("img[src='/content/dam/mca/icons/next-active.png']");
    return nextButton !== null;
}

async function clickNextButton(page) {
    try {
        await page.waitForSelector("img[src='/content/dam/mca/icons/next-active.png']", { timeout: 1000 });
        await page.click("img[src='/content/dam/mca/icons/next-active.png']");
        return true;
    } catch (error) {
        console.log('No more pages to navigate');
        return false;
    }
}

async function run() {
    let browser;
    const downloadPath = "/Users/anirudh/Downloads/mca_downloads";
    const url = "https://www.mca.gov.in/content/mca/global/en/data-and-reports/company-llp-info/incorporated-closed-month.html"
    try {
        browser = await puppeteer.launch({
            headless: false
        });
        const page = await browser.newPage();
        const client = await page.createCDPSession();
        await client.send(
            'Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: downloadPath
        });
        await page.setRequestInterception(true);
        const blockedScriptURLs = [
            // redirect script.
			"https://www.mca.gov.in/etc.clientlibs/mca/clientlibs/clientlib-devtool.js",
        ]
        page.on(
            "request",
            request => {
                if (request.resourceType() === "script" && blockedScriptURLs.includes(request.url())) {
                    request.abort();
                } else {
                    request.continue();
                }
            }
        );
        fs.mkdir(
            downloadPath,
            { recursive: true },
            (err) => err && console.error(err),
        );
        await page.goto(url);
        await page.click("img[src='/content/dam/mca/icons/next.png']");
        let pageNum = 1;
        while (pageNum < 30) {
            console.log("Page: ", pageNum);
            await clickAllDownloadIcons(page);
            await setTimeout(5000);
            if (!hasNextButton(page)) {
                break;
            }
            clickNextButton(page);
            pageNum++;
            await setTimeout(1000);
        }
    } catch (e) {
        console.error(e);
    } 
}

(
    async () => {
        await run();
    }
)();
