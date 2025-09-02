import React, { useState, useEffect, useCallback } from "react";
import { Box, Text, Spinner } from "@chakra-ui/react";
import { GroupBase, Select } from "chakra-react-select";
import { useDataEngine } from "@dhis2/app-runtime";
import { useStore } from "effector-react";
import { storeApi } from "../../Events";
import { $store } from "../../Store";
import { db } from "../../db";

// Temporary function to clear cache - can be called from browser console
(window as any).clearOrgUnitCache = async () => {
    await db.organisations.clear();
    localStorage.removeItem("ou-cache-owner");
    localStorage.removeItem("has-user-logged-in");
};

interface DefaultOption {
    label: string;
    value: string;
    id: string;
    level: number;
}

interface DefaultOrgUnitFilterProps {
    isDisabled?: boolean;
}

export default function DefaultOrgUnitFilter({ isDisabled = false }: DefaultOrgUnitFilterProps) {
    const engine = useDataEngine();
    const store = useStore($store);
    
    
    const [defaultOption, setDefaultOption] = useState<DefaultOption | null>(null);
    const [loading, setLoading] = useState(false);
    const [hasFullAccess, setHasFullAccess] = useState(false);

    // Helper to get current user key for cache ownership
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

    // Determine user access type and set default filter
    const determineAndSetDefault = useCallback(async () => {
        if (loading) return;
        
        setLoading(true);
        
        try {
            // Get user's org units from cache
            const userOrgUnits = await db.organisations.toArray();
            
            if (!userOrgUnits || userOrgUnits.length === 0) {
                setLoading(false);
                return;
            }

            // Analyze user's access pattern
            const unitLevels = userOrgUnits.map((unit: any) => unit.level);
            const minLevel = Math.min(...unitLevels);
            const maxLevel = Math.max(...unitLevels);
            const totalUnits = userOrgUnits.length;
            const levelCounts = {
                level2: userOrgUnits.filter((unit: any) => unit.level === 2).length,
                level3: userOrgUnits.filter((unit: any) => unit.level === 3).length,
            };

            // Determine if user has broad access (simplified version of main logic)
            const hasLevel1Access = (minLevel === 1);
            const hasLimitedLevel1Access = hasLevel1Access && totalUnits <= 3 && maxLevel > minLevel;
            const hasTrueBroadLevel1Access = hasLevel1Access && !hasLimitedLevel1Access;
            const hasLevel1WithMultipleLevel2 = (minLevel === 1 && levelCounts.level2 > 2);
            const hasManyUnitsAcrossLevels = (totalUnits > 5 && maxLevel > minLevel);
            const hasMultipleUnitsAtHighLevels = (levelCounts.level2 > 1 && levelCounts.level3 > 1);
            
            const broadAccess = hasTrueBroadLevel1Access || hasLevel1WithMultipleLevel2 || hasManyUnitsAcrossLevels || hasMultipleUnitsAtHighLevels;
            setHasFullAccess(broadAccess);

            let defaultUnit: DefaultOption | null = null;

            if (broadAccess) {
                // Admin/broad access users: Default to country level (level 1)
                try {
                    const response: any = await engine.query({
                        countryLevel: {
                            resource: "organisationUnits.json",
                            params: {
                                filter: "level:eq:1",
                                fields: "id,name,level",
                                paging: "false",
                            },
                        },
                    });
                    
                    const countryUnits = response.countryLevel?.organisationUnits || [];
                    if (countryUnits.length > 0) {
                        const countryUnit = countryUnits[0]; // Usually there's only one country
                        defaultUnit = {
                            label: countryUnit.name,
                            value: countryUnit.id,
                            id: countryUnit.id,
                            level: 1
                        };
                    }
                } catch (error) {
                    console.warn("Failed to load country level unit:", error);
                }
            } else {
                // Limited access users: Use their highest accessible level as default
                const highestLevelUnit = userOrgUnits.find((unit: any) => unit.level === minLevel);
                
                if (highestLevelUnit) {
                    defaultUnit = {
                        label: (highestLevelUnit as any).name,
                        value: (highestLevelUnit as any).id,
                        id: (highestLevelUnit as any).id,
                        level: (highestLevelUnit as any).level
                    };
                }
            }

            if (defaultUnit) {
                setDefaultOption(defaultUnit);
                
                // Set this as the dashboard's default filter
                try {
                    storeApi?.setOrganisations?.([defaultUnit.id]);
                    storeApi.setSelectedOrgUnitName?.(defaultUnit.label);
                } catch (e) {
                    console.warn("Failed to set default filter:", e);
                }
            }

        } catch (error) {
            console.error("Error determining default filter:", error);
        } finally {
            setLoading(false);
        }
    }, [engine, loading]);

    // Initialize default filter when system is ready
    useEffect(() => {
        const initializeDefault = async () => {
            if (store.systemId && !defaultOption && !loading) {
                // Verify we're using the correct user's cache
                const currentUserKey = await getCurrentUserKey();
                const cacheOwner = localStorage.getItem("ou-cache-owner");
                
                if (cacheOwner === currentUserKey) {
                    const units = await db.organisations.toArray();
                    if (units && units.length > 0) {
                        await determineAndSetDefault();
                    }
                }
            }
        };

        initializeDefault();
    }, [store.systemId, defaultOption, loading, getCurrentUserKey, determineAndSetDefault]);

    // Re-establish default filter when organisational selections are cleared
    useEffect(() => {
        const checkAndReestablishDefault = async () => {
            // If no organisations are selected and we have a default, re-apply it
            if (store.organisations && store.organisations.length === 0 && defaultOption && !loading) {
                try {
                    storeApi?.setOrganisations?.([defaultOption.id]);
                    storeApi.setSelectedOrgUnitName?.(defaultOption.label);
                } catch (e) {
                    console.warn("Failed to re-establish default filter:", e);
                }
            }
        };

        // Small delay to avoid conflicts with clearing operations
        const timer = setTimeout(checkAndReestablishDefault, 200);
        return () => clearTimeout(timer);
    }, [store.organisations, defaultOption, loading]);

    if (loading) {
        return (
            <Box minW="180px">
                <Text fontSize="xs" fontWeight="medium" color="gray.500" mb={1}>
                    Default Filter
                </Text>
                <Box display="flex" alignItems="center" justifyContent="center" h="32px" bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
                    <Spinner size="sm" />
                    <Text ml={2} fontSize="xs" color="gray.600">Loading...</Text>
                </Box>
            </Box>
        );
    }

    if (!defaultOption) {
        return null; // Don't render if no default option available
    }

    return (
        <Box minW="130px" flexShrink={0} position="relative">
            <Select<DefaultOption, false, GroupBase<DefaultOption>>
                value={defaultOption}
                onChange={undefined} // No change handler - disabled
                options={[defaultOption]} // Only show the default option
                placeholder="Country"
                isClearable={false}
                isDisabled={true} // Always disabled as per user request
                size="sm"
                menuPortalTarget={document.body}
                menuPosition="fixed"
                styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                    control: (base) => ({
                        ...base,
                        minHeight: "28px",
                        backgroundColor: "#e8f4fd", // Light blue background to indicate it's the default/country level
                        border: "1px solid #3182ce",
                        opacity: 1,
                        cursor: "not-allowed",
                        fontSize: "13px",
                        fontWeight: "500",
                        color: "#2d3748",
                        "&:hover": {
                            borderColor: "#3182ce"
                        }
                    }),
                    dropdownIndicator: (base) => ({
                        ...base,
                        display: "none" // Hide dropdown arrow since it's disabled
                    }),
                    indicatorSeparator: (base) => ({
                        ...base,
                        display: "none" // Hide separator
                    }),
                    menu: (base) => ({
                        ...base,
                        minWidth: "120px",
                        maxHeight: "80px"
                    }),
                    singleValue: (base) => ({
                        ...base,
                        color: "#2d3748",
                        fontWeight: "500"
                    }),
                    placeholder: (base) => ({
                        ...base,
                        fontSize: "12px",
                        color: "#a0aec0"
                    })
                }}
            />
        </Box>
    );
}