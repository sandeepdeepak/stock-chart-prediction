export function convertCandleData(candleData) {
    return candleData
      .map((data) => {
        const date = new Date(data[0]);
        if (isNaN(date)) {
          console.error("Invalid date format: ", data[0]);
          return null;
        }
  
        return {
          date: date,
          open: data[1],
          high: data[2],
          low: data[3],
          close: data[4],
          volume: data[5],
        };
      })
      .filter((item) => item !== null);
  }
  
  export function filterExtremes(data) {
    let filteredData = [];
    let lastExtremeIdx = 0;
  
    for (let i = 0; i < data.length; i++) {
      const currentPoint = data[i];
  
      if (i === 0 || i === data.length - 1) {
        // Always keep the first and last points
        filteredData.push(currentPoint);
        lastExtremeIdx = i;
        continue;
      }
  
      // Determine if the current point is an extreme point
      const previousExtreme = data[lastExtremeIdx];
      const nextExtremeIdx = findNextExtremeIndex(data, i);
      const nextExtreme = data[nextExtremeIdx];
  
      const isExtremePoint =
        (currentPoint.adaptiveValue > previousExtreme.adaptiveValue &&
          currentPoint.adaptiveValue > nextExtreme.adaptiveValue) ||
        (currentPoint.adaptiveValue < previousExtreme.adaptiveValue &&
          currentPoint.adaptiveValue < nextExtreme.adaptiveValue);
  
      // Skip the extreme point if its candle is fully enclosed by the previous extreme point's candle
      if (isExtremePoint) {
        if (
          currentPoint.low >= previousExtreme.low &&
          currentPoint.high <= previousExtreme.high
        ) {
          continue;
        }
  
        // If not between previous and next extremes, keep it
        filteredData.push(currentPoint);
        lastExtremeIdx = i;
      }
    }
  
    return filteredData;
  }
  
  export function findNextExtremeIndex(data, currentIndex) {
    for (let i = currentIndex + 1; i < data.length; i++) {
      if (
        (data[i]?.adaptiveValue > (data[i - 1]?.adaptiveValue ?? -Infinity) &&
          data[i]?.adaptiveValue > (data[i + 1]?.adaptiveValue ?? -Infinity)) ||
        (data[i]?.adaptiveValue < (data[i - 1]?.adaptiveValue ?? Infinity) &&
          data[i]?.adaptiveValue < (data[i + 1]?.adaptiveValue ?? Infinity))
      ) {
        return i;
      }
    }
    return data.length - 1; // Return last point if no more extremes found
  }