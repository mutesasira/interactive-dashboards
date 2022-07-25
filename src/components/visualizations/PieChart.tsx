import { Stack, Text } from "@chakra-ui/react";
import { useStore } from "effector-react";
import React from "react";
import Plot from "react-plotly.js";

import { IVisualization } from "../../interfaces";
import { $visualizationData, $visualizationMetadata } from "../../Store";
import { exclusions } from "../../utils/utils";
import { processPieChart } from "../processors";

type PieChartProps = {
  visualization: IVisualization;
  labels?: string;
  values?: string;
  layoutProperties?: { [key: string]: any };
  dataProperties?: { [key: string]: any };
};

const PieChart = ({
  visualization,
  labels,
  values,
  dataProperties,
}: PieChartProps) => {
  const visualizationData = useStore($visualizationData);
  const metadata = useStore($visualizationMetadata);
  const data = visualizationData[visualization.id]
    ? visualizationData[visualization.id]
    : [];
  const titleFontSize = dataProperties?.["data.title.fontsize"] || "1.5vh";
  const titleCase = dataProperties?.["data.title.case"] || "uppercase";
  const titleColor = dataProperties?.["data.title.color"] || "black";
  return (
    <Stack w="100%" h="100%">
      {visualization.name && (
        <Text
          textAlign="center"
          fontSize={titleFontSize}
          textTransform={titleCase}
          color={titleColor}
        >
          {visualization.name}
        </Text>
      )}
      <Stack h="100%" w="100%" flex={1}>
        <Plot
          data={processPieChart(
            data,
            labels,
            values,
            metadata[visualization.id]
          )}
          layout={{
            margin: {
              pad: 0,
              r: 0,
              t: 0,
              l: 0,
              b: 0,
            },
            autosize: true,
            showlegend: false,
          }}
          style={{ width: "100%", height: "100%" }}
          config={{
            displayModeBar: true,
            responsive: true,
            toImageButtonOptions: {
              format: "svg",
              scale: 1,
            },
            modeBarButtonsToRemove: exclusions,
            displaylogo: false,
          }}
        />
      </Stack>
    </Stack>
  );
};

export default PieChart;
