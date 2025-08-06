import {
    Input,
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    Stack,
    Text,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { GroupBase, Select } from "chakra-react-select";
import { ChangeEvent } from "react";
import { sectionApi } from "../../Events";
import { IVisualization, Option } from "../../interfaces";
import {
    alignItemsOptions,
    createOptions,
    justifyContentOptions,
} from "../../utils/utils";
import ColorPalette from "../ColorPalette";
import ColorRangePicker from "../ColorRangePicker";
import SelectProperty from "./SelectProperty";
import TextProperty from "./TextProperty";
import NumberProperty from "./NumberProperty";
import SwitchProperty from "./SwitchProperty";
import ColorProperty from "./ColorProperty";
import { useStore } from "effector-react";
import { $visualizationData } from "../../Store";
import { uniq, flatten } from "lodash";

const progressAlignments: Option[] = [
    {
        label: "Column",
        value: "column",
    },
    {
        label: "Column Reverse",
        value: "column-reverse",
    },
    {
        label: "Row",
        value: "row",
    },
    {
        label: "Row Reverse",
        value: "row-reverse",
    },
];

const formatStyleOptions = createOptions(["decimal", "percent", "currency"]);
const numberFormatNotationOptions = createOptions(["standard", "compact"]);
const targetGraphOptions = createOptions(["progress", "circular"]);

const SingleValueProperties = ({
    visualization,
}: {
    visualization: IVisualization;
}) => {
    const visualizationData = useStore($visualizationData);
    const [currentValues, setCurrentValues] = useState<Option[]>([]);
    const normalColumns = uniq(
        flatten(
            flatten(visualizationData[visualization.id] || []).map((d) =>
                Object.keys(d)
            )
        )
    );
    useEffect(() => {
        setCurrentValues(() =>
            uniq(
                visualizationData[visualization.id]?.map(
                    (d) =>
                        d[visualization.properties["aggregationColumn"] || ""]
                ) || []
            )
                .filter((d) => !!d)
                .map((d) => {
                    return { label: d, value: d, span: 1, actual: d };
                })
        );

        return () => { };
    }, [visualization.properties["aggregationColumn"]]);

    return (
        <Stack spacing="20px" pb="10px">
            <SwitchProperty
                visualization={visualization}
                title="Show Value Circle"
                attribute="data.showCircle"
            />
            <NumberProperty
                visualization={visualization}
                min={0}
                max={500}
                step={1}
                attribute="data.circleSize"
                title="Circle Size (px)"
            />
            <NumberProperty
                visualization={visualization}
                min={0}
                max={20}
                step={1}
                attribute="data.circleThickness"
                title="Circle Border Thickness (px)"
            />
            <SwitchProperty
                visualization={visualization}
                title="Dotted Border"
                attribute="data.circleDotted"
            />
            <Stack>
                <Text>Circle Color</Text>
                <ColorPalette
                    visualization={visualization}
                    attribute="data.circleColor"
                />
            </Stack>
            <SwitchProperty
                visualization={visualization}
                title="Aggregate"
                attribute="aggregate"
            />
            <SelectProperty
                visualization={visualization}
                title="Aggregation Column"
                attribute="aggregationColumn"
                options={createOptions(normalColumns)}
            />
            <SelectProperty
                visualization={visualization}
                title="Aggregation Strategy"
                attribute="aggregationStrategy"
                options={createOptions(["all", "first", "last", "max", "min"])}
            />
            <SelectProperty
                visualization={visualization}
                title="Aggregation Strategy Columns"
                attribute="aggregationStrategyColumn"
                options={createOptions(normalColumns)}
            />
            <SelectProperty
                visualization={visualization}
                title="Uniq Column"
                attribute="uniqColumn"
                options={createOptions(normalColumns)}
            />
            <TextProperty
                visualization={visualization}
                title="Specific Key"
                attribute="key"
            />

            <SelectProperty
                visualization={visualization}
                title="Label Alignment"
                attribute="data.alignment"
                options={progressAlignments}
            />
            <SelectProperty
                visualization={visualization}
                title="Justify Content"
                attribute="data.justifyContent"
                options={justifyContentOptions}
            />
            <SelectProperty
                visualization={visualization}
                title="Align Items"
                attribute="data.alignItems"
                options={alignItemsOptions}
            />
            <SelectProperty
                visualization={visualization}
                title="Horizontal Position"
                attribute="data.position"
                options={[
                    { label: "Left", value: "left" },
                    { label: "Center", value: "center" },
                    { label: "Right", value: "right" }
                ]}
            />
            <SelectProperty
                visualization={visualization}
                title="Vertical Position"
                attribute="data.verticalPosition"
                options={[
                    { label: "Top", value: "top" },
                    { label: "Center", value: "center" },
                    { label: "Bottom", value: "bottom" }
                ]}
            />
            <TextProperty
                visualization={visualization}
                title="Prefix"
                attribute="data.prefix"
            />

            <TextProperty
                visualization={visualization}
                title="Suffix"
                attribute="data.suffix"
            />

            <SelectProperty
                visualization={visualization}
                title="Number format style"
                attribute="data.format.style"
                options={formatStyleOptions}
            />
            <SelectProperty
                visualization={visualization}
                title="Number format notation"
                attribute="data.format.notation"
                options={numberFormatNotationOptions}
            />
            <Stack>
                <Text>Single Value Background Color</Text>
                <ColorPalette
                    visualization={visualization}
                    attribute="layout.bg"
                />
            </Stack>

            <NumberProperty
                visualization={visualization}
                max={2}
                min={0}
                step={1}
                attribute="data.border"
                title="Single Value Border and Border Radius"
            />

            <NumberProperty
                visualization={visualization}
                max={4}
                min={0}
                step={1}
                attribute="data.format.maximumFractionDigits"
                title="Number format decimal places"
            />
            <NumberProperty
                visualization={visualization}
                max={60}
                min={0}
                step={1}
                attribute="data.format.fontSize"
                title="Value Font Size (px)"
            />
            <NumberProperty
                visualization={visualization}
                max={40}
                min={8}
                step={1}
                attribute="data.title.fontSize"
                title="Title Font Size (px)"
            />
            <NumberProperty
                visualization={visualization}
                max={1000}
                min={100}
                step={100}
                attribute="data.format.fontWeight"
                title="Value Font Weight"
            />
            <NumberProperty
                visualization={visualization}
                max={1000}
                min={0}
                step={1}
                attribute="data.format.spacing"
                title="Label Value Spacing"
            />

            <ColorRangePicker visualization={visualization} />
            <TextProperty
                visualization={visualization}
                title="Suffix"
                attribute="data.suffix"
            />
            <TextProperty
                visualization={visualization}
                title="Secondary Target Query"
                attribute="data.secondaryTarget"
            />

            <SelectProperty
                visualization={visualization}
                title="Secondary Target Position"
                attribute="data.secondaryTargetPosition"
                options={progressAlignments}
            />

            <NumberProperty
                visualization={visualization}
                min={0}
                max={100}
                step={1}
                attribute="data.secondaryTargetSpacing"
                title="Secondary Target Spacing (px)"
            />

            <NumberProperty
                visualization={visualization}
                min={8}
                max={100}
                step={1}
                attribute="data.secondaryTargetFontSize"
                title="Secondary Target Font Size (px)"
            />
            <NumberProperty
                visualization={visualization}
                min={100}
                max={900}
                step={100}
                attribute="data.secondaryTargetFontWeight"
                title="Secondary Target Font Weight"
            />

            <Stack>
                <Text>Secondary Target Color</Text>
                <ColorPalette
                    visualization={visualization}
                    attribute="data.secondaryTargetColor"
                />
            </Stack>
            <NumberProperty
                visualization={visualization}
                min={0}
                max={10}
                step={1}
                attribute="data.secondaryTargetDecimalPlaces"
                title="Secondary Target Decimals"
            />
            <SwitchProperty
                visualization={visualization}
                title="Bracket Secondary Target"
                attribute="data.secondaryTargetBracketed"
            />
            <Stack>
                <Text>Target</Text>
                <Input
                    size="sm"
                    value={visualization.properties?.["data.target"] || ""}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        sectionApi.changeVisualizationProperties({
                            visualization: visualization.id,
                            attribute: "data.target",
                            value: e.target.value,
                        })
                    }
                />
            </Stack>
            <Stack>
                <Text>Target Graph</Text>
                <Select<Option, false, GroupBase<Option>>
                    value={targetGraphOptions.find(
                        (pt) =>
                            pt.value ===
                            visualization.properties?.["data.targetgraph"]
                    )}
                    onChange={(e) =>
                        sectionApi.changeVisualizationProperties({
                            visualization: visualization.id,
                            attribute: "data.targetgraph",
                            value: e?.value,
                        })
                    }
                    options={targetGraphOptions}
                    isClearable
                    size="sm"
                />
            </Stack>

            <Stack>
                <Text>Target Direction</Text>
                <Select<Option, false, GroupBase<Option>>
                    value={progressAlignments.find(
                        (pt) =>
                            pt.value ===
                            visualization.properties?.["data.direction"]
                    )}
                    onChange={(e) =>
                        sectionApi.changeVisualizationProperties({
                            visualization: visualization.id,
                            attribute: "data.direction",
                            value: e?.value,
                        })
                    }
                    options={progressAlignments}
                    isClearable
                    size="sm"
                />
            </Stack>

            <Stack>
                <Text>Target Spacing</Text>
                <NumberInput
                    value={visualization.properties["data.targetspacing"] || 0}
                    min={0}
                    step={1}
                    onChange={(value1: string, value2: number) =>
                        sectionApi.changeVisualizationProperties({
                            visualization: visualization.id,
                            attribute: "data.targetspacing",
                            value: value2,
                        })
                    }
                    size="sm"
                >
                    <NumberInputField />
                    <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                    </NumberInputStepper>
                </NumberInput>
            </Stack>

            <Stack>
                <Text>Target Color</Text>
                <ColorPalette
                    visualization={visualization}
                    attribute="data.targetcolor"
                />
            </Stack>

            <Stack>
                <Text>Thickness</Text>
                <NumberInput
                    value={
                        visualization.properties["data.targetthickness"] || 0
                    }
                    min={0}
                    step={1}
                    onChange={(value1: string, value2: number) =>
                        sectionApi.changeVisualizationProperties({
                            visualization: visualization.id,
                            attribute: "data.targetthickness",
                            value: value2,
                        })
                    }
                    size="sm"
                >
                    <NumberInputField />
                    <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                    </NumberInputStepper>
                </NumberInput>
            </Stack>

            <Stack>
                <Text>Radius</Text>
                <NumberInput
                    value={visualization.properties["data.targetradius"] || 0}
                    min={30}
                    step={1}
                    onChange={(value1: string, value2: number) =>
                        sectionApi.changeVisualizationProperties({
                            visualization: visualization.id,
                            attribute: "data.targetradius",
                            value: value2,
                        })
                    }
                    size="sm"
                >
                    <NumberInputField />
                    <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                    </NumberInputStepper>
                </NumberInput>
            </Stack>
            <Stack>
                <Text>Grouping</Text>
                <Input
                    value={visualization.group}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        sectionApi.changeVisualizationAttribute({
                            visualization: visualization.id,
                            attribute: "group",
                            value: e.target.value,
                        })
                    }
                    size="sm"
                />
            </Stack>

            {/* Enhanced Styling Properties */}
            <Text fontWeight="bold" fontSize="md" color="blue.600" mt={4}>Container Styling</Text>

            <TextProperty
                visualization={visualization}
                title="Container Padding"
                attribute="data.container.padding"
                placeholder="e.g., 4px, 8px 12px"
            />

            <TextProperty
                visualization={visualization}
                title="Container Margin"
                attribute="data.container.margin"
                placeholder="e.g., 0px, 4px 8px"
            />

            <NumberProperty
                visualization={visualization}
                min={0}
                max={50}
                step={1}
                attribute="data.container.borderRadius"
                title="Border Radius (px)"
            />

            <ColorProperty
                title="Border Color"
                attribute="data.container.borderColor"
                visualization={visualization}
            />

            <SelectProperty
                visualization={visualization}
                title="Border Style"
                attribute="data.container.borderStyle"
                options={[
                    { label: "Solid", value: "solid" },
                    { label: "Dashed", value: "dashed" },
                    { label: "Dotted", value: "dotted" },
                    { label: "Double", value: "double" },
                    { label: "None", value: "none" }
                ]}
            />

            {/* Shadow Properties */}
            <Text fontWeight="bold" fontSize="md" color="blue.600" mt={4}>Shadow Effects</Text>

            <SwitchProperty
                visualization={visualization}
                title="Enable Shadow"
                attribute="data.shadow.enabled"
            />

            <NumberProperty
                visualization={visualization}
                min={0}
                max={50}
                step={1}
                attribute="data.shadow.blur"
                title="Shadow Blur (px)"
            />

            <NumberProperty
                visualization={visualization}
                min={0}
                max={20}
                step={1}
                attribute="data.shadow.spread"
                title="Shadow Spread (px)"
            />

            <NumberProperty
                visualization={visualization}
                min={-20}
                max={20}
                step={1}
                attribute="data.shadow.offsetX"
                title="Shadow X Offset (px)"
            />

            <NumberProperty
                visualization={visualization}
                min={-20}
                max={20}
                step={1}
                attribute="data.shadow.offsetY"
                title="Shadow Y Offset (px)"
            />

            <ColorProperty
                title="Shadow Color"
                attribute="data.shadow.color"
                visualization={visualization}
            />

            {/* Gradient Properties */}
            <Text fontWeight="bold" fontSize="md" color="blue.600" mt={4}>Gradient Background</Text>

            <SwitchProperty
                visualization={visualization}
                title="Enable Gradient"
                attribute="data.gradient.enabled"
            />

            <SelectProperty
                visualization={visualization}
                title="Gradient Direction"
                attribute="data.gradient.direction"
                options={[
                    { label: "Top to Bottom", value: "to bottom" },
                    { label: "Bottom to Top", value: "to top" },
                    { label: "Left to Right", value: "to right" },
                    { label: "Right to Left", value: "to left" },
                    { label: "Diagonal (Top-Left to Bottom-Right)", value: "to bottom right" },
                    { label: "Diagonal (Top-Right to Bottom-Left)", value: "to bottom left" },
                    { label: "Radial", value: "radial-gradient(circle" }
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

            {/* Animation Properties */}
            <Text fontWeight="bold" fontSize="md" color="blue.600" mt={4}>Animation Effects</Text>

            <SwitchProperty
                visualization={visualization}
                title="Enable Animation"
                attribute="data.animation.enabled"
            />

            <SelectProperty
                visualization={visualization}
                title="Animation Type"
                attribute="data.animation.type"
                options={[
                    { label: "Pulse", value: "pulse" },
                    { label: "Bounce", value: "bounce" },
                    { label: "Glow", value: "glow" },
                    { label: "Fade In", value: "fadeIn" }
                ]}
            />

            <TextProperty
                visualization={visualization}
                title="Animation Duration"
                attribute="data.animation.duration"
                placeholder="e.g., 2s, 1500ms"
            />

            {/* Advanced Value Styling */}
            <Text fontWeight="bold" fontSize="md" color="blue.600" mt={4}>Value Text Styling</Text>

            <TextProperty
                visualization={visualization}
                title="Value Text Shadow"
                attribute="data.value.textShadow"
                placeholder="e.g., 2px 2px 4px rgba(0,0,0,0.5)"
            />

            <SelectProperty
                visualization={visualization}
                title="Value Font Family"
                attribute="data.value.fontFamily"
                options={[
                    { label: "Inherit", value: "inherit" },
                    { label: "Arial", value: "Arial, sans-serif" },
                    { label: "Helvetica", value: "Helvetica, sans-serif" },
                    { label: "Times New Roman", value: "Times New Roman, serif" },
                    { label: "Georgia", value: "Georgia, serif" },
                    { label: "Courier New", value: "Courier New, monospace" },
                    { label: "Roboto", value: "Roboto, sans-serif" },
                    { label: "Open Sans", value: "Open Sans, sans-serif" }
                ]}
            />

            <TextProperty
                visualization={visualization}
                title="Value Letter Spacing"
                attribute="data.value.letterSpacing"
                placeholder="e.g., normal, 1px, 0.1em"
            />

            <NumberProperty
                visualization={visualization}
                min={0.8}
                max={3}
                step={0.1}
                attribute="data.value.lineHeight"
                title="Value Line Height"
            />

            {/* Value Margin Properties */}
            <Text fontWeight="bold" fontSize="sm" color="gray.600" mt={2}>Value Margins</Text>

            <NumberProperty
                visualization={visualization}
                min={0}
                max={100}
                step={1}
                attribute="data.value.marginTop"
                title="Value Top Margin (px)"
            />

            <NumberProperty
                visualization={visualization}
                min={0}
                max={100}
                step={1}
                attribute="data.value.marginBottom"
                title="Value Bottom Margin (px)"
            />

            <NumberProperty
                visualization={visualization}
                min={0}
                max={100}
                step={1}
                attribute="data.value.marginLeft"
                title="Value Left Margin (px)"
            />

            <NumberProperty
                visualization={visualization}
                min={0}
                max={100}
                step={1}
                attribute="data.value.marginRight"
                title="Value Right Margin (px)"
            />

            <TextProperty
                visualization={visualization}
                title="Value Margin (All Sides)"
                attribute="data.value.margin"
                placeholder="e.g., 10px, 5px 10px, 2px 4px 6px 8px"
            />

            {/* Advanced Title Styling */}
            <Text fontWeight="bold" fontSize="md" color="blue.600" mt={4}>Title Text Styling</Text>

            <TextProperty
                visualization={visualization}
                title="Title Text Shadow"
                attribute="data.title.textShadow"
                placeholder="e.g., 1px 1px 2px rgba(0,0,0,0.3)"
            />

            <SelectProperty
                visualization={visualization}
                title="Title Font Family"
                attribute="data.title.fontFamily"
                options={[
                    { label: "Inherit", value: "inherit" },
                    { label: "Arial", value: "Arial, sans-serif" },
                    { label: "Helvetica", value: "Helvetica, sans-serif" },
                    { label: "Times New Roman", value: "Times New Roman, serif" },
                    { label: "Georgia", value: "Georgia, serif" },
                    { label: "Courier New", value: "Courier New, monospace" },
                    { label: "Roboto", value: "Roboto, sans-serif" },
                    { label: "Open Sans", value: "Open Sans, sans-serif" }
                ]}
            />

            <TextProperty
                visualization={visualization}
                title="Title Letter Spacing"
                attribute="data.title.letterSpacing"
                placeholder="e.g., normal, 1px, 0.1em"
            />

            <NumberProperty
                visualization={visualization}
                min={0.8}
                max={3}
                step={0.1}
                attribute="data.title.lineHeight"
                title="Title Line Height"
            />

            <SelectProperty
                visualization={visualization}
                title="Title Position"
                attribute="data.title.position"
                options={[
                    { label: "Left", value: "left" },
                    { label: "Center", value: "center" },
                    { label: "Right", value: "right" }
                ]}
            />

            {/* Image Properties */}
            <Text fontWeight="bold" fontSize="md" color="blue.600" mt={4}>Image Display</Text>

            <SwitchProperty
                visualization={visualization}
                title="Show Image"
                attribute="data.image.show"
            />

            <TextProperty
                visualization={visualization}
                title="Image URL"
                attribute="data.image.url"
                placeholder="Enter image URL or path"
            />

            <SelectProperty
                visualization={visualization}
                title="Image Position"
                attribute="data.image.position"
                options={[
                    { label: "Top", value: "top" },
                    { label: "Bottom", value: "bottom" },
                    { label: "Left", value: "left" },
                    { label: "Right", value: "right" },
                    { label: "Background", value: "background" }
                ]}
            />

            <NumberProperty
                visualization={visualization}
                min={10}
                max={500}
                step={5}
                attribute="data.image.width"
                title="Image Width (px)"
            />

            <NumberProperty
                visualization={visualization}
                min={10}
                max={500}
                step={5}
                attribute="data.image.height"
                title="Image Height (px)"
            />

            <SelectProperty
                visualization={visualization}
                title="Image Fit"
                attribute="data.image.objectFit"
                options={[
                    { label: "Contain", value: "contain" },
                    { label: "Cover", value: "cover" },
                    { label: "Fill", value: "fill" },
                    { label: "Scale Down", value: "scale-down" },
                    { label: "None", value: "none" }
                ]}
            />

            <NumberProperty
                visualization={visualization}
                min={0}
                max={50}
                step={1}
                attribute="data.image.borderRadius"
                title="Image Border Radius (px)"
            />

            <NumberProperty
                visualization={visualization}
                min={0}
                max={50}
                step={2}
                attribute="data.image.spacing"
                title="Image Spacing (px)"
            />

            <NumberProperty
                visualization={visualization}
                min={0}
                max={1}
                step={0.1}
                attribute="data.image.opacity"
                title="Image Opacity"
            />

        </Stack>
    );
};

export default SingleValueProperties;
