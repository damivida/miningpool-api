const express = require('express');
const axios = require('axios');
const app = express();
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

const averageFunc = require('../averageFunc');
const profRound = require('../scraping/profRound');


//***************************************** ETH mining pools **************************************************

app.get('/miningPools/ETH', (req, res) => {

  const whatToMineUrl = `https://whattomine.com/coins/151.json?hr=1&p=0.0&fee=0&cost=0&hcost=0.07`;
  const viaBtcUrl = `https://www.viabtc.com/res/tools/calculator?coin=ETH`;
  const poolInUrl = 'https://api-prod.poolin.com/api/public/v2/basedata/coins/block_stats';

  const whatToMineRequest = axios.get(whatToMineUrl);
  const viaBtcRequest = axios.get(viaBtcUrl);
  const poolInRequest = axios.get(poolInUrl);


  axios.all([whatToMineRequest, viaBtcRequest, poolInRequest]).then(axios.spread((...responses) => {
    const whatToMineResponse = responses[0].data;
    const viaBtcResponse = responses[1].data;
    const poolInResponse = responses[2].data;

    const viaBtcProf = viaBtcResponse["data"][0]["profit"]["ETH"];
    let viaBtcProfNoFee = viaBtcProf / 0.97;


    const whatToMineData = {
      poolName: "WhatToMine",
      profitability: whatToMineResponse["estimated_rewards"],
      url: 'https://whattomine.com/coins/151-eth-ethash?hr=1&p=420.0&fee=0.0&cost=0.0&hcost=0.0&commit=Calculate'
    }

    const viaBtcData = {
      poolName: "ViaBtc",
      profitability: viaBtcResponse["data"][0]["profit"]["ETH"],
      url: 'https://www.viabtc.com/tools/calculator?symbol=ETH'
    }

    const poolInData = {
      poolName: "Poolin",
      profitability: poolInResponse["data"]["ETH"]["rewards_per_unit"],
      url: 'https://www.poolin.com/tools/mini-calc?type=eth'
    }


    let allProfArr = [parseFloat(whatToMineData.profitability), parseFloat(viaBtcData.profitability), parseFloat(poolInData.profitability)];

    const avgEthMiningProf = {
      avgETHProf: averageFunc(allProfArr)
    }

    const ethMiningPools = { whatToMineData, viaBtcData, poolInData, avgEthMiningProf };
    res.send({ ethMiningPools });

  })).catch(errors => {
    console.log(errors);
  })

});


//----------ETH scraping--------------------------------------

app.get('/miningPools/eth/crawler', (req, res) => {

  async function miningPoolHubETH(page) {

    await page.setDefaultNavigationTimeout(0);
    await page.goto('https://ethereum.miningpoolhub.com/index.php?page=statistics&action=pool');
    const html = await page.content();
    const $ = cheerio.load(html);

    const poolName = 'Mining Pool Hub - ETH';
    let lastBlockTime = $('#main > div:nth-child(2) > article:nth-child(2) > div > table > tbody > tr:nth-child(8) > td').text();
    let hp = parseFloat($('#main > div:nth-child(2) > article:nth-child(1) > div > table > tbody > tr:nth-child(1) > td:nth-child(4)')
      .text()
      .replace(',', '')
      .replace(',', '')
      .replace(',', ''));

    let coinsPerDay = parseFloat($('#main > div:nth-child(2) > article:nth-child(1) > div > table > tbody > tr:nth-child(1) > td:nth-child(5)').text());
    let prof = (coinsPerDay / hp) * 1000;
    let profitability = profRound(prof)
    let url = 'https://ethereum.miningpoolhub.com/index.php?page=statistics&action=pool';

    //console.log({poolName, hp, coinsPerDay, profitability, lastBlockTime});

    return ({ poolName, hp, coinsPerDay, profitability, lastBlockTime, url });

  }

  //COINOTRON
  async function coinotronETH(page) {

    try {

      await page.setDefaultNavigationTimeout(0);
      await page.goto('https://www.coinotron.com/app?action=statistics');
      const html = await page.content();
      const $ = cheerio.load(html);

      const poolName = 'Coinotron - ETH';
      const lastBlockTime = $('#row0TableSolvedBlocksETH > td:nth-child(2)').text();
      let hp = parseFloat($('#row0TableBestMinersETH > td:nth-child(3)').text().replace('GH', ''));
      let coinsPerDay = parseFloat($('#row0TableBestMinersETH > td:nth-child(4)').text());
      let prof = (coinsPerDay / hp) / 1000;
      let profitability = profRound(prof)
      let url = 'https://www.coinotron.com/app?action=statistics';


      return ({ poolName, hp, coinsPerDay, profitability, lastBlockTime, url });

    } catch (err) {
      console.log(err);

    }

  }

  //F2POOL
  async function f2pool(page) {
    try {

      /* const browser = await puppeteer.launch({headless:false});
      const page = await browser.newPage(); */

      await page.setDefaultNavigationTimeout(0);
      await page.goto('https://www.f2pool.com/');
      const html = await page.content();
      const $ = cheerio.load(html);


      const poolName = 'F2Pool';
      const profWithFee = parseFloat($("#tab-content-main > table > tbody > tr:nth-child(10) > td > div > div > div.container-info.col-12.col-lg-6 > div.row.calc-inline.hash-val-container > div > div:nth-child(4) > span.pl-1.profit-val.info-value").text().trim());
      const fee = parseFloat($('#tab-content-main > table > tbody > tr:nth-child(10) > td > div > div > div.container-info.col-12.col-lg-6 > div.row.info-content > div:nth-child(8) > span.info-value').text().replace('% PPS+', ''));
      const profitability = parseFloat((profWithFee / ((100 - fee) / 100)).toFixed(8));
      const url = 'https://www.f2pool.com/';

      //console.log({profWithFee, fee, profitability});
      return ({ poolName, profWithFee, fee, profitability, url });

    } catch (error) {
      console.error(error);
    }

  }


  const scrapingETH = async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();


    //profitability calc
    let arrProf = [];
    const getSum = (total, numb) => {
      return total + numb;
    }

    let scrapMiningPoolHubETH = await miningPoolHubETH(page);
    let profMiningPoolHubETH = scrapMiningPoolHubETH.profitability;
    arrProf.push(profMiningPoolHubETH)

    let scrapCoinotronETH = await coinotronETH(page);
    let profCoinotronETH = scrapCoinotronETH.profitability;
    arrProf.push(profCoinotronETH)

    let scrapingF2PoolETH = await f2pool(page);
    let profF2PoolETH = scrapingF2PoolETH.profitability;
    arrProf.push(profF2PoolETH);


    //arrProf.reduce(getSum)

    let profAvg = arrProf.reduce(getSum);
    profAvg = parseFloat((profAvg / arrProf.length).toFixed(8));

    //--------------------------------

    const ethMiningPools = {
      miningPoolHubETH: scrapMiningPoolHubETH,
      coinotronETH: scrapCoinotronETH,
      f2PoolETH: scrapingF2PoolETH,
      avgETHProf: profAvg
    }
    //console.log(ethMining)

    res.send({ ethMiningPools });
    //return ethMining;
  }

  scrapingETH();

});



