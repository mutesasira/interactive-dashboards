import React, { useMemo } from "react";
import { useStore } from "effector-react";
import ReactECharts from "echarts-for-react";
import { Stack } from "@chakra-ui/react";
import { ChartProps } from "../../interfaces";
import { $visualizationData, $visualizationMetadata } from "../../Store";
import VisualizationTitle from "./VisualizationTitle";
import { processGraphs } from "../processors";

interface BulletChartProps extends ChartProps {
  category?: string;
  series?: string;
}

const BulletChart = ({
  visualization,
  category,
  series,
  layoutProperties,
  dataProperties,
  section,
}: BulletChartProps) => {
  const visualizationData = useStore($visualizationData)[visualization.id] || [];
  const metadata = useStore($visualizationMetadata)[visualization.id];

  // Extract properties with defaults
  const title = visualization.name || "";
  const showTitle = visualization.showTitle !== false && section.display !== "tabs";
  
  // Chart title properties
  const chartTitle = dataProperties?.["data.chart.title"] || "";
  const showChartTitle = dataProperties?.["data.chart.showTitle"] !== false;
  const chartTitleFontSize = dataProperties?.["data.chart.titleFontSize"] || 16;
  const chartTitleColor = dataProperties?.["data.chart.titleColor"] || "#333";
  const chartTitlePosition = dataProperties?.["data.chart.titlePosition"] || "center";
  const chartTitleFontWeight = dataProperties?.["data.chart.titleFontWeight"] || "bold";
  
  // Layout properties
  const backgroundColor = layoutProperties?.["layout.backgroundColor"] || "transparent";
  const showLegend = dataProperties?.["data.showLegend"] !== false;
  const legendPosition = dataProperties?.["data.legend.position"] || "bottom";
  
  // Bullet chart specific properties
  const targetColor = dataProperties?.["data.bullet.targetColor"] || "#ff4444";
  const actualColor = dataProperties?.["data.bullet.actualColor"] || "#4CAF50";
  const range1Color = dataProperties?.["data.bullet.range1Color"] || "#f0f0f0";
  const range2Color = dataProperties?.["data.bullet.range2Color"] || "#e0e0e0";
  const range3Color = dataProperties?.["data.bullet.range3Color"] || "#d0d0d0";
  const rangeColors = [range1Color, range2Color, range3Color];
  const showValues = dataProperties?.["data.showValues"] !== false;
  const orientation = dataProperties?.["data.orientation"] || "horizontal";
  
  // Chart sizing properties
  const fitContainer = layoutProperties?.["layout.fitContainer"] !== false;
  const chartWidth = layoutProperties?.["layout.chartWidth"] || "100%";
  const chartHeight = layoutProperties?.["layout.chartHeight"] || "400px";

  const chartData = useMemo(() => {
    if (!visualizationData?.length) return null;

    const processed = processGraphs(
      visualizationData,
      visualization,
      {
        category,
        series,
        metadata,
      },
      "bullet"
    );

    if (!processed || !processed.length) return null;

    // Transform data for bullet chart
    const bulletData = processed.map((item: any, index: number) => {
      const name = item.name || item.category || `Item ${index + 1}`;
      const actual = Number(item.actual || item.value || 0);
      const target = Number(item.target || item.goal || actual * 1.2);
      const ranges = item.ranges || [target * 0.6, target * 0.8, target];

      return {
        name,
        actual,
        target,
        ranges: Array.isArray(ranges) ? ranges : [target * 0.6, target * 0.8, target],
        max: Math.max(target * 1.1, actual * 1.1, ...(Array.isArray(ranges) ? ranges : []))
      };
    });

    return bulletData;
  }, [visualizationData, visualization, category, series, metadata]);

  const chartOptions = useMemo(() => {
    if (!chartData) return {};

    const isHorizontal = orientation === "horizontal";

    return {
      backgroundColor,
      title: showChartTitle && chartTitle ? {
        text: chartTitle,
        left: chartTitlePosition,
        textStyle: {
          fontSize: chartTitleFontSize,
          color: chartTitleColor,
          fontWeight: chartTitleFontWeight,
        },
      } : undefined,
      tooltip: {
        trigger: "item",
        formatter: (params: any) => {
          const { name, actual, target, ranges } = params.data;
          return `
            <b>${name}</b><br/>
            Actual: ${actual}<br/>
            Target: ${target}<br/>
            Range 1: 0 - ${ranges[0]}<br/>
            Range 2: ${ranges[0]} - ${ranges[1]}<br/>
            Range 3: ${ranges[1]} - ${ranges[2]}
          `;
        },
      },
      legend: showLegend ? {
        orient: legendPosition === "left" || legendPosition === "right" ? "vertical" : "horizontal",
        [legendPosition]: legendPosition === "top" ? 0 : legendPosition === "bottom" ? 0 : 20,
        data: ["Range 1", "Range 2", "Range 3", "Actual", "Target"],
      } : undefined,
      grid: {
        left: isHorizontal ? "15%" : "10%",
        right: "10%",
        top: showChartTitle && chartTitle ? "15%" : "10%",
        bottom: showLegend ? "15%" : "10%",
        containLabel: true,
      },
      xAxis: isHorizontal ? {
        type: "value",
        splitLine: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: showValues },
      } : {
        type: "category",
        data: chartData.map(d => d.name),
        axisLine: { show: true },
        axisTick: { show: true },
      },
      yAxis: isHorizontal ? {
        type: "category",
        data: chartData.map(d => d.name),
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
      } : {
        type: "value",
        splitLine: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: showValues },
      },
      series: [
        // Range 1 (background)
        {
          name: "Range 1",
          type: "bar",
          stack: "bullet",
          data: chartData.map(d => ({
            value: isHorizontal ? d.ranges[0] : d.ranges[0],
            name: d.name,
            actual: d.actual,
            target: d.target,
            ranges: d.ranges,
          })),
          itemStyle: {
            color: rangeColors[0],
            borderRadius: isHorizontal ? [0, 2, 2, 0] : [2, 2, 0, 0],
          },
          barWidth: "60%",
          silent: true,
        },
        // Range 2
        {
          name: "Range 2",
          type: "bar",
          stack: "bullet",
          data: chartData.map(d => ({
            value: isHorizontal ? Math.max(0, d.ranges[1] - d.ranges[0]) : Math.max(0, d.ranges[1] - d.ranges[0]),
            name: d.name,
            actual: d.actual,
            target: d.target,
            ranges: d.ranges,
          })),
          itemStyle: {
            color: rangeColors[1],
          },
          barWidth: "60%",
          silent: true,
        },
        // Range 3
        {
          name: "Range 3",
          type: "bar",
          stack: "bullet",
          data: chartData.map(d => ({
            value: isHorizontal ? Math.max(0, d.ranges[2] - d.ranges[1]) : Math.max(0, d.ranges[2] - d.ranges[1]),
            name: d.name,
            actual: d.actual,
            target: d.target,
            ranges: d.ranges,
          })),
          itemStyle: {
            color: rangeColors[2],
          },
          barWidth: "60%",
          silent: true,
        },
        // Actual value
        {
          name: "Actual",
          type: "bar",
          data: chartData.map(d => ({
            value: isHorizontal ? d.actual : d.actual,
            name: d.name,
            actual: d.actual,
            target: d.target,
            ranges: d.ranges,
          })),
          itemStyle: {
            color: actualColor,
            borderRadius: isHorizontal ? [0, 2, 2, 0] : [2, 2, 0, 0],
          },
          barWidth: "30%",
          z: 2,
          label: showValues ? {
            show: true,
            position: isHorizontal ? "right" : "top",
            formatter: "{c}",
          } : undefined,
        },
        // Target line
        {
          name: "Target",
          type: "scatter",
          data: chartData.map((d, index) => ({
            value: isHorizontal ? [d.target, index] : [index, d.target],
            name: d.name,
            actual: d.actual,
            target: d.target,
            ranges: d.ranges,
          })),
          symbolSize: 15,
          symbol: isHorizontal ? "rect" : "rect",
          itemStyle: {
            color: targetColor,
          },
          z: 3,
        },
      ],
    };
  }, [
    chartData,
    backgroundColor,
    showChartTitle,
    chartTitle,
    chartTitlePosition,
    chartTitleFontSize,
    chartTitleColor,
    chartTitleFontWeight,
    showLegend,
    legendPosition,
    targetColor,
    actualColor,
    rangeColors,
    showValues,
    orientation,
  ]);

  if (!chartData || chartData.length === 0) {
    return (
      <Stack spacing={4} align="center" justify="center" h="200px">
        {showTitle && <VisualizationTitle section={section} title={title} />}
        <div>No data available for bullet chart</div>
      </Stack>
    );
  }

  return (
    <Stack 
      spacing={2} 
      w="100%" 
      h="100%"
      style={{
        width: fitContainer ? "100%" : chartWidth,
        height: fitContainer ? "100%" : chartHeight,
      }}
    >
      {showTitle && <VisualizationTitle section={section} title={title} />}
      <ReactECharts
        option={chartOptions}
        style={{
          width: "100%",
          height: "100%",
          minHeight: "300px",
        }}
        opts={{
          renderer: "canvas",
          useDirtyRect: false,
        }}
      />
    </Stack>
  );
};

export default BulletChart;