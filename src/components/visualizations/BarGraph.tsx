// import { Stack, Text } from "@chakra-ui/react";
// import { useSearch } from "@tanstack/react-location";
// import { useStore } from "effector-react";
// import isEmpty from "lodash/isEmpty";
// import update from "lodash/update";
// import Plot from "react-plotly.js";
// import { ChartProps, LocationGenerics } from "../../interfaces";
// import { $visualizationMetadata } from "../../Store";
// import { exclusions } from "../../utils/utils";
// import { processGraphs } from "../processors";
// import VisualizationTitle from "./VisualizationTitle";

// interface BarGraphProps extends ChartProps {
//   category?: string;
//   series?: string;
// }

// const BarGraph = ({
//   visualization,
//   category,
//   series,
//   layoutProperties,
//   section,
//   data,
// }: BarGraphProps) => {
//   const metadata = useStore($visualizationMetadata)[visualization.id];
//   const { downloadable } = useSearch<LocationGenerics>();
//   let availableProperties: { [key: string]: any } = {
//     layout: {
//       legend: { x: 0.5, y: -0.1, orientation: "h" },
//       yaxis: { automargin: true },
//       colorway: [
//         "#1f77b4",
//         "#ff7f0e",
//         "#2ca02c",
//         "#d62728",
//         "#9467bd",
//         "#8c564b",
//         "#e377c2",
//         "#7f7f7f",
//         "#bcbd22",
//       ],
//     },
//   };
//   Object.entries(layoutProperties || {}).forEach(([property, value]) => {
//     update(availableProperties, property, () => value);
//   });
//   const colors = availableProperties.layout.colorway;
//   const { chartData, allSeries } = processGraphs(data, {
//     order: visualization.order,
//     show: visualization.show,
//     summarize: visualization.properties?.["summarize"] || false,
//     dataProperties: visualization.properties,
//     category: category,
//     series: series,
//     type: "bar",
//     metadata: metadata,
//     indicators: visualization.indicators,
//   });
//   console.log("Albert:", visualization.properties);
//   if (series) {
//     const combined = allSeries.map((s, i) => ({
//       series: s,
//       trace: chartData[i],
//       pos: (visualization.properties?.[`${s}.position`] as number) || 0,
//     }));
//     combined.sort((a, b) => a.pos - b.pos);
//     chartData.splice(0, chartData.length, ...combined.map((c) => c.trace));
//     allSeries.splice(0, allSeries.length, ...combined.map((c) => c.series));
//   }

//   return (
//     <Stack h="100%" spacing={0} w="100%">
//       {((visualization.showTitle !== undefined &&
//         visualization.showTitle === true &&
//         visualization.name) ||
//         (visualization.showTitle === undefined && visualization.name)) && (
//         <VisualizationTitle section={section} title={visualization.name} />
//       )}
//       <Stack direction="column" spacing={0} w="100%" h="100%">
//         <Stack flex={1} spacing={0}>
//           <Stack flex="1 1 0" minH={0} spacing={0} overflow="hidden">
//             <Plot
//               useResizeHandler
//               data={chartData as any}
//               layout={{
//                 margin: {
//                   pad: 5,
//                   r: 10,
//                   t: 0,
//                   l: 50,
//                   b: 0,
//                 },
//                 autosize: true,
//                 showlegend: false,
//                 ...availableProperties.layout,

//                 xaxis: {
//                   automargin: true,
//                   showgrid: false,
//                   type: "linear",
//                 },
//                 yaxis: {
//                   automargin: true,
//                   type: "category",
//                   labels: { rotate: 0 },
//                 },

//                 // 2) horizontal bars → numeric on X, categories on Y in the exact order
//               }}
//               style={{ width: "100%", height: "100%" }}
//               config={{
//                 displayModeBar: true,
//                 responsive: true,
//                 toImageButtonOptions: {
//                   format: "svg",
//                   scale: 1,
//                 },

//                 modeBarButtonsToRemove: exclusions,
//                 displaylogo: false,
//               }}
//             />
//           </Stack>
//         </Stack>
//         <Stack direction="row" spacing="20px" justify="center" h="50px">
//           {allSeries
//             .filter((v) => !isEmpty(v))
//             .map((series, index) => (
//               <Stack
//                 direction="row"
//                 spacing="2px"
//                 alignItems="center"
//                 key={index}
//               >
//                 <Text
//                   bgColor={
//                     visualization.properties?.[`${series}.bg`] || colors[index]
//                   }
//                   w="10px"
//                   h="10px"
//                 >
//                   &nbsp;
//                 </Text>
//                 <Text noOfLines={[1, 2, 3]}>
//                   {visualization.properties?.[`${series}.name`] || series}
//                 </Text>
//               </Stack>
//             ))}
//         </Stack>
//       </Stack>
//     </Stack>
//   );
// };

// export default BarGraph;

// BarGraph.tsx
import { Stack, Text } from "@chakra-ui/react";
import { useSearch } from "@tanstack/react-location";
import { useStore } from "effector-react";
import isEmpty from "lodash/isEmpty";
import update from "lodash/update";
import Plot from "react-plotly.js";
import { ChartProps, LocationGenerics } from "../../interfaces";
import { $visualizationMetadata } from "../../Store";
import { exclusions } from "../../utils/utils";
import { processGraphs } from "../processors";
import VisualizationTitle from "./VisualizationTitle";
import uniq from "lodash/uniq";

