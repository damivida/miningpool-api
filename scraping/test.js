const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

//F2POOL
async function f2poolBTC() {
    try {

        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();

        await page.setDefaultNavigationTimeout(0);
        await page.goto('https://www.f2pool.com/');
        const html = await page.content();
        const $ = cheerio.load(html);


        const poolName = 'F2Pool';
        const profWithFee = parseFloat($("#tab-content-main > table > tbody > tr:nth-child(2) > td > div > div > div.container-info.col-12.col-lg-6 > div.row.calc-inline.hash-val-container > div > div:nth-child(4) > span.pl-1.profit-val.info-value").text().trim());
        const fee = parseFloat($("#tab-content-main > table > tbody > tr:nth-child(2) > td > div > div > div.container-info.col-12.col-lg-6 > div.row.info-content > div:nth-child(10) > span.info-value").text().replace('% PPS+', ''));
        const profitability = parseFloat((profWithFee / ((100 - fee) / 100)).toFixed(8));
        const url = 'https://www.f2pool.com/';

        console.log({ profWithFee, fee, profitability });
        return ({ poolName, profWithFee, fee, profitability, url });

    } catch (error) {
        console.error(error);
    }

}

//COIN WARZ BTC
async function coinWarzBTC() {

    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        page.setDefaultNavigationTimeout(0);
        await page.goto('https://www.coinwarz.com/mining/bitcoin/calculator');
        const html = await page.content();
        const $ = cheerio.load(html);

        const poolName = 'CoinWarz';
        const hp = parseFloat($("[class='form-control numeric']").attr('value'));
        const coinsPerDay = parseFloat($("#left-col > main > section > section:nth-child(12) > div > table > tbody > tr:nth-child(2) > td:nth-child(2)").text().trim());
        const url = "https://www.coinwarz.com/mining/bitcoin/calculator";
        const profitability = parseFloat((coinsPerDay / hp).toFixed(8));


        console.log({ poolName, coinsPerDay, hp, profitability, url });
        return({poolName, coinsPerDay, hp, profitability, url});


    } catch (error) {
        console.log(error);
    }

}


//COIN WARZ BTC
async function coinWarzBCH() {

    try {
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();

        page.setDefaultNavigationTimeout(0);
        await page.goto('https://www.coinwarz.com/mining/bitcoincash/calculator');
        const html = await page.content();
        const $ = cheerio.load(html);

        const poolName = 'CoinWarz';
        const hp = parseFloat($("[class='form-control numeric']").attr('value'));
        const coinsPerDay = parseFloat($("#left-col > main > section > section:nth-child(12) > div > table > tbody > tr:nth-child(2) > td:nth-child(2)").text().trim());
        const url = "https://www.coinwarz.com/mining/bitcoin/calculator";
        const profitability = parseFloat((coinsPerDay / hp).toFixed(8));


        console.log({ poolName, coinsPerDay, hp, profitability, url });
        return({poolName, coinsPerDay, hp, profitability, url});


    } catch (error) {
        console.log(error);
    }

}

coinWarzBCH();
