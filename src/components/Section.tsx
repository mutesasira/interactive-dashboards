import { DeleteIcon, ChevronUpIcon, ChevronDownIcon } from "@chakra-ui/icons";
import {
    Button,
    Flex,
    Grid,
    IconButton,
    Input,
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    Spacer,
    Stack,
    Text,
    Textarea,
} from "@chakra-ui/react";
import { GroupBase, Select } from "chakra-react-select";
import { useStore } from "effector-react";
import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { BiDuplicate } from "react-icons/bi";
import { sectionApi, dashboardApi } from "../Events";
import { IIndicator, ISection, IVisualization, Option } from "../interfaces";
import { useNamespace } from "../Queries";
import { $section, $settings, $store, $dashboard } from "../Store";
import { generateUid } from "../utils/uid";
import {
    alignItemsOptions,
    chartTypes,
    createOptions,
    createOptions2,
    justifyContentOptions,
    donNotRequireQuery,
} from "../utils/utils";
import ColorPalette from "./ColorPalette";
import { NumberField, RadioField, SelectField, TextField } from "./fields";
import CheckboxField from "./fields/CheckboxField";
import LoadingIndicator from "./LoadingIndicator";
import SectionColorPalette from "./SectionColorPalette";
import SectionVisualization from "./SectionVisualization";
import VisualizationProperties from "./visualizations/VisualizationProperties";
import NumberProperty from "./properties/NumberProperty";
import TextProperty from "./properties/TextProperty";

const VisualizationTypes = ({
    visualization,
}: {
    visualization: IVisualization;
}) => {
    return (
        <Stack>
            <Text>Visualization Type</Text>
            <Select<Option, false, GroupBase<Option>>
                value={chartTypes.find(
                    (d: Option) => d.value === visualization.type
                )}
                onChange={(e) =>
                    sectionApi.changeVisualizationAttribute({
                        attribute: "type",
                        value: e?.value,
                        visualization: visualization.id,
                    })
                }
                options={chartTypes}
                isClearable
                menuPlacement="top"
                size="sm"
            />
        </Stack>
    );
};
const VisualizationQuery = ({
    visualization,
}: {
    visualization: IVisualization;
}) => {
    const { systemId } = useStore($store);
    const { storage } = useStore($settings);
    const { isLoading, isSuccess, isError, error, data } =
        useNamespace<IIndicator>("i-indicators", storage, systemId, []);
    return (
        <Stack>
            <Text>Visualization Query</Text>
            {isLoading && <LoadingIndicator />}
            {isSuccess && (
                <Select<IIndicator, true, GroupBase<IIndicator>>
                    isMulti
                    value={data?.filter(
                        (i) => visualization.indicators.indexOf(i.id) !== -1
                    )}
                    getOptionLabel={(v) => String(v.name)}
                    getOptionValue={(v) => v.id}
                    onChange={(value) => {
                        sectionApi.changeVisualizationAttribute({
                            attribute: "indicators",
                            value: value.map((i) => i.id),
                            visualization: visualization.id,
                        });
                    }}
                    options={data}
                    isClearable
                    size="sm"
                />
            )}
            {isError && <Text>{error?.message}</Text>}
        </Stack>
    );
};

const VisualizationOverride = ({
    visualization,
}: {
    visualization: IVisualization;
}) => {
    // const indicators = useStore($indicators);
    // const indicator = indicators.find((i) => i.id === visualization.indicator);
    return (
        <Text>Coming soon</Text>
        // <>
        //     {indicator && indicator.numerator?.type === "ANALYTICS" && (
        //         <Stack>
        //             <Text>Overrides</Text>
        //             <Stack direction="row">
        //                 <Text>DX</Text>
        //                 <RadioGroup
        //                     value={visualization.overrides["dx"]}
        //                     onChange={(e: string) =>
        //                         sectionApi.changeVisualizationOverride({
        //                             override: "dx",
        //                             value: e,
        //                             visualization: visualization.id,
        //                         })
        //                     }
        //                 >
        //                     <Stack direction="row">
        //                         <Radio value="dimension">Dimension</Radio>
        //                         <Radio value="filter">Filter</Radio>
        //                     </Stack>
        //                 </RadioGroup>
        //             </Stack>
        //             <Stack direction="row">
        //                 <Text>OU</Text>
        //                 <RadioGroup
        //                     value={visualization.overrides["ou"]}
        //                     onChange={(e: string) =>
        //                         sectionApi.changeVisualizationOverride({
        //                             override: "ou",
        //                             value: e,
        //                             visualization: visualization.id,
        //                         })
        //                     }
        //                 >
        //                     <Stack direction="row">
        //                         <Radio value="dimension">Dimension</Radio>
        //                         <Radio value="filter">Filter</Radio>
        //                     </Stack>
        //                 </RadioGroup>
        //             </Stack>
        //             <Stack direction="row">
        //                 <Text>OU Level</Text>
        //                 <RadioGroup
        //                     value={visualization.overrides["oul"]}
        //                     onChange={(e: string) =>
        //                         sectionApi.changeVisualizationOverride({
        //                             override: "oul",
        //                             value: e,
        //                             visualization: visualization.id,
        //                         })
        //                     }
        //                 >
        //                     <Stack direction="row">
        //                         <Radio value="dimension">Dimension</Radio>
        //                         <Radio value="filter">Filter</Radio>
        //                     </Stack>
        //                 </RadioGroup>
        //             </Stack>
        //             <Stack direction="row">
        //                 <Text>OU Group</Text>
        //                 <RadioGroup
        //                     value={visualization.overrides["oug"]}
        //                     onChange={(e: string) =>
        //                         sectionApi.changeVisualizationOverride({
        //                             override: "oug",
        //                             value: e,
        //                             visualization: visualization.id,
        //                         })
        //                     }
        //                 >
        //                     <Stack direction="row">
        //                         <Radio value="dimension">Dimension</Radio>
        //                         <Radio value="filter">Filter</Radio>
        //                     </Stack>
        //                 </RadioGroup>
        //             </Stack>
        //             <Stack direction="row">
        //                 <Text>PE</Text>
        //                 <RadioGroup
        //                     value={visualization.overrides["pe"]}
        //                     onChange={(e: string) =>
        //                         sectionApi.changeVisualizationOverride({
        //                             override: "pe",
        //                             value: e,
        //                             visualization: visualization.id,
        //                         })
        //                     }
        //                 >
        //                     <Stack direction="row">
        //                         <Radio value="dimension">Dimension</Radio>
        //                         <Radio value="filter">Filter</Radio>
        //                     </Stack>
        //                 </RadioGroup>
        //             </Stack>
        //         </Stack>
        //     )}
        // </>
    );
};

