import React, { useMemo } from "react";
import {
    Stack,
    Flex,
    Badge,
    Tooltip,
} from "@chakra-ui/react";
import { TreeSelect } from "antd";
const { SHOW_PARENT } = TreeSelect;
import { useStore } from "effector-react";
import { useLiveQuery } from "dexie-react-hooks";
import { storeApi } from "../../Events";
import { $store } from "../../Store";
import { db } from "../../db";
import arrayToTree from "array-to-tree";

export default function OrgUnitPicker2() {
    const store = useStore($store);
    const selectedIds = store.organisations;

    // 1) load flat org-unit records from Dexie
    const organisations =
        useLiveQuery(() => db.organisations.toArray(), []) || [];

    // 2) build nested tree using pId
    const treeArray = useMemo(
        () => arrayToTree(organisations, { parentProperty: "pId" }),
        [organisations]
    );

    // 3) convert to AntD TreeSelect format
    const treeData = useMemo(() => {
        const mapNode = (node: any) => ({
            title: node.title,
            value: node.id,
            key: node.id,
            children: Array.isArray(node.children)
                ? node.children.map(mapNode)
                : [],
        });
        return treeArray.map(mapNode);
    }, [treeArray]);

    // 4) fetch selected nodes again for display badges
    const selectedNodes =
        useLiveQuery(
            () =>
                db.organisations.where("id").anyOf(selectedIds || []).toArray(),
            [selectedIds]
        ) || [];

    const names = selectedNodes.map((n) =>
        typeof n.title === "string" ? n.title : String(n.title)
    );

    // 5) badge overflow logic
    const MAX_VISIBLE = 3;
    const visibleNames = names.slice(0, MAX_VISIBLE);
    const hiddenNames = names.slice(MAX_VISIBLE);
    const hasHidden = hiddenNames.length > 0;
    const hiddenTooltip = hiddenNames.join(", ");

    return (
        <Stack spacing={2}>
            {/* TreeSelect dropdown */}
            <TreeSelect
                treeCheckable
                showCheckedStrategy={SHOW_PARENT}
                placeholder="Select Org Units"
                style={{ width: 300 }}
                dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
                treeData={treeData}
                value={selectedIds}
                onChange={(vals) => {
                    storeApi.setOrganisations(vals as string[]);
                }}
            />

            {/* Selected badges */}
            <Flex wrap="nowrap" overflow="hidden" align="center">
                {visibleNames.map((name, idx) => (
                    <Tooltip key={idx} label={name} hasArrow>
                        <Badge
                            colorScheme="blue"
                            variant="subtle"
                            px={2}
                            py={1}
                            mr={2}
                            maxW="120px"
                            whiteSpace="nowrap"
                            overflow="hidden"
                            textOverflow="ellipsis"
                        >
                            {name}
                        </Badge>
                    </Tooltip>
                ))}

                {hasHidden && (
                    <Tooltip label={hiddenTooltip} hasArrow>
                        <Badge colorScheme="gray" variant="outline" px={2} py={1}>
                            …
            </Badge>
                    </Tooltip>
                )}
            </Flex>
        </Stack>
    );
}
