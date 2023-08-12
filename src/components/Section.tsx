import { DeleteIcon } from "@chakra-ui/icons";
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
import { sectionApi } from "../Events";
import { IIndicator, ISection, IVisualization, Option } from "../interfaces";
import { useNamespace } from "../Queries";
import { $section, $settings, $store } from "../Store";
import { generateUid } from "../utils/uid";
import {
    alignItemsOptions,
    chartTypes,
    createOptions,
    createOptions2,
    justifyContentOptions,
} from "../utils/utils";
import ColorPalette from "./ColorPalette";
import { NumberField, RadioField, SelectField, TextField } from "./fields";
import CheckboxField from "./fields/CheckboxField";
import LoadingIndicator from "./LoadingIndicator";
import SectionColorPalette from "./SectionColorPalette";
import SectionVisualization from "./SectionVisualization";
import VisualizationProperties from "./visualizations/VisualizationProperties";

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
                    />
                )}
                {isError && <Text>{error?.message}</Text>}
            </Stack>

            <Stack>
                <Text>Title</Text>
                <Input
                    value={visualization.name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        sectionApi.changeVisualizationAttribute({
                            attribute: "name",
                            value: e.target.value,
                            visualization: visualization.id,
                        })
                    }
                />
            </Stack>
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
                <SectionVisualization {...section} />
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
                            <CheckboxField<ISection>
                                attribute="isTemplateArea"
                                func={sectionApi.changeSectionAttribute}
                                title="Is template area"
                                obj={section}
                            />
                            <TextField<ISection>
                                attribute="title"
                                func={sectionApi.changeSectionAttribute}
                                title="Title"
                                obj={section}
                            />
                            <NumberField<ISection>
                                attribute="rowSpan"
                                func={sectionApi.changeSectionAttribute}
                                title="Row Span"
                                obj={section}
                                min={1}
                                max={24}
                                step={1}
                            />
                            <NumberField<ISection>
                                attribute="colSpan"
                                func={sectionApi.changeSectionAttribute}
                                title="Column Span"
                                obj={section}
                                min={1}
                                max={24}
                                step={1}
                            />

                            <TextField<ISection>
                                attribute="height"
                                func={sectionApi.changeSectionAttribute}
                                title="Height(when on small devices)"
                                obj={section}
                            />

                            <Text>Background Colour</Text>
                            <SectionColorPalette section={section} />
                            <RadioField<ISection>
                                attribute="direction"
                                func={sectionApi.changeSectionAttribute}
                                title="Arrangement"
                                obj={section}
                                options={createOptions(["row", "column"])}
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
                                        />
                                        <Text>Title font size</Text>
                                        <NumberInput
                                            value={
                                                visualization.properties[
                                                    "data.title.fontSize"
                                                ] || 2
                                            }
                                            max={10}
                                            min={1}
                                            step={0.1}
                                            onChange={(
                                                value1: string,
                                                value2: number
                                            ) =>
                                                sectionApi.changeVisualizationProperties(
                                                    {
                                                        visualization:
                                                            visualization?.id,
                                                        attribute:
                                                            "data.title.fontSize",
                                                        value: value2,
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
                                        <Text>Title font weight</Text>
                                        <NumberInput
                                            value={
                                                visualization.properties[
                                                    "data.title.fontWeight"
                                                ] || 250
                                            }
                                            max={1000}
                                            min={100}
                                            step={50}
                                            onChange={(
                                                value1: string,
                                                value2: number
                                            ) =>
                                                sectionApi.changeVisualizationProperties(
                                                    {
                                                        visualization:
                                                            visualization.id,
                                                        attribute:
                                                            "data.title.fontWeight",
                                                        value: value2,
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
                                        <Text>Title font color</Text>
                                        <ColorPalette
                                            visualization={visualization}
                                            attribute="data.title.color"
                                        />
                                        <VisualizationQuery
                                            visualization={visualization}
                                        />
                                        <Text>Expression</Text>
                                        <Textarea
                                            value={visualization.expression}
                                            onChange={(
                                                e: ChangeEvent<HTMLTextAreaElement>
                                            ) =>
                                                sectionApi.changeVisualizationAttribute(
                                                    {
                                                        attribute: "expression",
                                                        value: e.target.value,
                                                        visualization:
                                                            visualization.id,
                                                    }
                                                )
                                            }
                                        />
                                        <VisualizationTypes
                                            visualization={visualization}
                                        />
                                        <VisualizationProperties
                                            visualization={visualization}
                                        />
                                        x
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