//*****************************************************ETC mining pools ********************************************

app.get('/miningPools/ETC', (req, res) => {

  const whatToMineUrl = `https://whattomine.com/coins/162.json?hr=1&p=0.0&fee=0&cost=0&hcost=0.07`;
  const viaBtcUrl = `https://www.viabtc.com/res/tools/calculator?coin=ETC`;


  const whatToMineRequest = axios.get(whatToMineUrl);
  const viaBtcRequest = axios.get(viaBtcUrl);


  axios.all([whatToMineRequest, viaBtcRequest]).then(axios.spread((...responses) => {
    const whatToMineResponse = responses[0].data;
    const viaBtcResponse = responses[1].data;


    const viaBtcProf = viaBtcResponse["data"][0]["profit"]["ETC"];
    let viaBtcProfNoFee = viaBtcProf / 0.97;


    const whatToMineData = {
      poolName: "WhatToMine",
      profitability: whatToMineResponse["estimated_rewards"],
      url: 'https://whattomine.com/coins/162-etc-ethash'
    }

    const viaBtcData = {
      poolName: "ViaBtc",
      profitability: viaBtcResponse["data"][0]["profit"]["ETC"],
      url: 'https://www.viabtc.com/tools/calculator?symbol=ETC'
    }




    let allProfArr = [parseFloat(whatToMineData.profitability), parseFloat(viaBtcData.profitability)];

    const avgEtcMiningProf = {
      avgETCProf: averageFunc(allProfArr)
    }

    const etcMiningPools = { whatToMineData, viaBtcData, avgEtcMiningProf };
    res.send({ etcMiningPools });

  })).catch(errors => {
    console.log(errors);
  })

});


//------------------ETC scraping---------------------------------

