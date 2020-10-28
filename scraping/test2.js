const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const profRound = require('./profRound');


//F2POOL
/* async function miningPoolHubDASH() {

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.setDefaultNavigationTimeout(0);
    await page.goto('https://dash.miningpoolhub.com/index.php?page=statistics&action=pool');
    const html = await page.content();
    const $ = cheerio.load(html);

    const poolName = 'Mining Pool Hub - DASH';
    let lastBlockTime = $('#main > div:nth-child(2) > article:nth-child(2) > div > table > tbody > tr:nth-child(8) > td').text();
    let hp = parseFloat($('#main > div:nth-child(2) > article:nth-child(1) > div > table > tbody > tr:nth-child(1) > td:nth-child(4)')
      .text()
      .replace(',', '')
      .replace(',', '')
      .replace(',', ''));

    let coinsPerDay = parseFloat($('#main > div:nth-child(2) > article:nth-child(1) > div > table > tbody > tr:nth-child(1) > td:nth-child(5)').text());
    let prof = (coinsPerDay / hp) * 1000;
    let profitability = profRound(prof)
    let url = 'https://dash.miningpoolhub.com/index.php?page=statistics&action=pool';

    console.log({poolName, hp, coinsPerDay, profitability, lastBlockTime, url});

    return ({ poolName, hp, coinsPerDay, profitability, lastBlockTime, url });

  }

  miningPoolHubDASH(); */


async function hivonPoolEth() {

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.setDefaultNavigationTimeout(0);
    await page.goto('https://hiveon.net/');
    const html = await page.content();
    const $ = cheerio.load(html);

    const poolName = 'HiveonPool';
    let prof = parseFloat($('#gatsby-focus-wrapper > div > section:nth-child(4) > div > div > div:nth-child(1) > div.value-box-module--value--1Apyc > span.value-box-module--small--Yn40U').text().replace('ETH', ''));
    let url = 'https://hiveon.net/';
    let profitability = profRound(prof)
    let name = $('#gatsby-focus-wrapper > div > section:nth-child(3) > div > div > div:nth-child(1) > div.coin-pool-tab-module--row--Y3FNV.coin-pool-tab-module--pool--1gwoM > div.coin-pool-tab-module--fullName--3NC2-').text();



    console.log({poolName, profitability, url, name});
    return prof;
}

hivonPoolEth(); 
