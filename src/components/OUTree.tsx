import React, { useState, useMemo, useEffect } from "react";
import { Stack, Input, Box, Spinner, List, ListItem, Button } from "@chakra-ui/react";
import { useDataEngine } from "@dhis2/app-runtime";
import { Tree } from "antd";
import arrayToTree from "array-to-tree";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";

const OUTree = ({
    value,
    onChange,
}: {
    value: string[];
    onChange: (value: string[]) => void;
}) => {
    const engine = useDataEngine();

    const organisations = useLiveQuery(() => db.organisations.toArray()) || [];
    const expandedKeysDb = useLiveQuery(() => db.expandedKeys.get("1"));

    const [autoExpandParent, setAutoExpandParent] = useState(true);
    const [checkedKeys, setCheckedKeys] = useState<
        { checked: React.Key[]; halfChecked: React.Key[] } | React.Key[]
    >({ checked: value, halfChecked: [] });

    const [search, setSearch] = useState("");
    const [searching, setSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<
        Array<{ id: string; name: string; path: string }>
    >([]);

    const fullTreeData = useMemo(
        () => arrayToTree(organisations, { parentProperty: "pId" }),
        [organisations]
    );

    const [expandedKeysState, setExpandedKeysState] = useState<string[]>(
        () => expandedKeysDb?.name.split(",") || []
    );
    useEffect(() => {
        setExpandedKeysState(expandedKeysDb?.name.split(",") || []);
    }, [expandedKeysDb]);

    useEffect(() => {
        if (search.trim().length < 3) {
            setSearchResults([]);
            return;
        }
        let cancelled = false;
        setSearching(true);

        engine
            .query({
                units: {
                    resource: "organisationUnits.json",
                    params: {
                        filter: `name:ilike:${search}`,
                        fields: "id,name,path",
                        paging: "false",
                    },
                },
            })
            .then((res: any) => {
                if (cancelled) return;
                console.log("DHIS2 search response.units:", res.units);
                const list: Array<{ id: string; name: string; path: string }> =
                    res.units.organisationUnits || [];
                setSearchResults(list);
            })
            .catch((err) => {
                console.error("DHIS2 search error:", err);
                if (!cancelled) setSearchResults([]);
            })
            .finally(() => {
                if (!cancelled) setSearching(false);
            });

        return () => {
            cancelled = true;
        };
    }, [search, engine]);

    const handlePick = async (unit: { id: string; path: string }) => {
        const ancestors = unit.path.split("/").filter(Boolean);

        await Promise.all(
            ancestors.map(async (pid) => {
                const res: any = await engine.query({
                    units: {
                        resource: "organisationUnits.json",
                        params: {
                            filter: `id:in:[${pid}]`,
                            fields: "children[id,name,path,leaf]",
                            paging: "false",
                        },
                    },
                });
                console.log(`Loaded children for ${pid}:`, res.units);
                const parentUnits: any[] = res.units.organisationUnits || [];
                const toPut = parentUnits.flatMap((u) =>
                    u.children.map((c: any) => ({
                        id: c.id,
                        pId: pid,
                        value: c.id,
                        title: c.name,
                        key: c.id,
                        isLeaf: c.leaf,
                    }))
                );
                await db.organisations.bulkPut(toPut);
            })
        );

        setExpandedKeysState(ancestors);
        setAutoExpandParent(true);
        setCheckedKeys({ checked: [unit.id], halfChecked: [] });
        onChange([unit.id]);

        setSearch("");
        setSearchResults([]);
    };

    const onLoadData = async ({ id, children }: any) => {
        if (children) return;
        const res: any = await engine.query({
            units: {
                resource: "organisationUnits.json",
                params: {
                    filter: `id:in:[${id}]`,
                    fields: "children[id,name,path,leaf]",
                    paging: "false",
                },
            },
        });
        console.log(`Lazy‐loaded children for ${id}:`, res.units);
        const parentUnits: any[] = res.units.organisationUnits || [];
        const found = parentUnits.flatMap((u) =>
            u.children.map((c: any) => ({
                id: c.id,
                pId: id,
                value: c.id,
                title: c.name,
                key: c.id,
                isLeaf: c.leaf,
            }))
        );
        await db.organisations.bulkPut(found);
    };

    const onExpand = async (keys: React.Key[]) => {
        await db.expandedKeys.put({
            id: "1",
            name: (keys as string[]).join(","),
        });
        setAutoExpandParent(false);
        setExpandedKeysState(keys as string[]);
    };

    const onCheck = (
        keys: { checked: React.Key[]; halfChecked: React.Key[] } | React.Key[]
    ) => {
        const all = Array.isArray(keys) ? keys : keys.checked;
        setCheckedKeys(keys);
        onChange(all.map((k) => String(k)));
    };

    return (
        <Stack spacing="10px">
            <Input
                placeholder="Search organisation units…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="sm"
            />

            {search.trim().length >= 3 ? (
                searching ? (
                    <Spinner size="sm" />
                ) : (
                        <Box
                            maxH="200px"
                            overflowY="auto"
                            border="1px solid #ccc"
                            borderRadius="4px"
                        >
                            <List spacing={1}>
                                {searchResults.map((u) => (
                                    <ListItem key={u.id}>
                                        <Button
                                            variant="link"
                                            onClick={() => handlePick(u)}
                                            size="sm"
                                            w="100%"
                                            justifyContent="flex-start"
                                        >
                                            {u.name}
                                        </Button>
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    )
            ) : (
                    <Tree
                        checkable
                        onExpand={onExpand}
                        expandedKeys={expandedKeysState}
                        autoExpandParent={autoExpandParent}
                        checkStrictly
                        onCheck={onCheck}
                        checkedKeys={checkedKeys}
                        loadData={onLoadData}
                        style={{ maxHeight: 400, overflow: "auto", fontSize: 18 }}
                        treeData={fullTreeData}
                    />
                )}
        </Stack>
    );
};

export default OUTree;

