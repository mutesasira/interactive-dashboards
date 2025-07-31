import {
  Checkbox,
  Input,
  Radio,
  RadioGroup,
  Stack,
  Tab,
  Table,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { GroupBase, Select } from "chakra-react-select";
import { useStore } from "effector-react";
import { flatten, isArray, uniq } from "lodash";
import { ChangeEvent } from "react";
import { sectionApi } from "../../Events";
import { IVisualization, Option } from "../../interfaces";
import { $visualizationData, $visualizationMetadata } from "../../Store";
import { customComponents } from "../../utils/components";
import {
  chartTypes,
  colors,
  createOptions,
  findUniqValue,
} from "../../utils/utils";
import Scrollable from "../Scrollable";
import SelectProperty from "./SelectProperty";
import SwitchProperty from "./SwitchProperty";
import TextProperty from "./TextProperty";
import ColorProperty from "./ColorProperty";
import NumberProperty from "./NumberProperty";

const barModes = createOptions(["stack", "group", "overlay", "relative"]);

const BarGraphProperties = ({
  visualization,
}: {
  visualization: IVisualization;
}) => {
  const visualizationData = flatten(
    useStore($visualizationData)[visualization.id] || []
  );
  const metadata = useStore($visualizationMetadata)[visualization.id];
  const columns: Option[] = createOptions(
    uniq(flatten(visualizationData.map((d) => Object.keys(d))))
  );

  // Create options for data elements/indicators available in the visualization
  const dataElementOptions: Option[] = visualization.indicators.map(indicator => ({
    label: indicator,
    value: indicator,
    id: indicator
  }));

  // Combine regular columns with data elements
  const allFieldOptions: Option[] = [
    ...columns,
    ...dataElementOptions
  ];

  // Debug logging to see what options are available
  console.log('BarGraph visualization indicators:', visualization.indicators);
  console.log('BarGraph data element options:', dataElementOptions);
  console.log('BarGraph all field options:', allFieldOptions);

  const specificValues: string[] = visualization.properties["specific"] || [];

  return (
    <Stack>
      <Checkbox
        isChecked={visualization.showTitle}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          sectionApi.changeVisualizationAttribute({
            visualization: visualization.id,
            attribute: "showTitle",
            value: e.target.checked,
          });
        }}
      >
        Show Title
      </Checkbox>
      <SwitchProperty
        attribute="summarize"
        visualization={visualization}
        title="Summarize"
      />

      <SelectProperty
        attribute="category"
        visualization={visualization}
        title="Category"
        options={columns}
      />

      {visualization.properties["category"] && (
        <Scrollable height={"300px"}>
          <Table variant="unstyled">
            <Thead>
              <Tr>
                <Th>Column</Th>
                <Th>Rename</Th>
                <Th>Color</Th>
                <Th>Order</Th>
              </Tr>
            </Thead>
            <Tbody>
              {findUniqValue(
                visualizationData,
                visualization.properties["category"]
              ).map((row) => (
                <Tr key={row}>
                  <Td>{row}</Td>
                  <Td>
                    <TextProperty
                      visualization={visualization}
                      title=""
                      attribute={`data.${row}.name`}
                    />
                  </Td>
                  <Td w="50px">
                    <ColorProperty
                      visualization={visualization}
                      title=""
                      attribute={`data.${row}.bg`}
                    />
                  </Td>
                  <Td w="100px">
                    <NumberProperty
                      visualization={visualization}
                      title=""
                      attribute={`data.${row}.position`}
                      min={0}
                      step={1}
                      size="sm"
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Scrollable>
      )}
      <SelectProperty
        attribute="series"
        visualization={visualization}
        title="Traces"
        options={columns}
      />

      {visualization.properties["series"] && (
        <Scrollable height={"300px"}>
          <Table variant="unstyled">
            <Thead>
              <Tr>
                <Th></Th>
                <Th>Column</Th>
                <Th>Rename</Th>
                <Th>Color</Th>
                <Th>Order</Th>
              </Tr>
            </Thead>
            <Tbody>
              {findUniqValue(
                visualizationData,
                visualization.properties["series"]
              ).map((row) => (
                <Tr key={row}>
                  <Td>
                    <Checkbox
                      isChecked={specificValues.indexOf(row) !== -1}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        if (e.target.checked) {
                          sectionApi.changeVisualizationProperties({
                            visualization: visualization.id,
                            attribute: "specific",
                            value: [...specificValues, row],
                          });
                        } else {
                          sectionApi.changeVisualizationProperties({
                            visualization: visualization.id,
                            attribute: "specific",
                            value: specificValues.filter((i) => i !== row),
                          });
                        }
                      }}
                    />
                  </Td>
                  <Td>{row}</Td>
                  <Td w="300px">
                    <TextProperty
                      visualization={visualization}
                      title=""
                      attribute={`data.${row}.name`}
                    />
                  </Td>
                  <Td w="50px">
                    <ColorProperty
                      visualization={visualization}
                      title=""
                      attribute={`data.${row}.bg`}
                    />
                  </Td>
                  <Td w="100px">
                    <NumberProperty
                      visualization={visualization}
                      title=""
                      attribute={`data.${row}.position`}
                      min={0}
                      step={1}
                      size="sm"
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Scrollable>
      )}
      <Stack direction="row" alignItems="center">
        <SwitchProperty
          attribute="percentages"
          visualization={visualization}
          title="Percentages"
          direction="row-reverse"
        />
        <SwitchProperty
          attribute="overall"
          visualization={visualization}
          title="Overall"
          direction="row-reverse"
        />
      </Stack>

      <SelectProperty
        attribute="layout.barmode"
        visualization={visualization}
        title="Bar Mode"
        options={barModes}
      />

      <Stack>
        <Text>Orientation</Text>
        <RadioGroup
          onChange={(e: string) =>
            sectionApi.changeVisualizationProperties({
              visualization: visualization.id,
              attribute: "data.orientation",
              value: e,
            })
          }
          value={visualization.properties["data.orientation"]}
        >
          <Stack direction="row">
            <Radio value="h">Horizontal</Radio>
            <Radio value="v">Vertical</Radio>
          </Stack>
        </RadioGroup>
      </Stack>
      <Text>Bar Graph Colors</Text>
      <Select<Option, false, GroupBase<Option>>
        value={colors.find((pt) => {
          if (
            visualization.properties["layout.colorway"] &&
            isArray(visualization.properties["layout.colorway"])
          ) {
            return (
              visualization.properties["layout.colorway"].join(",") === pt.value
            );
          }
          return false;
        })}
        onChange={(e) => {
          const val = e?.value || "";
          sectionApi.changeVisualizationProperties({
            visualization: visualization.id,
            attribute: "layout.colorway",
            value: val.split(","),
          });
        }}
        options={colors}
        isClearable
        components={customComponents}
        menuPlacement="auto"
        size="sm"
      />

      <Text>Legend</Text>
      <Stack>
        <Text>X-Anchor</Text>
        <RadioGroup
          onChange={(e: string) =>
            sectionApi.changeVisualizationProperties({
              visualization: visualization.id,
              attribute: "layout.legend.xanchor",
              value: e,
            })
          }
          value={visualization.properties["layout.legend.xanchor"]}
        >
          <Stack direction="row">
            <Radio value="auto">Auto</Radio>
            <Radio value="right">Left</Radio>
            <Radio value="left">Right</Radio>
            <Radio value="center">Center</Radio>
          </Stack>
        </RadioGroup>
      </Stack>

      <Stack>
        <Text>Y-Anchor</Text>
        <RadioGroup
          onChange={(e: string) =>
            sectionApi.changeVisualizationProperties({
              visualization: visualization.id,
              attribute: "layout.legend.yanchor",
              value: e,
            })
          }
          value={visualization.properties["layout.legend.yanchor"]}
        >
          <Stack direction="row">
            <Radio value="auto">Auto</Radio>
            <Radio value="top">Top</Radio>
            <Radio value="bottom">Bottom</Radio>
            <Radio value="middle">Middle</Radio>
          </Stack>
        </RadioGroup>
      </Stack>

      <Stack>
        <Text>Y-Axis Title</Text>
        <Input
          value={visualization.properties["data.yAxis.title"]}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            sectionApi.changeVisualizationProperties({
              visualization: visualization.id,
              attribute: "data.yAxis.title",
              value: e.target.value,
            })
          }
          size="sm"
        />
      </Stack>

      <Stack>
        <Text>X-Axis Title</Text>
        <Input
          value={visualization.properties["data.xAxis.title"]}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            sectionApi.changeVisualizationProperties({
              visualization: visualization.id,
              attribute: "data.xAxis.title",
              value: e.target.value,
            })
          }
          size="sm"
        />
      </Stack>

      {/* Legend Settings */}
      <Text fontWeight="bold" fontSize="md" color="blue.600">Legend Settings</Text>

      <SwitchProperty
        attribute="data.showLegend"
        visualization={visualization}
        title="Show Legend"
      />

      <SelectProperty
        attribute="data.legend.position"
        visualization={visualization}
        title="Legend Position"
        options={[
          { label: "Top", value: "top" },
          { label: "Bottom", value: "bottom" },
          { label: "Left", value: "left" },
          { label: "Right", value: "right" }
        ]}
      />

      {/* Grid and Visual Settings */}
      <Text fontWeight="bold" fontSize="md" color="blue.600">Visual Settings</Text>

      <SwitchProperty
        attribute="data.grid.show"
        visualization={visualization}
        title="Show Grid"
      />

      <SwitchProperty
        attribute="data.showValues"
        visualization={visualization}
        title="Show Values on Bars"
      />

      <ColorProperty
        title="Background Color"
        attribute="layout.backgroundColor"
        visualization={visualization}
      />

      {/* Bar Settings */}
      <Text fontWeight="bold" fontSize="md" color="blue.600">Bar Settings</Text>

      <TextProperty
        title="Bar Width"
        attribute="data.bar.width"
        visualization={visualization}
      />

      <NumberProperty
        title="Bar Border Width"
        attribute="data.bar.borderWidth"
        visualization={visualization}
        min={0}
        max={10}
        step={1}
      />

      <ColorProperty
        title="Bar Border Color"
        attribute="data.bar.borderColor"
        visualization={visualization}
      />

      {/* Axis Label Settings */}
      <Text fontWeight="bold" fontSize="md" color="blue.600">Axis Settings</Text>

      <NumberProperty
        title="X-Axis Label Rotation"
        attribute="data.xAxis.labelRotation"
        visualization={visualization}
        min={-90}
        max={90}
        step={15}
      />

      <NumberProperty
        title="Y-Axis Label Rotation"
        attribute="data.yAxis.labelRotation"
        visualization={visualization}
        min={-90}
        max={90}
        step={15}
      />

      {/* Bar Stacking Settings */}
      <Text fontWeight="bold" fontSize="md" color="blue.600">Bar Stacking</Text>

      <SelectProperty
        attribute="data.stack.type"
        visualization={visualization}
        title="Stack Type"
        options={[
          { label: "None (Side by Side)", value: "none" },
          { label: "Normal Stack", value: "normal" },
          { label: "Percentage Stack", value: "percentage" }
        ]}
      />

      <TextProperty
        title="Stack Name"
        attribute="data.stack.name"
        visualization={visualization}
      />

      {/* Value Display and Formatting */}
      <Text fontWeight="bold" fontSize="md" color="blue.600">Value Display & Formatting</Text>

      <NumberProperty
        title="Decimal Places"
        attribute="data.values.decimalPlaces"
        visualization={visualization}
        min={0}
        max={6}
        step={1}
      />

      <SwitchProperty
        attribute="data.values.showThousandsSeparator"
        visualization={visualization}
        title="Show Thousands Separator"
      />

      <SelectProperty
        attribute="data.values.thousandsSeparator"
        visualization={visualization}
        title="Thousands Separator Type"
        options={[
          { label: "Comma (1,234)", value: "comma" },
          { label: "Period (1.234)", value: "period" },
          { label: "Space (1 234)", value: "space" }
        ]}
      />

      <TextProperty
        title="Value Prefix"
        attribute="data.values.prefix"
        visualization={visualization}
      />

      <TextProperty
        title="Value Suffix"
        attribute="data.values.suffix"
        visualization={visualization}
      />

      <SelectProperty
        attribute="data.values.position"
        visualization={visualization}
        title="Value Position"
        options={[
          { label: "Inside Center (Recommended)", value: "inside" },
          { label: "Inside Top", value: "insideTop" },
          { label: "Inside Bottom", value: "insideBottom" },
          { label: "Inside Left", value: "insideLeft" },
          { label: "Inside Right", value: "insideRight" },
          { label: "Top (Outside)", value: "top" },
          { label: "Bottom (Outside)", value: "bottom" },
          { label: "Left (Outside)", value: "left" },
          { label: "Right (Outside)", value: "right" }
        ]}
      />

      <NumberProperty
        title="Value Font Size"
        attribute="data.values.fontSize"
        visualization={visualization}
        min={8}
        max={24}
        step={1}
      />

      <ColorProperty
        title="Value Font Color"
        attribute="data.values.color"
        visualization={visualization}
      />

      <SelectProperty
        attribute="data.values.fontWeight"
        visualization={visualization}
        title="Value Font Weight"
        options={[
          { label: "Normal", value: "normal" },
          { label: "Bold", value: "bold" },
          { label: "Bolder", value: "bolder" },
          { label: "Lighter", value: "lighter" }
        ]}
      />

      <SwitchProperty
        attribute="data.values.intelligentSizing"
        visualization={visualization}
        title="Smart Auto-Sizing (Recommended)"
      />

      <NumberProperty
        title="Min Bar Size for Values (%)"
        attribute="data.values.minBarSizePercent"
        visualization={visualization}
        min={0}
        max={50}
        step={5}
      />

      {/* Advanced Bar Styling */}
      <Text fontWeight="bold" fontSize="md" color="blue.600">Advanced Bar Styling</Text>

      <NumberProperty
        title="Bar Gap (%)"
        attribute="data.bar.gap"
        visualization={visualization}
        min={0}
        max={100}
        step={5}
      />

      <NumberProperty
        title="Category Gap (%)"
        attribute="data.bar.categoryGap"
        visualization={visualization}
        min={0}
        max={100}
        step={5}
      />

      <NumberProperty
        title="Bar Opacity"
        attribute="data.bar.opacity"
        visualization={visualization}
        min={0}
        max={1}
        step={0.1}
      />

      <SwitchProperty
        attribute="data.bar.roundCap"
        visualization={visualization}
        title="Round Bar Caps"
      />

      <NumberProperty
        title="Bar Border Radius"
        attribute="data.bar.borderRadius"
        visualization={visualization}
        min={0}
        max={20}
        step={1}
      />

      {/* Gradient Effects */}
      <Text fontWeight="bold" fontSize="md" color="blue.600">Gradient & Effects</Text>

      <SwitchProperty
        attribute="data.gradient.enabled"
        visualization={visualization}
        title="Enable Gradient"
      />

      <SelectProperty
        attribute="data.gradient.direction"
        visualization={visualization}
        title="Gradient Direction"
        options={[
          { label: "Vertical", value: "vertical" },
          { label: "Horizontal", value: "horizontal" },
          { label: "Radial", value: "radial" }
        ]}
      />

      <ColorProperty
        title="Gradient Start Color"
        attribute="data.gradient.startColor"
        visualization={visualization}
      />

      <ColorProperty
        title="Gradient End Color"
        attribute="data.gradient.endColor"
        visualization={visualization}
      />

      <SwitchProperty
        attribute="data.shadow.enabled"
        visualization={visualization}
        title="Enable Shadow"
      />

      <NumberProperty
        title="Shadow Blur"
        attribute="data.shadow.blur"
        visualization={visualization}
        min={0}
        max={20}
        step={1}
      />

      <NumberProperty
        title="Shadow Offset X"
        attribute="data.shadow.offsetX"
        visualization={visualization}
        min={-10}
        max={10}
        step={1}
      />

      <NumberProperty
        title="Shadow Offset Y"
        attribute="data.shadow.offsetY"
        visualization={visualization}
        min={-10}
        max={10}
        step={1}
      />

      <ColorProperty
        title="Shadow Color"
        attribute="data.shadow.color"
        visualization={visualization}
      />

      {/* Pattern and Texture */}
      <Text fontWeight="bold" fontSize="md" color="blue.600">Pattern & Texture</Text>

      <SwitchProperty
        attribute="data.pattern.enabled"
        visualization={visualization}
        title="Enable Pattern"
      />

      <SelectProperty
        attribute="data.pattern.type"
        visualization={visualization}
        title="Pattern Type"
        options={[
          { label: "None", value: "none" },
          { label: "Diagonal Lines", value: "diagonal" },
          { label: "Horizontal Lines", value: "horizontal" },
          { label: "Vertical Lines", value: "vertical" },
          { label: "Dots", value: "dots" },
          { label: "Cross", value: "cross" }
        ]}
      />

      <ColorProperty
        title="Pattern Color"
        attribute="data.pattern.color"
        visualization={visualization}
      />

      <NumberProperty
        title="Pattern Size"
        attribute="data.pattern.size"
        visualization={visualization}
        min={1}
        max={20}
        step={1}
      />

      {/* Tooltip Customization */}
      <Text fontWeight="bold" fontSize="md" color="blue.600">Tooltip Settings</Text>

      <SwitchProperty
        attribute="data.tooltip.show"
        visualization={visualization}
        title="Show Tooltip"
      />

      <SelectProperty
        attribute="data.tooltip.trigger"
        visualization={visualization}
        title="Tooltip Trigger"
        options={[
          { label: "Axis", value: "axis" },
          { label: "Item", value: "item" },
          { label: "None", value: "none" }
        ]}
      />

      <ColorProperty
        title="Tooltip Background"
        attribute="data.tooltip.backgroundColor"
        visualization={visualization}
      />

      <ColorProperty
        title="Tooltip Border Color"
        attribute="data.tooltip.borderColor"
        visualization={visualization}
      />

      <NumberProperty
        title="Tooltip Font Size"
        attribute="data.tooltip.fontSize"
        visualization={visualization}
        min={10}
        max={20}
        step={1}
      />

      {/* Chart Title Settings */}
      <Text fontWeight="bold" fontSize="md" color="blue.600">Chart Title</Text>

      <SwitchProperty
        attribute="data.chart.showTitle"
        visualization={visualization}
        title="Show Chart Title"
      />

      <TextProperty
        title="Chart Title Text"
        attribute="data.chart.title"
        visualization={visualization}
        placeholder="Enter chart title"
      />

      <SelectProperty
        attribute="data.chart.titlePosition"
        visualization={visualization}
        title="Title Position"
        options={[
          { label: "Left", value: "left" },
          { label: "Center", value: "center" },
          { label: "Right", value: "right" }
        ]}
      />

      <NumberProperty
        title="Title Font Size"
        attribute="data.chart.titleFontSize"
        visualization={visualization}
        min={10}
        max={32}
        step={1}
      />

      <ColorProperty
        title="Title Color"
        attribute="data.chart.titleColor"
        visualization={visualization}
      />

      <SelectProperty
        attribute="data.chart.titleFontWeight"
        visualization={visualization}
        title="Title Font Weight"
        options={[
          { label: "Normal", value: "normal" },
          { label: "Bold", value: "bold" },
          { label: "Bolder", value: "bolder" },
          { label: "Lighter", value: "lighter" }
        ]}
      />

      {/* Chart Sizing Settings */}
      <Text fontWeight="bold" fontSize="md" color="blue.600">Chart Sizing</Text>

      <SwitchProperty
        attribute="data.chart.fitContainer"
        visualization={visualization}
        title="Fit Container (Recommended)"
      />

      <TextProperty
        title="Chart Width"
        attribute="data.chart.width"
        visualization={visualization}
        placeholder="e.g., 100%, 400px, 400"
      />

      <TextProperty
        title="Chart Height"
        attribute="data.chart.height"
        visualization={visualization}
        placeholder="e.g., 100%, 300px, 300"
      />

      <SwitchProperty
        attribute="data.chart.maintainAspectRatio"
        visualization={visualization}
        title="Maintain Aspect Ratio"
      />

      <Text fontWeight="bold" fontSize="sm" color="gray.600" mt={2}>Chart Margins & Spacing</Text>

      <NumberProperty
        title="Left Margin (%)"
        attribute="data.grid.left"
        visualization={visualization}
        min={0.1}
        max={50}
        step={0.1}
      />

      <NumberProperty
        title="Right Margin (%)"
        attribute="data.grid.right"
        visualization={visualization}
        min={0.1}
        max={50}
        step={0.1}
      />

      <NumberProperty
        title="Top Margin (%)"
        attribute="data.grid.top"
        visualization={visualization}
        min={0.1}
        max={50}
        step={0.1}
      />

      <NumberProperty
        title="Bottom Margin (%)"
        attribute="data.grid.bottom"
        visualization={visualization}
        min={0.1}
        max={50}
        step={0.1}
      />

      {/* Third Axis (Line) Settings */}
      <Text fontWeight="bold" fontSize="md" color="blue.600">Third Axis (Line)</Text>

      <SwitchProperty
        attribute="data.thirdAxis.enabled"
        visualization={visualization}
        title="Enable Third Axis Line"
      />

      <SelectProperty
        attribute="data.thirdAxis.dataField"
        visualization={visualization}
        title="Line Data Field"
        options={allFieldOptions}
      />

      <TextProperty
        title="Line Name"
        attribute="data.thirdAxis.name"
        visualization={visualization}
        placeholder="e.g., Percentage"
      />

      <SelectProperty
        attribute="data.thirdAxis.yAxisIndex"
        visualization={visualization}
        title="Y-Axis Side"
        options={[
          { label: "Left (Primary)", value: "0" },
          { label: "Right (Secondary)", value: "1" }
        ]}
      />

      <SelectProperty
        attribute="data.thirdAxis.lineType"
        visualization={visualization}
        title="Line Type"
        options={[
          { label: "Solid", value: "solid" },
          { label: "Dashed", value: "dashed" },
          { label: "Dotted", value: "dotted" }
        ]}
      />

      <NumberProperty
        title="Line Width"
        attribute="data.thirdAxis.lineWidth"
        visualization={visualization}
        min={1}
        max={10}
        step={1}
      />

      <ColorProperty
        title="Line Color"
        attribute="data.thirdAxis.color"
        visualization={visualization}
      />

      <SwitchProperty
        attribute="data.thirdAxis.showSymbol"
        visualization={visualization}
        title="Show Data Points"
      />

      <SelectProperty
        attribute="data.thirdAxis.symbolType"
        visualization={visualization}
        title="Symbol Type"
        options={[
          { label: "Circle", value: "circle" },
          { label: "Rectangle", value: "rect" },
          { label: "Triangle", value: "triangle" },
          { label: "Diamond", value: "diamond" },
          { label: "Pin", value: "pin" },
          { label: "Arrow", value: "arrow" }
        ]}
      />

      <NumberProperty
        title="Symbol Size"
        attribute="data.thirdAxis.symbolSize"
        visualization={visualization}
        min={2}
        max={20}
        step={1}
      />

      <SwitchProperty
        attribute="data.thirdAxis.smooth"
        visualization={visualization}
        title="Smooth Line"
      />

      <SwitchProperty
        attribute="data.thirdAxis.showValues"
        visualization={visualization}
        title="Show Line Values"
      />

      <TextProperty
        title="Right Y-Axis Title"
        attribute="data.thirdAxis.yAxisTitle"
        visualization={visualization}
        placeholder="e.g., Percentage (%)"
      />

      <NumberProperty
        title="Line Value Decimal Places"
        attribute="data.thirdAxis.decimalPlaces"
        visualization={visualization}
        min={0}
        max={6}
        step={1}
      />

      <TextProperty
        title="Line Value Suffix"
        attribute="data.thirdAxis.suffix"
        visualization={visualization}
        placeholder="e.g., %"
      />

      {/* Animation Settings */}
      <Text fontWeight="bold" fontSize="md" color="blue.600">Animation Settings</Text>

      <NumberProperty
        title="Animation Duration (ms)"
        attribute="data.animation.duration"
        visualization={visualization}
        min={0}
        max={5000}
        step={100}
      />

      <SelectProperty
        title="Animation Easing"
        attribute="data.animation.easing"
        visualization={visualization}
        options={[
          { label: "Linear", value: "linear" },
          { label: "Cubic Out", value: "cubicOut" },
          { label: "Cubic In", value: "cubicIn" },
          { label: "Cubic In Out", value: "cubicInOut" },
          { label: "Quad Out", value: "quadOut" },
          { label: "Quad In", value: "quadIn" },
          { label: "Bounce Out", value: "bounceOut" },
          { label: "Elastic Out", value: "elasticOut" }
        ]}
      />

      <NumberProperty
        title="Animation Delay (ms)"
        attribute="data.animation.delay"
        visualization={visualization}
        min={0}
        max={2000}
        step={50}
      />

      <SwitchProperty
        attribute="data.animation.animationDurationUpdate"
        visualization={visualization}
        title="Animate on Data Update"
      />

      {visualization.properties["series"] && (
        <Tabs>
          <TabList>
            {uniq(
              visualizationData.map(
                (x: any) => x[visualization.properties["series"]]
              )
            ).map((x) => (
              <Tab key={x}>{metadata?.[x]}</Tab>
            ))}
          </TabList>

          <TabPanels>
            {uniq(
              visualizationData.map(
                (x: any) => x[visualization.properties["series"]]
              )
            ).map((x) => (
              <TabPanel key={x}>
                <Stack>
                  <Text>Chart Type</Text>
                  <Select<Option, false, GroupBase<Option>>
                    value={chartTypes.find(
                      (pt) => visualization.properties[`data.${x}`] === pt.value
                    )}
                    onChange={(e) => {
                      const val = e?.value || "";
                      sectionApi.changeVisualizationProperties({
                        visualization: visualization.id,
                        attribute: `data.${x}`,
                        value: val,
                      });
                    }}
                    options={chartTypes}
                    isClearable
                    menuPlacement="auto"
                    size="sm"
                  />
                </Stack>
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      )}
      <SwitchProperty
        visualization={visualization}
        title="Comma Separate Values"
        attribute="data.commaSeparated"
        direction="row-reverse"
      />

      {visualization.indicators.length > 1 && (
        <>
          {visualization.indicators.map((i) => (
            <TextProperty
              visualization={visualization}
              title={i}
              attribute={i}
            />
          ))}
        </>
      )}
    </Stack>
  );
};

export default BarGraphProperties;
