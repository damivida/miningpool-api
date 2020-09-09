const express = require('express');
const axios = require ('axios');
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
  let viaBtcProfNoFee = viaBtcProf/0.97;


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

  const ethMiningPools = {whatToMineData, viaBtcData, poolInData, avgEthMiningProf};
  res.send({ethMiningPools});  

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
    let prof = (coinsPerDay/hp)*1000;
    let profitability =  profRound(prof)
    let url = 'https://ethereum.miningpoolhub.com/index.php?page=statistics&action=pool';
    
    //console.log({poolName, hp, coinsPerDay, profitability, lastBlockTime});

    return({poolName, hp, coinsPerDay, profitability, lastBlockTime, url});

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
    let prof = (coinsPerDay/hp)/1000;
    let profitability =  profRound(prof)
    let url = 'https://www.coinotron.com/app?action=statistics';


    return({poolName, hp, coinsPerDay, profitability, lastBlockTime, url});

    }catch(err) {
        console.log(err);

    }

}

//F2POOL
async function f2pool() {

    /* const browser = await puppeteer.launch({headless:false});
    const page = await browser.newPage(); */

    await page.setDefaultNavigationTimeout(0);
    await page.goto('https://www.f2pool.com/');
    const html = await page.content();
    const $ = cheerio.load(html);


    const poolName = '';
    
    //const val1 = $('#__layout > div > div.g-doc > div > div.index > div > div.box.mt40.mb40.pb20 > div:nth-child(2) > div.calc-main.el-row > div:nth-child(3) > div > section:nth-child(2) > span > input').attr('value');
    await page.waitForSelector('#tab-content-main > table > tbody > tr.row-common.row-etc > td:nth-child(7) > a.btn-tool.btn-circle.btn-collapse.collapsed.d-none.d-lg-inline-block');
    await page.click('#tab-content-main > table > tbody > tr.row-common.row-etc > td:nth-child(7) > a.btn-tool.btn-circle.btn-collapse.collapsed.d-none.d-lg-inline-block'); 
   // await page.waitForSelector('#ContentPlaceHolder1_divresults > div > table > tbody > tr:nth-child(2) > td:nth-child(2)');
   //const prof = $('#ContentPlaceHolder1_divresults > div > table > tbody > tr:nth-child(2) > td:nth-child(2)').text();
    //console.log(val1);
    
}


const scrapingETH =  async () => {
    const browser = await puppeteer.launch({headless:true});
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

   
    //arrProf.reduce(getSum)

    let profAvg = arrProf.reduce(getSum);
    profAvg = parseFloat((profAvg /arrProf.length).toFixed(8));

    //--------------------------------

    const ethMiningPools =  {
        miningPoolHubETH: scrapMiningPoolHubETH,
        coinotronETH: scrapCoinotronETH,
        avgETHProf: profAvg
    }
   //console.log(ethMining)
   
   res.send({ethMiningPools});
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
      let viaBtcProfNoFee = viaBtcProf/0.97;
    
    
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
    
      const etcMiningPools = {whatToMineData, viaBtcData, avgEtcMiningProf};
      res.send({etcMiningPools});  
    
    })).catch(errors => {
       console.log(errors);
    })

});


//------------------ETC scraping---------------------------------

app.get('/miningPools/etc/crawler', (req, res) => {

  async function coinotronETC(page) {

    await page.setDefaultNavigationTimeout(0);
    await page.goto('https://www.coinotron.com/app?action=statistics');
    const html = await page.content();
    const $ = cheerio.load(html);

    const poolName = 'Coinotron - ETC';
    const lastBlockTime = $('#row0TableSolvedBlocksETC > td:nth-child(2)').text();
    const hp = parseFloat($('#row0TableBestMinersETC > td:nth-child(3)').text().replace('GH', ''));
    let coinsPerDay = parseFloat($('#row0TableBestMinersETC > td:nth-child(4)').text());
    let prof = (coinsPerDay/hp)/1000;
    let profitability =  profRound(prof)
    let url = 'https://www.coinotron.com/app?action=statistics';

    return({poolName, hp, coinsPerDay, profitability, lastBlockTime, url});
}



const etcScraping = async () => {
    const browser = await puppeteer.launch({headless:true});
    const page = await browser.newPage();

        //profitability calc
        let arrProf = [];
        const getSum = (total, numb) => {
            return total + numb;
        }

        let scrapCoinotronETC = await coinotronETC(page);
        let profCoinotronETC = scrapCoinotronETC.profitability;
        arrProf.push(profCoinotronETC)

        //arrProf.reduce(getSum);

       let profAvg = arrProf.reduce(getSum);
       profAvg = parseFloat((profAvg /arrProf.length).toFixed(8));

       //-------------------

    const etcMiningPools = {
        coinotronETC: scrapCoinotronETC,
        avgETCProf: profAvg
    }
   //console.log(etcMining)
   res.send({etcMiningPools});
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
    viaBtcProf = viaBtcProf/1000;
    viaBtcProf = viaBtcProf.toString()

    let poolInProf =  poolInResponse["data"]["LTC"]["rewards_per_unit"];
    poolInProf = poolInProf/1000;
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
      profitability:poolInProf,
      url: 'https://www.poolin.com/tools/mini-calc?type=ltc',
    }
  
  
  let allProfArr = [parseFloat(whatToMineData.profitability), parseFloat(viaBtcData.profitability), parseFloat(poolInData.profitability)];
    
   const avgLtcMiningProf = {
      avgLtcProf: averageFunc(allProfArr)
   }
  
    const ltcMiningPools = {whatToMineData, viaBtcData, poolInData, avgLtcMiningProf};
    res.send({ltcMiningPools});  
  
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
        .replace(',',''));
    

    let coinsPerDay = parseFloat($('#content > div > div > div.optional2.column > table > tbody > tr:nth-child(2) > td:nth-child(4)').text());
    let prof = (coinsPerDay/hp)/1000;
    let profitability =  profRound(prof)
    let url = 'https://www.litecoinpool.org/stats';

    
    //console.log({poolName, hp, coinsPerDay, profitability, lastBlockTime});

    return({poolName, hp, coinsPerDay, profitability, lastBlockTime, url});
}



//--------------------------------------------MAIN
const ltcScraping = async () => {
    const browser = await puppeteer.launch({headless:true});
    const page = await browser.newPage();

        //---------------profitability calc
        let arrProf = [];
        const getSum = (total, numb) => {
            return total + numb;
        }

        let scrapLitecoinPool = await liteCoinPool(page);
        let profLitecoinPool = scrapLitecoinPool.profitability;
        arrProf.push(profLitecoinPool)

       let profAvg = arrProf.reduce(getSum);
       profAvg = parseFloat((profAvg /arrProf.length).toFixed(8));

       //-------------------

    const etcMiningPools = {
        litecoinPoolLTC: scrapLitecoinPool,
        avgLtcProf: profAvg
    }

   // console.log(ltcMining);
   res.send({etcMiningPools});
}
ltcScraping();
  
  
  });



//-----------------------------------------------------
const server = app.listen(8081, () => {
   const host = server.address().address
   const port = server.address().port
   
   console.log("Server is up on port:", host, port)
})