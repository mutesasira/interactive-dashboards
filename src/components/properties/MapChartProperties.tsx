import {
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    Stack,
    Text,
    Switch,
    FormLabel,
    Input,
} from "@chakra-ui/react";
import { GroupBase, Select } from "chakra-react-select";
import { sectionApi } from "../../Events";
import { IVisualization, Option } from "../../interfaces";
import { createOptions } from "../../utils/utils";
import ColorRangePicker from "../ColorRangePicker";
import NumberProperty from "./NumberProperty";

const mapStyleOptions = createOptions([
    "carto-darkmatter",
    "carto-positron",
    "open-street-map",
    "stamen-terrain",
    "stamen-toner",
    "stamen-watercolor",
    "white-bg",
]);

const MapChartProperties = ({
    visualization,
}: {
    visualization: IVisualization;
}) => {
    return (
        <Stack spacing="30px">
            <NumberProperty
                visualization={visualization}
                attribute="childLevel"
                max={5}
                step={1}
                min={1}
                title="Child Relative Level"
            />

            <ColorRangePicker visualization={visualization} />

            <Stack spacing="20px">
                <Text fontWeight="bold">Map Layout & Sizing</Text>
                
                <Stack direction="row" align="center">
                    <FormLabel htmlFor="fit-to-section" mb="0">
                        Fit to Section
                    </FormLabel>
                    <Switch
                        id="fit-to-section"
                        isChecked={
                            visualization.properties?.["layout.fitToSection"] !== false
                        }
                        onChange={(e) =>
                            sectionApi.changeVisualizationProperties({
                                visualization: visualization.id,
                                attribute: "layout.fitToSection",
                                value: e.target.checked,
                            })
                        }
                    />
                </Stack>

                {visualization.properties?.["layout.fitToSection"] === false && (
                    <>
                        <Stack>
                            <Text>Custom Width</Text>
                            <Input
                                value={visualization.properties?.["layout.width"] || ""}
                                onChange={(e) =>
                                    sectionApi.changeVisualizationProperties({
                                        visualization: visualization.id,
                                        attribute: "layout.width",
                                        value: e.target.value,
                                    })
                                }
                                placeholder="e.g., 500px, 80%, auto"
                            />
                        </Stack>

                        <Stack>
                            <Text>Custom Height</Text>
                            <Input
                                value={visualization.properties?.["layout.height"] || ""}
                                onChange={(e) =>
                                    sectionApi.changeVisualizationProperties({
                                        visualization: visualization.id,
                                        attribute: "layout.height",
                                        value: e.target.value,
                                    })
                                }
                                placeholder="e.g., 400px, 60%, auto"
                            />
                        </Stack>
                    </>
                )}
            </Stack>

            <Stack>
                <Text>Map Style</Text>
                <Select<Option, false, GroupBase<Option>>
                    value={mapStyleOptions.find(
                        (pt) =>
                            pt.value ===
                            visualization.properties?.["layout.mapbox.style"]
                    )}
                    onChange={(e) =>
                        sectionApi.changeVisualizationProperties({
                            visualization: visualization.id,
                            attribute: "layout.mapbox.style",
                            value: e?.value,
                        })
                    }
                    options={mapStyleOptions}
                    isClearable
                />
            </Stack>
        </Stack>
    );
};

export default MapChartProperties;