app.get('/miningPools/etc/crawler', (req, res) => {

  //COINOTRON
  async function coinotronETC(page) {

    await page.setDefaultNavigationTimeout(0);
    await page.goto('https://www.coinotron.com/app?action=statistics');
    const html = await page.content();
    const $ = cheerio.load(html);

    const poolName = 'Coinotron - ETC';
    const lastBlockTime = $('#row0TableSolvedBlocksETC > td:nth-child(2)').text();
    const hp = parseFloat($('#row0TableBestMinersETC > td:nth-child(3)').text().replace(' MH', ''));
    let coinsPerDay = parseFloat($('#row0TableBestMinersETC > td:nth-child(4)').text());
    //let prof = (coinsPerDay/hp);
    let profitability = parseFloat((coinsPerDay / hp).toFixed(8));
    let url = 'https://www.coinotron.com/app?action=statistics';

    return ({ poolName, hp, coinsPerDay, profitability, lastBlockTime, url });
  }


  //F2POOL
  async function f2poolETC(page) {
    try {

      await page.setDefaultNavigationTimeout(0);
      await page.goto('https://www.f2pool.com/');
      const html = await page.content();
      const $ = cheerio.load(html);


      const poolName = 'F2Pool';
      const profWithFee = parseFloat($("#tab-content-main > table > tbody > tr:nth-child(12) > td > div > div > div.container-info.col-12.col-lg-6 > div.row.calc-inline.hash-val-container > div > div:nth-child(4) > span.pl-1.profit-val.info-value").text().trim());
      const fee = parseFloat($("#tab-content-main > table > tbody > tr:nth-child(12) > td > div > div > div.container-info.col-12.col-lg-6 > div.row.info-content > div:nth-child(10) > span.info-value").text().replace('% PPS', ''));
      const profitability = parseFloat((profWithFee / ((100 - fee) / 100)).toFixed(8));
      const url = 'https://www.f2pool.com/';

      // console.log({profWithFee, fee, profitability});
      return ({ poolName, profWithFee, fee, profitability, url });

    } catch (error) {
      console.error(error);
    }

  }



  const etcScraping = async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    //profitability calc
    let arrProf = [];
    const getSum = (total, numb) => {
      return total + numb;
    }

    let scrapCoinotronETC = await coinotronETC(page);
    let scrapF2PoolETC = await f2poolETC(page);
    let profCoinotronETC = scrapCoinotronETC.profitability;
    let profF2PoolETC = scrapF2PoolETC.profitability;

    arrProf.push(profCoinotronETC, profF2PoolETC)

    //arrProf.reduce(getSum);

    let profAvg = arrProf.reduce(getSum);
    profAvg = parseFloat((profAvg / arrProf.length).toFixed(8));

    //-------------------

    const etcMiningPools = {
      coinotronETC: scrapCoinotronETC,
      f2PoolETC: scrapF2PoolETC,
      avgETCProf: profAvg
    }
    //console.log(etcMining)
    res.send({ etcMiningPools });
  }

  etcScraping();

});


//*******************************************************  LTC mining pools ***************************************

app.get('/miningPools/LTC', (req, res) => {

  const whatToMineUrl = `https://whattomine.com/coins/4.json?hr=1&p=0.0&fee=0&cost=0&hcost=0.07`;
  const viaBtcUrl = `https://www.viabtc.com/res/tools/calculator?coin=LTC`;
  const poolInUrl = 'https://api-prod.poolin.com/api/public/v2/basedata/coins/block_stats';

  const whatToMineRequest = axios.get(whatToMineUrl);
  const viaBtcRequest = axios.get(viaBtcUrl);
  const poolInRequest = axios.get(poolInUrl);


  axios.all([whatToMineRequest, viaBtcRequest, poolInRequest]).then(axios.spread((...responses) => {
    const whatToMineResponse = responses[0].data;
    const viaBtcResponse = responses[1].data;
    const poolInResponse = responses[2].data;


    let viaBtcProf = viaBtcResponse["data"][0]["profit"]["LTC"];
    viaBtcProf = viaBtcProf / 1000;
    viaBtcProf = viaBtcProf.toString()

    let poolInProf = poolInResponse["data"]["LTC"]["rewards_per_unit"];
    poolInProf = poolInProf / 1000;
    poolInProf = poolInProf.toString();


    const whatToMineData = {
      poolName: "WhatToMine",
      profitability: whatToMineResponse["estimated_rewards"],
      url: 'https://whattomine.com/coins/4-ltc-scrypt?hr=1&p=1050.0&fee=0.0&cost=0.0&hcost=0.0&commit=Calculate'
    }

    const viaBtcData = {
      poolName: "ViaBtc",
      profitability: viaBtcProf,
      url: 'https://www.viabtc.com/tools/calculator?symbol=LTC'
    }

    const poolInData = {
      poolName: "Poolin",
      profitability: poolInProf,
      url: 'https://www.poolin.com/tools/mini-calc?type=ltc',
    }


    let allProfArr = [parseFloat(whatToMineData.profitability), parseFloat(viaBtcData.profitability), parseFloat(poolInData.profitability)];

    const avgLtcMiningProf = {
      avgLtcProf: averageFunc(allProfArr)
    }

    const ltcMiningPools = { whatToMineData, viaBtcData, poolInData, avgLtcMiningProf };
    res.send({ ltcMiningPools });

  })).catch(errors => {
    console.log(errors);
  })

});

//--------------------------- LTC scraping  