interface BarGraphProps extends ChartProps {
  category?: string;
  series?: string;
}

const BarGraph = ({
  visualization,
  category,
  series,
  layoutProperties,
  section,
  data,
}: BarGraphProps) => {
  const metadata = useStore($visualizationMetadata)[visualization.id];
  const { downloadable } = useSearch<LocationGenerics>();

  let availableProperties: any = {
    layout: {
      legend: { x: 0.5, y: -0.1, orientation: "h" },
      yaxis: { automargin: true },
      colorway: [
        "#1f77b4",
        "#ff7f0e",
        "#2ca02c",
        "#d62728",
        "#9467bd",
        "#8c564b",
        "#e377c2",
        "#7f7f7f",
        "#bcbd22",
      ],
    },
  };
  Object.entries(layoutProperties || {}).forEach(([p, v]) =>
    update(availableProperties, p, () => v)
  );

  const { chartData, allSeries } = processGraphs(data, {
    order: visualization.order,
    show: visualization.show,
    summarize: visualization.properties?.["summarize"] || false,
    dataProperties: visualization.properties,
    category,
    series,
    type: "bar",
    metadata,
    indicators: visualization.indicators,
  });
  if (series) {
    const combined = allSeries.map((s, i) => ({
      name: s,
      trace: chartData[i],
      pos: Number(visualization.properties?.[`data.${s}.position`] ?? 0),
    }));
    // console.log(
    //   "🔍 series before:",
    //   combined.map((c) => c.name + "=" + c.pos)
    // );
    // combined.sort((a, b) => a.pos - b.pos);
    // console.log(
    //   "🔍 series after: ",
    //   combined.map((c) => c.name + "=" + c.pos)
    // );
    chartData.splice(0, chartData.length, ...combined.map((c) => c.trace));
    allSeries.splice(0, allSeries.length, ...combined.map((c) => c.name));
  }

  let orderedCats: string[] | undefined;
  if (category && chartData.length) {
    const isHorizontal =
      availableProperties.data?.orientation === "h" ||
      availableProperties.data?.orientation === "horizontal";

    const catKey = isHorizontal ? "y" : "x";
    const valKey = isHorizontal ? "x" : "y";

    const originalCats = [...(chartData[0][catKey] as string[])];
    // console.log(`🔍 axis: ${catKey} rawCats:`, originalCats);

    orderedCats = originalCats
      .map((cat, idx) => {
        const raw = visualization.properties?.[`data.${cat}.position`];
        const pos = raw != null ? Number(raw) : idx;
        // console.log(`🔍 ${cat} → raw=${String(raw)} pos=${pos}`);
        return { cat, pos };
      })
      .sort((a, b) => a.pos - b.pos)
      .map((o) => o.cat);

    // console.log("🔍 orderedCats:", orderedCats);

    chartData.forEach((trace: any) => {
      if (Array.isArray(trace[catKey]) && Array.isArray(trace[valKey])) {
        const newCats: any[] = [];
        const newVals: any[] = [];
        orderedCats!.forEach((cat) => {
          const i = originalCats.indexOf(cat);
          if (i !== -1) {
            newCats.push(trace[catKey][i]);
            newVals.push(trace[valKey][i]);
          }
        });
        trace[catKey] = newCats;
        trace[valKey] = newVals;
      }
    });
  }

  return (
    <Stack h="100%" spacing={0} w="100%">
      {visualization.name && visualization.showTitle !== false && (
        <VisualizationTitle section={section} title={visualization.name} />
      )}
      <Stack direction="column" spacing={0} w="100%" h="100%">
        <Stack flex={1} spacing={0}>
          <Stack flex="1 1 0" minH={0} spacing={0} overflow="hidden">
            <Plot
              useResizeHandler
              data={chartData as any}
              layout={{
                margin: { pad: 5, r: 10, t: 0, l: 50, b: 0 },
                autosize: true,
                showlegend: false,
                ...availableProperties.layout,
                xaxis: {
                  automargin: true,
                  showgrid: false,
                  type: "linear",
                },
                yaxis: {
                  ...availableProperties.layout.yaxis,
                  categoryorder: orderedCats ? "array" : undefined,
                  categoryarray: orderedCats,
                },
              }}
              style={{ width: "100%", height: "100%" }}
              config={{
                displayModeBar: true,
                responsive: true,
                toImageButtonOptions: { format: "svg", scale: 1 },
                modeBarButtonsToRemove: exclusions,
                displaylogo: false,
              }}
            />
          </Stack>
        </Stack>
        <Stack direction="row" spacing="20px" justify="center" h="50px">
          {allSeries
            .filter((v) => !isEmpty(v))
            .map((s, i) => (
              <Stack direction="row" spacing="2px" align="center" key={i}>
                <Text
                  bgColor={
                    visualization.properties?.[`${s}.bg`] ||
                    availableProperties.layout.colorway[i]
                  }
                  w="10px"
                  h="10px"
                />
                <Text noOfLines={[1, 2, 3]}>
                  {visualization.properties?.[`${s}.name`] || s}
                </Text>
              </Stack>
            ))}
        </Stack>
      </Stack>
    </Stack>
  );
};

export default BarGraph;
