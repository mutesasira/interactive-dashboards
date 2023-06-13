import {
    Stack,
    Text,
    Table,
    Tbody,
    Td,
    Th,
    Thead,
    Tr,
    Input,
} from "@chakra-ui/react";
import { GroupBase, Select } from "chakra-react-select";
import { useStore } from "effector-react";
import { flatten, uniq } from "lodash";
import React from "react";
import { sectionApi } from "../../Events";
import { IVisualization, Option, Threshold } from "../../interfaces";
import { $visualizationData } from "../../Store";
import { createOptions, createOptions2 } from "../../utils/utils";
import SimpleAccordion from "../SimpleAccordion";
import NumberProperty from "./NumberProperty";
import SelectProperty from "./SelectProperty";
import SwitchProperty from "./SwitchProperty";
import { processTable, getLast } from "../processors";
import Picker from "../Picker";
import ColorProperty from "./ColorProperty";
import ColorRangePicker from "../ColorRangePicker";
import TableLikeProperty from "./TableLikeProperty";
import Scrollable from "../Scrollable";
import TextProperty from "./TextProperty";
import { SPECIAL_COLUMNS } from "../constants";

const aggregations = createOptions2(
    [
        "Count",
        "Count unique values",
        "List unique values",
        "Sum",
        "Integer sum",
        "Average",
        "Median",
        "Sample variance",
        "Sample standard deviation",
        "Minimum",
        "Maximum",
        "First",
        "Last",
        "Sum over sum",
        "80% Upper bound",
        "80% Lower bound",
        "sum as a fraction of totals",
        "sum as a fraction of rows",
        "sum as a fraction of columns",
        "Count as a fraction of totals",
        "Count as a fraction of rows",
        "Count as a fraction of columns",
    ],
    [
        "count",
        "countUniqValues",
        "listUniqueValues",
        "sum",
        "integerSum",
        "average",
        "median",
        "sampleVariance",
        "sampleStandardDeviation",
        "minimum",
        "maximum",
        "first",
        "last",
        "sumOverSum",
        "upperBound80",
        "lowerBound80",
        "sumFractionTotals",
        "sumFractionRows",
        "sumFractionColumns",
        "countFractionTotals",
        "countFractionRows",
        "countFractionColumns",
    ]
);

const TableProperties = ({
    visualization,
}: {
    visualization: IVisualization;
}) => {
    const visualizationData = useStore($visualizationData);
    const rows = String(visualization.properties["rows"] || "").split(",");
    const columns1 = String(visualization.properties["columns"] || "").split(
        ","
    );

    const columns = visualizationData[visualization.id]
        ? createOptions([
              ...uniq(
                  flatten(
                      flatten(visualizationData[visualization.id]).map((d) =>
                          Object.keys(d)
                      )
                  )
              ),
              "rowCount",
              "rowTotal",
              "columnCount",
              "columnTotal",
          ])
        : [];
    const aggregation = visualization.properties["aggregation"] || "count";
    const { lastRow, lastColumn } = getLast(
        flatten(visualizationData[visualization.id]),
        rows,
        columns1
    );

    return (
        <Stack>
            <Stack>
                <Text>Columns</Text>
                <Select<Option, true, GroupBase<Option>>
                    value={columns.filter(
                        (pt) =>
                            String(visualization.properties["columns"])
                                .split(",")
                                .indexOf(pt.value) !== -1
                    )}
                    onChange={(e) =>
                        sectionApi.changeVisualizationProperties({
                            visualization: visualization.id,
                            attribute: "columns",
                            value: Array.from(e)
                                .map(({ value }) => value)
                                .join(","),
                        })
                    }
                    options={columns}
                    isClearable
                    menuPlacement="top"
                    isMulti
                />
            </Stack>

            <Scrollable height={300}>
                <Table variant="unstyled">
                    <Thead>
                        <Tr>
                            <Th>Column</Th>
                            <Th>Width</Th>
                            <Th>BG</Th>
                            <Th>Rename</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {lastColumn.map((row) => (
                            <Tr key={row}>
                                <Td>{row}</Td>
                                <Td w="50px">
                                    <NumberProperty
                                        visualization={visualization}
                                        title=""
                                        attribute={`${row}.width`}
                                        min={50}
                                        max={500}
                                        step={1}
                                    />
                                </Td>
                                <Td w="50px">
                                    <ColorProperty
                                        visualization={visualization}
                                        title=""
                                        attribute={`${row}.bg`}
                                    />
                                </Td>
                                <Td w="300px">
                                    <TextProperty
                                        visualization={visualization}
                                        title=""
                                        attribute={`${row}.name`}
                                        disabled={
                                            SPECIAL_COLUMNS.indexOf(row) === -1
                                        }
                                    />
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </Scrollable>
            <Stack>
                <Text>Rows</Text>
                <Select<Option, true, GroupBase<Option>>
                    value={columns.filter(
                        (pt) =>
                            String(visualization.properties["rows"])
                                .split(",")
                                .indexOf(pt.value) !== -1
                    )}
                    onChange={(e) =>
                        sectionApi.changeVisualizationProperties({
                            visualization: visualization.id,
                            attribute: "rows",
                            value: Array.from(e)
                                .map(({ value }) => value)
                                .join(","),
                        })
                    }
                    options={columns}
                    isClearable
                    menuPlacement="top"
                    isMulti
                />
            </Stack>
            <SelectProperty
                visualization={visualization}
                title="Aggregation"
                attribute="aggregation"
                options={aggregations}
            />
            <SimpleAccordion title="Table">
                <SwitchProperty
                    visualization={visualization}
                    title="Show headers"
                    attribute="showHeaders"
                />
                <SelectProperty
                    visualization={visualization}
                    title="Cell height"
                    attribute="cellHeight"
                    options={createOptions2(
                        ["Small", "Medium", "Large"],
                        ["sm", "md", "lg"]
                    )}
                />
                <SwitchProperty
                    visualization={visualization}
                    title="Enable pagination"
                    attribute="enablePagination"
                />
                <NumberProperty
                    visualization={visualization}
                    title="Minimum column width"
                    attribute="columnMinWidth"
                    min={50}
                    max={1000}
                    step={1}
                />
                <SelectProperty
                    visualization={visualization}
                    title="Column alignment"
                    attribute="columnAlignment"
                    options={createOptions(["auto", "left", "center", "right"])}
                />
            </SimpleAccordion>
            <SimpleAccordion title="Table footer">
                <div></div>
            </SimpleAccordion>
            <SimpleAccordion title="Cell options">
                <SelectProperty
                    visualization={visualization}
                    title="Cell Type"
                    attribute="cellType"
                    options={createOptions2(
                        ["Auto", "Colored text", "Colored background"],
                        ["auto", "coloredText", "coloredBackground"]
                    )}
                />
            </SimpleAccordion>
            <SimpleAccordion title="Threshold">
                <ColorRangePicker visualization={visualization} />
            </SimpleAccordion>
            <SimpleAccordion title="Other options">
                <div></div>
            </SimpleAccordion>
        </Stack>
    );
};

export default TableProperties;
