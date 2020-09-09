const axios = require ('axios');
const averageFunc = require('./averageFunc');

const whatToViaPoolIn = (coin) => {

    let correctHR = 1;

    let coinWhatToMine = '';

    if(coin == 'ETH') {
        coinWhatToMine = '151';
        correctHR = 1;
    }else if(coin == 'BTC') {
        coinWhatToMine = '1';
        correctHR = 1;
    }else {
        res.send({error: 'Coin is not avilable for dagger-hashimoto'});
    }


const whatToMineUrl = `https://whattomine.com/coins/${coinWhatToMine}.json?hr=${correctHR}&p=0.0&fee=0&cost=0&hcost=0.07`;
const viaBtcUrl = `https://www.viabtc.com/res/tools/calculator?coin=${coin}`;
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
    profitability: viaBtcResponse["data"][0]["profit"][coin],
    url: 'https://www.viabtc.com/tools/calculator?symbol=ETH'
  }

  const poolInData = {
    poolName: "Poolin",
    profitability: poolInResponse["data"][coin]["rewards_per_unit"],
    url: 'https://www.poolin.com/tools/mini-calc?type=eth'
  }


let allProfArr = [parseFloat(whatToMineData.profitability), parseFloat(viaBtcData.profitability), parseFloat(poolInData.profitability)];
  
 const avgEthMiningProf = {
    avgETHProf: averageFunc(allProfArr)
 }

  const ethMininPools = {whatToMineData, viaBtcData, poolInData, avgEthMiningProf};
  res.send({ethMininPools});  

})).catch(errors => {
   console.log(errors);
})

}


module.exports = whatToViaPoolIn;