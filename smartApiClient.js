// smartApiClient.js
const { SmartAPI } = require("smartapi-javascript");
const { authenticator } = require("otplib");
const { symbolTokens } = require("./symbolTokens");
const { nifty_100_symbols } = require("./nifty_100_symbols");

const apiKey = "TQ6Dn3Cr"; // PROVIDE YOUR API KEY HERE
const userId = "S50015360";
const password = "0806";
const totpSecret = "LBZHRNSWVHZQ6XEVPXSN75BJSE";

const generateTotp = () => {
  return authenticator.generate(totpSecret);
};

const generateSessionAndFetchData = async () => {
    try {
      let smart_api = new SmartAPI({
        api_key: apiKey,
      });
  
      const totp = generateTotp();
      console.log("Generated TOTP:", totp);
  
      const filteredSymbols = symbolTokens.filter(
        (s) =>
          s.exch_seg === "NSE" &&
          s.expiry === "" &&
          s.symbol.includes("-EQ") &&
          nifty_100_symbols.includes(s.name)
      );
  
      const stocksData = await smart_api
        .generateSession("S50015360", "0806", totp)
        .then(async (data) => {
          console.log(data);
  
          // Function to chunk the array into batches of 3
          const chunkArray = (array, chunk_size) => {
            const results = [];
            for (let i = 0; i < array.length; i += chunk_size) {
              results.push(array.slice(i, i + chunk_size));
            }
            return results;
          };
  
          // Break filteredSymbols into chunks of 3
          const symbolChunks = chunkArray(filteredSymbols, 3);
          const candleDataArray = [];
  
          for (const chunk of symbolChunks) {
            // Fetch candle data for each symbol in the chunk
            const candleDataPromises = chunk.map(async (symbolObj) => {
              const candleData = await smart_api.getCandleData({
                exchange: "NSE",
                symboltoken: symbolObj.token,
                interval: "ONE_DAY",
                fromdate: "2023-01-01 09:15",
                todate: "2024-10-28 12:00",
              });
              return {
                name: symbolObj.name,
                candleData: candleData.data,
              };
            });
  
            // Wait for all promises in this chunk to resolve
            const chunkCandleData = await Promise.all(candleDataPromises);
            candleDataArray.push(...chunkCandleData);
  
            // Wait for 1 second before processing the next chunk
            console.log("Waiting for 1 second before the next batch...");
            await new Promise((resolve) => setTimeout(resolve, 750));
          }
  
          return candleDataArray;
        });
  
      return stocksData;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };
  

module.exports = { generateSessionAndFetchData };