app.get('/miningPools/ltc/crawler', (req, res) => {

  async function liteCoinPool(page) {

    await page.setDefaultNavigationTimeout(0);
    await page.goto('https://www.litecoinpool.org/stats');
    const html = await page.content();
    const $ = cheerio.load(html);

    const poolName = 'LitecoinPool - LTC';
    let lastBlockTime = $('#stats_pool_time_since_block').text();
    let hp = parseFloat($('#content > div > div > div.optional2.column > table > tbody > tr:nth-child(2) > td:nth-child(3)')
      .text()
      .replace(',', ''));


    let coinsPerDay = parseFloat($('#content > div > div > div.optional2.column > table > tbody > tr:nth-child(2) > td:nth-child(4)').text());
    let prof = (coinsPerDay / hp) / 1000;
    let profitability = profRound(prof)
    let url = 'https://www.litecoinpool.org/stats';


    //console.log({poolName, hp, coinsPerDay, profitability, lastBlockTime});

    return ({ poolName, hp, coinsPerDay, profitability, lastBlockTime, url });
  }


  async function f2poolETC(page) {
    try {

      await page.setDefaultNavigationTimeout(0);
      await page.goto('https://www.f2pool.com/');
      const html = await page.content();
      const $ = cheerio.load(html);


      const poolName = 'F2Pool';
      const profWithFee = parseFloat($("#tab-content-main > table > tbody > tr:nth-child(8) > td > div > div > div.container-info.col-12.col-lg-6 > div.row.calc-inline.hash-val-container > div > div:nth-child(4) > span.pl-1.profit-val.info-value").text().trim());
      const fee = parseFloat($("#tab-content-main > table > tbody > tr:nth-child(8) > td > div > div > div.container-info.col-12.col-lg-6 > div.row.info-content > div:nth-child(10) > span.info-value").text().replace('% PPS', ''));
      let profitability = parseFloat((profWithFee / ((100 - fee) / 100)).toFixed(8));
      profitability = parseFloat((profitability / 1000).toFixed(8));
      const url = 'https://www.f2pool.com/';

      console.log({ profWithFee, fee, profitability });
      return ({ poolName, profWithFee, fee, profitability, url });

    } catch (error) {
      console.error(error);
    }

  }


  //--------------------------------------------MAIN
  const ltcScraping = async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    //---------------profitability calc
    let arrProf = [];
    const getSum = (total, numb) => {
      return total + numb;
    }

    let scrapLitecoinPool = await liteCoinPool(page);
    let scrapF2PoolLTC = await f2poolETC(page);

    let profLitecoinPool = scrapLitecoinPool.profitability;
    let profF2PoolLTC = scrapF2PoolLTC.profitability;
    arrProf.push(profLitecoinPool, profF2PoolLTC)

    let profAvg = arrProf.reduce(getSum);
    profAvg = parseFloat((profAvg / arrProf.length).toFixed(8));

    //-------------------

    const ltcMiningPools = {
      litecoinPoolLTC: scrapLitecoinPool,
      f2PoolLTC: scrapF2PoolLTC,
      avgLtcProf: profAvg
    }

    // console.log(ltcMining);
    res.send({ ltcMiningPools });
  }
  ltcScraping();

});


//**********************************************BTC mining pools**********************************

app.get('/miningPools/BTC', (req, res) => {

  const whatToMineUrl = `https://whattomine.com/coins/1.json?hr=1000&p=0.0&fee=0&cost=0&hcost=0.07`;
  const viaBtcUrl = `https://www.viabtc.com/res/tools/calculator?coin=BTC`;
  const poolInUrl = 'https://api-prod.poolin.com/api/public/v2/basedata/coins/block_stats';
  const btcComUrl = 'https://btc.com/service/price/coins-income';

  const whatToMineRequest = axios.get(whatToMineUrl);
  const viaBtcRequest = axios.get(viaBtcUrl);
  const poolInRequest = axios.get(poolInUrl);
  const btcComRequest = axios.get(btcComUrl);


  axios.all([whatToMineRequest, viaBtcRequest, poolInRequest, btcComRequest]).then(axios.spread((...responses) => {
    const whatToMineResponse = responses[0].data;
    const viaBtcResponse = responses[1].data;
    const poolInResponse = responses[2].data;
    const btcComResponse = responses[3].data;


    const whatToMineData = {
      poolName: "WhatToMine",
      profitability: whatToMineResponse["btc_revenue"],
      url: 'https://whattomine.com/coins/1-btc-sha-256?hr=1000000&p=2800.0&fee=0.0&cost=0.0&hcost=0.0&commit=Calculate'
    }

    const viaBtcData = {
      poolName: "ViaBtc",
      profitability: viaBtcResponse["data"][0]["profit"]["BTC"],
      url: 'https://www.viabtc.com/tools/calculator?symbol=BTC'
    }

    const poolInData = {
      poolName: "Poolin",
      profitability: poolInResponse["data"]["BTC"]["rewards_per_unit"],
      url: 'https://www.poolin.com/tools/mini-calc?type=btc'
    }

    const btcComData = {
      poolName: "BtcCom",
      profitability: btcComResponse["data"]["btc"]["income_optimize_coin"].toFixed(8).toString(),
      url: 'https://btc.com/tools/mini-mining-calculator'
    }


    let allProfArr = [parseFloat(whatToMineData.profitability), parseFloat(viaBtcData.profitability), parseFloat(poolInData.profitability), parseFloat(btcComData.profitability)];

    const avgBtcMiningProf = {
      avgBtcProf: averageFunc(allProfArr)
    }

    const btcMiningPools = { whatToMineData, viaBtcData, poolInData, btcComData, avgBtcMiningProf };
    res.send({ btcMiningPools });

  })).catch(errors => {
    console.log(errors);
  })

});


