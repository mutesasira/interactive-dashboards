import React, { useState, useEffect, useRef, useCallback } from "react";
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
    level: number;
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
}: CascadingOrgUnitPickerProps) {
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
    const [fifthLevelOptions, setFifthLevelOptions] = useState<CascadingOption[]>([]);
    const [selectedFifthLevel, setSelectedFifthLevel] = useState<CascadingOption | null>(null);
    const [loadingFifth, setLoadingFifth] = useState(false);

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

    // System initialization state
    const [isSystemInitialized, setIsSystemInitialized] = useState(false);

    // Track which levels are locked (auto-selected parents)
    const [lockedLevels, setLockedLevels] = useState({
        level1: false,
        level2: false,
        level3: false,
        level4: false,
        level5: false,
    });

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

    // Effect to monitor system initialization
    useEffect(() => {
        const checkInitialization = async () => {
            if (store.systemId && !isSystemInitialized) {
                const units = await db.organisations.toArray();
                if (units && units.length > 0) {
                    console.log("System initialized: Found", units.length, "organization units");
                    setIsSystemInitialized(true);
                }
            }
        };

        // Check immediately
        checkInitialization();

        // Set up a timer to check periodically until initialized
        const interval = setInterval(checkInitialization, 500);

        // Clear interval when initialized or component unmounts
        return () => {
            clearInterval(interval);
        };
    }, [store.systemId, isSystemInitialized]);

    // Debug effect to track firstLevelOptions changes
    useEffect(() => {
        console.log("firstLevelOptions changed:", firstLevelOptions.length, "items");
        if (firstLevelOptions.length > 0) {
            console.log("First few items:", firstLevelOptions.slice(0, 3));
        }
    }, [firstLevelOptions]);

    useEffect(() => {
        if (isSystemInitialized && firstLevelOptions.length === 0 && !loadingFirst) {
            loadFirstLevelData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSystemInitialized,]);

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

    const allowedIdsRef = useRef<Set<string>>(new Set());

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

    const restrictOptions = useCallback(
        (opts: CascadingOption[], parentId?: string, targetLevel?: number) => {
            if (hasFullAccess) return opts;

            const allowed = allowedIdsRef.current;
            const userMin = userAccessLevels.minLevel; // ← from state

            // BELOW the user's level: if parent is allowed, show all its children
            if (parentId && allowed.has(parentId) && targetLevel !== undefined && targetLevel > userMin) {
                return opts;
            }

            // At/above the user's level: only explicitly allowed ids (hides siblings at user's level)
            return opts.filter(o => allowed.has(o.id));
        },
        [hasFullAccess, userAccessLevels.minLevel]
    );


    // Function to load level 2 options for broad access users
    const loadBroadAccessLevel2Options = async () => {
        console.log("Loading level 2 options for broad access user");
        try {
            const response: any = await engine.query({
                orgUnits: {
                    resource: "organisationUnits.json",
                    params: {
                        filter: "level:eq:2",
                        fields: "id,name,level",
                        paging: "false",
                    },
                },
            });

            const units = response.orgUnits.organisationUnits || [];
            const options = units
                .map((unit: any) => ({
                    label: unit.name,
                    value: unit.id,
                    id: unit.id,
                    level: 2
                }))
                .sort((a: CascadingOption, b: CascadingOption) => a.label.localeCompare(b.label));

            console.log("Loaded", options.length, "level 2 options for broad access");
            setFirstLevelOptions(options);

        } catch (error) {
            console.error("Error loading broad access options:", error);
        }
    };

    // Function to load full hierarchy and auto-select parents
    const loadHierarchyAndAutoSelect = async (userOrgUnits: any[], userMinLevel: number) => {
        console.log("Loading hierarchy for user starting at level", userMinLevel);

        try {
            // Get the user's unit at their deepest level (the one we want to trace back from)
            const userUnit = userOrgUnits.find(unit => unit.level === userMinLevel) || userOrgUnits[0];
            if (!userUnit) return;

            console.log("User's target unit for hierarchy:", userUnit.title, "at level", userUnit.level);
            console.log("Tracing hierarchy back from this unit to level 1");

            // Load the full path to this unit to get all parents
            console.log("Querying DHIS2 for org unit path:", userUnit.id);
            const pathResponse: any = await engine.query({
                orgUnitPath: {
                    resource: `organisationUnits/${userUnit.id}.json`,
                    params: {
                        fields: "path,ancestors[id,name,level]"
                    }
                }
            });

            console.log("Path response:", pathResponse);
            const ancestors = pathResponse.orgUnitPath?.ancestors || [];
            if (!hasFullAccess) {
                const tmp = new Set(allowedIdsRef.current);
                ancestors.forEach((a: any) => tmp.add(a.id));
                allowedIdsRef.current = tmp;
            }
            console.log("Found", ancestors.length, "ancestors:", ancestors.map((a: any) => `${a.name} (L${a.level})`));

            // Auto-select and load the hierarchy from level 1 down to user's level
            if (ancestors.length > 0) {
                // Start from level 1 (country level)
                const level1Unit = ancestors.find((a: any) => a.level === 1);
                if (level1Unit) {
                    // Load level 1 options
                    const level1Options = [{
                        label: level1Unit.name,
                        value: level1Unit.id,
                        id: level1Unit.id,
                        level: 1
                    }];
                    setFirstLevelOptions(level1Options);
                    setSelectedFirstLevel(level1Options[0]);

                    // Set locked levels - all levels above user's min level are locked
                    const newLockedLevels = {
                        level1: userMinLevel > 1,
                        level2: userMinLevel > 2,
                        level3: userMinLevel > 3,
                        level4: userMinLevel > 4,
                        level5: userMinLevel > 5,
                    };
                    console.log("=== SETTING LOCKED LEVELS ===");
                    console.log("userMinLevel:", userMinLevel);
                    console.log("newLockedLevels:", newLockedLevels);
                    setLockedLevels(newLockedLevels);
                    console.log("Locked levels set in state");

                    // Auto-select each level down to the user's accessible level
                    await autoSelectHierarchyLevel(
                        level1Unit.id,
                        2,
                        userMinLevel,
                        ancestors,
                        userOrgUnits,
                        userUnit.id
                    );
                }
            }
        } catch (error) {
            console.error("Error loading hierarchy:", error);
            console.error("Full error details:", error);
            // Fallback to showing user's units at their level
            console.log("Using fallback approach - showing user units at level", userMinLevel);
            const fallbackOptions = userOrgUnits
                .filter((unit: any) => unit.level === userMinLevel)
                .map((unit: any) => ({
                    // label: unit.title,
                    label: unit.name,
                    value: unit.id,
                    id: unit.id,
                    level: unit.level
                }));
            setFirstLevelOptions(fallbackOptions);
            console.log("Fallback options set:", fallbackOptions.length, "items");
        }
    };

    // Recursive function to auto-select hierarchy levels
    // ⬇️ REPLACE the whole autoSelectHierarchyLevel with this
    const autoSelectHierarchyLevel = async (
        parentId: string,
        targetLevel: number,
        userMinLevel: number,
        ancestors: any[],
        userOrgUnits: any[],
        userUnitId?: string,
    ) => {
        if (targetLevel > userMinLevel) return;

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
            const children = parentUnits.flatMap((u: any) => u.children || []);
            const base = children.map((c: any) => ({
                label: c.name,
                value: c.id,
                id: c.id,
                level: targetLevel,
            }));
            const options = restrictOptions(base, parentId, targetLevel).sort((a, b) => a.label.localeCompare(b.label));

            const setLevel = async (
                setOptions: (o: CascadingOption[]) => void,
                setSelected: (o: CascadingOption | null) => void,
                nextLoader?: (id: string) => Promise<void>
            ) => {
                setOptions(options);

                // Try to find the ancestor node at this level (the user's path)
                const ancestor = ancestors.find((a: any) => a.level === targetLevel);
                let chosen =
                    ancestor ? options.find((o) => o.id === ancestor.id) : undefined;

                if (!chosen && userUnitId && targetLevel === userMinLevel) {
                    chosen = options.find(o => o.id === userUnitId);
                }

                if (targetLevel < userMinLevel) {
                    // We are still walking down to the user's own level → select the path node and recurse
                    if (!chosen && !hasFullAccess && options.length === 1) {
                        chosen = options[0];
                    }
                    if (chosen) {
                        if (!hasFullAccess) {
                            allowedIdsRef.current.add(chosen.id);
                        }
                        setSelected(chosen);
                        await autoSelectHierarchyLevel(
                            chosen.id,
                            targetLevel + 1,
                            userMinLevel,
                            ancestors,
                            userOrgUnits,
                            userUnitId
                        );
                    }
                    return;
                }

                // targetLevel === userMinLevel (the user's own level)
                if (!chosen && options.length === 1) {
                    chosen = options[0];
                }

                if (chosen) {
                    if (!hasFullAccess) {
                        allowedIdsRef.current.add(chosen.id);
                    }
                    setSelected(chosen);
                    storeApi?.setOrganisations?.([chosen.value]);
                    storeApi.setSelectedOrgUnitName(chosen.label);

                    // Just LOAD the next level; do NOT auto-select any child
                    if (nextLoader) await nextLoader(chosen.value);
                } else {
                    // Multiple allowed options at the user's level → leave unselected; they will choose
                    setSelected(null);
                }
            };

            if (targetLevel === 2) {
                await setLevel(setSecondLevelOptions, setSelectedSecondLevel, loadThirdLevelData);
            } else if (targetLevel === 3) {
                await setLevel(setThirdLevelOptions, setSelectedThirdLevel, loadFourthLevelData);
            } else if (targetLevel === 4) {
                await setLevel(setFourthLevelOptions, setSelectedFourthLevel, loadFifthLevelData);
            } else if (targetLevel === 5) {
                // No deeper level
                await setLevel(setFifthLevelOptions, setSelectedFifthLevel);
            }
        } catch (error) {
            console.error(`Error loading level ${targetLevel}:`, error);
        }
    };


    // ⬇️ ADD THIS BLOCK inside CascadingOrgUnitPicker component
    const getCurrentUserKey = useCallback(async () => {
        try {
            const me: any = await engine.query({
                me: { resource: "me", params: { fields: "id,username" } },
            });
            const uid = me?.me?.id || me?.me?.username || "unknown";
            return `${store.systemId || ""}:${uid}`;
        } catch {
            return `${store.systemId || ""}:unknown`;
        }
    }, [engine, store.systemId]);

    const ensureCacheForUser = useCallback(async () => {
        const ownerKey = await getCurrentUserKey();
        const prev = localStorage.getItem("ou-cache-owner");

        if (prev !== ownerKey) {
            // Different user/server → clear org-units cache and reset in-memory state
            await db.organisations.clear();

            // reset in-memory cascade state
            allowedIdsRef.current = new Set();
            setFirstLevelOptions([]);
            setSecondLevelOptions([]);
            setThirdLevelOptions([]);
            setFourthLevelOptions([]);
            setFifthLevelOptions([]);
            setSelectedFirstLevel(null);
            setSelectedSecondLevel(null);
            setSelectedThirdLevel(null);
            setSelectedFourthLevel(null);
            setSelectedFifthLevel(null);
            setLockedLevels({ level1: false, level2: false, level3: false, level4: false, level5: false });
            setHasFullAccess(false);
            setUserAccessLevels({ minLevel: 2, maxLevel: 5, hasLevel2: false, hasLevel3: false, hasLevel4: false, hasLevel5: false });

            // allow the auto-loader to run again
            didAutoLoad.current = false;

            localStorage.setItem("ou-cache-owner", ownerKey);
        }
    }, [
        db,
        getCurrentUserKey,
        setFirstLevelOptions,
        setSecondLevelOptions,
        setThirdLevelOptions,
        setFourthLevelOptions,
        setFifthLevelOptions,
        setSelectedFirstLevel,
        setSelectedSecondLevel,
        setSelectedThirdLevel,
        setSelectedFourthLevel,
        setSelectedFifthLevel,
        setLockedLevels,
        setHasFullAccess,
        setUserAccessLevels,
    ]);


    // Manual load function for first level data - uses user's accessible org units
    const didAutoLoad = useRef(false);

    const loadFirstLevelData = async () => {
        if (didAutoLoad.current) return;
        if (loadingFirst) return;
        if (firstLevelOptions.length > 0) return;

        didAutoLoad.current = true;     // mark immediately to prevent a second call
        setLoadingFirst(true);
        setError(null);

        await ensureCacheForUser();

        setLoadingFirst(true);
        setError(null);

        try {
            // First try to get user's accessible org units from local db
            console.log("Loading organization units from local database...");
            let userOrgUnits = await db.organisations.toArray();
            console.log("Found", userOrgUnits?.length || 0, "organization units in local database");

            // If no data found, wait a bit and try again (in case initial load is still in progress)
            if ((!userOrgUnits || userOrgUnits.length === 0) && store.systemId) {
                console.log("No data found, waiting for initialization to complete...");
                await new Promise(resolve => setTimeout(resolve, 1000));
                const retryUnits = await db.organisations.toArray();
                console.log("Retry found", retryUnits?.length || 0, "organization units");
                if (retryUnits && retryUnits.length > 0) {
                    userOrgUnits = retryUnits;
                }
            }

            if (userOrgUnits && userOrgUnits.length > 0) {

                allowedIdsRef.current = new Set(userOrgUnits.map((u: any) => u.id));

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
                // If user has level 1 access, assume they can access all levels below
                const accessLevels = {
                    minLevel,
                    maxLevel: minLevel === 1 ? 5 : maxLevel, // Level 1 users can access down to level 5
                    hasLevel2: levelCounts.level2 > 0 || minLevel === 1, // Level 1 users can access level 2
                    hasLevel3: levelCounts.level3 > 0 || minLevel <= 2, // Level 1-2 users can access level 3
                    hasLevel4: levelCounts.level4 > 0 || minLevel <= 3, // Level 1-3 users can access level 4
                    hasLevel5: levelCounts.level5 > 0 || minLevel <= 4  // Level 1-4 users can access level 5
                };
                setUserAccessLevels(accessLevels);

                // Determine user access type for smart hierarchy handling
                const hasMultipleLevelOptions = maxLevel > minLevel;
                const hasMultipleUnitsAtLevel2 = levelCounts.level2 > 1;
                const hasMultipleUnitsAtLevel3 = levelCounts.level3 > 1;
                const totalUnits = userOrgUnits.length;

                console.log("=== ACCESS DETECTION DEBUG ===");
                console.log("Raw data:", {
                    minLevel,
                    maxLevel,
                    totalUnits,
                    levelCounts,
                    hasMultipleLevelOptions,
                    hasMultipleUnitsAtLevel2,
                    hasMultipleUnitsAtLevel3
                });

                // Broad access indicators:
                const hasLevel1WithMultipleLevel2 = (minLevel === 1 && levelCounts.level2 > 2);
                const hasManyUnitsAcrossLevels = (totalUnits > 5 && hasMultipleLevelOptions);
                const hasMultipleUnitsAtHighLevels = (hasMultipleUnitsAtLevel2 && hasMultipleUnitsAtLevel3);
                // More sophisticated Level 1 access detection
                // True broad access: Level 1 + multiple level 2 children OR many total units
                // Limited Level 1 access: Level 1 + only specific deep level unit (like single ward)
                const hasLevel1Access = (minLevel === 1);
                const hasLimitedLevel1Access = hasLevel1Access && totalUnits <= 3 && hasMultipleLevelOptions;
                const hasTrueBroadLevel1Access = hasLevel1Access && !hasLimitedLevel1Access;

                console.log("Broad access indicators:", {
                    hasLevel1WithMultipleLevel2,
                    hasManyUnitsAcrossLevels,
                    hasMultipleUnitsAtHighLevels,
                    hasLevel1Access,
                    hasLimitedLevel1Access,
                    hasTrueBroadLevel1Access,
                    totalUnits,
                    hasMultipleLevelOptions
                });

                const hasBroadAccess = hasTrueBroadLevel1Access || hasLevel1WithMultipleLevel2 || hasManyUnitsAcrossLevels || hasMultipleUnitsAtHighLevels;

                // Limited scope indicators:
                const hasLimitedScope = totalUnits <= 3 && hasMultipleLevelOptions;

                console.log("Final access determination:", {
                    hasBroadAccess,
                    hasLimitedScope,
                    willSetFullAccess: hasBroadAccess
                });

                const fullAccess = hasBroadAccess;
                setHasFullAccess(fullAccess);

                console.log("=== END ACCESS DETECTION ===");
                console.log("User access analysis:", {
                    levelCounts,
                    minLevel,
                    maxLevel,
                    hasFullAccess: fullAccess,
                    accessLevels,
                    willShowLevel2: fullAccess || (accessLevels.minLevel <= 2 && accessLevels.maxLevel >= 3),
                    willShowLevel3: fullAccess || (accessLevels.minLevel <= 3 && accessLevels.maxLevel >= 4),
                    willShowLevel4: fullAccess || (accessLevels.minLevel <= 4 && accessLevels.maxLevel >= 5)
                });

                // Filter org units to show appropriate level for first dropdown
                let optionsForFirstLevel = userOrgUnits;

                // Smart hierarchy loading based on user access type
                console.log("Loading hierarchy for user with minLevel:", minLevel, "maxLevel:", maxLevel);
                console.log("User org units:", userOrgUnits.map(u => `${u.title} (Level ${u.level})`));

                // Determine loading strategy based on access type
                const hasMultiLevelAccess = maxLevel > minLevel;

                console.log("Loading strategy:", {
                    hasMultiLevelAccess,
                    hasFullAccess,
                    hasBroadAccess: hasBroadAccess
                });

                // Simplified unified loading logic
                console.log("=== UNIFIED LOADING LOGIC ===");
                console.log("User type:", hasBroadAccess ? "BROAD ACCESS" : "LIMITED ACCESS");
                console.log("Will load hierarchy:", !hasBroadAccess);

                if (hasBroadAccess) {
                    // Broad access users: Load level 2 options, no auto-selection, all unlocked
                    console.log("🟢 BROAD ACCESS: Loading level 2 options, all unlocked");
                    setLockedLevels({
                        level1: false,
                        level2: false,
                        level3: false,
                        level4: false,
                        level5: false,
                    });

                    // Load level 2 options for broad access users
                    await loadBroadAccessLevel2Options();
                    return;
                } else {
                    // All non-broad users: Load full hierarchy with appropriate locks
                    console.log("🔴 LIMITED ACCESS: Loading full hierarchy with locks");
                    await loadHierarchyAndAutoSelect(userOrgUnits, maxLevel);
                    return;
                }
                console.log("=== END UNIFIED LOADING LOGIC ===");
            } else {
                // Fallback: load from DHIS2 if local db is empty - assume full access
                console.log("Local database is empty, loading from DHIS2...");
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
                        id: unit.id,
                        level: 2  // Add level for consistency
                    }))
                    .sort((a: CascadingOption, b: CascadingOption) => a.label.localeCompare(b.label));

                console.log("Fallback: Setting first level options:", options.length, "items");
                console.log("Fallback: First few options:", options.slice(0, 3));
                setFirstLevelOptions(options);
                console.log("Fallback: Loaded", options.length, "level 2 org units, hasFullAccess:", true);
            }
        } catch (err) {
            console.error("Error loading first level data:", err);
            setError("Failed to load organization data");
            didAutoLoad.current = false;
        } finally {
            setLoadingFirst(false);
            console.log("loadFirstLevelData completed. Loading state set to false.");
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
            const base = children.map((child: any) => ({
                label: child.name,
                value: child.id,
                id: child.id,
                level: 2
            }));
            const options = restrictOptions(base, parentId, 2).sort((a, b) => a.label.localeCompare(b.label));
            setSecondLevelOptions(options);

            // Auto-select if limited user and only one option
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
            const base = children.map((child: any) => ({
                label: child.name,
                value: child.id,
                id: child.id,
                level: 3
            }));
            const options = restrictOptions(base, parentId, 3).sort((a, b) => a.label.localeCompare(b.label));
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
            const base = children.map((child: any) => ({
                label: child.name,
                value: child.id,
                id: child.id,
                level: 4
            }));
            const options = restrictOptions(base, parentId, 4).sort((a, b) => a.label.localeCompare(b.label));
            setFourthLevelOptions(options);

        } catch (err) {
            console.error("Error loading fourth level data:", err);
            setError("Failed to load fourth level organizations");
            setFourthLevelOptions([]);
        } finally {
            setLoadingFourth(false);
        }
    };


    const loadFifthLevelData = async (parentId: string) => {
        setLoadingFifth(true);
        setError(null);
        console.log("[L5] parentId:", parentId, {
            allowedParent: allowedIdsRef.current.has(parentId)
        });
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
            const base = children.map((child: any) => ({
                label: child.name,
                value: child.id,
                id: child.id,
                level: 5,
            }));
            const options = restrictOptions(base, parentId, 5).sort((a, b) => a.label.localeCompare(b.label));
            setFifthLevelOptions(options);
        } catch (err) {
            console.error("Error loading fifth level data:", err);
            setError("Failed to load fifth level organizations");
            setFifthLevelOptions([]);
        } finally {
            setLoadingFifth(false);
        }
    };



    const handleFirstLevelChange = (option: CascadingOption | null) => {
        setSelectedFirstLevel(option);
        setSelectedSecondLevel(null);
        setSelectedThirdLevel(null);
        setSelectedFourthLevel(null);
        setSelectedFifthLevel(null);
        setSecondLevelOptions([]);
        setThirdLevelOptions([]);
        setFourthLevelOptions([]);
        setFifthLevelOptions([]);
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
        setSelectedFifthLevel(null);
        setThirdLevelOptions([]);
        setFourthLevelOptions([]);
        setFifthLevelOptions([]);

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
        setSelectedFifthLevel(null);
        setFifthLevelOptions([]);
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
        setSelectedFifthLevel(null);
        setFifthLevelOptions([]);

        if (option) {
            if (!hasFullAccess) {
                allowedIdsRef.current.add(option.value);
            }
            loadFifthLevelData(option.value);
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

    const handleFifthLevelChange = (option: CascadingOption | null) => {
        setSelectedFifthLevel(option);

        if (option) {
            try {
                if (storeApi?.setOrganisations) {
                    storeApi.setOrganisations([option.value]);
                }
                storeApi.setSelectedOrgUnitName(option.label);
            } catch (err) {
                console.error("Error updating filter:", err);
            }
        } else if (selectedFourthLevel) {
            try {
                if (storeApi?.setOrganisations) {
                    storeApi.setOrganisations([selectedFourthLevel.value]);
                }
                storeApi.setSelectedOrgUnitName(selectedFourthLevel.label);
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

    // Debug render state
    console.log("Render state:", {
        firstLevelOptionsLength: firstLevelOptions.length,
        loadingFirst,
        isSystemInitialized,
        hasFullAccess,
        errorState: error,
        lockedLevels: lockedLevels
    });

    return (
        <Stack spacing={2} minW="300px" position="relative" zIndex={1}>
            {/* <Text fontSize="sm" fontWeight="medium" color="gray.600">
                Organization Units (Cascading)
            </Text> */}

            {/* Combined Filters and Cascading Row */}
            {(firstLevelOptions.length === 0 || showLevels || showGroups || showGroupSets || firstLevelOptions.length > 0) && (
                <Flex direction="row" align="flex-start" gap={2} wrap="wrap">
                    {/* Load Data Button - Only show when needed */}
                    {firstLevelOptions.length === 0 && !loadingFirst && isSystemInitialized && (
                        <Box minW="100px">
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

                    {/* Show loading message while system is initializing */}
                    {!isSystemInitialized && store.systemId && (
                        <Box minW="140px">
                            <Text fontSize="xs" fontWeight="medium" color="gray.500" mb={1}>
                                Organization Units
                            </Text>
                            <Box display="flex" alignItems="center" justifyContent="center" h="32px" bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
                                <Spinner size="sm" />
                                <Text ml={2} fontSize="xs" color="gray.600">Initializing...</Text>
                            </Box>
                        </Box>
                    )}

                    {/* Additional Filter Buttons - Only show for users with full access */}
                    {showLevels && hasFullAccess && (
                        <Box minW="150px">
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
                                        isDisabled={loadingFirst || loadingSecond || loadingThird || loadingFourth || loadingFifth}
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
                        <Box minW="150px">
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
                        <Box minW="150px">
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
                            {console.log("Rendering cascading dropdowns with", firstLevelOptions.length, "options")}
                            {/* First Level Dropdown - Always show if we have options */}
                            <Box minW="140px" position="relative">
                                {/* <Text fontSize="xs" fontWeight="medium" color="gray.500" mb={1}>
                                    {userAccessLevels.minLevel === 2 ? 'Organization Units' :
                                        userAccessLevels.minLevel === 3 ? 'Sub-units' :
                                            userAccessLevels.minLevel === 4 ? 'Level 3' : 'Level 4'} ({firstLevelOptions.length} available)
                            {lockedLevels.level1 && <Text as="span" color="orange.500" ml={1}>(Auto-selected)</Text>}
                                </Text> */}
                                <Select<CascadingOption, false, GroupBase<CascadingOption>>
                                    value={selectedFirstLevel}
                                    onChange={lockedLevels.level1 ? undefined : handleFirstLevelChange}
                                    options={firstLevelOptions}
                                    placeholder="Select Organization..."
                                    isClearable={!lockedLevels.level1}
                                    isDisabled={lockedLevels.level1}
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
                                            minWidth: "140px",
                                            maxHeight: "200px",
                                            overflow: "auto"
                                        }),
                                        menuList: (base) => ({
                                            ...base,
                                            maxHeight: "200px"
                                        }),
                                        control: (base) => {
                                            console.log("Level 1 dropdown styling - lockedLevels.level1:", lockedLevels.level1);
                                            return {
                                                ...base,
                                                minHeight: "32px",
                                                backgroundColor: lockedLevels.level1 ? "#f5f5f5" : base.backgroundColor,
                                                opacity: lockedLevels.level1 ? 0.6 : 1,
                                                cursor: lockedLevels.level1 ? "not-allowed" : "default",
                                                borderColor: lockedLevels.level1 ? "#d0d0d0" : base.borderColor,
                                                "&:hover": {
                                                    borderColor: lockedLevels.level1 ? "#d0d0d0" : base.borderColor
                                                }
                                            };
                                        }
                                    }}
                                />
                            </Box>

                            {/* Second Level Dropdown - Show if has data OR is locked (parent context) */}
                            {(secondLevelOptions.length > 0 || loadingSecond || lockedLevels.level2) && (<Box minW="140px" position="relative">
                                {/* <Text fontSize="xs" fontWeight="medium" color="gray.500" mb={1}>
                                        Sub-units ({secondLevelOptions.length} available)
                                {lockedLevels.level2 && <Text as="span" color="orange.500" ml={1}>(Auto-selected)</Text>}
                                    </Text> */}
                                {loadingSecond ? (
                                    <Box display="flex" alignItems="center" justifyContent="center" h="40px">
                                        <Spinner size="sm" />
                                        <Text ml={2} fontSize="sm">Loading...</Text>
                                    </Box>
                                ) : (
                                        <Select<CascadingOption, false, GroupBase<CascadingOption>>
                                            value={selectedSecondLevel}
                                            onChange={lockedLevels.level2 ? undefined : handleSecondLevelChange}
                                            options={secondLevelOptions}
                                            placeholder={selectedFirstLevel ? "Select Sub-unit..." : "Select Organization first"}
                                            isClearable={!lockedLevels.level2}
                                            size="sm"
                                            isDisabled={!selectedFirstLevel || lockedLevels.level2}
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
                                                    minWidth: "140px",
                                                    maxHeight: "200px",
                                                    overflow: "auto"
                                                }),
                                                menuList: (base) => ({
                                                    ...base,
                                                    maxHeight: "200px"
                                                }),
                                                control: (base) => {
                                                    console.log("Level 2 dropdown styling - lockedLevels.level2:", lockedLevels.level2);
                                                    return {
                                                        ...base,
                                                        minHeight: "32px",
                                                        backgroundColor: lockedLevels.level2 ? "#f5f5f5" : base.backgroundColor,
                                                        opacity: lockedLevels.level2 ? 0.6 : 1,
                                                        cursor: lockedLevels.level2 ? "not-allowed" : "default",
                                                        borderColor: lockedLevels.level2 ? "#d0d0d0" : base.borderColor,
                                                        "&:hover": {
                                                            borderColor: lockedLevels.level2 ? "#d0d0d0" : base.borderColor
                                                        }
                                                    };
                                                }
                                            }}
                                        />
                                    )}
                                {/* {!loadingSecond && selectedFirstLevel && secondLevelOptions.length === 0 && (
                                        <Text fontSize="xs" color="gray.500" mt={1}>
                                            No sub-units available
                                        </Text>
                                    )} */}
                            </Box>
                            )}

                            {/* Third Level Dropdown - Show if has data OR is locked (parent context) */}
                            {(thirdLevelOptions.length > 0 || loadingThird || lockedLevels.level3) && (<Box minW="140px" position="relative">
                                {/* <Text fontSize="xs" fontWeight="medium" color="gray.500" mb={1}>
                                        Level 3 ({thirdLevelOptions.length} available)
                            </Text> */}
                                {loadingThird ? (
                                    <Box display="flex" alignItems="center" justifyContent="center" h="40px">
                                        <Spinner size="sm" />
                                        <Text ml={2} fontSize="sm">Loading...</Text>
                                    </Box>
                                ) : (
                                        <Select<CascadingOption, false, GroupBase<CascadingOption>>
                                            value={selectedThirdLevel}
                                            onChange={lockedLevels.level3 ? undefined : handleThirdLevelChange}
                                            options={thirdLevelOptions}
                                            placeholder={selectedSecondLevel ? "Select Level 3..." : "Select Sub-unit first"}
                                            isClearable={!lockedLevels.level3}
                                            size="sm"
                                            isDisabled={!selectedSecondLevel || lockedLevels.level3}
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
                                                    minWidth: "140px",
                                                    maxHeight: "200px",
                                                    overflow: "auto"
                                                }),
                                                menuList: (base) => ({
                                                    ...base,
                                                    maxHeight: "200px"
                                                }),
                                                control: (base) => ({
                                                    ...base,
                                                    minHeight: "32px",
                                                    backgroundColor: lockedLevels.level3 ? "#f5f5f5" : base.backgroundColor,
                                                    opacity: lockedLevels.level3 ? 0.6 : 1,
                                                    cursor: lockedLevels.level3 ? "not-allowed" : "default",
                                                    borderColor: lockedLevels.level3 ? "#d0d0d0" : base.borderColor,
                                                    "&:hover": {
                                                        borderColor: lockedLevels.level3 ? "#d0d0d0" : base.borderColor
                                                    }
                                                })
                                            }}
                                        />
                                    )}
                                {/* {!loadingThird && selectedSecondLevel && thirdLevelOptions.length === 0 && (
                                        <Text fontSize="xs" color="gray.500" mt={1}>
                                            No Level 3 units available
                                        </Text>
                                    )} */}
                            </Box>
                            )}

                            {/* Fourth Level Dropdown - Show if has data OR is locked (parent context) */}
                            {(fourthLevelOptions.length > 0 || loadingFourth || lockedLevels.level4) && (<Box minW="140px" position="relative">
                                {/* <Text fontSize="xs" fontWeight="medium" color="gray.500" mb={1}>
                                        Level 4 ({fourthLevelOptions.length} available)
                            </Text> */}
                                {loadingFourth ? (
                                    <Box display="flex" alignItems="center" justifyContent="center" h="40px">
                                        <Spinner size="sm" />
                                        <Text ml={2} fontSize="sm">Loading...</Text>
                                    </Box>
                                ) : (
                                        <Select<CascadingOption, false, GroupBase<CascadingOption>>
                                            value={selectedFourthLevel}
                                            onChange={lockedLevels.level4 ? undefined : handleFourthLevelChange}
                                            options={fourthLevelOptions}
                                            placeholder={selectedThirdLevel ? "Select Level 4..." : "Select Level 3 first"}
                                            isClearable={!lockedLevels.level4}
                                            size="sm"
                                            isDisabled={!selectedThirdLevel || lockedLevels.level4}
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
                                                    minWidth: "140px",
                                                    maxHeight: "200px",
                                                    overflow: "auto"
                                                }),
                                                menuList: (base) => ({
                                                    ...base,
                                                    maxHeight: "200px"
                                                }),
                                                control: (base) => ({
                                                    ...base,
                                                    minHeight: "32px",
                                                    backgroundColor: lockedLevels.level4 ? "#f5f5f5" : base.backgroundColor,
                                                    opacity: lockedLevels.level4 ? 0.6 : 1,
                                                    cursor: lockedLevels.level4 ? "not-allowed" : "default",
                                                    borderColor: lockedLevels.level4 ? "#d0d0d0" : base.borderColor,
                                                    "&:hover": {
                                                        borderColor: lockedLevels.level4 ? "#d0d0d0" : base.borderColor
                                                    }
                                                })
                                            }}
                                        />
                                    )}
                                {/* {!loadingFourth && selectedThirdLevel && fourthLevelOptions.length === 0 && (
                                        <Text fontSize="xs" color="gray.500" mt={1}>
                                            No Level 4 units available
                                        </Text>
                                    )} */}
                            </Box>
                            )}

                            {/* Fifth Level Dropdown - Show if has data OR is locked (parent context) */}
                            {(fifthLevelOptions.length > 0 || loadingFifth || lockedLevels.level5) && (<Box minW="140px" position="relative">
                                {/* <Text fontSize="xs" fontWeight="medium" color="gray.500" mb={1}>
                                        Level 5 ({fifthLevelOptions.length} available)
                                    </Text> */}
                                {loadingFifth ? (
                                    <Box display="flex" alignItems="center" justifyContent="center" h="40px">
                                        <Spinner size="sm" />
                                        <Text ml={2} fontSize="sm">Loading...</Text>
                                    </Box>
                                ) : (
                                        <Select<CascadingOption, false, GroupBase<CascadingOption>>
                                            value={selectedFifthLevel}
                                            onChange={lockedLevels.level5 ? undefined : handleFifthLevelChange}
                                            options={fifthLevelOptions}
                                            placeholder={selectedFourthLevel ? "Select Sch..." : "Select Level 4 first"}
                                            isClearable={!lockedLevels.level5}
                                            size="sm"
                                            isDisabled={!selectedFourthLevel || lockedLevels.level5}
                                            menuPortalTarget={document.body}
                                            menuPosition="fixed"
                                            menuPlacement="auto"
                                            styles={{
                                                menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                                                menu: (base) => ({ ...base, minWidth: "140px", maxHeight: "200px", overflow: "auto" }),
                                                menuList: (base) => ({ ...base, maxHeight: "200px" }),
                                                control: (base) => ({
                                                    ...base,
                                                    minHeight: "32px",
                                                    backgroundColor: lockedLevels.level5 ? "#f5f5f5" : base.backgroundColor,
                                                    opacity: lockedLevels.level5 ? 0.6 : 1,
                                                    cursor: lockedLevels.level5 ? "not-allowed" : "default",
                                                    borderColor: lockedLevels.level5 ? "#d0d0d0" : base.borderColor,
                                                    "&:hover": { borderColor: lockedLevels.level5 ? "#d0d0d0" : base.borderColor },
                                                }),
                                            }}
                                        />
                                    )}
                                {/* {!loadingFifth && selectedFourthLevel && fifthLevelOptions.length === 0 && (
                                        <Text fontSize="xs" color="gray.500" mt={1}>
                                            No Level 5 units available
                                        </Text>
                                    )} */}
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
                    {/* <Text fontSize="xs" fontWeight="medium" color="gray.500">
                        Selected Organization:
                    </Text> */}
                    {/* <Badge colorScheme="blue" fontSize="xs" mt={1}>
                        {selectedFifthLevel
                            ? `${selectedFirstLevel?.label} → ${selectedSecondLevel?.label} → ${selectedThirdLevel?.label} → ${selectedFourthLevel?.label} → ${selectedFifthLevel.label}`
                            : selectedFourthLevel
                                ? `${selectedFirstLevel?.label} → ${selectedSecondLevel?.label} → ${selectedThirdLevel?.label} → ${selectedFourthLevel.label}`
                                : selectedThirdLevel
                                    ? `${selectedFirstLevel?.label} → ${selectedSecondLevel?.label} → ${selectedThirdLevel.label}`
                                    : selectedSecondLevel
                                        ? `${selectedFirstLevel?.label} → ${selectedSecondLevel.label}`
                                        : selectedFirstLevel?.label || "None"
                        }
                    </Badge> */}
                </Box>
            )}
        </Stack>
    );
}