import {
  Input,
  Radio,
  RadioGroup,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from "@chakra-ui/react";
import { GroupBase, Select } from "chakra-react-select";
import { useStore } from "effector-react";
import { flatten, uniq } from "lodash";
import { ChangeEvent } from "react";
import { sectionApi } from "../../Events";
import { IVisualization, Option } from "../../interfaces";
import { $visualizationData, $visualizationMetadata } from "../../Store";
import { createOptions } from "../../utils/utils";
import Scrollable from "../Scrollable";
import SelectProperty from "./SelectProperty";
import SwitchProperty from "./SwitchProperty";
import TextProperty from "./TextProperty";
import ColorProperty from "./ColorProperty";
import NumberProperty from "./NumberProperty";

const orientationOptions = createOptions(["horizontal", "vertical"]);

const BulletChartProperties = ({
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

  return (
    <Scrollable>
      <Tabs>
        <TabList>
          <Tab>Data</Tab>
          <Tab>Layout</Tab>
          <Tab>Chart Styling</Tab>
        </TabList>
        <TabPanels>
          {/* Data Tab */}
          <TabPanel>
            <Stack spacing="20px">
              <SelectProperty
                title="Category"
                attribute="category"
                visualization={visualization}
                options={columns}
              />
              <SelectProperty
                title="Actual Value"
                attribute="series"
                visualization={visualization}
                options={columns}
              />
              <SelectProperty
                title="Target Value"
                attribute="target"
                visualization={visualization}
                options={columns}
              />
              <SelectProperty
                title="Range 1 (Poor)"
                attribute="range1"
                visualization={visualization}
                options={columns}
              />
              <SelectProperty
                title="Range 2 (Satisfactory)"
                attribute="range2"
                visualization={visualization}
                options={columns}
              />
              <SelectProperty
                title="Range 3 (Good)"
                attribute="range3"
                visualization={visualization}
                options={columns}
              />
            </Stack>
          </TabPanel>

          {/* Layout Tab */}
          <TabPanel>
            <Stack spacing="20px">
              <SelectProperty
                title="Orientation"
                attribute="data.orientation"
                visualization={visualization}
                options={orientationOptions}
              />
              <SwitchProperty
                title="Show Values"
                attribute="data.showValues"
                visualization={visualization}
              />
              <SwitchProperty
                title="Show Legend"
                attribute="data.showLegend"
                visualization={visualization}
              />
              <SelectProperty
                title="Legend Position"
                attribute="data.legend.position"
                visualization={visualization}
                options={createOptions(["top", "bottom", "left", "right"])}
              />
            </Stack>
          </TabPanel>

          {/* Chart Styling Tab */}
          <TabPanel>
            <Stack spacing="20px">
              {/* Chart Title Section */}
              <Stack spacing="10px">
                <Text fontWeight="bold">Chart Title</Text>
                <SwitchProperty
                  title="Show Chart Title"
                  attribute="data.chart.showTitle"
                  visualization={visualization}
                />
                <TextProperty
                  title="Chart Title"
                  attribute="data.chart.title"
                  visualization={visualization}
                />
                <NumberProperty
                  title="Title Font Size"
                  attribute="data.chart.titleFontSize"
                  visualization={visualization}
                />
                <ColorProperty
                  title="Title Color"
                  attribute="data.chart.titleColor"
                  visualization={visualization}
                />
                <SelectProperty
                  title="Title Position"
                  attribute="data.chart.titlePosition"
                  visualization={visualization}
                  options={createOptions(["left", "center", "right"])}
                />
                <SelectProperty
                  title="Title Font Weight"
                  attribute="data.chart.titleFontWeight"
                  visualization={visualization}
                  options={createOptions(["normal", "bold", "bolder", "lighter"])}
                />
              </Stack>

              {/* Colors Section */}
              <Stack spacing="10px">
                <Text fontWeight="bold">Colors</Text>
                <ColorProperty
                  title="Actual Value Color"
                  attribute="data.bullet.actualColor"
                  visualization={visualization}
                />
                <ColorProperty
                  title="Target Color"
                  attribute="data.bullet.targetColor"
                  visualization={visualization}
                />
                <Stack spacing="5px">
                  <Text fontSize="sm">Range Colors</Text>
                  <ColorProperty
                    title="Range 1 Color (Poor)"
                    attribute="data.bullet.range1Color"
                    visualization={visualization}
                  />
                  <ColorProperty
                    title="Range 2 Color (Satisfactory)"
                    attribute="data.bullet.range2Color"
                    visualization={visualization}
                  />
                  <ColorProperty
                    title="Range 3 Color (Good)"
                    attribute="data.bullet.range3Color"
                    visualization={visualization}
                  />
                </Stack>
              </Stack>

              {/* Chart Sizing Section */}
              <Stack spacing="10px">
                <Text fontWeight="bold">Chart Sizing</Text>
                <SwitchProperty
                  title="Fit Container"
                  attribute="layout.fitContainer"
                  visualization={visualization}
                />
                <Stack direction="row" spacing="10px">
                  <Stack flex="1">
                    <Text fontSize="sm">Chart Width</Text>
                    <Input
                      size="sm"
                      placeholder="400px or 100%"
                      value={visualization.properties["layout.chartWidth"] || ""}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        sectionApi.changeVisualizationProperties({
                          visualization: visualization.id,
                          attribute: "layout.chartWidth",
                          value: e.target.value,
                        })
                      }
                    />
                  </Stack>
                  <Stack flex="1">
                    <Text fontSize="sm">Chart Height</Text>
                    <Input
                      size="sm"
                      placeholder="400px"
                      value={visualization.properties["layout.chartHeight"] || ""}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        sectionApi.changeVisualizationProperties({
                          visualization: visualization.id,
                          attribute: "layout.chartHeight",
                          value: e.target.value,
                        })
                      }
                    />
                  </Stack>
                </Stack>
              </Stack>
            </Stack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Scrollable>
  );
};

export default BulletChartProperties;