//---------------------------------- BTC scraping --------------------------------------------

app.get('/miningPools/btc/crawler', (req, res) => {


  //F2POOL
  async function f2poolBTC(page) {
    try {

      await page.setDefaultNavigationTimeout(0);
      await page.goto('https://www.f2pool.com/');
      const html = await page.content();
      const $ = cheerio.load(html);


      const poolName = 'F2Pool';
      const profWithFee = parseFloat($("#tab-content-main > table > tbody > tr:nth-child(2) > td > div > div > div.container-info.col-12.col-lg-6 > div.row.calc-inline.hash-val-container > div > div:nth-child(4) > span.pl-1.profit-val.info-value").text().trim());
      const fee = parseFloat($("#tab-content-main > table > tbody > tr:nth-child(2) > td > div > div > div.container-info.col-12.col-lg-6 > div.row.info-content > div:nth-child(10) > span.info-value").text().replace('% PPS+', ''));
      const profitability = parseFloat((profWithFee / ((100 - fee) / 100)).toFixed(8));
      const url = 'https://www.f2pool.com/';

      //console.log({profWithFee, fee, profitability});
      return ({ poolName, profWithFee, fee, profitability, url });

    } catch (error) {
      console.error(error);
    }

  }

 //COIN WARZ
async function coinWarzBTC(page) {

  try {

      page.setDefaultNavigationTimeout(0);
      await page.goto('https://www.coinwarz.com/mining/bitcoin/calculator');
      const html = await page.content();
      const $ = cheerio.load(html);


      const poolName = 'CoinWarz';
      const hp = parseFloat($("[class='form-control numeric']").attr('value'));
      const coinsPerDay = parseFloat($("#left-col > main > section > section:nth-child(12) > div > table > tbody > tr:nth-child(2) > td:nth-child(2)").text().trim());
      const url = "https://www.coinwarz.com/mining/bitcoin/calculator";
      const profitability = parseFloat((coinsPerDay / hp).toFixed(8));


      //console.log({ poolName, coinsPerDay, hp, profitability, url });
       return({poolName, coinsPerDay, hp, profitability, url});


  } catch (error) {
      console.log(error);
  }

}


  const scrapingBTC = async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();


    //profitability calc
    let arrProf = [];
    const getSum = (total, numb) => {
      return total + numb;
    }


    let scrapF2PoolBTC = await f2poolBTC(page)
    let scrapCoinWarzBTC = await coinWarzBTC(page);

    let profF2PoolBTC = scrapF2PoolBTC.profitability;
    let profCoinWarzBTC = scrapCoinWarzBTC.profitability;
    
    arrProf.push(profF2PoolBTC, profCoinWarzBTC)

    //arrProf.reduce(getSum)

    let profAvg = arrProf.reduce(getSum);
    profAvg = parseFloat((profAvg / arrProf.length).toFixed(8));

    //--------------------------------

    const btcMiningPools = {
      f2PoolBTC: scrapF2PoolBTC,
      coinwarzBTC: scrapCoinWarzBTC
    }

    res.send({ btcMiningPools });

  }

  scrapingBTC();

});





//**********************************************BCH mining pools**********************************

app.get('/miningPools/BCH', (req, res) => {

  const whatToMineUrl = `https://whattomine.com/coins/193.json?hr=1000&p=0.0&fee=0&cost=0&hcost=0.07`;
  const viaBtcUrl = `https://www.viabtc.com/res/tools/calculator?coin=BCH`;
  const poolInUrl = 'https://api-prod.poolin.com/api/public/v2/basedata/coins/block_stats';
  const btcComUrl = 'https://btc.com/service/price/coins-income';

  const whatToMineRequest = axios.get(whatToMineUrl);
  const viaBtcRequest = axios.get(viaBtcUrl);
  const poolInRequest = axios.get(poolInUrl);
  const btcComRequest = axios.get(btcComUrl);


  axios.all([whatToMineRequest, viaBtcRequest, poolInRequest, btcComRequest]).then(axios.spread((...responses) => {
    const whatToMineResponse = responses[0].data;
    const viaBtcResponse = responses[1].data;
    const poolInResponse = responses[2].data;
    const btcComResponse = responses[3].data;


    const whatToMineData = {
      poolName: "WhatToMine",
      profitability: whatToMineResponse["estimated_rewards"],
      url: 'https://whattomine.com/coins/193-bch-sha-256?hr=1000&p=2800.0&fee=0.0&cost=0.0&hcost=0.0&commit=Calculate'
    }

    const viaBtcData = {
      poolName: "ViaBtc",
      profitability: viaBtcResponse["data"][0]["profit"]["BCH"],
      url: 'https://www.viabtc.com/tools/calculator?symbol=BCH'
    }

    const poolInData = {
      poolName: "Poolin",
      profitability: poolInResponse["data"]["BCH"]["rewards_per_unit"],
      url: 'https://www.poolin.com/tools/mini-calc?type=btc'
    }

    const btcComData = {
      poolName: "BtcCom",
      profitability: btcComResponse["data"]["bch"]["income_coin"].toFixed(8).toString(),
      url: 'https://btc.com/tools/mini-mining-calculator'
    }


    let allProfArr = [parseFloat(whatToMineData.profitability), parseFloat(viaBtcData.profitability), parseFloat(poolInData.profitability), parseFloat(btcComData.profitability)];

    const avgBchMiningProf = {
      avgBchProf: averageFunc(allProfArr)
    }

    const bchMiningPools = { whatToMineData, viaBtcData, poolInData, btcComData, avgBchMiningProf };
    res.send({ bchMiningPools });

  })).catch(errors => {
    console.log(errors);
  })

});


