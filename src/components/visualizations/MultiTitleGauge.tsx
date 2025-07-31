import React, { useMemo } from "react";
import { useStore } from "effector-react";
import * as echarts from "echarts";
import ReactECharts from "echarts-for-react";
import { ChartProps } from "../../interfaces";
import { $visualizationData } from "../../Store";

const MultiTitleGauge = ({
    dataProperties,
    layoutProperties,
    visualization,
    section,
}: ChartProps) => {
    const vizData = useStore($visualizationData)[visualization.id] || [];

    // Extract properties with defaults
    const title = dataProperties?.["data.title"] || "Multi Title Gauge";
    const subTitle = dataProperties?.["data.subTitle"] || "";
    const backgroundColor = layoutProperties?.["layout.backgroundColor"] || "transparent";
    const titleColor = dataProperties?.["data.title.color"] || "#333";
    const titleFontSize = dataProperties?.["data.title.fontSize"] || 18;
    const titleFontWeight = dataProperties?.["data.title.fontWeight"] || "bold";
    
    // Gauge specific properties
    const gaugeRadius = dataProperties?.["data.gauge.radius"] || "75%";
    const gaugeStartAngle = dataProperties?.["data.gauge.startAngle"] || 225;
    const gaugeEndAngle = dataProperties?.["data.gauge.endAngle"] || -45;
    const gaugeClockwise = dataProperties?.["data.gauge.clockwise"] !== false;
    const gaugeMin = dataProperties?.["data.gauge.min"] || 0;
    const gaugeMax = dataProperties?.["data.gauge.max"] || 100;
    const gaugeSplitNumber = dataProperties?.["data.gauge.splitNumber"] || 10;
    
    // Axis line properties
    const axisLineShow = dataProperties?.["data.axisLine.show"] !== false;
    const axisLineWidth = dataProperties?.["data.axisLine.lineStyle.width"] || 30;
    const axisLineColor = dataProperties?.["data.axisLine.lineStyle.color"] || [
        [0.3, '#67e0e3'],
        [0.7, '#37a2da'],
        [1, '#fd666d']
    ];
    
    // Split line properties
    const splitLineShow = dataProperties?.["data.splitLine.show"] !== false;
    const splitLineLength = dataProperties?.["data.splitLine.length"] || 30;
    const splitLineWidth = dataProperties?.["data.splitLine.lineStyle.width"] || 4;
    const splitLineColor = dataProperties?.["data.splitLine.lineStyle.color"] || "#eee";
    
    // Tick properties
    const axisTickShow = dataProperties?.["data.axisTick.show"] !== false;
    const axisTickLength = dataProperties?.["data.axisTick.length"] || 8;
    const axisTickWidth = dataProperties?.["data.axisTick.lineStyle.width"] || 2;
    const axisTickColor = dataProperties?.["data.axisTick.lineStyle.color"] || "#eee";
    
    // Label properties
    const axisLabelShow = dataProperties?.["data.axisLabel.show"] !== false;
    const axisLabelColor = dataProperties?.["data.axisLabel.color"] || "#666";
    const axisLabelFontSize = dataProperties?.["data.axisLabel.fontSize"] || 12;
    const axisLabelDistance = dataProperties?.["data.axisLabel.distance"] || 40;
    
    // Pointer properties
    const pointerShow = dataProperties?.["data.pointer.show"] !== false;
    const pointerLength = dataProperties?.["data.pointer.length"] || "60%";
    const pointerWidth = dataProperties?.["data.pointer.width"] || 6;
    const pointerColor = dataProperties?.["data.pointer.itemStyle.color"] || "#37a2da";
    
    // Detail properties (center value display)
    const detailShow = dataProperties?.["data.detail.show"] !== false;
    const detailOffsetCenter = dataProperties?.["data.detail.offsetCenter"] || [0, '40%'];
    const detailFontSize = dataProperties?.["data.detail.fontSize"] || 30;
    const detailFontWeight = dataProperties?.["data.detail.fontWeight"] || "bold";
    const detailColor = dataProperties?.["data.detail.color"] || "#333";
    const detailFormatter = dataProperties?.["data.detail.formatter"] || "{value}%";
    
    // Animation properties
    const animationDuration = dataProperties?.["data.animation.duration"] || 1000;
    const animationEasing = dataProperties?.["data.animation.easing"] || "cubicOut";
    
    // Progress properties
    const progressShow = dataProperties?.["data.progress.show"] || false;
    const progressWidth = dataProperties?.["data.progress.width"] || 18;
    const progressColor = dataProperties?.["data.progress.itemStyle.color"] || "#37a2da";
    
    // Anchor properties
    const anchorShow = dataProperties?.["data.anchor.show"] || false;
    const anchorSize = dataProperties?.["data.anchor.size"] || 6;
    const anchorColor = dataProperties?.["data.anchor.itemStyle.color"] || "#fff";
    
    const option = useMemo(() => {
        // Process data for multiple gauges
        const processedData = Array.isArray(vizData) && vizData.length > 0 
            ? vizData.map((item, index) => {
                const value = parseFloat(item.value) || parseFloat(item.Value) || 0;
                const name = item['dx-name'] || item['dx_name'] || item.indicator || item.name || `Gauge ${index + 1}`;
                
                return {
                    value: value,
                    name: name,
                    title: {
                        offsetCenter: [0, `${-40 - (index * 20)}%`],
                        fontSize: 14,
                        color: titleColor
                    },
                    detail: {
                        valueAnimation: true,
                        offsetCenter: [0, `${20 + (index * 20)}%`],
                        fontSize: detailFontSize - (index * 2),
                        fontWeight: detailFontWeight,
                        color: detailColor,
                        formatter: detailFormatter
                    }
                };
            })
            : [{ value: 0, name: "No Data" }];

        return {
            backgroundColor: backgroundColor,
            title: {
                text: title,
                subtext: subTitle,
                left: 'center',
                top: '5%',
                textStyle: {
                    color: titleColor,
                    fontSize: titleFontSize,
                    fontWeight: titleFontWeight
                }
            },
            series: [{
                name: 'Multi Title Gauge',
                type: 'gauge',
                radius: gaugeRadius,
                startAngle: gaugeStartAngle,
                endAngle: gaugeEndAngle,
                clockwise: gaugeClockwise,
                min: gaugeMin,
                max: gaugeMax,
                splitNumber: gaugeSplitNumber,
                
                axisLine: {
                    show: axisLineShow,
                    lineStyle: {
                        width: axisLineWidth,
                        color: Array.isArray(axisLineColor) ? axisLineColor : [
                            [0.3, '#67e0e3'],
                            [0.7, '#37a2da'],
                            [1, '#fd666d']
                        ]
                    }
                },
                
                splitLine: {
                    show: splitLineShow,
                    length: splitLineLength,
                    lineStyle: {
                        width: splitLineWidth,
                        color: splitLineColor
                    }
                },
                
                axisTick: {
                    show: axisTickShow,
                    length: axisTickLength,
                    lineStyle: {
                        width: axisTickWidth,
                        color: axisTickColor
                    }
                },
                
                axisLabel: {
                    show: axisLabelShow,
                    color: axisLabelColor,
                    fontSize: axisLabelFontSize,
                    distance: axisLabelDistance,
                    formatter: function(value: number) {
                        return value.toString();
                    }
                },
                
                pointer: {
                    show: pointerShow,
                    length: pointerLength,
                    width: pointerWidth,
                    itemStyle: {
                        color: pointerColor
                    }
                },
                
                progress: {
                    show: progressShow,
                    width: progressWidth,
                    itemStyle: {
                        color: progressColor
                    }
                },
                
                anchor: {
                    show: anchorShow,
                    size: anchorSize,
                    itemStyle: {
                        color: anchorColor,
                        borderWidth: 2,
                        borderColor: pointerColor
                    }
                },
                
                detail: {
                    show: detailShow,
                    offsetCenter: detailOffsetCenter,
                    fontSize: detailFontSize,
                    fontWeight: detailFontWeight,
                    color: detailColor,
                    formatter: detailFormatter,
                    valueAnimation: true
                },
                
                data: processedData,
                
                animation: true,
                animationDuration: animationDuration,
                animationEasing: animationEasing
            }],
            
            tooltip: {
                trigger: 'item',
                formatter: function(params: any) {
                    return `${params.data.name}: ${params.data.value}`;
                }
            }
        };
    }, [vizData, dataProperties, layoutProperties, title, subTitle, backgroundColor, titleColor, titleFontSize, titleFontWeight,
        gaugeRadius, gaugeStartAngle, gaugeEndAngle, gaugeClockwise, gaugeMin, gaugeMax, gaugeSplitNumber,
        axisLineShow, axisLineWidth, axisLineColor, splitLineShow, splitLineLength, splitLineWidth, splitLineColor,
        axisTickShow, axisTickLength, axisTickWidth, axisTickColor, axisLabelShow, axisLabelColor, axisLabelFontSize, axisLabelDistance,
        pointerShow, pointerLength, pointerWidth, pointerColor, detailShow, detailOffsetCenter, detailFontSize, detailFontWeight, detailColor, detailFormatter,
        animationDuration, animationEasing, progressShow, progressWidth, progressColor, anchorShow, anchorSize, anchorColor]);

    return (
        <ReactECharts
            option={option}
            style={{ width: "100%", height: "100%" }}
            opts={{ renderer: 'canvas' }}
        />
    );
};

export default MultiTitleGauge;