import React from "react";
import { Stack, Text, Input } from "@chakra-ui/react";
import { Select, GroupBase } from "chakra-react-select";
import { useStore } from "effector-react";
import { flatten, uniq } from "lodash";
import { sectionApi } from "../../Events";
import { IVisualization, Option } from "../../interfaces";
import { $visualizationData } from "../../Store";
import { customComponents } from "../../utils/components";

export default function FunnelChartProperties({
    visualization,
}: {
    visualization: IVisualization;
}) {
    const vizData = useStore($visualizationData)[visualization.id] || [];
    const allRows = vizData.flat();
    const fields = uniq(flatten(allRows.map((row) => Object.keys(row))));
    const fieldOptions: Option[] = fields.map((f) => ({ label: f, value: f }));
    const props = visualization.properties || {};

    const currentLabels = (props["data.labels"] as string) || "";
    const currentValues = (props["data.values"] as string) || "";
    const currentOrientation = (props["data.orientation"] as string) || "v";
    const currentColors = (props["data.colors"] as string[]) || [];

    return (
        <Stack spacing={4}>
            <Text>Label Field</Text>
            <Select<Option, false, GroupBase<Option>>
                options={fieldOptions}
                value={fieldOptions.find((o) => o.value === currentLabels) || null}
                onChange={(opt) =>
                    sectionApi.changeVisualizationProperties({
                        visualization: visualization.id,
                        attribute: "data.labels",
                        value: opt?.value || "",
                    })
                }
                isClearable
                menuPlacement="auto"
                components={customComponents}
            />

            <Text>Value Field</Text>
            <Select<Option, false, GroupBase<Option>>
                options={fieldOptions}
                value={fieldOptions.find((o) => o.value === currentValues) || null}
                onChange={(opt) =>
                    sectionApi.changeVisualizationProperties({
                        visualization: visualization.id,
                        attribute: "data.values",
                        value: opt?.value || "",
                    })
                }
                isClearable
                menuPlacement="auto"
                components={customComponents}
            />

            <Text>Orientation</Text>
            <Select<Option, false, GroupBase<Option>>
                options={[
                    { label: "Vertical", value: "v" },
                    { label: "Horizontal", value: "h" },
                ]}
                value={{
                    label: currentOrientation === "v" ? "Vertical" : "Horizontal",
                    value: currentOrientation,
                }}
                onChange={(opt) =>
                    sectionApi.changeVisualizationProperties({
                        visualization: visualization.id,
                        attribute: "data.orientation",
                        value: opt?.value || "v",
                    })
                }
                isClearable={false}
                menuPlacement="auto"
            />

            <Text>Colors (comma-separated)</Text>
            <Input
                value={currentColors.join(",")}
                placeholder="e.g. #1f77b4,#ff7f0e"
                onChange={(e) =>
                    sectionApi.changeVisualizationProperties({
                        visualization: visualization.id,
                        attribute: "data.colors",
                        value: e.target.value.split(","),
                    })
                }
            />
        </Stack>
    );
}