//------------------------------------Scraping BCH ----------------------------------------

app.get('/miningPools/bch/crawler', (req, res) => {

 //COIN WARZ
async function coinWarzBCH(page) {

  try {

      page.setDefaultNavigationTimeout(0);
      await page.goto('https://www.coinwarz.com/mining/bitcoincash/calculator');
      const html = await page.content();
      const $ = cheerio.load(html);


      const poolName = 'CoinWarz';
      const hp = parseFloat($("[class='form-control numeric']").attr('value'));
      const coinsPerDay = parseFloat($("#left-col > main > section > section:nth-child(12) > div > table > tbody > tr:nth-child(2) > td:nth-child(2)").text().trim());
      const url = "https://www.coinwarz.com/mining/bitcoincash/calculator";
      const profitability = parseFloat((coinsPerDay / hp).toFixed(8));


      //console.log({ poolName, coinsPerDay, hp, profitability, url });
       return({poolName, coinsPerDay, hp, profitability, url});


  } catch (error) {
      console.log(error);
  }

}


  const scrapingBCH = async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();


    //profitability calc
    let arrProf = [];
    const getSum = (total, numb) => {
      return total + numb;
    }

    let scrapCoinWarzBCH = await coinWarzBCH(page);

    let profCoinWarzBCH = scrapCoinWarzBCH.profitability;
    
    arrProf.push(profCoinWarzBCH)

    let profAvg = arrProf.reduce(getSum);
    profAvg = parseFloat((profAvg / arrProf.length).toFixed(8));

    //--------------------------------

    const bchMiningPools = {
      coinwarzBCH: scrapCoinWarzBCH,
    }

    res.send({ bchMiningPools });

  }

  scrapingBCH();

});



//**********************************************DASH mining pools**********************************

app.get('/miningPools/DASH', (req, res) => {

  const whatToMineUrl = `https://whattomine.com/coins/34.json?hr=1000&p=0.0&fee=0&cost=0&hcost=0.07`;
  const viaBtcUrl = `https://www.viabtc.com/res/tools/calculator?coin=DASH`;
  const poolInUrl = 'https://api-prod.poolin.com/api/public/v2/basedata/coins/block_stats';

  const whatToMineRequest = axios.get(whatToMineUrl);
  const viaBtcRequest = axios.get(viaBtcUrl);
  const poolInRequest = axios.get(poolInUrl);


  axios.all([whatToMineRequest, viaBtcRequest, poolInRequest]).then(axios.spread((...responses) => {
    const whatToMineResponse = responses[0].data;
    const viaBtcResponse = responses[1].data;
    const poolInResponse = responses[2].data;

    let whatToMineProf = whatToMineResponse["estimated_rewards"] / 1000;
    whatToMineProf = whatToMineProf.toFixed(8).toString();

    let viaBtcProf = viaBtcResponse["data"][0]["profit"]["DASH"] / 1000;
    viaBtcProf = viaBtcProf.toFixed(8).toString();

    let poolInProf = poolInResponse["data"]["DASH"]["rewards_per_unit"] / 1000;
    poolInProf = poolInProf.toFixed(8).toString();


    const whatToMineData = {
      poolName: "WhatToMine",
      profitability: whatToMineProf,
      url: 'https://whattomine.com/coins/34-dash-x11?hr=1000&p=1800.0&fee=0.0&cost=0.0&hcost=0.0&commit=Calculate'
    }

    const viaBtcData = {
      poolName: "ViaBtc",
      profitability: viaBtcProf,
      url: 'https://www.viabtc.com/tools/calculator?symbol=DASH'
    }

    const poolInData = {
      poolName: "Poolin",
      profitability: poolInProf,
      url: 'https://www.poolin.com/tools/mini-calc?type=dash'
    }


    let allProfArr = [parseFloat(whatToMineData.profitability), parseFloat(viaBtcData.profitability), parseFloat(poolInData.profitability)];

    const avgDashMiningProf = {
      avgDashProf: averageFunc(allProfArr)
    }

    const dashMiningPools = { whatToMineData, viaBtcData, poolInData, avgDashMiningProf };
    res.send({ dashMiningPools });

  })).catch(errors => {
    console.log(errors);
  })

});

