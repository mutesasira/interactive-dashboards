import React, { useMemo } from "react";
import { useStore } from "effector-react";
import ReactECharts from "echarts-for-react";
import { Stack } from "@chakra-ui/react";
import { ChartProps } from "../../interfaces";
import { $visualizationData, $visualizationMetadata } from "../../Store";
import VisualizationTitle from "./VisualizationTitle";
import { processGraphs } from "../processors";

interface BarGraphProps extends ChartProps {
  category?: string;
  series?: string;
}

const BarGraph = ({
  visualization,
  category,
  series,
  layoutProperties,
  dataProperties,
  section,
}: BarGraphProps) => {
  const visualizationData = useStore($visualizationData)[visualization.id] || [];
  const metadata = useStore($visualizationMetadata)[visualization.id];
  

  // Extract properties with defaults
  const title = visualization.name || "";
  // Don't show visualization title in tabs mode as it's already shown in the tab
  const showTitle = visualization.showTitle !== false && section.display !== "tabs";
  
  // Chart title properties (independent of visualization title) - with responsive sizing
  const chartTitle = dataProperties?.["data.chart.title"] || "";
  const showChartTitle = dataProperties?.["data.chart.showTitle"] !== false;
  const baseChartTitleFontSize = dataProperties?.["data.chart.titleFontSize"] || 16;
  const chartTitleFontSize = baseChartTitleFontSize;
  const chartTitleColor = dataProperties?.["data.chart.titleColor"] || "#333";
  const chartTitlePosition = dataProperties?.["data.chart.titlePosition"] || "center";
  const chartTitleFontWeight = dataProperties?.["data.chart.titleFontWeight"] || "bold";
  const backgroundColor = layoutProperties?.["layout.backgroundColor"] || "transparent";
  const orientation = dataProperties?.["data.orientation"] || "v";
  const barMode = layoutProperties?.["layout.barmode"] || "group";
  const showLegend = dataProperties?.["data.showLegend"] !== false;
  const legendPosition = dataProperties?.["data.legend.position"] || "bottom";
  const showGrid = dataProperties?.["data.grid.show"] !== false;
  const showValues = dataProperties?.["data.showValues"] || false;
  const colorway = layoutProperties?.["layout.colorway"] || [
    "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
    "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22"
  ];

  // Stacking properties
  const stackType = dataProperties?.["data.stack.type"] || "none";
  const stackName = dataProperties?.["data.stack.name"] || "stack";

  // Value formatting properties
  const decimalPlaces = dataProperties?.["data.values.decimalPlaces"] || 0;
  const showThousandsSeparator = dataProperties?.["data.values.showThousandsSeparator"] || false;
  const thousandsSeparatorType = dataProperties?.["data.values.thousandsSeparator"] || "comma";
  const valuePrefix = dataProperties?.["data.values.prefix"] || "";
  const valueSuffix = dataProperties?.["data.values.suffix"] || "";
  const valuePosition = dataProperties?.["data.values.position"] || "inside";
  // Responsive value font size
  const baseValueFontSize = dataProperties?.["data.values.fontSize"] || 12;
  const valueFontSize = baseValueFontSize;
  const valueColor = dataProperties?.["data.values.color"] || "#000";
  const valueFontWeight = dataProperties?.["data.values.fontWeight"] || "normal";
  const intelligentSizing = dataProperties?.["data.values.intelligentSizing"] === true;
  const minBarSizePercent = dataProperties?.["data.values.minBarSizePercent"] || 10;

  // Animation properties
  const animationDuration = dataProperties?.["data.animation.duration"] || 1000;
  const animationEasing = dataProperties?.["data.animation.easing"] || "cubicOut";
  const animationDelay = dataProperties?.["data.animation.delay"] || 0;
  const animateOnUpdate = dataProperties?.["data.animation.animationDurationUpdate"] || true;

  // Axis properties
  const xAxisTitle = dataProperties?.["data.xAxis.title"] || "";
  const yAxisTitle = dataProperties?.["data.yAxis.title"] || "";
  const xAxisLabelRotation = dataProperties?.["data.xAxis.labelRotation"] || 0;
  const yAxisLabelRotation = dataProperties?.["data.yAxis.labelRotation"] || 0;

  // Bar styling properties
  const barWidth = dataProperties?.["data.bar.width"] || "auto";
  const barBorderWidth = dataProperties?.["data.bar.borderWidth"] || 0;
  const barBorderColor = dataProperties?.["data.bar.borderColor"] || "#000";
  const barGap = dataProperties?.["data.bar.gap"] || "20%";
  const categoryGap = dataProperties?.["data.bar.categoryGap"] || "20%";
  
  // Increase gaps slightly if values are shown to provide more space for labels
  const adjustedBarGap = showValues ? (typeof barGap === 'string' && barGap.includes('%') ? 
    `${Math.min(50, parseInt(barGap) + 5)}%` : barGap) : barGap;
  const adjustedCategoryGap = showValues ? (typeof categoryGap === 'string' && categoryGap.includes('%') ? 
    `${Math.min(50, parseInt(categoryGap) + 5)}%` : categoryGap) : categoryGap;
  const barOpacity = dataProperties?.["data.bar.opacity"] || 1;
  const roundCap = dataProperties?.["data.bar.roundCap"] || false;
  const barBorderRadius = dataProperties?.["data.bar.borderRadius"] || 0;

  // Gradient properties
  const gradientEnabled = dataProperties?.["data.gradient.enabled"] || false;
  const gradientDirection = dataProperties?.["data.gradient.direction"] || "vertical";
  const gradientStartColor = dataProperties?.["data.gradient.startColor"] || "#1f77b4";
  const gradientEndColor = dataProperties?.["data.gradient.endColor"] || "#87CEEB";

  // Shadow properties
  const shadowEnabled = dataProperties?.["data.shadow.enabled"] || false;
  const shadowBlur = dataProperties?.["data.shadow.blur"] || 10;
  const shadowOffsetX = dataProperties?.["data.shadow.offsetX"] || 0;
  const shadowOffsetY = dataProperties?.["data.shadow.offsetY"] || 0;
  const shadowColor = dataProperties?.["data.shadow.color"] || "rgba(0,0,0,0.3)";

  // Pattern properties
  const patternEnabled = dataProperties?.["data.pattern.enabled"] || false;
  const patternType = dataProperties?.["data.pattern.type"] || "none";
  const patternColor = dataProperties?.["data.pattern.color"] || "#000";
  const patternSize = dataProperties?.["data.pattern.size"] || 4;

  // Responsive sizing properties
  const chartWidth = dataProperties?.["data.chart.width"] || "100%";
  const chartHeight = dataProperties?.["data.chart.height"] || "100%";
  const maintainAspectRatio = dataProperties?.["data.chart.maintainAspectRatio"] !== false;
  const fitContainer = dataProperties?.["data.chart.fitContainer"] !== false;
  
  // Device-specific minimum sizes
  const minChartWidth = '400px';
  const minChartHeight = '300px';

  // Grid margin properties (adjust margins when labels are shown to prevent overlap)
  const baseLeftMargin = 10;
  const baseRightMargin = 10;
  const baseTopMargin = showTitle ? 15 : 10;
  const baseBottomMargin = showLegend && legendPosition === 'bottom' ? 20 : 10;
  
  // Label margin adjustment when values are shown
  const labelMarginAdjustment = showValues ? 15 : 0;
  const isHorizontal = orientation === "h" || orientation === "horizontal";
  
  const gridLeft = dataProperties?.["data.grid.left"] || (baseLeftMargin + (isHorizontal && showValues ? labelMarginAdjustment : 0));
  const gridRight = dataProperties?.["data.grid.right"] || (baseRightMargin + (isHorizontal && showValues ? labelMarginAdjustment : 0));
  const chartTitleAdjustment = (showChartTitle && chartTitle) ? 5 : 0;
  const gridTop = dataProperties?.["data.grid.top"] || (baseTopMargin + chartTitleAdjustment + (!isHorizontal && showValues ? labelMarginAdjustment : 0));
  const gridBottom = dataProperties?.["data.grid.bottom"] || (baseBottomMargin + (!isHorizontal && showValues ? labelMarginAdjustment : 0));

  // Tooltip properties
  const showTooltip = dataProperties?.["data.tooltip.show"] !== false;
  const tooltipTrigger = dataProperties?.["data.tooltip.trigger"] || "axis";
  const tooltipBgColor = dataProperties?.["data.tooltip.backgroundColor"] || "rgba(50,50,50,0.7)";
  const tooltipBorderColor = dataProperties?.["data.tooltip.borderColor"] || "#777";
  // Tooltip font size
  const baseTooltipFontSize = dataProperties?.["data.tooltip.fontSize"] || 12;
  const tooltipFontSize = baseTooltipFontSize;

  // Third axis (line) properties
  const thirdAxisEnabled = dataProperties?.["data.thirdAxis.enabled"] || false;
  const thirdAxisDataSource = dataProperties?.["data.thirdAxis.dataSource"] || "direct";
  const thirdAxisDataField = dataProperties?.["data.thirdAxis.dataField"] || "";
  const thirdAxisDimensionField = dataProperties?.["data.thirdAxis.dimensionField"] || "";
  const thirdAxisDataElement = dataProperties?.["data.thirdAxis.dataElement"] || "";
  const thirdAxisCalculation = dataProperties?.["data.thirdAxis.calculation"] || "";
  const thirdAxisName = dataProperties?.["data.thirdAxis.name"] || "Line Series";
  const thirdAxisYAxisIndex = parseInt(dataProperties?.["data.thirdAxis.yAxisIndex"] || "1");
  const thirdAxisLineType = dataProperties?.["data.thirdAxis.lineType"] || "solid";
  const thirdAxisLineWidth = dataProperties?.["data.thirdAxis.lineWidth"] || 2;
  const thirdAxisColor = dataProperties?.["data.thirdAxis.color"] || "#ff6b6b";
  const thirdAxisShowSymbol = dataProperties?.["data.thirdAxis.showSymbol"] !== false;
  const thirdAxisSymbolType = dataProperties?.["data.thirdAxis.symbolType"] || "circle";
  const thirdAxisSymbolSize = dataProperties?.["data.thirdAxis.symbolSize"] || 6;
  const thirdAxisSmooth = dataProperties?.["data.thirdAxis.smooth"] || false;
  const thirdAxisShowValues = dataProperties?.["data.thirdAxis.showValues"] || false;
  const thirdAxisYAxisTitle = dataProperties?.["data.thirdAxis.yAxisTitle"] || "";
  const thirdAxisDecimalPlaces = dataProperties?.["data.thirdAxis.decimalPlaces"] || 1;
  const thirdAxisSuffix = dataProperties?.["data.thirdAxis.suffix"] || "";

  const option = useMemo(() => {
    if (!Array.isArray(visualizationData) || visualizationData.length === 0) {
      return {
        backgroundColor: backgroundColor,
        title: {
          text: 'No data available',
          left: 'center',
          top: 'center',
          textStyle: {
            color: '#999',
            fontSize: 16
          }
        }
      };
    }

    // Process data using existing processGraphs function
    const { chartData, allSeries } = processGraphs(visualizationData, {
      order: visualization.order,
      show: visualization.show,
      summarize: visualization.properties?.["summarize"] || false,
      dataProperties: visualization.properties,
      category: category || visualization.properties?.["category"],
      series: series || visualization.properties?.["series"],
      type: "bar",
      metadata: metadata,
      indicators: visualization.indicators,
    });

    if (!chartData || chartData.length === 0) {
      return {
        backgroundColor: backgroundColor,
        title: {
          text: 'No data to display',
          left: 'center',
          top: 'center',
          textStyle: {
            color: '#999',
            fontSize: 16
          }
        }
      };
    }

    // Extract categories and series data
    const categories: string[] = [];
    const seriesData: any[] = [];

    // Handle different data structures from processGraphs
    if (chartData[0]) {
      const isHorizontal = orientation === "h" || orientation === "horizontal";
      const categoryKey = isHorizontal ? "y" : "x";
      const valueKey = isHorizontal ? "x" : "y";

      // Get categories from first trace
      if (chartData[0][categoryKey]) {
        categories.push(...chartData[0][categoryKey]);
      }

      // Format values function
      const formatValue = (value: any) => {
        // Handle null, undefined, or non-numeric values
        if (value === null || value === undefined || value === '') {
          return '0';
        }
        
        // Convert to number if it's not already
        const numericValue = typeof value === 'number' ? value : Number(value);
        
        // Handle NaN values
        if (isNaN(numericValue)) {
          return '0';
        }
        
        let formatted = numericValue.toFixed(decimalPlaces);
        if (showThousandsSeparator) {
          // Apply custom thousands separator
          switch (thousandsSeparatorType) {
            case 'period':
              formatted = Number(formatted).toLocaleString('de-DE', {
                minimumFractionDigits: decimalPlaces,
                maximumFractionDigits: decimalPlaces
              });
              break;
            case 'space':
              formatted = Number(formatted).toLocaleString('fr-FR', {
                minimumFractionDigits: decimalPlaces,
                maximumFractionDigits: decimalPlaces
              });
              break;
            case 'comma':
            default:
              formatted = Number(formatted).toLocaleString('en-US', {
                minimumFractionDigits: decimalPlaces,
                maximumFractionDigits: decimalPlaces
              });
              break;
          }
        }
        return `${valuePrefix}${formatted}${valueSuffix}`;
      };

      // Process each series
      chartData.forEach((trace: any, index: number) => {
        const seriesName = allSeries[index] || trace.name || `Series ${index + 1}`;
        const customName = visualization.properties?.[`data.${seriesName}.name`] || seriesName;
        const customColor = visualization.properties?.[`data.${seriesName}.bg`] || colorway[index % colorway.length];

        // Create gradient if enabled
        let itemStyleColor = customColor;
        if (gradientEnabled) {
          const gradientConfig = {
            type: gradientDirection === 'radial' ? 'radial' : 'linear',
            ...(gradientDirection === 'vertical' && { x: 0, y: 0, x2: 0, y2: 1 }),
            ...(gradientDirection === 'horizontal' && { x: 0, y: 0, x2: 1, y2: 0 }),
            ...(gradientDirection === 'radial' && { x: 0.5, y: 0.5, r: 0.5 }),
            colorStops: [
              { offset: 0, color: gradientStartColor },
              { offset: 1, color: gradientEndColor }
            ]
          };
          itemStyleColor = gradientConfig;
        }

        // Create pattern if enabled (simplified for performance)
        let patternConfig;
        if (patternEnabled && patternType !== 'none') {
          // Create simple pattern effects
          switch (patternType) {
            case 'diagonal':
              patternConfig = {
                color: {
                  image: 'data:image/svg+xml;base64,' + btoa(`
                    <svg width="${patternSize * 4}" height="${patternSize * 4}" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id="diagonal" patternUnits="userSpaceOnUse" width="${patternSize * 2}" height="${patternSize * 2}">
                          <path d="M0,${patternSize * 2} L${patternSize * 2},0" stroke="${patternColor}" stroke-width="1"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#diagonal)"/>
                    </svg>
                  `),
                  repeat: 'repeat'
                }
              };
              break;
            default:
              patternConfig = null;
          }
        }

        // Ensure data array contains only numeric values
        const cleanData = (trace[valueKey] || []).map((val: any) => {
          if (val === null || val === undefined || val === '') {
            return 0;
          }
          const numVal = typeof val === 'number' ? val : Number(val);
          return isNaN(numVal) ? 0 : numVal;
        });

        // Calculate intelligent label properties if enabled
        let labelConfig: any = {
          show: showValues,
          position: valuePosition,
          formatter: (params: any) => formatValue(params.value),
          fontSize: valueFontSize,
          color: valueColor,
          fontWeight: valueFontWeight,
          // Add default spacing to prevent overlap
          padding: [1, 2, 1, 2],
          // Ensure labels don't overflow
          overflow: 'truncate'
        };

        if (intelligentSizing && showValues) {
          // Calculate data range for this series and all existing series
          const allExistingData = seriesData.flatMap(s => s.data || []);
          const allCurrentData = [...allExistingData, ...cleanData];
          const maxVal = Math.max(...allCurrentData.filter(v => typeof v === 'number' && !isNaN(v)));
          const minVal = Math.min(...allCurrentData.filter(v => typeof v === 'number' && !isNaN(v)));
          const range = maxVal - minVal;
          const isHorizontal = orientation === "h" || orientation === "horizontal";
          
          // Improved label configuration to prevent overlapping
          labelConfig = {
            show: (params: any) => {
              const value = params.value;
              const relativeSize = range > 0 ? Math.abs(value - minVal) / range : 1;
              
              // Hide values for extremely tiny bars (less than 3% of range)
              return relativeSize >= 0.03;
            },
            
            position: (params: any) => {
              const value = params.value;
              const relativeSize = range > 0 ? Math.abs(value - minVal) / range : 1;
              
              // Only override position for extremely small bars (< 5% of range) to avoid overlap
              if (relativeSize < 0.05) {
                if (isHorizontal) {
                  return value >= 0 ? 'right' : 'left';
                } else {
                  return value >= 0 ? 'top' : 'bottom';
                }
              }
              
              // For all other bars, respect the user's configured position
              return valuePosition;
            },
            
            fontSize: (params: any) => {
              const value = params.value;
              const relativeSize = range > 0 ? Math.abs(value - minVal) / range : 1;
              
              // Gradual font size reduction based on bar size
              if (relativeSize < 0.05) {
                return Math.max(8, Math.floor(valueFontSize * 0.6));
              } else if (relativeSize < 0.1) {
                return Math.max(9, Math.floor(valueFontSize * 0.7));
              } else if (relativeSize < 0.2) {
                return Math.max(10, Math.floor(valueFontSize * 0.8));
              } else if (relativeSize < 0.4) {
                return Math.max(11, Math.floor(valueFontSize * 0.9));
              }
              
              return valueFontSize;
            },
            
            formatter: (params: any) => {
              const value = params.value;
              const relativeSize = range > 0 ? Math.abs(value - minVal) / range : 1;
              const numValue = typeof value === 'number' ? value : Number(value);
              
              if (isNaN(numValue)) return '0';
              
              // Compact formatting for small bars to prevent overlap
              if (relativeSize < 0.05) {
                if (Math.abs(numValue) >= 1000000000) {
                  return (numValue / 1000000000).toFixed(1) + 'B';
                } else if (Math.abs(numValue) >= 1000000) {
                  return (numValue / 1000000).toFixed(1) + 'M';
                } else if (Math.abs(numValue) >= 1000) {
                  return (numValue / 1000).toFixed(1) + 'K';
                } else {
                  return Math.round(numValue).toString();
                }
              }
              
              // Medium compact for medium bars
              if (relativeSize < 0.15) {
                if (Math.abs(numValue) >= 1000000) {
                  return (numValue / 1000000).toFixed(1) + 'M';
                } else if (Math.abs(numValue) >= 1000) {
                  return (numValue / 1000).toFixed(1) + 'K';
                } else {
                  return numValue.toFixed(0);
                }
              }
              
              // Regular formatting for larger bars
              return formatValue(value);
            },
            
            color: valueColor,
            fontWeight: valueFontWeight,
            padding: [2, 4, 2, 4], // Moderate padding to prevent cramping
            backgroundColor: (params: any) => {
              const value = params.value;
              const relativeSize = range > 0 ? Math.abs(value - minVal) / range : 1;
              // Light background for small outside labels to improve visibility
              return relativeSize < 0.08 && (params.position === 'top' || params.position === 'right') ? 
                'rgba(255, 255, 255, 0.9)' : 'transparent';
            },
            borderRadius: 2,
            borderWidth: 0
          };
        }

        const seriesItem = {
          name: customName,
          type: 'bar' as const,
          stack: stackType !== 'none' ? stackName : undefined,
          data: cleanData,
          barGap: adjustedBarGap,
          barCategoryGap: adjustedCategoryGap,
          barWidth: barWidth === "auto" ? undefined : barWidth,
          itemStyle: {
            color: patternEnabled && patternConfig ? patternConfig.color : itemStyleColor,
            borderWidth: barBorderWidth,
            borderColor: barBorderColor,
            borderRadius: roundCap ? barBorderRadius : 0,
            opacity: barOpacity,
            ...(shadowEnabled && {
              shadowBlur: shadowBlur,
              shadowOffsetX: shadowOffsetX,
              shadowOffsetY: shadowOffsetY,
              shadowColor: shadowColor
            })
          },
          label: labelConfig
        };

        seriesData.push(seriesItem);
      });
    }

    // Add third axis line series if enabled
    if (thirdAxisEnabled && categories.length > 0) {
      
      // Extract line data based on the selected data source type
      const lineData = categories.map(category => {
        // Find the data point for this category
        const dataPoints = visualizationData.filter((item: any) => {
          // Check multiple possible category field names
          const categoryValue = item[visualization.properties?.["category"]] || 
                              item.name || 
                              item.category || 
                              item.ou ||
                              item['ou-name'];
          return categoryValue === category;
        });
        
        
        if (dataPoints.length === 0) return 0;
        
        // Handle different data source types
        switch (thirdAxisDataSource) {
          case 'direct':
            if (!thirdAxisDataField) return 0;
            
            
            // Try multiple approaches to find the value
            for (const point of dataPoints) {
              
              // 1. Direct field access
              if (point[thirdAxisDataField] !== undefined) {
                const value = point[thirdAxisDataField];
                const numValue = typeof value === 'number' ? value : Number(value);
                return isNaN(numValue) ? 0 : numValue;
              }
              
              // 2. Check if it's a series-based field (might need to match series)
              const seriesValue = point[visualization.properties?.["series"]] || point.series;
              if (seriesValue === thirdAxisDataField && point.value !== undefined) {
                const value = point.value;
                const numValue = typeof value === 'number' ? value : Number(value);
                return isNaN(numValue) ? 0 : numValue;
              }
              
              // 3. Check if the field is in the indicator list and this point has that indicator
              if (visualization.indicators.includes(thirdAxisDataField)) {
                // Check various indicator formats
                const indicatorValue = point[`${thirdAxisDataField}_value`] || 
                                     point[`${thirdAxisDataField}.value`] ||
                                     (seriesValue === thirdAxisDataField ? point.value : undefined);
                
                if (indicatorValue !== undefined) {
                  const numValue = typeof indicatorValue === 'number' ? indicatorValue : Number(indicatorValue);
                  return isNaN(numValue) ? 0 : numValue;
                }
              }
            }
            
            break;
            
          case 'dimension':
            if (!thirdAxisDimensionField || !thirdAxisDataElement) return 0;
            
            // Find the data point that matches the selected data element
            const dimensionPoint = dataPoints.find(item => 
              item[thirdAxisDimensionField] === thirdAxisDataElement
            );
            
            if (dimensionPoint && dimensionPoint.value !== undefined) {
              const value = dimensionPoint.value;
              const numValue = typeof value === 'number' ? value : Number(value);
              return isNaN(numValue) ? 0 : numValue;
            }
            break;
            
          case 'calculation':
            if (!thirdAxisCalculation || !thirdAxisCalculation.startsWith('calc:')) return 0;
            
            // Parse calculation: calc:numerator/denominator*100
            const calcParts = thirdAxisCalculation.replace('calc:', '').split('/');
            if (calcParts.length !== 2) return 0;
            
            const numeratorName = calcParts[0];
            const denominatorPart = calcParts[1];
            const denominatorName = denominatorPart.replace('*100', '');
            
            // Find the data points for numerator and denominator
            const numeratorPoint = dataPoints.find(item => {
              const seriesValue = item[visualization.properties?.["series"]] || item.series;
              return seriesValue === numeratorName;
            });
            
            const denominatorPoint = dataPoints.find(item => {
              const seriesValue = item[visualization.properties?.["series"]] || item.series;
              return seriesValue === denominatorName;
            });
            
            if (numeratorPoint && denominatorPoint) {
              const numeratorValue = typeof numeratorPoint.value === 'number' ? numeratorPoint.value : Number(numeratorPoint.value);
              const denominatorValue = typeof denominatorPoint.value === 'number' ? denominatorPoint.value : Number(denominatorPoint.value);
              
              if (!isNaN(numeratorValue) && !isNaN(denominatorValue) && denominatorValue !== 0) {
                const percentage = (numeratorValue / denominatorValue) * 100;
                return percentage;
              }
            }
            break;
        }
        
        return 0;
      });
      

      // Format line values
      const formatLineValue = (value: any) => {
        if (value === null || value === undefined || value === '') {
          return '0';
        }
        
        const numericValue = typeof value === 'number' ? value : Number(value);
        if (isNaN(numericValue)) {
          return '0';
        }
        
        const formatted = numericValue.toFixed(thirdAxisDecimalPlaces);
        return `${formatted}${thirdAxisSuffix}`;
      };

      const lineSeries = {
        name: thirdAxisName,
        type: 'line' as const,
        yAxisIndex: thirdAxisYAxisIndex,
        data: lineData,
        lineStyle: {
          type: thirdAxisLineType,
          width: thirdAxisLineWidth,
          color: thirdAxisColor
        },
        itemStyle: {
          color: thirdAxisColor
        },
        symbol: thirdAxisShowSymbol ? thirdAxisSymbolType : 'none',
        symbolSize: thirdAxisSymbolSize,
        smooth: thirdAxisSmooth,
        label: {
          show: thirdAxisShowValues,
          position: 'top',
          formatter: (params: any) => formatLineValue(params.value),
          fontSize: 10,
          color: thirdAxisColor
        }
      };

      seriesData.push(lineSeries);
    }

    // Handle percentage stacking
    if (stackType === 'percentage' && seriesData.length > 0) {
      const categoryTotals: { [key: string]: number } = {};
      
      // Calculate totals for each category
      categories.forEach((category, catIndex) => {
        categoryTotals[category] = seriesData.reduce((sum, series) => {
          const value = series.data[catIndex];
          const numValue = typeof value === 'number' ? value : Number(value);
          const safeValue = isNaN(numValue) ? 0 : numValue;
          return sum + safeValue;
        }, 0);
      });
      
      // Convert to percentages
      seriesData.forEach(series => {
        series.data = series.data.map((value: any, index: number) => {
          const numValue = typeof value === 'number' ? value : Number(value);
          const safeValue = isNaN(numValue) ? 0 : numValue;
          const total = categoryTotals[categories[index]];
          return total > 0 ? (safeValue / total) * 100 : 0;
        });
      });
    }

    // Configure responsive legend
    const legendConfig: any = {
      show: showLegend,
      type: 'scroll',
      // Responsive legend text styling
      textStyle: {
        fontSize: 12,
      },
      // Responsive item dimensions
      itemWidth: 25,
      itemHeight: 14,
      itemGap: 10,
    };

    switch (legendPosition) {
      case 'top':
        legendConfig.top = '10%';
        legendConfig.left = 'center';
        legendConfig.orient = 'horizontal';
        break;
      case 'bottom':
        legendConfig.bottom = '5%';
        legendConfig.left = 'center';
        legendConfig.orient = 'horizontal';
        break;
      case 'left':
        legendConfig.left = '2%';
        legendConfig.top = 'center';
        legendConfig.orient = 'vertical';
        break;
      case 'right':
        legendConfig.right = '2%';
        legendConfig.top = 'center';
        legendConfig.orient = 'vertical';
        break;
      default:
        legendConfig.bottom = '5%';
        legendConfig.left = 'center';
        legendConfig.orient = 'horizontal';
    }

    const isHorizontal = orientation === "h" || orientation === "horizontal";

    return {
      backgroundColor: backgroundColor,
      title: (showChartTitle && chartTitle) ? {
        text: chartTitle,
        left: chartTitlePosition,
        top: '2%',
        textStyle: {
          fontSize: chartTitleFontSize,
          fontWeight: chartTitleFontWeight,
          color: chartTitleColor
        }
      } : undefined,
      
      tooltip: showTooltip ? {
        trigger: tooltipTrigger,
        axisPointer: {
          type: 'shadow'
        },
        backgroundColor: tooltipBgColor,
        borderColor: tooltipBorderColor,
        borderWidth: 1,
        textStyle: {
          fontSize: tooltipFontSize
        },
        enterable: true,
        padding: [12, 18],
        formatter: (params: any) => {
          const formatValue = (value: any, isLineSeries: boolean = false) => {
            // Handle null, undefined, or non-numeric values
            if (value === null || value === undefined || value === '') {
              return '0';
            }
            
            // Convert to number if it's not already
            const numericValue = typeof value === 'number' ? value : Number(value);
            
            // Handle NaN values
            if (isNaN(numericValue)) {
              return '0';
            }
            
            if (isLineSeries) {
              // Format line series values with their specific formatting
              const formatted = numericValue.toFixed(thirdAxisDecimalPlaces);
              return `${formatted}${thirdAxisSuffix}`;
            } else {
              // Format bar series values with regular formatting
              let formatted = numericValue.toFixed(decimalPlaces);
              if (showThousandsSeparator) {
                // Apply custom thousands separator
                switch (thousandsSeparatorType) {
                  case 'period':
                    formatted = Number(formatted).toLocaleString('de-DE', {
                      minimumFractionDigits: decimalPlaces,
                      maximumFractionDigits: decimalPlaces
                    });
                    break;
                  case 'space':
                    formatted = Number(formatted).toLocaleString('fr-FR', {
                      minimumFractionDigits: decimalPlaces,
                      maximumFractionDigits: decimalPlaces
                    });
                    break;
                  case 'comma':
                  default:
                    formatted = Number(formatted).toLocaleString('en-US', {
                      minimumFractionDigits: decimalPlaces,
                      maximumFractionDigits: decimalPlaces
                    });
                    break;
                }
              }
              return `${valuePrefix}${formatted}${valueSuffix}`;
            }
          };
          
          if (Array.isArray(params)) {
            let result = `<div style="margin-bottom:4px">${params[0].name}</div>`;
            params.forEach((param: any) => {
              const isLineSeries = param.seriesType === 'line';
              const value = formatValue(param.value, isLineSeries);
              result += `<div style="margin:2px 0">
                <span style="display:inline-block;margin-right:4px;border-radius:${isLineSeries ? '0px' : '10px'};width:9px;height:9px;background-color:${param.color}${isLineSeries ? ';border:1px solid ' + param.color : ''}"></span>
                ${param.seriesName}: ${value}
              </div>`;
            });
            return result;
          } else {
            const isLineSeries = params.seriesType === 'line';
            const value = formatValue(params.value, isLineSeries);
            return `<div>${params.name}</div>
                   <div><span style="display:inline-block;margin-right:4px;border-radius:${isLineSeries ? '0px' : '10px'};width:9px;height:9px;background-color:${params.color}${isLineSeries ? ';border:1px solid ' + params.color : ''}"></span>
                   ${params.seriesName}: ${value}</div>`;
          }
        }
      } : undefined,
      
      legend: legendConfig,
      
      grid: {
        show: showGrid,
        left: `${gridLeft}%`,
        right: `${gridRight}%`,
        top: `${gridTop}%`,
        bottom: `${gridBottom}%`,
        containLabel: true
      },
      
      xAxis: {
        type: isHorizontal ? 'value' : 'category',
        data: isHorizontal ? undefined : categories,
        name: xAxisTitle,
        nameLocation: 'middle',
        nameGap: 30,
        axisLabel: {
          rotate: xAxisLabelRotation,
          interval: 0,
          fontSize: 12,
        },
        axisLine: {
          show: true
        },
        axisTick: {
          show: true
        }
      },
      
      yAxis: thirdAxisEnabled ? [
        // Primary Y-axis (left)
        {
          type: isHorizontal ? 'category' : 'value',
          data: isHorizontal ? categories : undefined,
          name: yAxisTitle,
          nameLocation: 'middle',
          nameGap: 50,
          position: 'left',
          axisLabel: {
            rotate: yAxisLabelRotation,
            fontSize: 12,
            formatter: (value: any) => {
              return value;
            },
          },
          axisLine: {
            show: true
          },
          axisTick: {
            show: true
          },
          splitLine: {
            show: showGrid
          }
        },
        // Secondary Y-axis (right) for line
        {
          type: 'value',
          name: thirdAxisYAxisTitle,
          nameLocation: 'middle',
          nameGap: 50,
          position: 'right',
          axisLabel: {
            fontSize: 12,
            formatter: (value: any) => {
              return `${value}${thirdAxisSuffix}`;
            },
          },
          axisLine: {
            show: true,
            lineStyle: {
              color: thirdAxisColor
            }
          },
          axisTick: {
            show: true,
            lineStyle: {
              color: thirdAxisColor
            }
          },
          splitLine: {
            show: false // Don't show grid lines for secondary axis to avoid confusion
          }
        }
      ] : {
        type: isHorizontal ? 'category' : 'value',
        data: isHorizontal ? categories : undefined,
        name: yAxisTitle,
        nameLocation: 'middle',
        nameGap: 50,
        axisLabel: {
          rotate: yAxisLabelRotation,
          fontSize: 12,
          formatter: (value: any) => {
            return value;
          },
        },
        axisLine: {
          show: true
        },
        axisTick: {
          show: true
        },
        splitLine: {
          show: showGrid
        }
      },
      
      series: seriesData,
      
      animation: true,
      animationDuration: animationDuration,
      animationEasing: animationEasing,
      animationDelay: animationDelay,
      animationDurationUpdate: animateOnUpdate ? animationDuration : 0
    };
  }, [visualizationData, visualization, category, series, metadata, title, showTitle, 
      backgroundColor, orientation, barMode, showLegend, legendPosition, showGrid, 
      showValues, colorway, stackType, stackName, decimalPlaces, showThousandsSeparator, thousandsSeparatorType,
      valuePrefix, valueSuffix, valuePosition, valueFontSize, valueColor, valueFontWeight, intelligentSizing, minBarSizePercent,
      animationDuration, animationEasing, animationDelay, animateOnUpdate, xAxisTitle, yAxisTitle,
      xAxisLabelRotation, yAxisLabelRotation, barWidth, barBorderWidth, barBorderColor,
      barGap, categoryGap, barOpacity, roundCap, barBorderRadius, gradientEnabled,
      gradientDirection, gradientStartColor, gradientEndColor, shadowEnabled, shadowBlur,
      shadowOffsetX, shadowOffsetY, shadowColor, patternEnabled, patternType, patternColor,
      patternSize, showTooltip, tooltipTrigger, tooltipBgColor, tooltipBorderColor, tooltipFontSize,
      chartWidth, chartHeight, maintainAspectRatio, fitContainer, gridLeft, gridRight, gridTop, gridBottom,
      chartTitle, showChartTitle, chartTitleFontSize, chartTitleColor, chartTitlePosition, chartTitleFontWeight,
      thirdAxisEnabled, thirdAxisDataSource, thirdAxisDataField, thirdAxisDimensionField, thirdAxisDataElement, 
      thirdAxisCalculation, thirdAxisName, thirdAxisYAxisIndex, thirdAxisLineType, thirdAxisLineWidth,
      thirdAxisColor, thirdAxisShowSymbol, thirdAxisSymbolType, thirdAxisSymbolSize, thirdAxisSmooth, thirdAxisShowValues,
      thirdAxisYAxisTitle, thirdAxisDecimalPlaces, thirdAxisSuffix]);

  // Calculate responsive chart style based on sizing properties
  const chartStyle = {
    width: fitContainer ? "100%" : (chartWidth || "400px"),
    height: fitContainer ? "100%" : (chartHeight || "300px"),
    minWidth: fitContainer ? minChartWidth : undefined,
    minHeight: fitContainer ? minChartHeight : undefined,
    overflow: "hidden",
    display: "block",
    maxWidth: fitContainer ? '100%' : 'none',
  };

  return (
    <Stack 
      h={fitContainer ? "100%" : "auto"} 
      spacing={0} 
      w={fitContainer ? "100%" : "auto"} 
      overflow="hidden"
      alignItems={fitContainer ? "stretch" : "flex-start"}
      justifyContent={fitContainer ? "stretch" : "flex-start"}
    >
      {showTitle && title && (
        <VisualizationTitle section={section} title={title} />
      )}
      <Stack 
        flex={fitContainer ? 1 : "none"} 
        w={fitContainer ? "100%" : chartWidth || "400px"} 
        h={fitContainer ? "100%" : chartHeight || "300px"}
        minH={fitContainer ? minChartHeight : undefined}
        overflow="hidden"
        alignItems="stretch"
        justifyContent="stretch"
        position="relative"
        p={0}
      >
        <ReactECharts
          option={option}
          style={chartStyle}
          opts={{ 
            renderer: 'canvas',
            width: 'auto',
            height: 'auto',
            // Enhanced device pixel ratio for crisp rendering on all devices
            devicePixelRatio: Math.min(window.devicePixelRatio || 1, 3), // Cap at 3x for performance
            // Responsive locale for number formatting
            locale: 'en',
          }}
        />
      </Stack>
    </Stack>
  );
};

export default BarGraph;