import React, { useState, useEffect } from "react";
import { Stack, Text, Box, Badge, Spinner, Button } from "@chakra-ui/react";
import { GroupBase, Select } from "chakra-react-select";
import { useDataEngine } from "@dhis2/app-runtime";
import { storeApi } from "../../Events";
import { ChevronDownIcon } from "@chakra-ui/icons";

interface CascadingOption {
    label: string;
    value: string;
    id: string;
}

export default function CascadingOrgUnitPicker() {
    const engine = useDataEngine();
    const [firstLevelOptions, setFirstLevelOptions] = useState<CascadingOption[]>([]);
    const [secondLevelOptions, setSecondLevelOptions] = useState<CascadingOption[]>([]);
    const [thirdLevelOptions, setThirdLevelOptions] = useState<CascadingOption[]>([]);
    const [fourthLevelOptions, setFourthLevelOptions] = useState<CascadingOption[]>([]);
    const [selectedFirstLevel, setSelectedFirstLevel] = useState<CascadingOption | null>(null);
    const [selectedSecondLevel, setSelectedSecondLevel] = useState<CascadingOption | null>(null);
    const [selectedThirdLevel, setSelectedThirdLevel] = useState<CascadingOption | null>(null);
    const [selectedFourthLevel, setSelectedFourthLevel] = useState<CascadingOption | null>(null);
    const [loadingFirst, setLoadingFirst] = useState(false);
    const [loadingSecond, setLoadingSecond] = useState(false);
    const [loadingThird, setLoadingThird] = useState(false);
    const [loadingFourth, setLoadingFourth] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Manual load function for first level data
    const loadFirstLevelData = async () => {
        setLoadingFirst(true);
        setError(null);

        try {
            const response: any = await engine.query({
                orgUnits: {
                    resource: "organisationUnits.json",
                    params: {
                        filter: "level:eq:2", // Get second level (states/provinces) directly
                        fields: "id,name,level,path",
                        paging: "false",
                    },
                },
            });

            const units = response.orgUnits.organisationUnits || [];
            const options = units
                .map((unit: any) => ({
                    label: unit.name,
                    value: unit.id,
                    id: unit.id
                }))
                .sort((a: CascadingOption, b: CascadingOption) => a.label.localeCompare(b.label));

            setFirstLevelOptions(options);
            console.log("Loaded first level options:", options.length);
        } catch (err) {
            console.error("Error loading first level data:", err);
            setError("Failed to load organization data");
        } finally {
            setLoadingFirst(false);
        }
    };

    // Manual load function for second level data
    const loadSecondLevelData = async (parentId: string) => {
        setLoadingSecond(true);
        setError(null);

        try {
            const response: any = await engine.query({
                children: {
                    resource: "organisationUnits.json",
                    params: {
                        filter: `id:in:[${parentId}]`,
                        fields: "children[id,name]",
                        paging: "false",
                    },
                },
            });

            const parentUnits = response.children.organisationUnits || [];
            const children = parentUnits.flatMap((unit: any) => unit.children || []);
            const options = children
                .map((child: any) => ({
                    label: child.name,
                    value: child.id,
                    id: child.id
                }))
                .sort((a: CascadingOption, b: CascadingOption) => a.label.localeCompare(b.label));

            setSecondLevelOptions(options);
            console.log("Loaded second level options:", options.length);
        } catch (err) {
            console.error("Error loading second level data:", err);
            setError("Failed to load child organizations");
            setSecondLevelOptions([]);
        } finally {
            setLoadingSecond(false);
        }
    };

    const handleFirstLevelChange = (option: CascadingOption | null) => {
        setSelectedFirstLevel(option);
        setSelectedSecondLevel(null);
        setSelectedThirdLevel(null);
        setSelectedFourthLevel(null);
        setSecondLevelOptions([]);
        setThirdLevelOptions([]);
        setFourthLevelOptions([]);
        setError(null);

        if (option) {
            // Load children for selected option
            loadSecondLevelData(option.value);

            // Update global filter
            try {
                if (storeApi?.setOrganisations) {
                    storeApi.setOrganisations([option.value]);
                }
            } catch (err) {
                console.error("Error updating filter:", err);
            }
        } else {
            // Clear filter
            try {
                if (storeApi?.setOrganisations) {
                    storeApi.setOrganisations([]);
                }
            } catch (err) {
                console.error("Error clearing filter:", err);
            }
        }
    };

    const handleSecondLevelChange = (option: CascadingOption | null) => {
        setSelectedSecondLevel(option);
        setSelectedThirdLevel(null);
        setSelectedFourthLevel(null);
        setThirdLevelOptions([]);
        setFourthLevelOptions([]);

        if (option) {
            // Update filter with second level selection
            try {
                if (storeApi?.setOrganisations) {
                    storeApi.setOrganisations([option.value]);
                }
            } catch (err) {
                console.error("Error updating filter:", err);
            }
        } else if (selectedFirstLevel) {
            // Fall back to first level
            try {
                if (storeApi?.setOrganisations) {
                    storeApi.setOrganisations([selectedFirstLevel.value]);
                }
            } catch (err) {
                console.error("Error updating filter:", err);
            }
        }
    };

    if (error) {
        return (
            <Stack spacing={2} minW="300px">
                <Text fontSize="sm" fontWeight="medium" color="red.500">
                    Error: {error}
                </Text>
                <Button size="sm" onClick={loadFirstLevelData} colorScheme="blue">
                    Retry Loading
                </Button>
            </Stack>
        );
    }

    return (
        <Stack spacing={0.5} minW="300px" position="relative" zIndex={1}>
            {/* Load Data Button */}
            {firstLevelOptions.length === 0 && !loadingFirst && (
                <Box>
                    <Button
                        size="md"
                        onClick={loadFirstLevelData}
                        colorScheme="blue"
                        variant="outline"
                        rightIcon={<ChevronDownIcon />}
                    >
                        Load Organisation Units
                    </Button>
                </Box>
            )}

            {/* Loading State */}
            {loadingFirst && (
                <Box display="flex" alignItems="center" justifyContent="center" h="60px">
                    <Spinner size="md" />
                    <Text ml={3} fontSize="sm">Loading organisation Units...</Text>
                </Box>
            )}

            {/* Current Selection - Simple Display */}
            {(selectedFirstLevel || selectedSecondLevel || selectedThirdLevel || selectedFourthLevel) && (
                <Text fontSize="xs" color="blue.600" fontWeight="medium" mb={0.5}>
                    {[
                        selectedFirstLevel?.label,
                        selectedSecondLevel?.label,
                        selectedThirdLevel?.label,
                        selectedFourthLevel?.label
                    ]
                        .filter(Boolean)
                        .join(" → ")}
                </Text>
            )}

            {/* All Four Levels in One Row */}
            {firstLevelOptions.length > 0 && (
                <Stack direction="row" spacing={4} align="flex-start" position="relative">
                    {/* First Level Dropdown */}
                    <Box flex="1" minW="200px" position="relative">
                        <Text fontSize="xs" fontWeight="medium" color="gray.500" mb={1}>
                            States ({firstLevelOptions.length} available)
                        </Text>
                        <Select<CascadingOption, false, GroupBase<CascadingOption>>
                            value={selectedFirstLevel}
                            onChange={handleFirstLevelChange}
                            options={firstLevelOptions}
                            placeholder="Select State..."
                            isClearable
                            size="sm"
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                            menuPlacement="top"
                            styles={{
                                menuPortal: (base) => ({
                                    ...base,
                                    zIndex: 99999
                                }),
                                menu: (base) => ({
                                    ...base,
                                    minWidth: "200px",
                                    maxHeight: "200px",
                                    overflow: "auto"
                                }),
                                menuList: (base) => ({
                                    ...base,
                                    maxHeight: "200px"
                                }),
                                control: (base) => ({
                                    ...base,
                                    minHeight: "28px"
                                }),
                                placeholder: (base) => ({
                                    ...base,
                                    fontSize: "2px"
                                })
                            }}
                        />
                    </Box>

                    {/* Second Level Dropdown */}
                    <Box flex="1" minW="200px" position="relative">
                        <Text fontSize="xs" fontWeight="medium" color="gray.500" mb={1}>
                            LGAs ({secondLevelOptions.length} available)
                        </Text>
                        {loadingSecond ? (
                            <Box display="flex" alignItems="center" justifyContent="center" h="32px">
                                <Spinner size="sm" />
                                <Text ml={2} fontSize="sm">Loading children...</Text>
                            </Box>
                        ) : (
                                <Select<CascadingOption, false, GroupBase<CascadingOption>>
                                    value={selectedSecondLevel}
                                    onChange={handleSecondLevelChange}
                                    options={secondLevelOptions}
                                    placeholder={selectedFirstLevel ? "Select LGA..." : "Select LGA..."}
                                    isClearable
                                    size="sm"
                                    isDisabled={!selectedFirstLevel}
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
                                    menuPlacement="top"
                                    styles={{
                                        menuPortal: (base) => ({
                                            ...base,
                                            zIndex: 99999
                                        }),
                                        menu: (base) => ({
                                            ...base,
                                            minWidth: "200px",
                                            maxHeight: "200px",
                                            overflow: "auto"
                                        }),
                                        menuList: (base) => ({
                                            ...base,
                                            maxHeight: "200px"
                                        }),
                                        control: (base) => ({
                                            ...base,
                                            minHeight: "28px"
                                        }),
                                        placeholder: (base) => ({
                                            ...base,
                                            fontSize: "12px"
                                        })
                                    }}
                                />
                            )}
                        {!loadingSecond && selectedFirstLevel && secondLevelOptions.length === 0 && (
                            <Text fontSize="xs" color="gray.500" mt={1}>
                                No child organizations available
                            </Text>
                        )}
                    </Box>
                </Stack>
            )}

            {/* Current Selection Display */}
            {(selectedFirstLevel || selectedSecondLevel) && (
                <Box mt={2}>
                    <Text fontSize="xs" fontWeight="medium" color="gray.500">
                        Current Filter:
                    </Text>
                    <Badge colorScheme="blue" fontSize="xs" mt={1}>
                        {selectedSecondLevel
                            ? `${selectedFirstLevel?.label} → ${selectedSecondLevel.label}`
                            : selectedFirstLevel?.label || "None"
                        }
                    </Badge>
                </Box>
            )}
        </Stack>
    );
}