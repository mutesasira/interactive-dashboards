import React, { useState, useEffect } from "react";
import { Stack, Text, Box, Badge, Spinner, Button, Checkbox, Flex } from "@chakra-ui/react";
import { GroupBase, Select } from "chakra-react-select";
import { useDataEngine } from "@dhis2/app-runtime";
import { useStore } from "effector-react";
import { storeApi, datumAPi } from "../../Events";
import { Option } from "../../interfaces";
import { $store } from "../../Store";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { db } from "../../db";

interface CascadingOption {
    label: string;
    value: string;
    id: string;
}

interface CascadingOrgUnitPickerProps {
    showLevels?: boolean;
    showGroups?: boolean;
    showGroupSets?: boolean;
    selectedGroupSet?: string;
}

interface GroupFromSet {
    id: string;
    name: string;
}

export default function CascadingOrgUnitPicker({
    showLevels = false,
    showGroups = false,
    showGroupSets = false,
    selectedGroupSet
}: CascadingOrgUnitPickerProps = {}) {
    const engine = useDataEngine();
    const store = useStore($store);
    
    // Org unit hierarchy state
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


    // Filter data from DHIS2
    const [levels, setLevels] = useState<Option[]>([]);
    const [groups, setGroups] = useState<Option[]>([]);
    const [groupSets, setGroupSets] = useState<Option[]>([]);
    const [groupsFromSet, setGroupsFromSet] = useState<GroupFromSet[]>([]);
    const [loadingLevels, setLoadingLevels] = useState(false);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [loadingGroupSets, setLoadingGroupSets] = useState(false);
    const [loadingGroupsFromSet, setLoadingGroupsFromSet] = useState(false);

    // Selected filter values
    const selectedLevels = store.levels || [];
    const selectedGroups = store.groups || [];
    
    // Functions to load metadata from DHIS2
    const loadLevels = async () => {
        if (levels.length > 0) return; // Already loaded
        setLoadingLevels(true);
        try {
            const response: any = await engine.query({
                levels: {
                    resource: "organisationUnitLevels.json",
                    params: {
                        fields: "id,level~rename(value),name~rename(label)",
                        paging: "false",
                    },
                },
            });
            setLevels(response.levels?.organisationUnitLevels || []);
        } catch (err) {
            console.error("Error loading levels:", err);
        } finally {
            setLoadingLevels(false);
        }
    };

    const loadGroups = async () => {
        if (groups.length > 0) return; // Already loaded
        setLoadingGroups(true);
        try {
            const response: any = await engine.query({
                groups: {
                    resource: "organisationUnitGroups.json",
                    params: {
                        fields: "id~rename(value),name~rename(label)",
                        paging: "false",
                    },
                },
            });
            setGroups(response.groups?.organisationUnitGroups || []);
        } catch (err) {
            console.error("Error loading groups:", err);
        } finally {
            setLoadingGroups(false);
        }
    };

    const loadGroupSets = async () => {
        if (groupSets.length > 0) return; // Already loaded
        setLoadingGroupSets(true);
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
        } finally {
            setLoadingGroupSets(false);
        }
    };
    
    // Function to load groups from a specific group set
    const loadGroupsFromSet = async (groupSetId: string) => {
        setLoadingGroupsFromSet(true);
        try {
            const response: any = await engine.query({
                groupSet: {
                    resource: `organisationUnitGroupSets/${groupSetId}.json`,
                    params: {
                        fields: "organisationUnitGroups[id,name]",
                    },
                },
            });

            const groupsData = response.groupSet?.organisationUnitGroups || [];
            setGroupsFromSet(groupsData);
        } catch (err) {
            console.error("Error loading groups from set:", err);
            setGroupsFromSet([]);
        } finally {
            setLoadingGroupsFromSet(false);
        }
    };

    // Effects to load data when component mounts or props change
    useEffect(() => {
        if (showLevels) {
            loadLevels();
        }
    }, [showLevels]);

    useEffect(() => {
        if (showGroups && !showGroupSets) {
            loadGroups();
        }
    }, [showGroups, showGroupSets]);

    // Effect to load groups when group set is selected
    useEffect(() => {
        if (selectedGroupSet && showGroupSets) {
            loadGroupsFromSet(selectedGroupSet);
        }
    }, [selectedGroupSet, showGroupSets]);

    // Filter handlers
    const handleLevelsChange = (selectedOptions: readonly Option[] | null) => {
        const levelIds = selectedOptions?.map((option) => String(option.value)) || [];
        
        
        // Clear existing level dimensions first
        if (selectedLevels.length > 0) {
            selectedLevels.forEach(levelId => {
                datumAPi.changeDimension({
                    id: levelId,
                    type: "filter",
                    dimension: "ou",
                    resource: "oul",
                    prefix: "LEVEL-",
                    remove: true,
                });
            });
        }
        
        // Add new level dimensions
        levelIds.forEach(levelId => {
            datumAPi.changeDimension({
                id: levelId,
                type: "filter",
                dimension: "ou",
                resource: "oul",
                prefix: "LEVEL-",
            });
        });
        
        // Also update the global store for UI consistency
        storeApi.changeLevels(levelIds);
    };

    const handleGroupsChange = (selectedOptions: readonly Option[] | null) => {
        const groupIds = selectedOptions?.map((option) => String(option.value)) || [];
        
        
        // Clear existing group dimensions first
        if (selectedGroups.length > 0) {
            selectedGroups.forEach(groupId => {
                datumAPi.changeDimension({
                    id: groupId,
                    type: "filter",
                    dimension: "ou",
                    resource: "oug",
                    prefix: "OU_GROUP-",
                    remove: true,
                });
            });
        }
        
        // Add new group dimensions
        groupIds.forEach(groupId => {
            datumAPi.changeDimension({
                id: groupId,
                type: "filter",
                dimension: "ou",
                resource: "oug",
                prefix: "OU_GROUP-",
            });
        });
        
        // Also update the global store for UI consistency
        storeApi.setGroups(groupIds);
    };

    const handleGroupsFromSetChange = (selectedOptions: readonly GroupFromSet[] | null) => {
        const groupIds = selectedOptions?.map((option) => option.id) || [];
        
        
        // Clear ALL existing group dimensions first - not just from current set
        if (selectedGroups.length > 0) {
            selectedGroups.forEach(groupId => {
                datumAPi.changeDimension({
                    id: groupId,
                    type: "filter",
                    dimension: "ou", 
                    resource: "oug",
                    prefix: "OU_GROUP-",
                    remove: true,
                });
            });
        }
        
        // Add new group dimensions
        groupIds.forEach(groupId => {
            datumAPi.changeDimension({
                id: groupId,
                type: "filter",
                dimension: "ou",
                resource: "oug", 
                prefix: "OU_GROUP-",
            });
        });
        
        // Also update the global store for UI consistency
        storeApi.setGroups(groupIds);
    };

    // Check if user has full hierarchy access (for showing groups/groupsets)
    const [hasFullAccess, setHasFullAccess] = useState(false);
    // Track user's accessibility levels to hide dropdowns they shouldn't see
    const [userAccessLevels, setUserAccessLevels] = useState<{
        minLevel: number;
        maxLevel: number;
        hasLevel2: boolean;
        hasLevel3: boolean;
        hasLevel4: boolean;
        hasLevel5: boolean;
    }>({
        minLevel: 2,
        maxLevel: 5,
        hasLevel2: false,
        hasLevel3: false,
        hasLevel4: false,
        hasLevel5: false
    });

    // Manual load function for first level data - uses user's accessible org units
    const loadFirstLevelData = async () => {
        setLoadingFirst(true);
        setError(null);

        try {
            // First try to get user's accessible org units from local db
            const userOrgUnits = await db.organisations.toArray();
            
            if (userOrgUnits && userOrgUnits.length > 0) {
                // Analyze user's org unit access levels
                const levels = userOrgUnits.map((unit: any) => unit.level);
                const minLevel = Math.min(...levels);
                const maxLevel = Math.max(...levels);
                const levelCounts = {
                    level2: userOrgUnits.filter((unit: any) => unit.level === 2).length,
                    level3: userOrgUnits.filter((unit: any) => unit.level === 3).length,
                    level4: userOrgUnits.filter((unit: any) => unit.level === 4).length,
                    level5: userOrgUnits.filter((unit: any) => unit.level === 5).length,
                };

                // Determine access pattern
                const accessLevels = {
                    minLevel,
                    maxLevel,
                    hasLevel2: levelCounts.level2 > 0,
                    hasLevel3: levelCounts.level3 > 0,
                    hasLevel4: levelCounts.level4 > 0,
                    hasLevel5: levelCounts.level5 > 0
                };
                setUserAccessLevels(accessLevels);

                // Check if user has broad access (multiple level 2 units or access starts at level 2)
                setHasFullAccess(levelCounts.level2 > 3 || (minLevel === 2 && levelCounts.level2 > 1));
                
                // Filter org units to show appropriate level for first dropdown
                let optionsForFirstLevel = userOrgUnits;
                
                // If user starts at level 3 or higher, use those as first level options
                if (minLevel > 2) {
                    optionsForFirstLevel = userOrgUnits.filter((unit: any) => unit.level === minLevel);
                } else {
                    // User has level 2 access, use level 2 units
                    optionsForFirstLevel = userOrgUnits.filter((unit: any) => unit.level === 2);
                }

                const options = optionsForFirstLevel
                    .map((unit: any) => ({
                        label: unit.title,
                        value: unit.id,
                        id: unit.id,
                        level: unit.level
                    }))
                    .sort((a: CascadingOption, b: CascadingOption) => a.label.localeCompare(b.label));

                setFirstLevelOptions(options);
            } else {
                // Fallback: load from DHIS2 if local db is empty - assume full access
                setHasFullAccess(true);
                setUserAccessLevels({
                    minLevel: 2,
                    maxLevel: 5,
                    hasLevel2: true,
                    hasLevel3: true,
                    hasLevel4: true,
                    hasLevel5: true
                });
                
                const response: any = await engine.query({
                    orgUnits: {
                        resource: "organisationUnits.json",
                        params: {
                            filter: "level:eq:2",
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
            }
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
        } catch (err) {
            console.error("Error loading second level data:", err);
            setError("Failed to load child organizations");
            setSecondLevelOptions([]);
        } finally {
            setLoadingSecond(false);
        }
    };

    // Load third level data
    const loadThirdLevelData = async (parentId: string) => {
        setLoadingThird(true);
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

            setThirdLevelOptions(options);
        } catch (err) {
            console.error("Error loading third level data:", err);
            setError("Failed to load third level organizations");
            setThirdLevelOptions([]);
        } finally {
            setLoadingThird(false);
        }
    };

    // Load fourth level data
    const loadFourthLevelData = async (parentId: string) => {
        setLoadingFourth(true);
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

            setFourthLevelOptions(options);
        } catch (err) {
            console.error("Error loading fourth level data:", err);
            setError("Failed to load fourth level organizations");
            setFourthLevelOptions([]);
        } finally {
            setLoadingFourth(false);
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

            // Update global filter and selected org unit name
            try {
                if (storeApi?.setOrganisations) {
                    storeApi.setOrganisations([option.value]);
                }
                storeApi.setSelectedOrgUnitName(option.label);
            } catch (err) {
                console.error("Error updating filter:", err);
            }
        } else {
            // Clear filter and name
            try {
                if (storeApi?.setOrganisations) {
                    storeApi.setOrganisations([]);
                }
                storeApi.setSelectedOrgUnitName("");
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
            // Load children for selected option
            loadThirdLevelData(option.value);

            // Update filter with second level selection
            try {
                if (storeApi?.setOrganisations) {
                    storeApi.setOrganisations([option.value]);
                }
                storeApi.setSelectedOrgUnitName(option.label);
            } catch (err) {
                console.error("Error updating filter:", err);
            }
        } else if (selectedFirstLevel) {
            // Fall back to first level
            try {
                if (storeApi?.setOrganisations) {
                    storeApi.setOrganisations([selectedFirstLevel.value]);
                }
                storeApi.setSelectedOrgUnitName(selectedFirstLevel.label);
            } catch (err) {
                console.error("Error updating filter:", err);
            }
        }
    };

    const handleThirdLevelChange = (option: CascadingOption | null) => {
        setSelectedThirdLevel(option);
        setSelectedFourthLevel(null);
        setFourthLevelOptions([]);

        if (option) {
            // Load children for selected option
            loadFourthLevelData(option.value);

            // Update filter with third level selection
            try {
                if (storeApi?.setOrganisations) {
                    storeApi.setOrganisations([option.value]);
                }
                storeApi.setSelectedOrgUnitName(option.label);
            } catch (err) {
                console.error("Error updating filter:", err);
            }
        } else if (selectedSecondLevel) {
            // Fall back to second level
            try {
                if (storeApi?.setOrganisations) {
                    storeApi.setOrganisations([selectedSecondLevel.value]);
                }
                storeApi.setSelectedOrgUnitName(selectedSecondLevel.label);
            } catch (err) {
                console.error("Error updating filter:", err);
            }
        }
    };

    const handleFourthLevelChange = (option: CascadingOption | null) => {
        setSelectedFourthLevel(option);

        if (option) {
            // Update filter with fourth level selection
            try {
                if (storeApi?.setOrganisations) {
                    storeApi.setOrganisations([option.value]);
                }
                storeApi.setSelectedOrgUnitName(option.label);
            } catch (err) {
                console.error("Error updating filter:", err);
            }
        } else if (selectedThirdLevel) {
            // Fall back to third level
            try {
                if (storeApi?.setOrganisations) {
                    storeApi.setOrganisations([selectedThirdLevel.value]);
                }
                storeApi.setSelectedOrgUnitName(selectedThirdLevel.label);
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
        <Stack spacing={2} minW="300px" position="relative" zIndex={1}>
            {/* <Text fontSize="sm" fontWeight="medium" color="gray.600">
                Organization Units (Cascading)
            </Text> */}

            {/* Combined Filters and Cascading Row */}
            {(firstLevelOptions.length === 0 || showLevels || showGroups || showGroupSets || firstLevelOptions.length > 0) && (
                <Flex direction="row" align="flex-start" gap={3} wrap="wrap">
                    {/* Load Data Button - Only show when needed */}
                    {firstLevelOptions.length === 0 && !loadingFirst && (
                        <Box minW="120px">
                            <Text fontSize="xs" fontWeight="medium" color="gray.500" mb={1}>
                                Organization Units
                            </Text>
                            <Button
                                size="sm"
                                onClick={loadFirstLevelData}
                                colorScheme="blue"
                                variant="outline"
                                rightIcon={<ChevronDownIcon />}
                                width="100%"
                            >
                                Load
                            </Button>
                        </Box>
                    )}

                    {/* Additional Filter Buttons - Only show for users with full access */}
                    {showLevels && hasFullAccess && (
                        <Box minW="200px">
                            <Text fontSize="xs" fontWeight="medium" color="gray.500" mb={1}>
                                Organization Unit Levels
                            </Text>
                            {loadingLevels ? (
                                <Flex align="center" justify="center" h="32px">
                                    <Spinner size="sm" />
                                    <Text ml={2} fontSize="xs">Loading...</Text>
                                </Flex>
                            ) : (
                                <Select<Option, true, GroupBase<Option>>
                                    isMulti
                                    isDisabled={loadingFirst || loadingSecond || loadingThird || loadingFourth}
                                    value={levels.filter((level) => 
                                        selectedLevels.indexOf(String(level.value)) !== -1
                                    )}
                                    onChange={handleLevelsChange}
                                    options={levels}
                                    placeholder={loadingFirst || loadingSecond || loadingThird || loadingFourth ? "Loading cascading..." : "Select levels..."}
                                    size="sm"
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
                                    styles={{
                                        menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                                        control: (base) => ({ ...base, minHeight: "32px" })
                                    }}
                                />
                            )}
                        </Box>
                    )}

                    {showGroups && !showGroupSets && hasFullAccess && (
                        <Box minW="200px">
                            <Text fontSize="xs" fontWeight="medium" color="gray.500" mb={1}>
                                Organization Unit Groups
                            </Text>
                            {loadingGroups ? (
                                <Flex align="center" justify="center" h="32px">
                                    <Spinner size="sm" />
                                    <Text ml={2} fontSize="xs">Loading...</Text>
                                </Flex>
                            ) : (
                                <Select<Option, true, GroupBase<Option>>
                                    isMulti
                                    isDisabled={loadingFirst || loadingSecond || loadingThird || loadingFourth}
                                    value={groups.filter((group) => 
                                        selectedGroups.indexOf(String(group.value)) !== -1
                                    )}
                                    onChange={handleGroupsChange}
                                    options={groups}
                                    placeholder={loadingFirst || loadingSecond || loadingThird || loadingFourth ? "Loading cascading..." : "Select groups..."}
                                    size="sm"
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
                                    styles={{
                                        menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                                        control: (base) => ({ ...base, minHeight: "32px" })
                                    }}
                                />
                            )}
                        </Box>
                    )}

                    {showGroupSets && selectedGroupSet && hasFullAccess && (
                        <Box minW="200px">
                            <Text fontSize="xs" fontWeight="medium" color="gray.500" mb={1}>
                                Groups from Selected Set
                            </Text>
                            {loadingGroupsFromSet ? (
                                <Flex align="center" justify="center" h="32px">
                                    <Spinner size="sm" />
                                    <Text ml={2} fontSize="xs">Loading...</Text>
                                </Flex>
                            ) : (
                                <Select<GroupFromSet, true, GroupBase<GroupFromSet>>
                                    isMulti
                                    isDisabled={loadingFirst || loadingSecond || loadingThird || loadingFourth}
                                    value={groupsFromSet.filter((group) => 
                                        selectedGroups.indexOf(group.id) !== -1
                                    )}
                                    onChange={handleGroupsFromSetChange}
                                    options={groupsFromSet}
                                    getOptionLabel={(option) => option.name}
                                    getOptionValue={(option) => option.id}
                                    placeholder={loadingFirst || loadingSecond || loadingThird || loadingFourth ? "Loading cascading..." : "Select groups..."}
                                    size="sm"
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
                                    styles={{
                                        menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                                        control: (base) => ({ ...base, minHeight: "32px" }),
                                        menu: (base) => ({ 
                                            ...base, 
                                            position: "fixed",
                                            minWidth: "200px" 
                                        }),
                                        menuList: (base) => ({ 
                                            ...base, 
                                            maxHeight: "200px",
                                            overflow: "auto"
                                        })
                                    }}
                                />
                            )}
                        </Box>
                    )}

                    {/* Cascading Dropdowns - Show inline when loaded, respecting user access levels */}
                    {firstLevelOptions.length > 0 && (
                        <>
                            {/* First Level Dropdown - Always show if we have options */}
                            <Box minW="180px" position="relative">
                        <Text fontSize="xs" fontWeight="medium" color="gray.500" mb={1}>
                            {userAccessLevels.minLevel === 2 ? 'Organization Units' : 
                             userAccessLevels.minLevel === 3 ? 'Sub-units' : 
                             userAccessLevels.minLevel === 4 ? 'Level 3' : 'Level 4'} ({firstLevelOptions.length} available)
                        </Text>
                        <Select<CascadingOption, false, GroupBase<CascadingOption>>
                            value={selectedFirstLevel}
                            onChange={handleFirstLevelChange}
                            options={firstLevelOptions}
                            placeholder="Select Organization..."
                            isClearable
                            size="sm"
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                            menuPlacement="auto"
                            styles={{
                                menuPortal: (base) => ({
                                    ...base,
                                    zIndex: 99999
                                }),
                                menu: (base) => ({
                                    ...base,
                                    minWidth: "180px",
                                    maxHeight: "200px",
                                    overflow: "auto"
                                }),
                                menuList: (base) => ({
                                    ...base,
                                    maxHeight: "200px"
                                }),
                                control: (base) => ({
                                    ...base,
                                    minHeight: "32px"
                                })
                            }}
                        />
                    </Box>

                    {/* Second Level Dropdown - Only show if user's access allows next level */}
                    {userAccessLevels.minLevel <= 2 && userAccessLevels.maxLevel >= 3 && (
                        <Box minW="180px" position="relative">
                            <Text fontSize="xs" fontWeight="medium" color="gray.500" mb={1}>
                                Sub-units ({secondLevelOptions.length} available)
                            </Text>
                            {loadingSecond ? (
                                <Box display="flex" alignItems="center" justifyContent="center" h="40px">
                                    <Spinner size="sm" />
                                    <Text ml={2} fontSize="sm">Loading...</Text>
                                </Box>
                            ) : (
                                    <Select<CascadingOption, false, GroupBase<CascadingOption>>
                                        value={selectedSecondLevel}
                                        onChange={handleSecondLevelChange}
                                        options={secondLevelOptions}
                                        placeholder={selectedFirstLevel ? "Select Sub-unit..." : "Select Organization first"}
                                        isClearable
                                        size="sm"
                                        isDisabled={!selectedFirstLevel}
                                        menuPortalTarget={document.body}
                                        menuPosition="fixed"
                                        menuPlacement="auto"
                                        styles={{
                                            menuPortal: (base) => ({
                                                ...base,
                                                zIndex: 99999
                                            }),
                                            menu: (base) => ({
                                                ...base,
                                                minWidth: "180px",
                                                maxHeight: "200px",
                                                overflow: "auto"
                                            }),
                                            menuList: (base) => ({
                                                ...base,
                                                maxHeight: "200px"
                                            }),
                                            control: (base) => ({
                                                ...base,
                                                minHeight: "32px"
                                            })
                                        }}
                                    />
                                )}
                            {!loadingSecond && selectedFirstLevel && secondLevelOptions.length === 0 && (
                                <Text fontSize="xs" color="gray.500" mt={1}>
                                    No sub-units available
                                </Text>
                            )}
                        </Box>
                    )}

                    {/* Third Level Dropdown - Only show if user's access allows level 4 */}
                    {userAccessLevels.minLevel <= 3 && userAccessLevels.maxLevel >= 4 && (
                        <Box minW="180px" position="relative">
                            <Text fontSize="xs" fontWeight="medium" color="gray.500" mb={1}>
                                Level 3 ({thirdLevelOptions.length} available)
                            </Text>
                            {loadingThird ? (
                                <Box display="flex" alignItems="center" justifyContent="center" h="40px">
                                    <Spinner size="sm" />
                                    <Text ml={2} fontSize="sm">Loading...</Text>
                                </Box>
                            ) : (
                                    <Select<CascadingOption, false, GroupBase<CascadingOption>>
                                        value={selectedThirdLevel}
                                        onChange={handleThirdLevelChange}
                                        options={thirdLevelOptions}
                                        placeholder={selectedSecondLevel ? "Select Level 3..." : "Select Sub-unit first"}
                                        isClearable
                                        size="sm"
                                        isDisabled={!selectedSecondLevel}
                                        menuPortalTarget={document.body}
                                        menuPosition="fixed"
                                        menuPlacement="auto"
                                        styles={{
                                            menuPortal: (base) => ({
                                                ...base,
                                                zIndex: 99999
                                            }),
                                            menu: (base) => ({
                                                ...base,
                                                minWidth: "180px",
                                                maxHeight: "200px",
                                                overflow: "auto"
                                            }),
                                            menuList: (base) => ({
                                                ...base,
                                                maxHeight: "200px"
                                            }),
                                            control: (base) => ({
                                                ...base,
                                                minHeight: "32px"
                                            })
                                        }}
                                    />
                                )}
                            {!loadingThird && selectedSecondLevel && thirdLevelOptions.length === 0 && (
                                <Text fontSize="xs" color="gray.500" mt={1}>
                                    No Level 3 units available
                                </Text>
                            )}
                        </Box>
                    )}

                    {/* Fourth Level Dropdown - Only show if user's access allows level 5 */}
                    {userAccessLevels.minLevel <= 4 && userAccessLevels.maxLevel >= 5 && (
                        <Box minW="180px" position="relative">
                            <Text fontSize="xs" fontWeight="medium" color="gray.500" mb={1}>
                                Level 4 ({fourthLevelOptions.length} available)
                            </Text>
                            {loadingFourth ? (
                                <Box display="flex" alignItems="center" justifyContent="center" h="40px">
                                    <Spinner size="sm" />
                                    <Text ml={2} fontSize="sm">Loading...</Text>
                                </Box>
                            ) : (
                                    <Select<CascadingOption, false, GroupBase<CascadingOption>>
                                        value={selectedFourthLevel}
                                        onChange={handleFourthLevelChange}
                                        options={fourthLevelOptions}
                                        placeholder={selectedThirdLevel ? "Select Level 4..." : "Select Level 3 first"}
                                        isClearable
                                        size="sm"
                                        isDisabled={!selectedThirdLevel}
                                        menuPortalTarget={document.body}
                                        menuPosition="fixed"
                                        menuPlacement="auto"
                                        styles={{
                                            menuPortal: (base) => ({
                                                ...base,
                                                zIndex: 99999
                                            }),
                                            menu: (base) => ({
                                                ...base,
                                                minWidth: "180px",
                                                maxHeight: "200px",
                                                overflow: "auto"
                                            }),
                                            menuList: (base) => ({
                                                ...base,
                                                maxHeight: "200px"
                                            }),
                                            control: (base) => ({
                                                ...base,
                                                minHeight: "32px"
                                            })
                                        }}
                                    />
                                )}
                            {!loadingFourth && selectedThirdLevel && fourthLevelOptions.length === 0 && (
                                <Text fontSize="xs" color="gray.500" mt={1}>
                                    No Level 4 units available
                                </Text>
                            )}
                        </Box>
                    )}
                        </>
                    )}
                </Flex>
            )}

            {/* Loading State */}
            {loadingFirst && (
                <Box display="flex" alignItems="center" justifyContent="center" h="60px">
                    <Spinner size="md" />
                    <Text ml={3} fontSize="sm">Loading States...</Text>
                </Box>
            )}

            {/* Current Selection Display */}
            {(selectedFirstLevel || selectedSecondLevel || selectedThirdLevel || selectedFourthLevel) && (
                <Box mt={2}>
                    <Text fontSize="xs" fontWeight="medium" color="gray.500">
                        Selected Organization:
                    </Text>
                    <Badge colorScheme="blue" fontSize="xs" mt={1}>
                        {selectedFourthLevel
                            ? `${selectedFirstLevel?.label} → ${selectedSecondLevel?.label} → ${selectedThirdLevel?.label} → ${selectedFourthLevel.label}`
                            : selectedThirdLevel
                                ? `${selectedFirstLevel?.label} → ${selectedSecondLevel?.label} → ${selectedThirdLevel.label}`
                                : selectedSecondLevel
                                    ? `${selectedFirstLevel?.label} → ${selectedSecondLevel.label}`
                                    : selectedFirstLevel?.label || "None"
                        }
                    </Badge>
                </Box>
            )}
        </Stack>
    );
}