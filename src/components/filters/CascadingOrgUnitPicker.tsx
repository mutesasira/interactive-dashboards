import React, { useState, useEffect, useRef, useCallback } from "react";
import { Stack, Text, Box, Spinner, Button, Flex } from "@chakra-ui/react";
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


    // --- Core state used by cache guard and loaders ---
    const [firstLevelOptions, setFirstLevelOptions] = useState<CascadingOption[]>([]);
    const [secondLevelOptions, setSecondLevelOptions] = useState<CascadingOption[]>([]);
    const [thirdLevelOptions, setThirdLevelOptions] = useState<CascadingOption[]>([]);
    const [fourthLevelOptions, setFourthLevelOptions] = useState<CascadingOption[]>([]);
    const [fifthLevelOptions, setFifthLevelOptions] = useState<CascadingOption[]>([]);

    const [selectedFirstLevel, setSelectedFirstLevel] = useState<CascadingOption | null>(null);
    const [selectedSecondLevel, setSelectedSecondLevel] = useState<CascadingOption | null>(null);
    const [selectedThirdLevel, setSelectedThirdLevel] = useState<CascadingOption | null>(null);
    const [selectedFourthLevel, setSelectedFourthLevel] = useState<CascadingOption | null>(null);
    const [selectedFifthLevel, setSelectedFifthLevel] = useState<CascadingOption | null>(null);

    const [loadingFirst, setLoadingFirst] = useState(false);
    const [loadingSecond, setLoadingSecond] = useState(false);
    const [loadingThird, setLoadingThird] = useState(false);
    const [loadingFourth, setLoadingFourth] = useState(false);
    const [loadingFifth, setLoadingFifth] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // DHIS2 filter data
    const [levels, setLevels] = useState<Option[]>([]);
    const [groups, setGroups] = useState<Option[]>([]);
    // const [groupSets, setGroupSets] = useState<Option[]>([]);
    const [groupsFromSet, setGroupsFromSet] = useState<GroupFromSet[]>([]);
    const [loadingLevels, setLoadingLevels] = useState(false);
    const [loadingGroups, setLoadingGroups] = useState(false);
    // const [, setLoadingGroupSets] = useState(false);
    const [loadingGroupsFromSet, setLoadingGroupsFromSet] = useState(false);

    // Selected values from global store
    const selectedLevels = store.levels || [];
    const selectedGroups = store.groups || [];

    // System init state
    const [isSystemInitialized, setIsSystemInitialized] = useState(false);

    // --- Access/lock refs & state (used by cache guard and restrictOptions) ---
    const didAutoLoad = useRef(false);
    const allowedIdsRef = useRef<Set<string>>(new Set());
    const [hasFullAccess, setHasFullAccess] = useState(false);
    const [lockedLevels, setLockedLevels] = useState({
        level1: false, level2: false, level3: false, level4: false, level5: false,
    });
    const [userAccessLevels, setUserAccessLevels] = useState({
        minLevel: 2, maxLevel: 5, hasLevel2: false, hasLevel3: false, hasLevel4: false, hasLevel5: false,
    });

    // --- Helpers: user key & cache guard ---
    const getCurrentUserKey = useCallback(async () => {
        try {
            const me: any = await engine.query({
                me: { resource: "me", params: { fields: "id,username" } },
            });
            const uid = me?.me?.id || me?.me?.username || "unknown";
            return `${store.systemId || ""}:${uid}`;
        } catch (error) {
            console.warn("Failed to get current user info:", error);
            return `${store.systemId || "unknown"}:anonymous`;
        }
    }, [engine, store.systemId]);
    const clearOuFilters = useCallback(() => {
        try {
            // remove existing LEVEL-* filters
            (store.levels || []).forEach((levelId: string | number) => {
                datumAPi.changeDimension({
                    id: String(levelId),
                    type: "filter",
                    dimension: "ou",
                    resource: "oul",
                    prefix: "LEVEL-",
                    remove: true,
                });
            });

            // remove existing OU_GROUP-* filters
            (store.groups || []).forEach((groupId: string) => {
                datumAPi.changeDimension({
                    id: groupId,
                    type: "filter",
                    dimension: "ou",
                    resource: "oug",
                    prefix: "OU_GROUP-",
                    remove: true,
                });
            });

            // clear store copies too
            storeApi.changeLevels([]);
            storeApi.setGroups([]);
        } catch (e) {
            console.warn("clearOuFilters failed:", e);
        }
    }, [store.levels, store.groups]);

    const selectHighestAccessibleLevel = useCallback(async () => {
        if (!hasFullAccess && userAccessLevels.minLevel && firstLevelOptions.length > 0) {
            // Find user's organization unit at their highest accessible level
            const userOrgUnits = await db.organisations.toArray();
            const highestLevelUnit = userOrgUnits.find(unit => unit.level === userAccessLevels.minLevel);

            if (highestLevelUnit) {
                // Find this unit in the first level options
                const optionToSelect = firstLevelOptions.find(opt => opt.id === highestLevelUnit.id);

                if (optionToSelect) {
                    console.log(`Auto-selecting highest accessible level: ${optionToSelect.label} (Level ${optionToSelect.level})`);

                    // Set the selection and update global store
                    setSelectedFirstLevel(optionToSelect);
                    try {
                        storeApi?.setOrganisations?.([optionToSelect.value]);
                        storeApi.setSelectedOrgUnitName(optionToSelect.label);
                    } catch (e) {
                        console.warn("Failed to update store with auto-selected unit:", e);
                    }

                    return true; // Indicate that auto-selection was made
                }
            }
        }
        return false; // No auto-selection made
    }, [hasFullAccess, userAccessLevels.minLevel, firstLevelOptions, storeApi]);


    const clearCascadingOuSelections = useCallback(async () => {
        // Clear all cascading selections
        setSelectedFirstLevel(null);
        setSelectedSecondLevel(null);
        setSelectedThirdLevel(null);
        setSelectedFourthLevel(null);
        setSelectedFifthLevel(null);

        // Clear all cascading options except first level (keep available options)
        setSecondLevelOptions([]);
        setThirdLevelOptions([]);
        setFourthLevelOptions([]);
        setFifthLevelOptions([]);

        // Clear from global store
        try {
            storeApi?.setOrganisations?.([]);
            storeApi.setSelectedOrgUnitName("");
        } catch (e) {
            console.warn("clearCascadingOuSelections failed:", e);
        }

        // After clearing cascading filters, clear the selection completely 
        // (DefaultOrgUnitFilter will handle setting appropriate defaults)
        setTimeout(() => {
            console.log("Cleared all cascading filters - DefaultOrgUnitFilter will handle defaults");
        }, 100);
    }, []);

    const refreshIndexedDBForFirstUser = useCallback(async () => {
        const hasEverLoggedIn = localStorage.getItem("has-user-logged-in");
        const currentUserKey = await getCurrentUserKey();

        if (!hasEverLoggedIn) {
            console.log("First user login detected. Refreshing IndexedDB...");

            // Clear all existing data to ensure fresh start
            await db.organisations.clear();

            // Fetch fresh organizational data from DHIS2
            try {
                console.log("Fetching fresh organizational data from DHIS2...");
                const response: any = await engine.query({
                    userOrgUnits: {
                        resource: "me",
                        params: {
                            fields: "organisationUnits[id,name,level,path,parent[id]]"
                        }
                    }
                });

                const userOrgUnits = response?.userOrgUnits?.organisationUnits || [];

                if (userOrgUnits.length > 0) {
                    // Store fresh data in IndexedDB
                    await db.organisations.bulkAdd(userOrgUnits);
                    console.log(`Refreshed IndexedDB with ${userOrgUnits.length} organizational units for first user`);

                    // Mark that a user has logged in
                    localStorage.setItem("has-user-logged-in", "true");
                    localStorage.setItem("ou-cache-owner", currentUserKey);

                    // Set system as initialized since we just loaded fresh data
                    setIsSystemInitialized(true);

                    // Set a flag to indicate we need to trigger first level data loading
                    // This will be handled by the useEffect that triggers loadFirstLevelData
                    didAutoLoad.current = false; // Reset this so loadFirstLevelData can run
                } else {
                    console.warn("No organizational units found for first user");
                }
            } catch (error) {
                console.error("Failed to refresh IndexedDB for first user:", error);
                // Fall back to regular cache management
                await ensureCacheForUser();
            }
        } else {
            // Not first user, use regular cache management
            await ensureCacheForUser();
        }
    }, [getCurrentUserKey, clearOuFilters, engine]);

    const ensureCacheForUser = useCallback(async () => {
        const ownerKey = await getCurrentUserKey();
        const prev = localStorage.getItem("ou-cache-owner");

        if (prev !== ownerKey) {
            await db.organisations.clear();
            allowedIdsRef.current = new Set();
            setIsSystemInitialized(false);

            setFirstLevelOptions([]); setSecondLevelOptions([]); setThirdLevelOptions([]);
            setFourthLevelOptions([]); setFifthLevelOptions([]);
            setSelectedFirstLevel(null); setSelectedSecondLevel(null);
            setSelectedThirdLevel(null); setSelectedFourthLevel(null); setSelectedFifthLevel(null);

            setLockedLevels({ level1: false, level2: false, level3: false, level4: false, level5: false });
            setHasFullAccess(false);
            setUserAccessLevels({ minLevel: 2, maxLevel: 5, hasLevel2: false, hasLevel3: false, hasLevel4: false, hasLevel5: false });

            try {
                storeApi?.setOrganisations?.([]);
                storeApi.setSelectedOrgUnitName("");
                clearOuFilters();                      // ✅ safe now
            } catch { }

            didAutoLoad.current = false;
            localStorage.setItem("ou-cache-owner", ownerKey);
        }
    }, [getCurrentUserKey, clearOuFilters]);     // ✅ add dep





    // --- Run the cache guard ASAP (must be before any DB-reading effects) ---
    useEffect(() => {
        (async () => { await refreshIndexedDBForFirstUser(); })();
    }, [refreshIndexedDBForFirstUser]);

    // --- Option visibility helper ---
    const restrictOptions = useCallback(
        (opts: CascadingOption[], parentId?: string, targetLevel?: number) => {
            if (hasFullAccess) return opts;

            const allowed = allowedIdsRef.current;
            const userMin = userAccessLevels.minLevel;

            if (parentId && allowed.has(parentId) && targetLevel !== undefined && targetLevel > userMin) {
                return opts;
            }
            return opts.filter(o => allowed.has(o.id));
        },
        [hasFullAccess, userAccessLevels.minLevel]
    );


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

    // const loadGroupSets = async () => {
    //     if (groupSets.length > 0) return; // Already loaded
    //     setLoadingGroupSets(true);
    //     try {
    //         const response: any = await engine.query({
    //             groupSets: {
    //                 resource: "organisationUnitGroupSets.json",
    //                 params: {
    //                     fields: "id~rename(value),name~rename(label)",
    //                     paging: "false",
    //                 },
    //             },
    //         });
    //         setGroupSets(response.groupSets?.organisationUnitGroupSets || []);
    //     } catch (err) {
    //         console.error("Error loading group sets:", err);
    //     } finally {
    //         setLoadingGroupSets(false);
    //     }
    // };

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
                // Ensure we're checking the right user's cache
                const ownerKey = await getCurrentUserKey();
                const currentOwner = localStorage.getItem("ou-cache-owner");

                // Only proceed if cache owner matches current user
                if (currentOwner === ownerKey) {
                    const units = await db.organisations.toArray();
                    if (units && units.length > 0) {
                        setIsSystemInitialized(true);
                    }
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
    }, [store.systemId, isSystemInitialized, getCurrentUserKey]);

    // Debug effect to track firstLevelOptions changes
    useEffect(() => {
        if (firstLevelOptions.length > 0) {
        }
    }, [firstLevelOptions]);

    useEffect(() => {
        if (isSystemInitialized && firstLevelOptions.length === 0 && !loadingFirst) {
            loadFirstLevelData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSystemInitialized,]);

    // Auto-select highest accessible level when first level options are loaded
    useEffect(() => {
        const autoSelectAfterLoad = async () => {
            if (firstLevelOptions.length > 0 && !selectedFirstLevel && !loadingFirst) {
                const autoSelected = await selectHighestAccessibleLevel();
                if (autoSelected) {
                    console.log("Auto-selected highest accessible level after loading options");
                }
            }
        };

        autoSelectAfterLoad();
    }, [firstLevelOptions, selectedFirstLevel, loadingFirst, selectHighestAccessibleLevel]);

    // Filter handlers
    const handleLevelsChange = (selectedOptions: readonly Option[] | null) => {
        const levelIds = selectedOptions?.map((option) => String(option.value)) || [];

        // Clear any specific OU selections when levels are changed
        clearCascadingOuSelections();

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

        // Clear any specific OU selections when groups are changed
        clearCascadingOuSelections();

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

        // Clear any specific OU selections when groups from set are changed
        clearCascadingOuSelections();

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


    // Function to load options for broad access users (level 2 and below - level 1 is handled by DefaultOrgUnitFilter)
    const loadBroadAccessOptions = async () => {
        try {
            // Load only level 2 (states/regions) for cascading - level 1 is handled separately
            const response: any = await engine.query({
                level2: {
                    resource: "organisationUnits.json",
                    params: {
                        filter: "level:eq:2",
                        fields: "id,name,level",
                        paging: "false",
                    },
                },
            });

            const level2Units = response.level2?.organisationUnits || [];

            // Only use level 2 units for cascading dropdowns
            const options = level2Units
                .map((unit: any) => ({
                    label: unit.name,
                    value: unit.id,
                    id: unit.id,
                    level: 2
                }))
                .sort((a: CascadingOption, b: CascadingOption) => a.label.localeCompare(b.label));

            setFirstLevelOptions(options);
            console.log(`Loaded ${options.length} broad access options (level 2 states only - level 1 handled by DefaultOrgUnitFilter)`);

        } catch (error) {
            console.error("Error loading broad access options:", error);
        }
    };

    // Function to load full hierarchy and auto-select parents
    const loadHierarchyAndAutoSelect = async (userOrgUnits: any[], userMinLevel: number) => {

        try {
            // Get the user's unit at their deepest level (the one we want to trace back from)
            const userUnit = userOrgUnits.find(unit => unit.level === userMinLevel) || userOrgUnits[0];
            if (!userUnit) return;



            // Load the full path to this unit to get all parents
            const pathResponse: any = await engine.query({
                orgUnitPath: {
                    resource: `organisationUnits/${userUnit.id}.json`,
                    params: {
                        fields: "path,ancestors[id,name,level]"
                    }
                }
            });

            const ancestors = pathResponse.orgUnitPath?.ancestors || [];
            if (!hasFullAccess) {
                const tmp = new Set(allowedIdsRef.current);
                ancestors.forEach((a: any) => tmp.add(a.id));
                allowedIdsRef.current = tmp;
            }

            // Auto-select and load the hierarchy from level 2 down to user's level (level 1 handled by DefaultOrgUnitFilter)
            if (ancestors.length > 0) {
                // Start from level 2 (state level) - level 1 is handled by DefaultOrgUnitFilter
                const level2Unit = ancestors.find((a: any) => a.level === 2);
                if (level2Unit) {
                    // Load level 2 options for cascading
                    const level2Options = [{
                        label: level2Unit.name,
                        value: level2Unit.id,
                        id: level2Unit.id,
                        level: 2
                    }];
                    setFirstLevelOptions(level2Options);
                    setSelectedFirstLevel(level2Options[0]);

                    // Set locked levels - all levels above user's min level are locked (level 1 always handled separately)
                    const newLockedLevels = {
                        level1: false, // Level 1 is handled by DefaultOrgUnitFilter, not locked here
                        level2: userMinLevel > 2,
                        level3: userMinLevel > 3,
                        level4: userMinLevel > 4,
                        level5: userMinLevel > 5,
                    };

                    setLockedLevels(newLockedLevels);

                    // Auto-select each level down to the user's accessible level (starting from level 3 since level 2 is already selected)
                    await autoSelectHierarchyLevel(
                        level2Unit.id,
                        3,
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
        }
    };

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
                nextLoader?: (id: string, parentLevel?: number) => Promise<void>
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
                    if (nextLoader) await nextLoader(chosen.value, targetLevel);
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



    // Manual load function for first level data - uses user's accessible org units
    const loadFirstLevelData = async () => {
        await ensureCacheForUser();

        if (didAutoLoad.current) return;
        if (loadingFirst) return;
        if (firstLevelOptions.length > 0) return;

        didAutoLoad.current = true;     // mark immediately to prevent a second call
        setLoadingFirst(true);
        setError(null);

        try {
            // Verify we're using the correct user's cache
            const currentUserKey = await getCurrentUserKey();
            const cacheOwner = localStorage.getItem("ou-cache-owner");

            if (cacheOwner !== currentUserKey) {
                // Check if this is a first user scenario where we just loaded fresh data
                const hasEverLoggedIn = localStorage.getItem("has-user-logged-in");
                if (!hasEverLoggedIn) {
                    // First user case - we might have just loaded fresh data, don't clear it
                    console.log("First user detected in loadFirstLevelData, skipping cache clear");
                } else {
                    await ensureCacheForUser();
                    // After cache clearing, return early and let the system reinitialize
                    didAutoLoad.current = false;
                    return;
                }
            }

            // First try to get user's accessible org units from local db
            let userOrgUnits = await db.organisations.toArray();

            // If no data found, wait a bit and try again (in case initial load is still in progress)
            if ((!userOrgUnits || userOrgUnits.length === 0) && store.systemId) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const retryUnits = await db.organisations.toArray();
                if (retryUnits && retryUnits.length > 0) {
                    userOrgUnits = retryUnits;
                }
            }

            if (userOrgUnits && userOrgUnits.length > 0) {

                allowedIdsRef.current = new Set(userOrgUnits.map((u: any) => u.id));

                // Analyze user's org unit access levels
                const unitLevels = userOrgUnits.map((unit: any) => unit.level);
                const minLevel = Math.min(...unitLevels);
                const maxLevel = Math.max(...unitLevels);
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



                const hasBroadAccess = hasTrueBroadLevel1Access || hasLevel1WithMultipleLevel2 || hasManyUnitsAcrossLevels || hasMultipleUnitsAtHighLevels;

                // Limited scope indicators:
                // const hasLimitedScope = totalUnits <= 3 && hasMultipleLevelOptions;



                const fullAccess = hasBroadAccess;
                setHasFullAccess(fullAccess);



                // Smart hierarchy loading based on user access type

                // Determine loading strategy based on access type
                // const hasMultiLevelAccess = maxLevel > minLevel;



                if (hasBroadAccess) {
                    // Broad access users: Load level 2 options, no auto-selection, all unlocked
                    setLockedLevels({
                        level1: false,
                        level2: false,
                        level3: false,
                        level4: false,
                        level5: false,
                    });

                    // Load options for broad access users (including country level)
                    await loadBroadAccessOptions();
                    return;
                } else {
                    // All non-broad users: Load full hierarchy with appropriate locks
                    await loadHierarchyAndAutoSelect(userOrgUnits, maxLevel);
                    return;
                }
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
                        id: unit.id,
                        level: 2  // Add level for consistency
                    }))
                    .sort((a: CascadingOption, b: CascadingOption) => a.label.localeCompare(b.label));

                setFirstLevelOptions(options);
            }
        } catch (err) {
            console.error("Error loading first level data:", err);
            setError("Failed to load organization data");
            didAutoLoad.current = false;
        } finally {
            setLoadingFirst(false);
        }
    };

    // Manual load function for second level data
    const loadSecondLevelData = async (parentId: string, parentLevel: number = 1) => {
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
            const nextLevel = parentLevel + 1;
            const base = children.map((child: any) => ({
                label: child.name,
                value: child.id,
                id: child.id,
                level: nextLevel,
            }));
            const options = restrictOptions(base, parentId, nextLevel).sort((a, b) =>
                a.label.localeCompare(b.label)
            );
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
    const loadThirdLevelData = async (parentId: string, parentLevel: number = 2) => {
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
            const nextLevel = parentLevel + 1;
            const base = children.map((child: any) => ({
                label: child.name,
                value: child.id,
                id: child.id,
                level: nextLevel,
            }));
            const options = restrictOptions(base, parentId, nextLevel).sort((a, b) =>
                a.label.localeCompare(b.label)
            );
            setThirdLevelOptions(options);
        } catch (err) {
            console.error("Error loading third level data:", err);
            setError("Failed to load third level organizations");
            setThirdLevelOptions([]);
        } finally {
            setLoadingThird(false);
        }
    };


    const loadFourthLevelData = async (parentId: string, parentLevel: number = 3) => {
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
            const nextLevel = parentLevel + 1;
            const base = children.map((child: any) => ({
                label: child.name,
                value: child.id,
                id: child.id,
                level: nextLevel,
            }));
            const options = restrictOptions(base, parentId, nextLevel).sort((a, b) =>
                a.label.localeCompare(b.label)
            );
            setFourthLevelOptions(options);
        } catch (err) {
            console.error("Error loading fourth level data:", err);
            setError("Failed to load fourth level organizations");
            setFourthLevelOptions([]);
        } finally {
            setLoadingFourth(false);
        }
    };

    const loadFifthLevelData = async (parentId: string, parentLevel: number = 4) => {
        setLoadingFifth(true);
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
            const nextLevel = parentLevel + 1; // usually 5
            const base = children.map((child: any) => ({
                label: child.name,
                value: child.id,
                id: child.id,
                level: nextLevel,
            }));
            const options = restrictOptions(base, parentId, nextLevel).sort((a, b) =>
                a.label.localeCompare(b.label)
            );
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
            clearOuFilters();
            // Load children for selected option
            loadSecondLevelData(option.value, option.level);

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
            clearOuFilters();
            // Load children for selected option
            loadThirdLevelData(option.value, option.level);

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
            clearOuFilters();
            // Load children for selected option
            loadFourthLevelData(option.value, option.level);

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
            clearOuFilters();
            if (!hasFullAccess) {
                allowedIdsRef.current.add(option.value);
            }
            loadFifthLevelData(option.value, option.level);
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
            clearOuFilters();
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
                <Button size="xs" onClick={loadFirstLevelData} colorScheme="blue" fontSize="2xs" h="24px">
                    Retry Loading
                </Button>
            </Stack>
        );
    }


    // Debug render state
    return (
        <Stack spacing={2} minW="300px" w="100%" position="relative" zIndex={1}>

            {/* Combined Filters and Cascading Row */}
            {(firstLevelOptions.length === 0 || showLevels || showGroups || showGroupSets || firstLevelOptions.length > 0) && (
                <Flex
                    direction="row"
                    align="flex-start"
                    gap={2}
                    wrap="nowrap"
                    overflowX="auto"
                    pb={2}
                    css={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#cbd5e0 #f7fafc',
                        '&::-webkit-scrollbar': {
                            height: '6px',
                        },
                        '&::-webkit-scrollbar-track': {
                            background: '#f7fafc',
                            borderRadius: '3px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: '#cbd5e0',
                            borderRadius: '3px',
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                            background: '#a0aec0',
                        },
                    }}
                >
                    {/* Load Data Button - Only show when needed */}
                    {firstLevelOptions.length === 0 && !loadingFirst && isSystemInitialized && (
                        <Box minW="100px">
                            <Text fontSize="xs" fontWeight="medium" color="gray.500" mb={1}>
                                Organization Units
                            </Text>
                            <Button
                                size="xs"
                                onClick={loadFirstLevelData}
                                colorScheme="blue"
                                variant="outline"
                                rightIcon={<ChevronDownIcon />}
                                width="100%"
                                fontSize="2xs"
                                h="24px"
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
                            <Box display="flex" alignItems="center" justifyContent="center" h="28px" bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
                                <Spinner size="sm" />
                                <Text ml={2} fontSize="xs" color="gray.600">Initializing...</Text>
                            </Box>
                        </Box>
                    )}

                    {/* Additional Filter Buttons - Only show for users with full access */}
                    {showLevels && hasFullAccess && (
                        <Box minW="130px">
                            <Text fontSize="xs" fontWeight="medium" color="gray.500" mb={1}>
                                Organization Unit Levels
                            </Text>
                            {loadingLevels ? (
                                <Flex align="center" justify="center" h="28px">
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
                        <Box minW="130px">
                            <Text fontSize="xs" fontWeight="medium" color="gray.500" mb={1}>
                                Organization Unit Groups
                            </Text>
                            {loadingGroups ? (
                                <Flex align="center" justify="center" h="28px">
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
                                        placeholder={loadingFirst || loadingSecond || loadingThird || loadingFourth ? "Loading ..." : " Groups..."}
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
                        <Box minW="130px">
                            {loadingGroupsFromSet ? (
                                <Flex align="center" justify="center" h="28px">
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
                                        placeholder={loadingFirst || loadingSecond || loadingThird || loadingFourth ? "Loading..." : "Groups..."}
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
                                                maxHeight: "80px",
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
                            <Box minW="130px" flexShrink={0} position="relative">
                                <Select<CascadingOption, false, GroupBase<CascadingOption>>
                                    value={selectedFirstLevel}
                                    onChange={lockedLevels.level1 ? undefined : handleFirstLevelChange}
                                    options={firstLevelOptions}
                                    placeholder="State"
                                    isClearable={!lockedLevels.level1}
                                    isDisabled={lockedLevels.level1}
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
                                            minWidth: "140px",
                                            maxHeight: "80px",
                                            overflow: "auto"
                                        }),
                                        menuList: (base) => ({
                                            ...base,
                                            maxHeight: "80px"
                                        }),
                                        control: (base) => {
                                            const hasDeepSelection = selectedSecondLevel || selectedThirdLevel || selectedFourthLevel || selectedFifthLevel;
                                            return {
                                                ...base,
                                                minHeight: "28px",
                                                backgroundColor: lockedLevels.level1 ? "#f7fafc" :
                                                    hasDeepSelection ? "#dbeafe" : // Light blue when part of completed path
                                                        selectedFirstLevel ? "#e0f2fe" : "#f0f9ff", // Light blue by default
                                                border: hasDeepSelection ? "1px solid #2563eb" :
                                                    selectedFirstLevel ? "1px solid #0284c7" : "1px solid #0ea5e9", // Blue border by default
                                                opacity: lockedLevels.level1 ? 0.7 : 1,
                                                cursor: lockedLevels.level1 ? "not-allowed" : "pointer",
                                                fontSize: "13px",
                                                boxShadow: hasDeepSelection ? "0 1px 3px rgba(37, 99, 235, 0.1)" : "none",
                                                "&:hover": {
                                                    borderColor: hasDeepSelection ? "#2563eb" :
                                                        selectedFirstLevel ? "#0284c7" : "#0284c7" // Blue on hover by default
                                                }
                                            };
                                        },
                                        dropdownIndicator: (base) => ({
                                            ...base,
                                            color: selectedFirstLevel ? "#2563eb" : "#0ea5e9" // Blue by default
                                        }),
                                        singleValue: (base) => ({
                                            ...base,
                                            color: "#2d3748",
                                            fontWeight: selectedFirstLevel ? "600" : "400"
                                        }),
                                        placeholder: (base) => ({
                                            ...base,
                                            fontSize: "12px",
                                            color: "#a0aec0"
                                        })
                                    }}
                                />
                            </Box>

                            {/* Second Level Dropdown - Show if has data OR is locked (parent context) */}
                            {(secondLevelOptions.length > 0 || loadingSecond || lockedLevels.level2) && (<Box minW="130px" flexShrink={0} position="relative">
                                {/* <Text fontSize="xs" fontWeight="medium" color="gray.500" mb={1}>
                                        Sub-units ({secondLevelOptions.length} available)
                                {lockedLevels.level2 && <Text as="span" color="orange.500" ml={1}>(Auto-selected)</Text>}
                                    </Text> */}
                                {loadingSecond ? (
                                    <Box display="flex" alignItems="center" justifyContent="center" h="28px" bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
                                        <Spinner size="sm" />
                                        <Text ml={2} fontSize="2xs" color="gray.600">Loading...</Text>
                                    </Box>
                                ) : (
                                        <Select<CascadingOption, false, GroupBase<CascadingOption>>
                                            value={selectedSecondLevel}
                                            onChange={lockedLevels.level2 ? undefined : handleSecondLevelChange}
                                            options={secondLevelOptions}
                                            placeholder={selectedFirstLevel ? "LGA" : "Select State first"}
                                            isClearable={!lockedLevels.level2}
                                            size="sm"
                                            isDisabled={!selectedFirstLevel || lockedLevels.level2}
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
                                                    minWidth: "140px",
                                                    maxHeight: "80px",
                                                    overflow: "auto"
                                                }),
                                                menuList: (base) => ({
                                                    ...base,
                                                    maxHeight: "80px"
                                                }),
                                                control: (base) => {
                                                    const hasDeepSelection = selectedThirdLevel || selectedFourthLevel || selectedFifthLevel;
                                                    return {
                                                        ...base,
                                                        minHeight: "28px",
                                                        backgroundColor: lockedLevels.level2 ? "#f7fafc" :
                                                            hasDeepSelection ? "#dbeafe" : // Light blue when part of completed path
                                                                selectedSecondLevel ? "#e0f2fe" : "#f0f9ff", // Light blue by default
                                                        border: hasDeepSelection ? "1px solid #2563eb" :
                                                            selectedSecondLevel ? "1px solid #0284c7" : "1px solid #0ea5e9", // Blue border by default
                                                        opacity: lockedLevels.level2 ? 0.7 : 1,
                                                        cursor: lockedLevels.level2 ? "not-allowed" : "pointer",
                                                        fontSize: "13px",
                                                        boxShadow: hasDeepSelection ? "0 1px 3px rgba(37, 99, 235, 0.1)" : "none",
                                                        "&:hover": {
                                                            borderColor: hasDeepSelection ? "#2563eb" :
                                                                selectedSecondLevel ? "#0284c7" : "#0284c7" // Blue on hover by default
                                                        }
                                                    };
                                                },
                                                dropdownIndicator: (base) => ({
                                                    ...base,
                                                    color: selectedSecondLevel ? "#2563eb" : "#0ea5e9" // Blue by default
                                                }),
                                                singleValue: (base) => ({
                                                    ...base,
                                                    color: "#2d3748",
                                                    fontWeight: selectedSecondLevel ? "600" : "400"
                                                }),
                                                placeholder: (base) => ({
                                                    ...base,
                                                    fontSize: "12px",
                                                    color: "#a0aec0"
                                                })
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
                            {(thirdLevelOptions.length > 0 || loadingThird || lockedLevels.level3) && (<Box minW="130px" flexShrink={0} position="relative">
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
                                            placeholder={selectedSecondLevel ? "Ward" : "Select LGA first"}
                                            isClearable={!lockedLevels.level3}
                                            size="sm"
                                            isDisabled={!selectedSecondLevel || lockedLevels.level3}
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
                                                    minWidth: "140px",
                                                    maxHeight: "80px",
                                                    overflow: "auto"
                                                }),
                                                menuList: (base) => ({
                                                    ...base,
                                                    maxHeight: "80px"
                                                }),
                                                control: (base) => ({
                                                    ...base,
                                                    minHeight: "28px",
                                                    backgroundColor: lockedLevels.level3 ? "#f5f5f5" : 
                                                        selectedThirdLevel ? "#e0f2fe" : "#f0f9ff", // Light blue by default
                                                    border: selectedThirdLevel ? "1px solid #0284c7" : "1px solid #0ea5e9", // Blue border by default
                                                    opacity: lockedLevels.level3 ? 0.6 : 1,
                                                    cursor: lockedLevels.level3 ? "not-allowed" : "pointer",
                                                    fontSize: "13px",
                                                    "&:hover": {
                                                        borderColor: lockedLevels.level3 ? "#d0d0d0" : 
                                                            selectedThirdLevel ? "#0284c7" : "#0284c7" // Blue on hover by default
                                                    }
                                                }),
                                                dropdownIndicator: (base) => ({
                                                    ...base,
                                                    color: selectedThirdLevel ? "#2563eb" : "#0ea5e9" // Blue by default
                                                }),
                                                placeholder: (base) => ({
                                                    ...base,
                                                    fontSize: "12px",
                                                    color: "#a0aec0"
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
                            {(fourthLevelOptions.length > 0 || loadingFourth || lockedLevels.level4) && (<Box minW="130px" flexShrink={0} position="relative">
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
                                            placeholder={selectedThirdLevel ? "School" : "Select Ward first"}
                                            isClearable={!lockedLevels.level4}
                                            size="sm"
                                            isDisabled={!selectedThirdLevel || lockedLevels.level4}
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
                                                    minWidth: "140px",
                                                    maxHeight: "80px",
                                                    overflow: "auto"
                                                }),
                                                menuList: (base) => ({
                                                    ...base,
                                                    maxHeight: "80px"
                                                }),
                                                control: (base) => ({
                                                    ...base,
                                                    minHeight: "28px",
                                                    backgroundColor: lockedLevels.level4 ? "#f5f5f5" : 
                                                        selectedFourthLevel ? "#e0f2fe" : "#f0f9ff", // Light blue by default
                                                    border: selectedFourthLevel ? "1px solid #0284c7" : "1px solid #0ea5e9", // Blue border by default
                                                    opacity: lockedLevels.level4 ? 0.6 : 1,
                                                    cursor: lockedLevels.level4 ? "not-allowed" : "pointer",
                                                    fontSize: "13px",
                                                    "&:hover": {
                                                        borderColor: lockedLevels.level4 ? "#d0d0d0" : 
                                                            selectedFourthLevel ? "#0284c7" : "#0284c7" // Blue on hover by default
                                                    }
                                                }),
                                                dropdownIndicator: (base) => ({
                                                    ...base,
                                                    color: selectedFourthLevel ? "#2563eb" : "#0ea5e9" // Blue by default
                                                }),
                                                placeholder: (base) => ({
                                                    ...base,
                                                    fontSize: "12px",
                                                    color: "#a0aec0"
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
                            {(fifthLevelOptions.length > 0 || loadingFifth || lockedLevels.level5) && (<Box minW="130px" flexShrink={0} position="relative">
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
                                            placeholder={selectedFourthLevel ? "Level 5" : "Select School first"}
                                            isClearable={!lockedLevels.level5}
                                            size="sm"
                                            isDisabled={!selectedFourthLevel || lockedLevels.level5}
                                            menuPortalTarget={document.body}
                                            menuPosition="fixed"
                                            menuPlacement="top"
                                            styles={{
                                                menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                                                menu: (base) => ({ ...base, minWidth: "140px", maxHeight: "80px", overflow: "auto" }),
                                                menuList: (base) => ({ ...base, maxHeight: "80px" }),
                                                control: (base) => ({
                                                    ...base,
                                                    minHeight: "28px",
                                                    backgroundColor: lockedLevels.level5 ? "#f5f5f5" : 
                                                        selectedFifthLevel ? "#e0f2fe" : "#f0f9ff", // Light blue by default
                                                    border: selectedFifthLevel ? "1px solid #0284c7" : "1px solid #0ea5e9", // Blue border by default
                                                    opacity: lockedLevels.level5 ? 0.6 : 1,
                                                    cursor: lockedLevels.level5 ? "not-allowed" : "pointer",
                                                    fontSize: "13px",
                                                    "&:hover": { 
                                                        borderColor: lockedLevels.level5 ? "#d0d0d0" : 
                                                            selectedFifthLevel ? "#0284c7" : "#0284c7" // Blue on hover by default
                                                    },
                                                }),
                                                dropdownIndicator: (base) => ({
                                                    ...base,
                                                    color: selectedFifthLevel ? "#2563eb" : "#0ea5e9" // Blue by default
                                                }),
                                                placeholder: (base) => ({
                                                    ...base,
                                                    fontSize: "12px",
                                                    color: "#a0aec0"
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

        </Stack>
    );
}