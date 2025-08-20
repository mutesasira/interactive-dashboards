import {
    Checkbox,
    CheckboxGroup,
    Radio,
    RadioGroup,
    Stack,
    Text,
} from "@chakra-ui/react";
import React, { useState, useEffect } from "react";
import { useDataEngine } from "@dhis2/app-runtime";
import { sectionApi } from "../../Events";
import { IVisualization, Option } from "../../interfaces";
import SwitchProperty from "./SwitchProperty";
import SelectProperty from "./SelectProperty";

export default function FiltersProperties({
    visualization,
}: {
    visualization: IVisualization;
}) {
    const engine = useDataEngine();
    const [groupSets, setGroupSets] = useState<Option[]>([]);

    // Load organization unit group sets
    useEffect(() => {
        const loadGroupSets = async () => {
            try {
                const response: any = await engine.query({
                    groupSets: {
                        resource: "organisationUnitGroupSets.json",
                        params: {
                            fields: "id~rename(value),name~rename(label)",
                            paging: "false",
                        },
                    },
                });
                setGroupSets(response.groupSets?.organisationUnitGroupSets || []);
            } catch (err) {
                console.error("Error loading group sets:", err);
            }
        };

        loadGroupSets();
    }, []);

    const showGroupSetSelector = visualization.properties["layout.items"]?.includes("cascading-organisations-with-groupset") || false;
    return (
        <Stack>
            <Stack>
                <Text>Filter Items</Text>
                <CheckboxGroup
                    colorScheme="green"
                    onChange={(value) => {
                        sectionApi.changeVisualizationProperties({
                            visualization: visualization.id,
                            attribute: "layout.items",
                            value,
                        });
                    }}
                    value={visualization.properties["layout.items"]}
                >
                    <Stack spacing={[1, 5]} direction={["column", "row"]}>
                        <Checkbox value="periods">Periods</Checkbox>
                        <Checkbox value="organisations">Organisations</Checkbox>
                        <Checkbox value="cascading-organisations">
                            Cascading Organisations
                        </Checkbox>
                        <Checkbox value="cascading-organisations-with-levels">
                            Cascading Organisations + Levels
                        </Checkbox>
                        <Checkbox value="cascading-organisations-with-groups">
                            Cascading Organisations + Groups
                        </Checkbox>
                        <Checkbox value="cascading-organisations-with-all">
                            Cascading Organisations + Levels & Groups
                        </Checkbox>
                        <Checkbox value="cascading-organisations-with-groupset">
                            Cascading Organisations + Group Set
                        </Checkbox>
                        <Checkbox value="organisations-levels">
                            Organisations Levels
                        </Checkbox>
                        <Checkbox value="attributes">Attributes</Checkbox>
                        <Checkbox value="dates">Date Ranges</Checkbox>
                        <Checkbox value="category-combo">
                            Category Combo
                        </Checkbox>
                    </Stack>
                </CheckboxGroup>
            </Stack>

            <SwitchProperty
                visualization={visualization}
                title="Group"
                attribute="grouped"
            />

            {!visualization.properties["group"] && (
                <Stack>
                    <Text>Alignment</Text>
                    <RadioGroup
                        onChange={(e: string) =>
                            sectionApi.changeVisualizationProperties({
                                visualization: visualization.id,
                                attribute: "layout.alignment",
                                value: e,
                            })
                        }
                        value={visualization.properties["layout.alignment"]}
                    >
                        <Stack direction="row">
                            <Radio value="row">Row</Radio>
                            <Radio value="column">Column</Radio>
                        </Stack>
                    </RadioGroup>
                </Stack>
            )}

            {showGroupSetSelector && (
                <SelectProperty
                    visualization={visualization}
                    attribute="cascade.groupSet"
                    title="Organization Unit Group Set"
                    options={groupSets}
                />
            )}
        </Stack>
    );
}