const Section = () => {
    const section = useStore($section);
    const [active, setActive] = useState<string>("title");

    const dragItem = useRef<number | undefined | null>();
    const dragOverItem = useRef<number | null>();
    const dragStart = (e: DragEvent<HTMLButtonElement>, position: number) => {
        dragItem.current = position;
    };

    const dashboard = useStore($dashboard);

    const dragEnter = (e: DragEvent<HTMLButtonElement>, position: number) => {
        dragOverItem.current = position;
    };

    const drop = (e: DragEvent<HTMLButtonElement>) => {
        const copyListItems = [...section.visualizations];

        if (
            dragItem.current !== null &&
            dragItem.current !== undefined &&
            dragOverItem.current !== null &&
            dragOverItem.current !== undefined
        ) {
            const dragItemContent = copyListItems[dragItem.current];
            copyListItems.splice(dragItem.current, 1);
            copyListItems.splice(dragOverItem.current, 0, dragItemContent);
            dragItem.current = null;
            dragOverItem.current = null;
            sectionApi.setVisualizations(copyListItems);
        }
    };

    return (
        <Grid gridTemplateColumns="1fr 40%" gap="2px">
            <Stack
                bg={section.bg}
                alignItems="center"
                overflow="auto"
                spacing={0}
            >
                <SectionVisualization section={section} />
            </Stack>
            <Stack
                maxH="calc(100vh - 150px)"
                minH="calc(100vh - 150px)"
                boxShadow="xl"
                spacing="2px"
                p="10px"
            >
                <Flex
                    gap="5px"
                    flexWrap="wrap"
                    bgColor="white"
                    alignContent="flex-start"
                >
                    <Button
                        size="sm"
                        onClick={() => setActive(() => "title")}
                        variant="outline"
                        colorScheme={active === "title" ? "teal" : "gray"}
                        key={"title"}
                    >
                        Section options
                    </Button>
                    {section.visualizations.map((visualization, index) => (
                        <Button
                            draggable
                            onDragStart={(e) => dragStart(e, index)}
                            onDragEnter={(e) => dragEnter(e, index)}
                            onDragOver={(e) => e.preventDefault()}
                            onDragEnd={drop}
                            size="sm"
                            variant="outline"
                            key={visualization.id}
                            colorScheme={
                                active === visualization.id ? "teal" : "yellow"
                            }
                            onClick={() => setActive(() => visualization.id)}
                        >
                            {visualization.name || visualization.id}
                        </Button>
                    ))}
                    <Button
                        size="sm"
                        onClick={() => {
                            const id = generateUid();
                            sectionApi.addVisualization2Section(id);
                            setActive(id);
                        }}
                    >
                        Add Visualization
                    </Button>
                </Flex>
                <Stack overflow="auto" flex={1} spacing={0}>
                    {active === "title" && (
                        <Stack p="10px" spacing="20px" bgColor="white">
                            <Stack direction="row" spacing="20px">
                                <CheckboxField<ISection>
                                    attribute="isTemplateArea"
                                    func={sectionApi.changeSectionAttribute}
                                    title="Is template area"
                                    obj={section}
                                />

                                <CheckboxField<ISection>
                                    attribute="isPrintable"
                                    func={sectionApi.changeSectionAttribute}
                                    title="Is Printable"
                                    obj={section}
                                />
                            </Stack>
                            <TextField<ISection>
                                attribute="title"
                                func={sectionApi.changeSectionAttribute}
                                title="Title"
                                obj={section}
                            />

                            {/* Section Title Styling Properties */}
                            {section.title && (
                                <Stack spacing={3} p={4} bg="blue.50" borderRadius="md">
                                    <Text fontWeight="bold" color="blue.700">Section Title Styling</Text>
                                    
                                    <Stack direction="row" spacing={4}>
                                        <Stack flex={1}>
                                            <Text fontSize="sm">Font Size</Text>
                                            <Input
                                                value={section.properties?.["sectionTitle.fontSize"] || "1.6vh"}
                                                placeholder="e.g., 1.6vh, 16px, 1.2rem"
                                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                    sectionApi.changeSectionAttribute({
                                                        attribute: "properties",
                                                        value: {
                                                            ...section.properties,
                                                            "sectionTitle.fontSize": e.target.value
                                                        }
                                                    })
                                                }
                                                size="sm"
                                            />
                                        </Stack>
                                        
                                        <Stack flex={1}>
                                            <Text fontSize="sm">Font Weight</Text>
                                            <NumberInput
                                                value={section.properties?.["sectionTitle.fontWeight"] || 600}
                                                min={100}
                                                max={900}
                                                step={100}
                                                size="sm"
                                                onChange={(_, value: number) =>
                                                    sectionApi.changeSectionAttribute({
                                                        attribute: "properties",
                                                        value: {
                                                            ...section.properties,
                                                            "sectionTitle.fontWeight": value
                                                        }
                                                    })
                                                }
                                            >
                                                <NumberInputField />
                                                <NumberInputStepper>
                                                    <NumberIncrementStepper />
                                                    <NumberDecrementStepper />
                                                </NumberInputStepper>
                                            </NumberInput>
                                        </Stack>
                                    </Stack>
                                    
                                    <Stack direction="row" spacing={4}>
                                        <Stack flex={1}>
                                            <Text fontSize="sm">Text Color</Text>
                                            <Input
                                                value={section.properties?.["sectionTitle.color"] || "#2D3748"}
                                                placeholder="e.g., #FF0000, red, rgb(255,0,0)"
                                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                    sectionApi.changeSectionAttribute({
                                                        attribute: "properties",
                                                        value: {
                                                            ...section.properties,
                                                            "sectionTitle.color": e.target.value
                                                        }
                                                    })
                                                }
                                                size="sm"
                                            />
                                        </Stack>
                                        
                                        <Stack flex={1}>
                                            <Text fontSize="sm">Background</Text>
                                            <Input
                                                value={section.properties?.["sectionTitle.bg"] || "transparent"}
                                                placeholder="e.g., #F0F0F0, white, transparent"
                                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                    sectionApi.changeSectionAttribute({
                                                        attribute: "properties",
                                                        value: {
                                                            ...section.properties,
                                                            "sectionTitle.bg": e.target.value
                                                        }
                                                    })
                                                }
                                                size="sm"
                                            />
                                        </Stack>
                                    </Stack>
                                    
                                    <Stack direction="row" spacing={4}>
                                        <Stack flex={1}>
                                            <Text fontSize="sm">Padding</Text>
                                            <Input
                                                value={section.properties?.["sectionTitle.padding"] || "8px 12px"}
                                                placeholder="e.g., 8px 12px, 10px"
                                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                    sectionApi.changeSectionAttribute({
                                                        attribute: "properties",
                                                        value: {
                                                            ...section.properties,
                                                            "sectionTitle.padding": e.target.value
                                                        }
                                                    })
                                                }
                                                size="sm"
                                            />
                                        </Stack>
                                        
                                        <Stack flex={1}>
                                            <Text fontSize="sm">Text Align</Text>
                                            <SelectField<ISection, Option>
                                                options={[
                                                    { label: "Left", value: "left" },
                                                    { label: "Center", value: "center" },
                                                    { label: "Right", value: "right" }
                                                ]}
                                                attribute="sectionTitle.textAlign"
                                                obj={{
                                                    "sectionTitle.textAlign": section.properties?.["sectionTitle.textAlign"] || "left"
                                                } as any}
                                                title=""
                                                func={(params: any) => 
                                                    sectionApi.changeSectionAttribute({
                                                        attribute: "properties",
                                                        value: {
                                                            ...section.properties,
                                                            "sectionTitle.textAlign": params.value
                                                        }
                                                    })
                                                }
                                                multiple={false}
                                                labelField="label"
                                                valueField="value"
                                            />
                                        </Stack>
                                    </Stack>
                                </Stack>
                            )}

                            {dashboard.type === "fixed" && (
                                <>
                                    <Stack direction="row" spacing="20px">
                                        <NumberField<ISection>
                                            attribute="rowSpan"
                                            func={
                                                sectionApi.changeSectionAttribute
                                            }
                                            title="Row Span"
                                            obj={section}
                                            min={1}
                                            max={24}
                                            step={1}
                                        />
                                        <NumberField<ISection>
                                            attribute="colSpan"
                                            func={
                                                sectionApi.changeSectionAttribute
                                            }
                                            title="Column Span"
                                            obj={section}
                                            min={1}
                                            max={24}
                                            step={1}
                                        />
                                    </Stack>

                                    <TextField<ISection>
                                        attribute="height"
                                        func={sectionApi.changeSectionAttribute}
                                        title="Height(when on small devices)"
                                        obj={section}
                                    />
                                </>
                            )}

                            <Stack>
                                <Text>Background Colour</Text>
                                <SectionColorPalette section={section} />
                            </Stack>
                            <RadioField<ISection>
                                attribute="direction"
                                func={sectionApi.changeSectionAttribute}
                                title="Arrangement"
                                obj={section}
                                options={createOptions(["row", "column"])}
                                direction="row"
                                spacing="20px"
                                alignItems="center"
                            />
                            <SelectField<ISection, Option>
                                options={alignItemsOptions}
                                attribute="alignItems"
                                obj={section}
                                title="Align Items"
                                func={sectionApi.changeSectionAttribute}
                                multiple={false}
                                labelField="label"
                                valueField="value"
                            />

                            <SelectField<ISection, Option>
                                options={justifyContentOptions}
                                attribute="justifyContent"
                                obj={section}
                                title="Justify Content"
                                func={sectionApi.changeSectionAttribute}
                                multiple={false}
                                labelField="label"
                                valueField="value"
                            />
                            <TextField
                                attribute="padding"
                                func={sectionApi.changeSectionAttribute}
                                title="Padding"
                                obj={section}
                            />

                            <TextField
                                attribute="spacing"
                                func={sectionApi.changeSectionAttribute}
                                title="Spacing (Between Items)"
                                obj={section}
                            />

                            <NumberField<ISection>
                                attribute="borderRadius"
                                func={sectionApi.changeSectionAttribute}
                                title="Border Radius (px)"
                                obj={section}
                                min={0}
                                max={50}
                                step={1}
                            />

                            <SelectField<ISection, Option>
                                options={[
                                    { label: "Sharp Corners", value: "0" },
                                    { label: "Slightly Rounded", value: "4" },
                                    { label: "Rounded", value: "8" },
                                    { label: "Very Rounded", value: "16" },
                                    { label: "Curved", value: "24" },
                                ]}
                                attribute="cornerStyle"
                                obj={section}
                                title="Corner Style"
                                func={sectionApi.changeSectionAttribute}
                                multiple={false}
                                labelField="label"
                                valueField="value"
                            />

                            <RadioField
                                attribute="display"
                                func={sectionApi.changeSectionAttribute}
                                title="Display Style"
                                obj={section}
                                options={createOptions2(
                                    [
                                        "Normal",
                                        "Carousel",
                                        "Marquee",
                                        "Grid",
                                        "Tabs",
                                    ],
                                    [
                                        "normal",
                                        "carousel",
                                        "marquee",
                                        "grid",
                                        "tabs",
                                    ]
                                )}
                            />

                            <RadioField
                                attribute="carouselOver"
                                func={sectionApi.changeSectionAttribute}
                                title="Carousel Over"
                                obj={section}
                                options={createOptions2(
                                    ["Items", "items"],
                                    ["normal", "groups"]
                                )}
                            />

                            {/* Tab Animation Settings */}
                            {section.display === "tabs" && (
                                <Stack spacing={4} p={4} bg="blue.50" borderRadius="md">
                                    <Text fontWeight="bold" color="blue.600">Tab Animation Settings</Text>
                                    <Text fontSize="sm" color="gray.600">
                                        Configure smooth transitions between tab visualizations
                                    </Text>
                                    
                                    <CheckboxField<ISection>
                                        attribute="enableTabAnimations"
                                        func={sectionApi.changeSectionAttribute}
                                        title="Enable Tab Animations"
                                        obj={section}
                                    />
                                    
                                    {section.enableTabAnimations !== false && (
                                        <>
                                            <Stack direction="row" spacing={4}>
                                                <Stack flex={1}>
                                                    <Text fontSize="sm">Animation Type</Text>
                                                    <SelectField<ISection, Option>
                                                        options={[
                                                            { label: "Fade", value: "fade" },
                                                            { label: "Slide", value: "slide" },
                                                            { label: "Scale", value: "scale" },
                                                            { label: "None", value: "none" }
                                                        ]}
                                                        attribute="tabAnimationType"
                                                        obj={section}
                                                        title=""
                                                        func={sectionApi.changeSectionAttribute}
                                                        multiple={false}
                                                        labelField="label"
                                                        valueField="value"
                                                    />
                                                </Stack>
                                                
                                                <Stack flex={1}>
                                                    <Text fontSize="sm">Duration (ms)</Text>
                                                    <NumberInput
                                                        value={section.tabAnimationDuration || 300}
                                                        min={100}
                                                        max={2000}
                                                        step={50}
                                                        size="sm"
                                                        onChange={(valueString, valueNumber) =>
                                                            sectionApi.changeSectionAttribute({
                                                                attribute: "tabAnimationDuration",
                                                                value: valueNumber || 300
                                                            })
                                                        }
                                                    >
                                                        <NumberInputField />
                                                        <NumberInputStepper>
                                                            <NumberIncrementStepper />
                                                            <NumberDecrementStepper />
                                                        </NumberInputStepper>
                                                    </NumberInput>
                                                </Stack>
                                            </Stack>
                                            
                                            <Stack direction="row" spacing={4} align="center" justify="space-between" p={3} bg="blue.25" borderRadius="md">
                                                <Text fontSize="xs" color="blue.700">
                                                    💡 <strong>Tip:</strong> Fade provides smooth opacity transitions, Slide creates directional movement, and Scale adds zoom effects.
                                                </Text>
                                            </Stack>
                                        </>
                                    )}
                                </Stack>
                            )}

                            {/* Tab Grouping Settings */}
                            {section.display === "tabs" && (
                                <Stack spacing={4} p={4} bg="green.50" borderRadius="md">
                                    <Text fontWeight="bold" color="green.600">Tab Group Settings</Text>
                                    <Text fontSize="sm" color="gray.600">
                                        Group multiple visualizations into organized tabs
                                    </Text>
                                    
                                    <CheckboxField<ISection>
                                        attribute="useTabGroups"
                                        func={sectionApi.changeSectionAttribute}
                                        title="Enable Tab Groups"
                                        obj={section}
                                    />
                                    
                                    {section.useTabGroups && (
                                        <Stack spacing={3}>
                                            <Stack direction="row" spacing={2} align="center">
                                                <Text fontSize="sm" fontWeight="medium">Tab Groups</Text>
                                                <Button
                                                    size="xs"
                                                    colorScheme="green"
                                                    onClick={() => {
                                                        const newGroup = {
                                                            id: generateUid(),
                                                            name: `Tab Group ${(section.tabGroups || []).length + 1}`,
                                                            visualizationIds: [],
                                                            order: (section.tabGroups || []).length
                                                        };
                                                        sectionApi.changeSectionAttribute({
                                                            attribute: "tabGroups",
                                                            value: [...(section.tabGroups || []), newGroup]
                                                        });
                                                    }}
                                                >
                                                    Add Group
                                                </Button>
                                            </Stack>
                                            
                                            {(section.tabGroups || []).map((group, groupIndex) => (
                                                <Stack key={group.id} p={3} bg="white" borderRadius="md" border="1px" borderColor="green.200">
                                                    <Stack direction="row" align="center" spacing={2}>
                                                        <Input
                                                            size="sm"
                                                            value={group.name}
                                                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                                                const updatedGroups = [...(section.tabGroups || [])];
                                                                updatedGroups[groupIndex] = { ...group, name: e.target.value };
                                                                sectionApi.changeSectionAttribute({
                                                                    attribute: "tabGroups",
                                                                    value: updatedGroups
                                                                });
                                                            }}
                                                            placeholder="Tab Group Name"
                                                        />
                                                        <Stack direction="row" spacing={1}>
                                                            <IconButton
                                                                size="sm"
                                                                aria-label="Move up"
                                                                icon={<ChevronUpIcon />}
                                                                variant="ghost"
                                                                isDisabled={groupIndex === 0}
                                                                onClick={() => {
                                                                    const updatedGroups = [...(section.tabGroups || [])];
                                                                    [updatedGroups[groupIndex], updatedGroups[groupIndex - 1]] = 
                                                                    [updatedGroups[groupIndex - 1], updatedGroups[groupIndex]];
                                                                    // Update order numbers
                                                                    updatedGroups.forEach((g, i) => g.order = i);
                                                                    sectionApi.changeSectionAttribute({
                                                                        attribute: "tabGroups",
                                                                        value: updatedGroups
                                                                    });
                                                                }}
                                                            />
                                                            <IconButton
                                                                size="sm"
                                                                aria-label="Move down"
                                                                icon={<ChevronDownIcon />}
                                                                variant="ghost"
                                                                isDisabled={groupIndex === (section.tabGroups || []).length - 1}
                                                                onClick={() => {
                                                                    const updatedGroups = [...(section.tabGroups || [])];
                                                                    [updatedGroups[groupIndex], updatedGroups[groupIndex + 1]] = 
                                                                    [updatedGroups[groupIndex + 1], updatedGroups[groupIndex]];
                                                                    // Update order numbers
                                                                    updatedGroups.forEach((g, i) => g.order = i);
                                                                    sectionApi.changeSectionAttribute({
                                                                        attribute: "tabGroups",
                                                                        value: updatedGroups
                                                                    });
                                                                }}
                                                            />
                                                            <IconButton
                                                                size="sm"
                                                                aria-label="Delete group"
                                                                icon={<DeleteIcon />}
                                                                colorScheme="red"
                                                                variant="ghost"
                                                                onClick={() => {
                                                                    const updatedGroups = (section.tabGroups || []).filter(g => g.id !== group.id);
                                                                    // Update order numbers
                                                                    updatedGroups.forEach((g, i) => g.order = i);
                                                                    sectionApi.changeSectionAttribute({
                                                                        attribute: "tabGroups",
                                                                        value: updatedGroups
                                                                    });
                                                                }}
                                                            />
                                                        </Stack>
                                                    </Stack>
                                                    
                                                    <Stack>
                                                        <Text fontSize="xs" color="gray.600">Visualizations in this group:</Text>
                                                        <Select<IVisualization, true, GroupBase<IVisualization>>
                                                            isMulti
                                                            size="sm"
                                                            placeholder="Select visualizations..."
                                                            value={section.visualizations.filter(viz => group.visualizationIds.includes(viz.id))}
                                                            options={section.visualizations}
                                                            getOptionLabel={(viz) => viz.name}
                                                            getOptionValue={(viz) => viz.id}
                                                            onChange={(selectedVizs) => {
                                                                const updatedGroups = [...(section.tabGroups || [])];
                                                                updatedGroups[groupIndex] = {
                                                                    ...group,
                                                                    visualizationIds: (selectedVizs || []).map(viz => viz.id)
                                                                };
                                                                sectionApi.changeSectionAttribute({
                                                                    attribute: "tabGroups",
                                                                    value: updatedGroups
                                                                });
                                                            }}
                                                        />
                                                    </Stack>
                                                    
                                                    {/* Grid Configuration */}
                                                    <Stack spacing={2} p={3} bg="gray.50" borderRadius="md">
                                                        <Text fontSize="xs" fontWeight="medium" color="gray.700">Grid Layout</Text>
                                                        <CheckboxField<ITabGroup>
                                                            obj={group}
                                                            attribute="gridEnabled"
                                                            title="Enable Grid Layout"
                                                            func={(update: { attribute: string; value: any }) => {
                                                                const updatedGroups = [...(section.tabGroups || [])];
                                                                updatedGroups[groupIndex] = {
                                                                    ...group,
                                                                    [update.attribute]: update.value
                                                                };
                                                                sectionApi.changeSectionAttribute({
                                                                    attribute: "tabGroups",
                                                                    value: updatedGroups
                                                                });
                                                            }}
                                                        />
                                                        
                                                        {group.gridEnabled && (
                                                            <Stack direction="row" spacing={2}>
                                                                <Stack flex={1}>
                                                                    <Text fontSize="xs" color="gray.600">Columns</Text>
                                                                    <NumberInput
                                                                        size="sm"
                                                                        min={1}
                                                                        max={6}
                                                                        value={group.gridColumns || 2}
                                                                        onChange={(valueString, valueNumber) => {
                                                                            const updatedGroups = [...(section.tabGroups || [])];
                                                                            updatedGroups[groupIndex] = {
                                                                                ...group,
                                                                                gridColumns: valueNumber || 2
                                                                            };
                                                                            sectionApi.changeSectionAttribute({
                                                                                attribute: "tabGroups",
                                                                                value: updatedGroups
                                                                            });
                                                                        }}
                                                                    >
                                                                        <NumberInputField />
                                                                        <NumberInputStepper>
                                                                            <NumberIncrementStepper />
                                                                            <NumberDecrementStepper />
                                                                        </NumberInputStepper>
                                                                    </NumberInput>
                                                                </Stack>
                                                                
                                                                <Stack flex={1}>
                                                                    <Text fontSize="xs" color="gray.600">Rows</Text>
                                                                    <NumberInput
                                                                        size="sm"
                                                                        min={1}
                                                                        max={6}
                                                                        value={group.gridRows || 2}
                                                                        onChange={(valueString, valueNumber) => {
                                                                            const updatedGroups = [...(section.tabGroups || [])];
                                                                            updatedGroups[groupIndex] = {
                                                                                ...group,
                                                                                gridRows: valueNumber || 2
                                                                            };
                                                                            sectionApi.changeSectionAttribute({
                                                                                attribute: "tabGroups",
                                                                                value: updatedGroups
                                                                            });
                                                                        }}
                                                                    >
                                                                        <NumberInputField />
                                                                        <NumberInputStepper>
                                                                            <NumberIncrementStepper />
                                                                            <NumberDecrementStepper />
                                                                        </NumberInputStepper>
                                                                    </NumberInput>
                                                                </Stack>
                                                                
                                                                <Stack flex={1}>
                                                                    <Text fontSize="xs" color="gray.600">Spacing</Text>
                                                                    <NumberInput
                                                                        size="sm"
                                                                        min={0}
                                                                        max={20}
                                                                        value={group.gridSpacing || 4}
                                                                        onChange={(valueString, valueNumber) => {
                                                                            const updatedGroups = [...(section.tabGroups || [])];
                                                                            updatedGroups[groupIndex] = {
                                                                                ...group,
                                                                                gridSpacing: valueNumber || 4
                                                                            };
                                                                            sectionApi.changeSectionAttribute({
                                                                                attribute: "tabGroups",
                                                                                value: updatedGroups
                                                                            });
                                                                        }}
                                                                    >
                                                                        <NumberInputField />
                                                                        <NumberInputStepper>
                                                                            <NumberIncrementStepper />
                                                                            <NumberDecrementStepper />
                                                                        </NumberInputStepper>
                                                                    </NumberInput>
                                                                </Stack>
                                                            </Stack>
                                                        )}
                                                        
                                                        {/* Individual Visualization Grid Spans */}
                                                        {group.gridEnabled && group.visualizationIds.length > 0 && (
                                                            <Stack spacing={3} p={3} bg="blue.50" borderRadius="md">
                                                                <Text fontSize="xs" fontWeight="medium" color="blue.700">Individual Visualization Spans</Text>
                                                                <Text fontSize="xs" color="gray.600">Configure how many grid cells each visualization occupies</Text>
                                                                
                                                                {group.visualizationIds.map((vizId) => {
                                                                    const visualization = section.visualizations.find(v => v.id === vizId);
                                                                    if (!visualization) return null;
                                                                    
                                                                    return (
                                                                        <Stack key={vizId} direction="row" spacing={3} align="center" bg="white" p={2} borderRadius="md">
                                                                            <Text fontSize="xs" flex={1} fontWeight="medium">{visualization.name}</Text>
                                                                            
                                                                            <Stack direction="row" spacing={2}>
                                                                                <Stack>
                                                                                    <Text fontSize="xs" color="gray.600">Columns</Text>
                                                                                    <NumberInput
                                                                                        value={visualization.columns || 1}
                                                                                        max={group.gridColumns || 2}
                                                                                        min={1}
                                                                                        step={1}
                                                                                        size="sm"
                                                                                        w="70px"
                                                                                        onChange={(valueString, valueNumber) =>
                                                                                            sectionApi.changeVisualizationAttribute({
                                                                                                attribute: "columns",
                                                                                                value: valueNumber || 1,
                                                                                                visualization: visualization.id,
                                                                                            })
                                                                                        }
                                                                                    >
                                                                                        <NumberInputField />
                                                                                        <NumberInputStepper>
                                                                                            <NumberIncrementStepper />
                                                                                            <NumberDecrementStepper />
                                                                                        </NumberInputStepper>
                                                                                    </NumberInput>
                                                                                </Stack>
                                                                                
                                                                                <Stack>
                                                                                    <Text fontSize="xs" color="gray.600">Rows</Text>
                                                                                    <NumberInput
                                                                                        value={visualization.rows || 1}
                                                                                        max={group.gridRows || 2}
                                                                                        min={1}
                                                                                        step={1}
                                                                                        size="sm"
                                                                                        w="70px"
                                                                                        onChange={(valueString, valueNumber) =>
                                                                                            sectionApi.changeVisualizationAttribute({
                                                                                                attribute: "rows",
                                                                                                value: valueNumber || 1,
                                                                                                visualization: visualization.id,
                                                                                            })
                                                                                        }
                                                                                    >
                                                                                        <NumberInputField />
                                                                                        <NumberInputStepper>
                                                                                            <NumberIncrementStepper />
                                                                                            <NumberDecrementStepper />
                                                                                        </NumberInputStepper>
                                                                                    </NumberInput>
                                                                                </Stack>
                                                                            </Stack>
                                                                        </Stack>
                                                                    );
                                                                })}
                                                            </Stack>
                                                        )}
                                                    </Stack>
                                                </Stack>
                                            ))}
                                        </Stack>
                                    )}
                                </Stack>
                            )}

                            {/* Marquee Settings */}
                            {section.display === "marquee" && (
                                <Stack spacing={4} p={4} bg="purple.50" borderRadius="md">
                                    <Text fontWeight="bold" color="purple.600">Marquee Scrolling Settings</Text>
                                    <Text fontSize="sm" color="gray.600">
                                        Configure continuous scrolling behavior for visualizations
                                    </Text>
                                    
                                    <Stack direction="row" spacing={4}>
                                        <Stack flex={1}>
                                            <Text fontSize="sm">Scroll Direction</Text>
                                            <SelectField<ISection, Option>
                                                options={[
                                                    { label: "Left", value: "left" },
                                                    { label: "Right", value: "right" },
                                                    { label: "Up", value: "up" },
                                                    { label: "Down", value: "down" }
                                                ]}
                                                attribute="marqueeDirection"
                                                obj={section}
                                                title=""
                                                func={sectionApi.changeSectionAttribute}
                                                multiple={false}
                                                labelField="label"
                                                valueField="value"
                                            />
                                        </Stack>
                                        
                                        <Stack flex={1}>
                                            <Text fontSize="sm">Speed (pixels/second)</Text>
                                            <NumberInput
                                                value={section.marqueeSpeed || 50}
                                                min={10}
                                                max={500}
                                                step={10}
                                                size="sm"
                                                onChange={(valueString, valueNumber) =>
                                                    sectionApi.changeSectionAttribute({
                                                        attribute: "marqueeSpeed",
                                                        value: valueNumber || 50
                                                    })
                                                }
                                            >
                                                <NumberInputField />
                                                <NumberInputStepper>
                                                    <NumberIncrementStepper />
                                                    <NumberDecrementStepper />
                                                </NumberInputStepper>
                                            </NumberInput>
                                        </Stack>
                                    </Stack>
                                    
                                    <Stack direction="row" spacing={4}>
                                        <Stack flex={1}>
                                            <Text fontSize="sm">Gap Between Items (px)</Text>
                                            <NumberInput
                                                value={section.marqueeGap || 20}
                                                min={0}
                                                max={200}
                                                step={5}
                                                size="sm"
                                                onChange={(valueString, valueNumber) =>
                                                    sectionApi.changeSectionAttribute({
                                                        attribute: "marqueeGap",
                                                        value: valueNumber || 20
                                                    })
                                                }
                                            >
                                                <NumberInputField />
                                                <NumberInputStepper>
                                                    <NumberIncrementStepper />
                                                    <NumberDecrementStepper />
                                                </NumberInputStepper>
                                            </NumberInput>
                                        </Stack>
                                        
                                        <Stack flex={1} direction="column" spacing={2}>
                                            <CheckboxField<ISection>
                                                attribute="marqueePauseOnHover"
                                                func={sectionApi.changeSectionAttribute}
                                                title="Pause on Hover"
                                                obj={section}
                                            />
                                            
                                            <CheckboxField<ISection>
                                                attribute="marqueeLoop"
                                                func={sectionApi.changeSectionAttribute}
                                                title="Continuous Loop"
                                                obj={section}
                                            />
                                        </Stack>
                                    </Stack>
                                    
                                    <Stack direction="row" spacing={4} align="center" justify="space-between" p={3} bg="purple.25" borderRadius="md">
                                        <Text fontSize="xs" color="purple.700">
                                            💡 <strong>Tip:</strong> Lower speeds (10-30) create smooth, readable scrolling. Higher speeds (100+) create dynamic movement effects.
                                        </Text>
                                    </Stack>
                                </Stack>
                            )}

                            {/* Auto Grid Generation */}
                            {section.display === "grid" && (
                                <Stack spacing={4} p={4} bg="gray.50" borderRadius="md">
                                    <Text fontWeight="bold" color="teal.600">Auto Grid Generator</Text>
                                    <Text fontSize="sm" color="gray.600">
                                        Automatically create a grid with the specified number of cells
                                    </Text>
                                    
                                    <Stack direction="row" spacing={2} alignItems="end">
                                        <Stack flex={1}>
                                            <Text fontSize="sm">Template</Text>
                                            <Select
                                                size="sm"
                                                id="gridTemplate"
                                                options={[
                                                    { label: "2x2 Grid (4 cells)", value: "2x2" },
                                                    { label: "3x2 Grid (6 cells)", value: "3x2" },
                                                    { label: "3x3 Grid (9 cells)", value: "3x3" },
                                                    { label: "4x3 Grid (12 cells)", value: "4x3" },
                                                    { label: "Custom", value: "custom" }
                                                ]}
                                                defaultValue={{ label: "2x2 Grid (4 cells)", value: "2x2" }}
                                                onChange={(selected) => {
                                                    const cellCountInput = document.getElementById('gridCellCount') as HTMLInputElement;
                                                    const gridColumnsInput = document.getElementById('gridColumns') as HTMLInputElement;
                                                    
                                                    if (selected?.value === "2x2") {
                                                        if (cellCountInput) cellCountInput.value = "4";
                                                        if (gridColumnsInput) gridColumnsInput.value = "2";
                                                    } else if (selected?.value === "3x2") {
                                                        if (cellCountInput) cellCountInput.value = "6";
                                                        if (gridColumnsInput) gridColumnsInput.value = "3";
                                                    } else if (selected?.value === "3x3") {
                                                        if (cellCountInput) cellCountInput.value = "9";
                                                        if (gridColumnsInput) gridColumnsInput.value = "3";
                                                    } else if (selected?.value === "4x3") {
                                                        if (cellCountInput) cellCountInput.value = "12";
                                                        if (gridColumnsInput) gridColumnsInput.value = "4";
                                                    }
                                                }}
                                            />
                                        </Stack>
                                        
                                        <Stack flex={1}>
                                            <Text fontSize="sm">Cells</Text>
                                            <NumberInput
                                                defaultValue={4}
                                                min={1}
                                                max={24}
                                                step={1}
                                                size="sm"
                                                id="gridCellCount"
                                            >
                                                <NumberInputField />
                                                <NumberInputStepper>
                                                    <NumberIncrementStepper />
                                                    <NumberDecrementStepper />
                                                </NumberInputStepper>
                                            </NumberInput>
                                        </Stack>
                                        
                                        <Stack flex={1}>
                                            <Text fontSize="sm">Columns</Text>
                                            <NumberInput
                                                defaultValue={2}
                                                min={1}
                                                max={6}
                                                step={1}
                                                size="sm"
                                                id="gridColumns"
                                            >
                                                <NumberInputField />
                                                <NumberInputStepper>
                                                    <NumberIncrementStepper />
                                                    <NumberDecrementStepper />
                                                </NumberInputStepper>
                                            </NumberInput>
                                        </Stack>
                                        
                                        <Button
                                            size="sm"
                                            colorScheme="teal"
                                            onClick={() => {
                                                const cellCountInput = document.getElementById('gridCellCount') as HTMLInputElement;
                                                const gridColumnsInput = document.getElementById('gridColumns') as HTMLInputElement;
                                                const cellCount = parseInt(cellCountInput?.value || '4');
                                                const gridColumns = parseInt(gridColumnsInput?.value || '2');
                                                
                                                // Calculate grid layout
                                                const gridRows = Math.ceil(cellCount / gridColumns);
                                                
                                                // Create new visualizations with better defaults
                                                const newVisualizations: IVisualization[] = [];
                                                for (let i = 0; i < cellCount; i++) {
                                                    const id = generateUid();
                                                    const visualization: IVisualization = {
                                                        id,
                                                        indicators: [],
                                                        type: "single",
                                                        name: `Cell ${i + 1}`,
                                                        properties: {
                                                            "data.prefix": "",
                                                            "data.suffix": "",
                                                            "data.format.style": "decimal",
                                                            "data.format.notation": "standard",
                                                            "data.format.maximumFractionDigits": 0,
                                                            "data.format.fontSize": 2.5,
                                                            "data.format.fontWeight": 600,
                                                            "data.alignment": "column",
                                                            "data.alignItems": "center",
                                                            "data.justifyContent": "center",
                                                            "data.title.fontSize": "1.2",
                                                            "data.title.fontWeight": 500,
                                                            "data.title.color": "#4A5568",
                                                            "data.container.padding": "16px",
                                                            "data.container.borderRadius": "8",
                                                            "data.shadow.enabled": true,
                                                            "data.shadow.blur": 4,
                                                            "data.shadow.offsetY": 2,
                                                            "data.shadow.color": "rgba(0,0,0,0.1)",
                                                            "layout.bg": "white"
                                                        },
                                                        overrides: {},
                                                        group: "",
                                                        bg: "white",
                                                        show: 1,
                                                        order: "1",
                                                        rows: 1,
                                                        columns: 1,
                                                        showTitle: true,
                                                        displayTitle: true
                                                    };
                                                    newVisualizations.push(visualization);
                                                }
                                                
                                                // Set the new visualizations
                                                sectionApi.setVisualizations(newVisualizations);
                                            }}
                                        >
                                            Generate Grid
                                        </Button>
                                    </Stack>
                                    
                                    <Text fontSize="xs" color="gray.500">
                                        ⚠️ This will replace all existing visualizations in this section
                                    </Text>
                                </Stack>
                            )}
                        </Stack>
                    )}
                    {section.visualizations.map(
                        (visualization) =>
                            visualization.id === active && (
                                <Stack
                                    key={visualization.id}
                                    overflow="auto"
                                    flex={1}
                                >
                                    <Stack
                                        direction="row"
                                        fontSize="xl"
                                        p="10px"
                                        spacing="0"
                                    >
                                        <Text>{`${visualization.name}(${visualization.id})`}</Text>
                                        <Spacer />
                                        <IconButton
                                            variant="ghost"
                                            onClick={() => {
                                                const id = generateUid();
                                                sectionApi.duplicateVisualization(
                                                    {
                                                        ...visualization,
                                                        id,
                                                    }
                                                );
                                                setActive(() => id);
                                            }}
                                            icon={
                                                <BiDuplicate
                                                    color="green"
                                                    size="24px"
                                                />
                                            }
                                            aria-label="Down"
                                        />
                                        <IconButton
                                            variant="ghost"
                                            onClick={() => {
                                                sectionApi.deleteSectionVisualization(
                                                    visualization.id
                                                );
                                                if (
                                                    section.visualizations
                                                        .length > 1
                                                ) {
                                                    const viz =
                                                        section.visualizations[
                                                        section
                                                            .visualizations
                                                            .length - 2
                                                        ];
                                                    setActive(() => viz.id);
                                                } else {
                                                    setActive(() => "title");
                                                }
                                            }}
                                            icon={<DeleteIcon color="red" />}
                                            aria-label="Down"
                                        />
                                    </Stack>
                                    <Stack pl="10px" spacing="20px">
                                        <Text>Title</Text>
                                        <Input
                                            value={visualization.name}
                                            onChange={(
                                                e: ChangeEvent<HTMLInputElement>
                                            ) =>
                                                sectionApi.changeVisualizationAttribute(
                                                    {
                                                        attribute: "name",
                                                        value: e.target.value,
                                                        visualization:
                                                            visualization.id,
                                                    }
                                                )
                                            }
                                            size="sm"
                                        />

                                        {visualization.name && (
                                            <>
                                                <Stack
                                                    direction="row"
                                                    justifyContent="space-around"
                                                >
                                                    <Stack flex={1}>
                                                        <Text>
                                                            Title font color
                                                        </Text>
                                                        <ColorPalette
                                                            visualization={
                                                                visualization
                                                            }
                                                            attribute="data.title.color"
                                                        />
                                                    </Stack>
                                                    <Stack flex={1}>
                                                        <Text>
                                                            Background Color
                                                        </Text>
                                                        <ColorPalette
                                                            visualization={
                                                                visualization
                                                            }
                                                            attribute="layout.bg"
                                                        />
                                                    </Stack>
                                                </Stack>
                                                <Stack
                                                    direction="row"
                                                    spacing="30px"
                                                >
                                                    <NumberProperty
                                                        max={10}
                                                        min={1}
                                                        step={0.1}
                                                        title="Title font size"
                                                        visualization={
                                                            visualization
                                                        }
                                                        attribute="data.title.fontSize"
                                                        direction="row"
                                                        alignItems="center"
                                                        flex={1}
                                                    />
                                                    <NumberProperty
                                                        max={1000}
                                                        min={100}
                                                        step={50}
                                                        title="Title font weight"
                                                        visualization={
                                                            visualization
                                                        }
                                                        attribute="data.title.fontWeight"
                                                        direction="row"
                                                        alignItems="center"
                                                        flex={1}
                                                    />
                                                </Stack>
                                            </>
                                        )}
                                        {section.display === "grid" && (
                                            <>
                                                <Stack>
                                                    <Text>Rows</Text>
                                                    <NumberInput
                                                        value={
                                                            visualization.rows
                                                        }
                                                        max={24}
                                                        min={1}
                                                        step={1}
                                                        size="sm"
                                                        onChange={(
                                                            _,
                                                            value2: number
                                                        ) =>
                                                            sectionApi.changeVisualizationAttribute(
                                                                {
                                                                    attribute:
                                                                        "rows",
                                                                    value: value2,
                                                                    visualization:
                                                                        visualization.id,
                                                                }
                                                            )
                                                        }
                                                    >
                                                        <NumberInputField />
                                                        <NumberInputStepper>
                                                            <NumberIncrementStepper />
                                                            <NumberDecrementStepper />
                                                        </NumberInputStepper>
                                                    </NumberInput>
                                                </Stack>
                                                <Stack>
                                                    <Text>Columns</Text>
                                                    <NumberInput
                                                        value={
                                                            visualization.columns
                                                        }
                                                        max={24}
                                                        min={1}
                                                        step={1}
                                                        size="sm"
                                                        onChange={(
                                                            _,
                                                            value2: number
                                                        ) =>
                                                            sectionApi.changeVisualizationAttribute(
                                                                {
                                                                    attribute:
                                                                        "columns",
                                                                    value: value2,
                                                                    visualization:
                                                                        visualization.id,
                                                                }
                                                            )
                                                        }
                                                    >
                                                        <NumberInputField />
                                                        <NumberInputStepper>
                                                            <NumberIncrementStepper />
                                                            <NumberDecrementStepper />
                                                        </NumberInputStepper>
                                                    </NumberInput>
                                                </Stack>
                                            </>
                                        )}

                                        <VisualizationTypes
                                            visualization={visualization}
                                        />

                                        {donNotRequireQuery.indexOf(
                                            visualization.type
                                        ) === -1 &&
                                            visualization.type !== "" && (
                                                <>
                                                    <VisualizationQuery
                                                        visualization={
                                                            visualization
                                                        }
                                                    />
                                                    <Text>Expression</Text>
                                                    <Textarea
                                                        value={
                                                            visualization.expression
                                                        }
                                                        rows={2}
                                                        onChange={(
                                                            e: ChangeEvent<HTMLTextAreaElement>
                                                        ) =>
                                                            sectionApi.changeVisualizationAttribute(
                                                                {
                                                                    attribute:
                                                                        "expression",
                                                                    value: e
                                                                        .target
                                                                        .value,
                                                                    visualization:
                                                                        visualization.id,
                                                                }
                                                            )
                                                        }
                                                    />
                                                </>
                                            )}

                                        <VisualizationProperties
                                            visualization={visualization}
                                        />
                                    </Stack>
                                </Stack>
                            )
                    )}
                </Stack>
            </Stack>
        </Grid>
    );
};

export default Section;
