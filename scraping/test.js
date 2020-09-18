const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const profRound = require('./profRound');

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

//coinWarzBCH();

// Dash minining

async function miningPoolHubDASH() {

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

 // miningPoolHubDASH()

  //----
  async function coinotronDASH() {

    try {

     const browser = await puppeteer.launch({ headless: true });
     const page = await browser.newPage();

      await page.setDefaultNavigationTimeout(0);
      await page.goto('https://www.coinotron.com/app?action=statistics');
      const html = await page.content();
      const $ = cheerio.load(html);

      const poolName = 'Coinotron - DASH';
      const lastBlockTime = $('#row0TableBestMinersDRK > td:nth-child(4)').text();
      let hp = parseFloat($('#row0TableBestMinersDRK > td:nth-child(3)').text().replace(' GH', ''));
      let coinsPerDay = parseFloat($('#row0TableBestMinersDRK > td:nth-child(4)').text());
      let prof = (coinsPerDay / hp) / 1000;
      let profitability = profRound(prof)
      let url = 'https://www.coinotron.com/app?action=statistics';


      console.log({ poolName, hp, coinsPerDay, profitability, lastBlockTime, url });
      return ({ poolName, hp, coinsPerDay, profitability, lastBlockTime, url });

    } catch (err) {
      console.log(err);

    }

  }
  //coinotronDASH();

    //F2POOL DASH
    async function f2poolDASH() {
        try {
    
          const browser = await puppeteer.launch({headless:true});
          const page = await browser.newPage(); 
    
          await page.setDefaultNavigationTimeout(0);
          await page.goto('https://www.f2pool.com/');
          const html = await page.content();
          const $ = cheerio.load(html);
    
    
          const poolName = 'F2Pool';
          const profWithFee = parseFloat($("#tab-content-main > table > tbody > tr:nth-child(18) > td > div > div > div.container-info.col-12.col-lg-6 > div.row.calc-inline.hash-val-container > div > div:nth-child(4) > span.pl-1.profit-val.info-value").text().trim());
          const fee = parseFloat($("#tab-content-main > table > tbody > tr:nth-child(18) > td > div > div > div.container-info.col-12.col-lg-6 > div.row.info-content > div:nth-child(10) > span.info-value").text().replace("% PPS", ""));
          let profitability = parseFloat((profWithFee / ((100 - fee) / 100)).toFixed(8));
          profitability =  parseFloat((profitability/1000).toFixed(8));
          const url = 'https://www.f2pool.com/';
    
          console.log({poolName, profWithFee, fee, profitability, url});
          return ({ poolName, profWithFee, fee, profitability, url });
    
        } catch (error) {
          console.error(error);
        }
    
    }     

//f2poolDASH();


//---ZEC mining
async function miningPoolHubZEC() {

    const browser = await puppeteer.launch({headless:true});
    const page = await browser.newPage(); 

    await page.setDefaultNavigationTimeout(0);
    await page.goto('https://zcash.miningpoolhub.com/index.php?page=statistics&action=pool');
    const html = await page.content();
    const $ = cheerio.load(html);

    const poolName = 'Mining Pool Hub - ZEC';
    let lastBlockTime = $("#main > div:nth-child(2) > article:nth-child(2) > div > table > tbody > tr:nth-child(8) > td").text();
    let hp = parseFloat($("#main > div:nth-child(2) > article:nth-child(1) > div > table > tbody > tr:nth-child(1) > td:nth-child(4)")
      .text()
      .replace(',', '')
      .replace(',', '')
      .replace(',', ''));

    let coinsPerDay = parseFloat($("#main > div:nth-child(2) > article:nth-child(1) > div > table > tbody > tr:nth-child(1) > td:nth-child(5)").text());
    let prof = (coinsPerDay / hp)/1000;
    let profitability = profRound(prof)
    let url = 'https://zcash.miningpoolhub.com/index.php?page=statistics&action=pool';

    console.log({poolName, hp, coinsPerDay, profitability, lastBlockTime});

    return ({ poolName, hp, coinsPerDay, profitability, lastBlockTime, url });

  }

  //miningPoolHubZEC();

  async function coinotronZEC() {

    try {

    const browser = await puppeteer.launch({headless:true});
    const page = await browser.newPage(); 

      await page.setDefaultNavigationTimeout(0);
      await page.goto('https://www.coinotron.com/app?action=statistics');
      const html = await page.content();
      const $ = cheerio.load(html);

      const poolName = 'Coinotron - ZEC';
      const lastBlockTime = $('#row0TableSolvedBlocksZEC > td:nth-child(2)').text();
      let hp = parseFloat($("#row0TableBestMinersZEC > td:nth-child(3)").text().replace(' KH', ''));
      let coinsPerDay = parseFloat($("#row0TableBestMinersZEC > td:nth-child(4)").text());
      let prof = (coinsPerDay / hp) / 1000;
      let profitability = profRound(prof)
      let url = 'https://www.coinotron.com/app?action=statistics';


      console.log({ poolName, hp, coinsPerDay, profitability, lastBlockTime, url });
      return ({ poolName, hp, coinsPerDay, profitability, lastBlockTime, url });

    } catch (err) {
      console.log(err);

    }

  }

  //coinotronZEC();


  async function f2poolZEC() {
    try {

     const browser = await puppeteer.launch({headless:true});
     const page = await browser.newPage(); 

      await page.setDefaultNavigationTimeout(0);
      await page.goto('https://www.f2pool.com/');
      const html = await page.content();
      const $ = cheerio.load(html);


      const poolName = 'F2Pool - ZEC';
      const profWithFee = parseFloat($("#tab-content-labs > table > tbody > tr:nth-child(2) > td > div > div > div.container-info.col-12.col-lg-6 > div.row.calc-inline.hash-val-container > div > div:nth-child(4) > span.pl-1.profit-val.info-value").text().trim());
      const fee = parseFloat($("#tab-content-labs > table > tbody > tr:nth-child(2) > td > div > div > div.container-info.col-12.col-lg-6 > div.row.info-content > div:nth-child(10) > span.info-value").text().replace("% PPS", ""));
      let profitability = parseFloat((profWithFee / ((100 - fee) / 100)).toFixed(8));
      profitability =  parseFloat((profitability/1000).toFixed(8));
      const url = 'https://www.f2pool.com/';

      console.log({poolName, profWithFee, fee, profitability, url});
      return ({ poolName, profWithFee, fee, profitability, url });

    } catch (error) {
      console.error(error);
    }

} 

//f2poolZEC();


//---------XMR mining
async function minergateXMR() {

    try {

    const browser = await puppeteer.launch({headless:true});
    const page = await browser.newPage(); 

      await page.setDefaultNavigationTimeout(0);
      await page.goto('https://minergate.com/calculator/cryptonote');
      const html = await page.content();
      const $ = cheerio.load(html);

      const poolName = 'Minergate - XMR';
      let profitability = $("#app > div > div.main-app-container > div.container > div > div > div > div:nth-child(3) > table > tbody:nth-child(3) > tr:nth-child(1) > td:nth-child(3) > span:nth-child(1)").text();
      profitability = parseFloat((profitability/1000).toFixed(8))
      let url = 'https://minergate.com/calculator/cryptonote';


      console.log({ poolName, profitability,url });
      return ({ poolName, profitability,url  });

    } catch (err) {
      console.log(err);

    }

  }


 // minergateXMR()

async function moneroCryptoPool() {

    try {

      const browser = await puppeteer.launch({headless:true});
      const page = await browser.newPage(); 
  
      await page.setDefaultNavigationTimeout(0);
      await page.goto('https://monero.crypto-pool.fr/');
      const html = await page.content();
      const $ = cheerio.load(html);
  
      const poolName = 'Monero.crypto-pool';
      let networkDiff = parseFloat($("#networkDifficulty").text());
      const netLastRew = parseFloat($("#networkLastReward").text().replace(' XMR', ''))
      const fee = 0.025;
      const profitability = ((netLastRew*86400)/networkDiff)+(((netLastRew*86400)/networkDiff)*fee);
      
  
      console.log({networkDiff,netLastRew, profitability});
      //return(val)

    } catch (err) {
        console.log(err);
    }

}

moneroCryptoPool()