//---------------------------------------------- Dash scraping ---------------------------

app.get('/miningPools/dash/crawler', (req, res) => {

  async function miningPoolHubDASH(page) {

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

    //console.log({poolName, hp, coinsPerDay, profitability, lastBlockTime});

    return ({ poolName, hp, coinsPerDay, profitability, lastBlockTime, url });

  }

  //COINOTRON
  async function coinotronDASH(page) {

    try {

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


    //  console.log({ poolName, hp, coinsPerDay, profitability, lastBlockTime, url });
      return ({ poolName, hp, coinsPerDay, profitability, lastBlockTime, url });

    } catch (err) {
      console.log(err);

    }

  }

  //F2POOL
  async function f2poolDASH(page) {
    try {

      await page.setDefaultNavigationTimeout(0);
      await page.goto('https://www.f2pool.com/');
      const html = await page.content();
      const $ = cheerio.load(html);


      const poolName = 'F2Pool - DASH';
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


  const scrapingDASH = async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    //profitability calc
    let arrProf = [];
    const getSum = (total, numb) => {
      return total + numb;
    }

    let scrapMiningPoolHubDASH = await miningPoolHubDASH(page);
    let profMiningPoolHubDASH = scrapMiningPoolHubDASH.profitability;
    arrProf.push(profMiningPoolHubDASH)

    let scrapCoinotronDASH = await coinotronDASH(page);
    let profCoinotronDASH = scrapCoinotronDASH.profitability;
    arrProf.push(profCoinotronDASH)

    let scrapingF2PoolDASH = await f2poolDASH(page);
    let profF2PoolDASH = scrapingF2PoolDASH.profitability;
    arrProf.push(profF2PoolDASH);


    let profAvg = arrProf.reduce(getSum);
    profAvg = parseFloat((profAvg / arrProf.length).toFixed(8));

    //--------------------------------

    const dashMiningPools = {
      miningPoolHubDASH: scrapMiningPoolHubDASH,
      coinotronDASH: scrapCoinotronDASH,
      f2PoolDASH: scrapingF2PoolDASH,
      avgDASHProf: profAvg
    }
   
    res.send({ dashMiningPools });
   
  }

  scrapingDASH();

});


//**********************************************ZEC mining pools**********************************

app.get('/miningPools/ZEC', (req, res) => {

  const whatToMineUrl = `https://whattomine.com/coins/166.json?hr=1000&p=0.0&fee=0&cost=0&hcost=0.07`;
  const viaBtcUrl = `https://www.viabtc.com/res/tools/calculator?coin=ZEC`;
  const poolInUrl = 'https://api-prod.poolin.com/api/public/v2/basedata/coins/block_stats';

  const whatToMineRequest = axios.get(whatToMineUrl);
  const viaBtcRequest = axios.get(viaBtcUrl);
  const poolInRequest = axios.get(poolInUrl);


  axios.all([whatToMineRequest, viaBtcRequest, poolInRequest]).then(axios.spread((...responses) => {
    const whatToMineResponse = responses[0].data;
    const viaBtcResponse = responses[1].data;
    const poolInResponse = responses[2].data;

    let whatToMineProf = whatToMineResponse["estimated_rewards"] / 1000;
    whatToMineProf = whatToMineProf.toFixed(8).toString();

    let viaBtcProf = viaBtcResponse["data"][0]["profit"]["ZEC"] / 1000;
    viaBtcProf = viaBtcProf.toFixed(8).toString();

    let poolInProf = poolInResponse["data"]["ZEC"]["rewards_per_unit"] / 1000;
    poolInProf = poolInProf.toFixed(8).toString();


    const whatToMineData = {
      poolName: "WhatToMine",
      profitability: whatToMineProf,
      url: 'https://whattomine.com/coins/166-zec-equihash?hr=1000&p=1420.0&fee=0.0&cost=0.0&hcost=0.0&commit=Calculate'
    }

    const viaBtcData = {
      poolName: "ViaBtc",
      profitability: viaBtcProf,
      url: 'https://www.viabtc.com/tools/calculator?symbol=ZEC'
    }

    const poolInData = {
      poolName: "Poolin",
      profitability: poolInProf,
      url: 'https://www.poolin.com/tools/mini-calc?type=zec'
    }


    let allProfArr = [parseFloat(whatToMineData.profitability), parseFloat(viaBtcData.profitability), parseFloat(poolInData.profitability)];

    const avgZecMiningProf = {
      avgZecProf: averageFunc(allProfArr)
    }

    const dashMiningPools = { whatToMineData, viaBtcData, poolInData, avgZecMiningProf };
    res.send({ dashMiningPools });

  })).catch(errors => {
    console.log(errors);
  })

});

//********************************************** XMR mining pools**********************************
app.get('/miningPools/XMR', (req, res) => {

  const whatToMineUrl = `https://whattomine.com/coins/101.json?hr=1000&p=0.0&fee=0&cost=0&hcost=0.07`;
  const viaBtcUrl = `https://www.viabtc.com/res/tools/calculator?coin=XMR`;

  const whatToMineRequest = axios.get(whatToMineUrl);
  const viaBtcRequest = axios.get(viaBtcUrl);



  axios.all([whatToMineRequest, viaBtcRequest]).then(axios.spread((...responses) => {
    const whatToMineResponse = responses[0].data;
    const viaBtcResponse = responses[1].data;

    let whatToMineProf = whatToMineResponse["estimated_rewards"] / 1000;
    whatToMineProf = whatToMineProf.toFixed(8).toString();

    let viaBtcProf = viaBtcResponse["data"][0]["profit"]["XMR"] / 1000;
    viaBtcProf = viaBtcProf.toFixed(8).toString();

    const whatToMineData = {
      poolName: "WhatToMine",
      profitability: whatToMineProf,
      url: 'https://whattomine.com/coins/101-xmr-cryptonightr?hr=1000&p=270.0&fee=0.0&cost=0.0&hcost=0.0&commit=Calculate'
    }

    const viaBtcData = {
      poolName: "ViaBtc",
      profitability: viaBtcProf,
      url: 'https://www.viabtc.com/tools/calculator?symbol=XMR'
    }


    let allProfArr = [parseFloat(whatToMineData.profitability), parseFloat(viaBtcData.profitability)];

    const avgXmrMiningProf = {
      avgXmrProf: averageFunc(allProfArr)
    }

    const xmrMiningPools = { whatToMineData, viaBtcData, avgXmrMiningProf };
    res.send({ xmrMiningPools });

  })).catch(errors => {
    console.log(errors);
  })

});

//********************************************** XMC mining pools**********************************
app.get('/miningPools/XMC', (req, res) => {

  const coinCalculatorsUrl = 'https://www.coincalculators.io/api?name=monero-classic&hashrate=1&power=0&poolfee=0&powercost=0&difficultytime=24';

  const coinCalculatorsRequest = axios.get(coinCalculatorsUrl);


  axios.all([coinCalculatorsRequest]).then(axios.spread((...responses) => {
    const coincalculatorsResponse = responses[0].data;

    const coinCalculatorsData = {
      poolName: "CoinCalculators",
      profitability: coincalculatorsResponse["rewardsInDay"].toFixed(8).toString(),
      url: 'https://www.coincalculators.io/coin/monero-classic?Hashrate=1&HashFactor=h&Watt=140&ElectricityPrice=0&PoolFee=0&HardwareCost=0&LH=&Difficulty=24'
    }


    let allProfArr = [parseFloat(coinCalculatorsData.profitability)];

    const avgXmcMiningProf = {
      avgXmcProf: averageFunc(allProfArr)
    }

    const xmcMiningPools = { coinCalculatorsData, avgXmcMiningProf };
    res.send({ xmcMiningPools });

  })).catch(errors => {
    console.log(errors);
  })

});


//********************************************** BEAM mining pools**********************************

app.get('/miningPools/BEAM', (req, res) => {

  const whatToMineUrl = `https://whattomine.com/coins/294.json?hr=1&p=0.0&fee=0&cost=0&hcost=0.0`
  const coinCalculatorsUrl = 'https://www.coincalculators.io/api?name=beam&hashrate=1&power=0&poolfee=0&powercost=0&difficultytime=24';

  const whatToMineRequest = axios.get(whatToMineUrl);
  const coinCalculatorsRequest = axios.get(coinCalculatorsUrl);


  axios.all([whatToMineRequest, coinCalculatorsRequest]).then(axios.spread((...responses) => {
    const whatToMineResponse = responses[0].data;
    const coincalCulatorsResponse = responses[1].data;

    const whatToMineData = {
      poolName: "WhatToMine",
      profitability: whatToMineResponse["estimated_rewards"],
      url: 'https://whattomine.com/coins/294-beam-beamhashiii?hr=1&p=390.0&fee=0.0&cost=0.0&hcost=0.0&commit=Calculate'

    }

    const coinCalculatorsData = {
      poolName: "CoinCalculators",
      profitability: coincalCulatorsResponse["rewardsInDay"].toFixed(8).toString(),
      url: 'https://www.coincalculators.io/coin/beam?Hashrate=1&HashFactor=h&Watt=200&ElectricityPrice=0.0&PoolFee=0&HardwareCost=0&LH=&Difficulty=24'
    }


    let allProfArr = [parseFloat(coinCalculatorsData.profitability), parseFloat(whatToMineData.profitability)];

    const avgBeamMiningProf = {
      avgBeamProf: averageFunc(allProfArr)
    }

    const beamMiningPools = { whatToMineData, coinCalculatorsData, avgBeamMiningProf };
    res.send({ beamMiningPools });

  })).catch(errors => {
    console.log(errors);
  })

});



//-----------------------------------------------------
const server = app.listen(8081, () => {
  const host = server.address().address
  const port = server.address().port

  console.log("Server is up on port:", host, port)
})