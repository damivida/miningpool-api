//const axios = require('axios');
const ethMininPools = require('./miningPools')


const profitability = async(coin) =>  {
  const date = {
    checkTimeUTC: new Date()
  };

  const ethApi = await ethMininPools(coin);
  const btcApi = await ethMininPools(coin);


   prof = {date, ethApi, btcApi}

  // console.log(prof);
   return prof;

}

console.log(profitability("ETH"));



//ethMininPools('ETH');










/* const whatToMineUrl = 'https://whattomine.com/coins/151.json?hr=1&p=0.0&fee=0&cost=0&hcost=0.0';
const viaBtcUrl = 'https://www.viabtc.com/res/tools/calculator?coin=ETH';
const poolInUrl = 'https://api-prod.poolin.com/api/public/v2/basedata/coins/block_stats';

const whatToMineRequest = axios.get(whatToMineUrl);
const viaBtcRequest = axios.get(viaBtcUrl);
const poolInRequest = axios.get(poolInUrl);


axios.all([whatToMineRequest, viaBtcRequest, poolInRequest]).then(axios.spread((...responses) => {
  const whatToMineResponse = responses[0].data;
  const viaBtcResponse = responses[1].data;
  const poolInResponse = responses[2].data;

  const whatToMineData = {
    poolName: "WhatToMIne",
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

 const ethMining = [ethMininPools, ]

  const ethMininPools = {whatToMineData, viaBtcData, poolInData, avgEthMiningProf};
  
  return ethMininPools;
  

})).catch(errors => {
   console.log(errors);
})

 */