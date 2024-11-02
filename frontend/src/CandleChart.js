import React from "react";
import {
  discontinuousTimeScaleProviderBuilder,
  Chart,
  ChartCanvas,
  CandlestickSeries,
  LineSeries,
  CurrentCoordinate,
  XAxis,
  YAxis,
  MouseCoordinateX,
  MouseCoordinateY,
  EdgeIndicator,
  ZoomButtons,
  OHLCTooltip,
  CrossHairCursor,
  lastVisibleItemBasedZoomAnchor,
  Annotate,
  SvgPathAnnotation,
} from "react-financial-charts";
import { timeFormat } from "d3-time-format";
import { filterExtremes } from "./ChartUtils";

const CandleChart = ({ initialData }) => {
  console.log("Entered", initialData);
  initialData = initialData.map((d, i) => {
    let adaptiveValue;

    if (i === 0) {
      adaptiveValue = d.high;
    } else {
      const previousHigh = initialData[i - 1].high;
      const trendIsUpward = d.high > previousHigh;

      if (trendIsUpward) {
        adaptiveValue = d.high > d.low ? d.high : d.low;
      } else {
        adaptiveValue = d.high > d.low ? d.low : d.high;
      }
    }

    return {
      ...d,
      adaptiveValue,
    };
  });

  let filteredData = filterExtremes(initialData);
  filteredData = filterExtremes(filteredData);

  const ScaleProvider =
    discontinuousTimeScaleProviderBuilder().inputDateAccessor(
      (d) => new Date(d.date)
    );

  const height = window.innerHeight * 0.8;
  const width = window.innerWidth * 0.8;
  const margin = { left: 0, right: 48, top: 0, bottom: 24 };

  const pricesDisplayFormat = (value) => value.toFixed(2);
  const { data, xScale, xAccessor, displayXAccessor } =
    ScaleProvider(initialData);
  const max = xAccessor(data[data.length - 1]);
  const min = xAccessor(data[Math.max(0, data.length - 100)]);
  const xExtents = [min, max + 5];

  const candleChartExtents = (data) => {
    return [data.high, data.low];
  };

  const yEdgeIndicator = (data) => {
    return data.close;
  };

  const openCloseColor = (data) => {
    return data.close > data.open ? "#26a69a" : "#ef5350";
  };

  const trendExtremes = filteredData.map((d) => ({
    x: new Date(d.date),
    y: d.adaptiveValue,
  }));

  // Custom annotation renderer to draw a rectangle
  const CustomRectangleAnnotation = ({
    xScale,
    yScale,
    datum,
    xAccessor,
    xEnd,
    plotData,
    fill, // Accept fill color as a prop
    stroke, // Accept stroke color as a prop
  }) => {
    // Calculate candle width
    let candleWidth;
    const index = plotData.findIndex((d) => xAccessor(d) === xAccessor(datum));
    if (index < plotData.length - 1) {
      const nextDatum = plotData[index + 1];
      const x = xScale(xAccessor(datum));
      const xNext = xScale(xAccessor(nextDatum));
      candleWidth = xNext - x;
    } else if (index > 0) {
      const prevDatum = plotData[index - 1];
      const xPrev = xScale(xAccessor(prevDatum));
      const x = xScale(xAccessor(datum));
      candleWidth = x - xPrev;
    } else {
      candleWidth = 5; // Default width if only one data point
    }

    // X positions
    const x = xScale(xAccessor(datum)) + candleWidth;
    const xEndPosition = xScale(xAccessor(xEnd)) + candleWidth;
    const width = xEndPosition - x;

    // Y positions
    const y = Math.min(yScale(datum.high), yScale(datum.low)) + 22; // Move down by 10 pixels
    const yEnd = Math.max(yScale(datum.high), yScale(datum.low)) + 22;
    const height = yEnd - y;

    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        stroke={stroke}
        strokeWidth={2}
        pointerEvents="none"
      />
    );
  };

  const percentageThreshold = 0.025; // Set a 1% threshold

  const rectanglesToAnnotate = data
    .filter((d, i) => {
      if (i + 2 < data.length) {
        const secondNextCandle = data[i + 2];
        
        // Check if the third candle's high meets the dynamic threshold
        const dynamicThreshold = d.high * (1 + percentageThreshold); // 1% above the high        
        return secondNextCandle.high >= dynamicThreshold;
      }
      return false;
    })
    .map((rectangleDatum, i) => {
      // Old logic for intersection check after 5 candles
      const startDate = rectangleDatum.date;
      const yMin = Math.min(rectangleDatum.high, rectangleDatum.low);
      const yMax = Math.max(rectangleDatum.high, rectangleDatum.low);
      const indexStart = data.findIndex((d) => d.date === startDate);
      const indexEnd = data.length - 1;

      let intersectsLine = false;
      let intersectionIndex = null;

      // Start checking from indexStart + 5
      for (let j = indexStart + 5; j <= indexEnd; j++) {
        if (j >= data.length) break;

        const d = data[j];
        const adaptiveValue = d.adaptiveValue;
        if (adaptiveValue !== undefined && adaptiveValue !== null) {
          if (adaptiveValue >= yMin && adaptiveValue <= yMax) {
            intersectsLine = true;
            intersectionIndex = j;
            break;
          }
        }
      }

      // Check if the intersection occurs within the last three candles
      const lastThreeCandlesStartIndex = data.length - 3;
      const intersectsInLastThreeCandles =
        intersectsLine && intersectionIndex >= lastThreeCandlesStartIndex;

      // New logic for extreme point check
      const previous = data[i - 1] ?? {};
      const next = data[i + 1] ?? {};
      const isExtremePoint =
        (rectangleDatum.adaptiveValue > (previous.adaptiveValue ?? -Infinity) &&
          rectangleDatum.adaptiveValue > (next.adaptiveValue ?? -Infinity)) ||
        (rectangleDatum.adaptiveValue < (previous.adaptiveValue ?? Infinity) &&
          rectangleDatum.adaptiveValue < (next.adaptiveValue ?? Infinity));

      // Return the rectangleDatum if it intersects or is near an extreme point
      return (intersectsLine || isExtremePoint)
        ? {
            ...rectangleDatum,
            intersectsLine,
            intersectsInLastThreeCandles,
          }
        : null;
    })
    .filter((datum) => datum !== null);


  console.log(rectanglesToAnnotate);

  return (
    <div style={{ backgroundColor: "black" }}>
      <ChartCanvas
        height={height}
        width={width}
        ratio={3}
        margin={margin}
        data={data}
        displayXAccessor={displayXAccessor}
        seriesName="Data"
        xScale={xScale}
        xAccessor={xAccessor}
        xExtents={xExtents}
        zoomAnchor={lastVisibleItemBasedZoomAnchor}
        style={{ backgroundColor: "black", padding: 0, border: "none" }}
      >
        <Chart
          id={3}
          yExtents={candleChartExtents}
          padding={{ left: 0, right: 0, top: 0, bottom: 0 }}
        >
          <XAxis
            strokeStyle="white"
            tickStrokeStyle="white"
            labelStyle={{ fill: "white" }}
            axisLineColor="white"
          />
          <YAxis
            strokeStyle="white"
            tickStrokeStyle="white"
            labelStyle={{ fill: "white" }}
            tickLabelFill="white"
          />
          <OHLCTooltip origin={[8, 16]} />
          <CandlestickSeries
            fill={(d) => (d.close > d.open ? "#26a69a" : "#ef5350")}
            strokeStyle="white"
          />

          <LineSeries
            yAccessor={(d) => {
              if (trendExtremes.length < 2) return null;
              return trendExtremes.some(
                (e) => e.x.getTime() === new Date(d.date).getTime()
              )
                ? d.adaptiveValue
                : null;
            }}
            strokeStyle="white"
            strokeDasharray="Solid"
          />
          <CurrentCoordinate
            yAccessor={(d) =>
              filteredData.find((fd) => fd.date === d.date)?.adaptiveValue
            }
            fillStyle="white"
          />

          <MouseCoordinateX
            rectHeight={margin.bottom}
            displayFormat={(d) => {
              const date = new Date(d);
              return date instanceof Date && !isNaN(date)
                ? timeFormat("%H:%M")(date)
                : "";
            }}
          />
          <MouseCoordinateY
            rectWidth={margin.right}
            displayFormat={pricesDisplayFormat}
          />
          <EdgeIndicator
            itemType="last"
            rectWidth={margin.right}
            fill={openCloseColor}
            lineStroke={openCloseColor}
            displayFormat={pricesDisplayFormat}
            yAccessor={yEdgeIndicator}
          />
          <ZoomButtons />

          {/* Adding Rectangle Annotation for each candle that meets the condition */}
          {rectanglesToAnnotate.map((datum, idx) => (
            <Annotate
              key={idx}
              with={CustomRectangleAnnotation}
              when={(d) =>
                new Date(d.date).getTime() === new Date(datum.date).getTime()
              }
              usingProps={{
                xEnd: data[data.length - 1],
                xAccessor: xAccessor,
                fill: datum.intersectsLine
                  ? datum.intersectsInLastThreeCandles
                    ? "rgba(0, 0, 255, 0.5)" // Green if intersects in last three candles
                    : "rgba(255, 0, 0, 0.5)" // Red if intersects but not in last three candles
                  : "rgba(144, 238, 144, 0.5)", // Light green if no intersection
                stroke: datum.intersectsLine
                  ? datum.intersectsInLastThreeCandles
                    ? "green" // Green stroke if intersects in last three candles
                    : "red" // Red stroke if intersects but not in last three candles
                  : "#90ee90", // Light green stroke if no intersection
              }}
            />
          ))}
        </Chart>
        <CrossHairCursor />
      </ChartCanvas>
    </div>
  );
};

export default CandleChart;
