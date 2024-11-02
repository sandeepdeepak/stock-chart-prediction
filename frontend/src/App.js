import React, { useEffect, useState } from "react";
import axios from "axios";
import CandleChart from "./CandleChart";
import { convertCandleData } from "./ChartUtils";
// import { symbolTokens } from "./symbolTokens";

const App = () => {
  const [stocksData, setStocksData] = useState([]);

  useEffect(() => {
    const fetchCandleData = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/candle-data"
        );
        const stocksData = response.data.stocksData;

        const stocksFormattedData = [];
        stocksData.forEach((stockRecord) => {
          const formattedData = [
            ["Date", "Low", "Open", "Close", "High"],
            ...stockRecord.candleData.map((data) => [
              new Date(data[0]),
              data[1],
              data[2],
              data[3],
              data[4],
            ]),
          ];
          const convertedFormatData = convertCandleData(formattedData);
          stocksFormattedData.push({name: stockRecord.name, candleData: convertedFormatData});
        });

        console.log(stocksFormattedData)

        setStocksData(stocksFormattedData);
      } catch (error) {
        console.error("Failed to fetch candle data:", error);
      }
    };

    fetchCandleData();

    // console.log(symbolTokens)
  }, []);

  return (
    <div>
      {stocksData?.map((stock) => (
        <div key={stock.id}>
          <h2>{stock.name}</h2>
          <CandleChart initialData={stock.candleData} />
        </div>
      ))}
    </div>
  );
};

export default App;
