import { useDataEngine } from "@dhis2/app-runtime";
import { useQuery } from "@tanstack/react-query";
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { Event } from "effector";
import {
    fromPairs,
    groupBy,
    isEmpty,
    min,
    uniq,
    flatten,
    every,
    uniqBy,
    max,
} from "lodash";
import { evaluate } from "mathjs";
import { db } from "./db";
import {
    categoriesApi,
    categoryApi,
    dashboardApi,
    dashboardTypeApi,
    dataSetsApi,
    dataSourceApi,
    dataSourcesApi,
    indicatorsApi,
    paginationApi,
    settingsApi,
    storeApi,
    visualizationDataApi,
    calculatedApi,
} from "./Events";
import {
    DataNode,
    ICategory,
    IDashboard,
    IDashboardSetting,
    IData,
    IDataSource,
    IDimension,
    IExpressions,
    IIndicator,
    INamed,
    IVisualization,
    Storage,
    Threshold,
    IFilter,
    IVisualization2,
    IIndicator2,
    IData2,
} from "./interfaces";
import { createCategory, createDashboard, createDataSource } from "./Store";
import {
    getSearchParams,
    processMap,
    flattenDHIS2Data,
    merge2DataSources,
} from "./utils/utils";
import { get, getOr } from "lodash/fp";

type QueryProps = {
    namespace: string;
    systemId: string;
    otherQueries: any[];
    signal?: AbortSignal;
    engine: any;
};

export const api = axios.create({
    baseURL: "https://services.dhis2.hispuganda.org/",
    string: "",
});

export const fetchDataForIndex = async (
    engine: any,
    dataSource: IDataSource
) => {
    let resource: string = "events/query.json";

    let totalRows = 1;
    let page = 1;

    do {
        let params = {
            programStage: dataSource.indexDb?.programStage,
            ouMode: "ALL",
            page,
        };
        const {
            data: { headers, rows },
        }: {
            data: {
                headers: Array<{
                    name: string;
                    column: string;
                    type: string;
                    hidden: boolean;
                    meta: boolean;
                }>;
                rows: string[][];
            };
        } = await engine.query({
            data: { resource, params },
        });
        const data = rows.map((row) => {
            return fromPairs(
                row.map((value, index) => [headers[index].name, value])
            );
        });
        db.events.bulkPut(data);
        totalRows = rows.length;
        page = page + 1;
    } while (totalRows !== 0);
};

export const queryDataSource = async (
    dataSource: IDataSource,
    url = "",
    parameters: { [key: string]: any }
) => {
    const engine = useDataEngine();
    if (dataSource.type === "DHIS2" && dataSource.isCurrentDHIS2) {
        if (url) {
            const query = {
                results: {
                    resource: url,
                    params: parameters,
                },
            };
            try {
                const { results }: any = await engine.query(query);
                return results;
            } catch (error) {
                return null;
            }
        }
    }

    let params: AxiosRequestConfig = {
        baseURL: dataSource.authentication?.url,
        string: "",
    };

    if (
        dataSource.authentication &&
        dataSource.authentication.username &&
        dataSource.authentication.password
    ) {
        params = {
            ...params,
            auth: {
                username: dataSource.authentication.username,
                password: dataSource.authentication.password,
            },
        };
    }
    const instance = axios.create(params);
    const { data } = await instance.get(url, {
        params: parameters,
        string: "",
    });
    return data;
};

export const getDHIS2Index = async <TData>(
    args: Pick<QueryProps, "namespace" | "engine">
) => {
    const { engine, namespace } = args;
    const namespaceQuery = {
        namespaceKeys: {
            resource: `dataStore/${namespace}`,
        },
    };
    try {
        const { namespaceKeys }: any = await engine.query(namespaceQuery);
        const query: any = fromPairs(
            namespaceKeys.map((n: string) => [
                n,
                {
                    resource: `dataStore/${namespace}/${n}`,
                },
            ])
        );
        const response: any = await engine.query(query);
        return Object.values<TData>(response);
    } catch (error) {
        console.log(error);
    }
    return [];
};

export const getESIndex = async <TData>(args: Omit<QueryProps, "engine">) => {
    let must: any[] = [
        {
            term: { "systemId.keyword": args.systemId },
        },
        ...args.otherQueries,
    ];
    try {
        let {
            data: {
                hits: { hits },
            },
        } = await api.post<{ hits: { hits: Array<{ _source: TData }> } }>(
            "wal/search",
            {
                index: args.namespace,
                size: 1000,
                query: {
                    bool: {
                        must,
                    },
                },
            }
            // { signal: args.signal }
        );
        return hits.map(({ _source }) => _source);
    } catch (error) {
        return [];
    }
};

export const getIndex = async <TData>(
    storage: "data-store" | "es",
    args: QueryProps
) => {
    if (storage === "es") {
        return await getESIndex<TData>(args);
    }

    return await getDHIS2Index<TData>(args);
};

export const getDHIS2Record = async <TData>(
    id: string,
    args: Pick<QueryProps, "namespace" | "engine">
) => {
    const { namespace, engine } = args;
    const namespaceQuery = {
        storedValue: {
            resource: `dataStore/${namespace}/${id}`,
        },
    };
    const { storedValue } = await engine.query(namespaceQuery);
    return storedValue as TData;
};

export const getESRecord = async <TData>(
    id: string,
    args: Omit<QueryProps, "systemId" | "engine">
) => {
    let {
        data: {
            body: { _source },
        },
    } = await api.post<{ body: { _source: TData } }>("wal/get", {
        index: args.namespace,
        id,
    });
    return _source;
};

export const getOneRecord = async <TData>(
    storage: "data-store" | "es",
    id: string,
    args: QueryProps
) => {
    if (storage === "es") {
        return getESRecord<TData>(id, args);
    }
    return getDHIS2Record<TData>(id, args);
};

export const useInitials = (storage: "data-store" | "es") => {
    const engine = useDataEngine();
    const ouQuery = {
        me: {
            resource: "me.json",
            params: {
                fields: "organisationUnits[id,name,leaf,level],authorities,userRoles[name]",
            },
        },
        levels: {
            resource: "organisationUnitLevels.json",
            params: {
                order: "level:DESC",
                fields: "id,level~rename(value),name~rename(label)",
            },
        },
        groups: {
            resource: "organisationUnitGroups.json",
            params: {
                fields: "id~rename(value),name~rename(label)",
            },
        },
        dataSets: {
            resource: "dataSets.json",
            params: {
                fields: "id~rename(value),name~rename(label)",
            },
        },
        systemInfo: {
            resource: "system/info",
        },
    };
    return useQuery<string, Error>(
        ["initialing"],
        async ({ signal }) => {
            const {
                //directives: { rows, headers },
                systemInfo: { systemId, systemName, instanceBaseUrl },
                me: { organisationUnits, authorities, userRoles },
                levels: { organisationUnitLevels },
                groups: { organisationUnitGroups },
                dataSets: { dataSets },
            }: any = await engine.query(ouQuery);

            const isAdmin =
                authorities.indexOf("IDVT_ADMINISTRATION") !== -1 ||
                authorities.indexOf("ALL") !== -1 ||
                userRoles.map(({ name }: any) => name).indexOf("Superuser") !==
                    -1;
            const facilities: string[] = organisationUnits.map(
                (unit: any) => unit.id
            );
            const maxLevel =
                organisationUnitLevels.length > 0
                    ? organisationUnitLevels[0].value
                    : 1;
            const levels = organisationUnitLevels.map(
                ({ value }: any) => value
            );
            const minLevel: number | null | undefined = min(levels);
            const minSublevel: number | null | undefined = max(levels);

            const availableUnits = organisationUnits.map((unit: any) => {
                return {
                    id: unit.id,
                    pId: unit.pId || "",
                    value: unit.id,
                    title: unit.name,
                    key: unit.id,
                    isLeaf: unit.leaf,
                };
            });
            const settings = await getIndex<IDashboardSetting>(storage, {
                namespace: "i-dashboard-settings",
                systemId,
                otherQueries: [],
                signal,
                engine,
            });
            // const defaultDashboard = settings.find(
            //     (s: any) => s.id === systemId && s.default
            // );
            if (settings.length > 0) {
                storeApi.changeSelectedDashboard(settings[0].defaultDashboard);
                storeApi.setDefaultDashboard(settings[0].defaultDashboard);
                // if (defaultDashboard.storage) {
                //     settingsApi.changeStorage(defaultDashboard.storage);
                // }
            }
            if (minSublevel && minSublevel + 1 <= maxLevel) {
                storeApi.setMinSublevel(minSublevel + 1);
            } else {
                storeApi.setMinSublevel(maxLevel);
            }
            storeApi.setSystemId(systemId);
            storeApi.setSystemName(systemName);
            dataSetsApi.setDataSets(dataSets);
            storeApi.setInstanceBaseUrl(instanceBaseUrl);
            storeApi.setOrganisations(facilities);
            storeApi.setMaxLevel(maxLevel);
            storeApi.changeAdministration(isAdmin);
            storeApi.setLevels([
                minLevel === 1 ? "3" : `${minLevel ? minLevel + 1 : 4}`,
            ]);
            await db.systemInfo.bulkPut([
                { id: "1", systemId, systemName, instanceBaseUrl },
            ]);
            await db.organisations.bulkPut(availableUnits);
            await db.levels.bulkPut(organisationUnitLevels);
            await db.groups.bulkPut(organisationUnitGroups);
            await db.dataSets.bulkPut(dataSets);
            return "Done";
        },
        { retry: false }
    );
};

export const useDataSources = (
    storage: "data-store" | "es",
    systemId: string
) => {
    const engine = useDataEngine();
    return useQuery<IDataSource[], Error>(
        ["i-data-sources"],
        async ({ signal }) => {
            try {
                storeApi.setCurrentPage("data-sources");
                storeApi.setShowFooter(false);
                storeApi.setShowSider(true);
                return await getIndex<IDataSource>(storage, {
                    namespace: "i-data-sources",
                    systemId,
                    otherQueries: [],
                    signal,
                    engine,
                });
            } catch (error) {
                console.error(error);
                return [];
            }
        }
    );
};
export const useDataSource = (storage: "data-store" | "es", id: string) => {
    const engine = useDataEngine();
    return useQuery<boolean, Error>(
        ["i-data-sources", id],
        async ({ signal }) => {
            let dataSource = await getOneRecord<IDataSource>(storage, id, {
                namespace: "i-data-sources",
                otherQueries: [],
                signal,
                engine,
                systemId: "",
            });
            if (isEmpty(dataSource)) {
                dataSource = createDataSource(id);
            }
            dataSourceApi.setDataSource(dataSource);
            return true;
        }
    );
};

export const useDashboards = (
    storage: "data-store" | "es",
    systemId: string
) => {
    const engine = useDataEngine();
    return useQuery<IDashboard[], Error>(
        ["i-dashboards"],
        async ({ signal }) => {
            try {
                const dashboards = await getIndex<IDashboard>(storage, {
                    namespace: "i-dashboards",
                    systemId,
                    otherQueries: [],
                    signal,
                    engine,
                });
                return dashboards;
            } catch (error) {
                console.error(error);
                return [];
            }
        }
    );
};

export const useCategoryList = (
    storage: "data-store" | "es",
    systemId: string
) => {
    const engine = useDataEngine();
    return useQuery<
        { dashboards: IDashboard[]; categories: ICategory[] },
        Error
    >(["i-dashboards-categories"], async ({ signal }) => {
        const dashboards = await getIndex<IDashboard>(storage, {
            namespace: "i-dashboards",
            systemId,
            otherQueries: [],
            signal,
            engine,
        });
        const categories = await getIndex<ICategory>(storage, {
            namespace: "i-categories",
            systemId,
            otherQueries: [],
            signal,
            engine,
        });

        return { dashboards, categories };
    });
};

export const useDashboard = (
    storage: "data-store" | "es",
    id: string,
    systemId: string,
    dashboardType: "dynamic" | "fixed",
    action: "view" | "create" | "update" | undefined
) => {
    const engine = useDataEngine();
    return useQuery<IDashboard, Error>(
        ["i-dashboards", id],
        async ({ signal }) => {
            if (action === "view" || action === "update") {
                let dashboard = await getOneRecord<IDashboard>(storage, id, {
                    namespace: "i-dashboards",
                    otherQueries: [],
                    signal,
                    engine,
                    systemId,
                });
                dashboardTypeApi.set(dashboard.type);
                // const queries = await getIndex<IIndicator>(storage, {
                //     namespace: "i-visualization-queries",
                //     systemId,
                //     otherQueries: [],
                //     signal,
                //     engine,
                // });
                // const dataSources = await getIndex<IDataSource>(storage, {
                //     namespace: "i-data-sources",
                //     systemId,
                //     otherQueries: [],
                //     signal,
                //     engine,
                // });
                // const categories = await getIndex<ICategory>(storage, {
                //     namespace: "i-categories",
                //     systemId,
                //     otherQueries: [],
                //     signal,
                //     engine,
                // });
                // categoriesApi.setCategories(categories);
                // dataSourcesApi.setDataSources(dataSources);
                dashboardApi.setCurrentDashboard(dashboard);
                storeApi.changeSelectedDashboard(dashboard.id);
                storeApi.changeSelectedCategory(dashboard.category || "");
                // indicatorsApi.setVisualizationQueries(queries);
                return dashboard;
            }
            return createDashboard(id, dashboardType);
        }
    );
};

export const useCategories = (
    storage: "data-store" | "es",
    systemId: string
) => {
    const engine = useDataEngine();

    return useQuery<ICategory[], Error>(
        ["i-categories"],
        async ({ signal }) => {
            try {
                return await getIndex(
                    storage,

                    {
                        namespace: "i-categories",
                        systemId,
                        otherQueries: [],
                        signal,
                        engine,
                    }
                );
            } catch (error) {
                console.error(error);
                return [];
            }
        }
    );
};

export const useCategory = (storage: "data-store" | "es", id: string) => {
    const engine = useDataEngine();

    return useQuery<boolean, Error>(
        ["i-categories", id],
        async ({ signal }) => {
            try {
                let category = await getOneRecord<ICategory>(storage, id, {
                    namespace: "i-categories",
                    otherQueries: [],
                    signal,
                    engine,
                    systemId: "",
                });
                if (!category) {
                    category = createCategory(id);
                }
                categoryApi.setCategory(category);
                return true;
            } catch (error) {
                console.error(error);
            }
            return true;
        }
    );
};

export const useNamespace = <TData>(
    namespace: string,
    storage: "data-store" | "es",
    systemId: string,
    key: string[]
) => {
    const engine = useDataEngine();
    return useQuery<TData[], Error>([namespace, ...key], async ({ signal }) => {
        try {
            return await getIndex(storage, {
                namespace,
                systemId,
                otherQueries: [],
                signal,
                engine,
            });
        } catch (error) {
            console.error(error);
            return [];
        }
    });
};

export const useVisualizationData = (
    storage: "data-store" | "es",
    systemId: string
) => {
    const engine = useDataEngine();
    return useQuery<IIndicator[], Error>(
        ["i-visualization-queries"],
        async ({ signal }) => {
            try {
                return await getIndex(storage, {
                    namespace: "i-visualization-queries",
                    systemId,
                    otherQueries: [],
                    signal,
                    engine,
                });
            } catch (error) {
                console.error(error);
                return [];
            }
        }
    );
};

export const useSingleNamespace = <TData>(
    storage: "data-store" | "es",
    id: string,
    systemId: string,
    namespace: string,
    onQuery: Event<TData>,
    onFailedData: TData
) => {
    const engine = useDataEngine();
    return useQuery<boolean, Error>([namespace, id], async ({ signal }) => {
        try {
            const data = await getOneRecord<TData>(storage, id, {
                namespace,
                otherQueries: [],
                signal,
                engine,
                systemId,
            });
            if (data) {
                onQuery(data);
            } else {
                onQuery(onFailedData);
            }

            return true;
        } catch (error) {
            onQuery(onFailedData);
            console.error(error);
            return false;
        }
    });
};

export const useDataSet = (dataSetId: string) => {
    const engine = useDataEngine();
    const namespaceQuery = {
        dataSet: {
            resource: `dataSets/${dataSetId}`,
            params: {
                fields: "categoryCombo[categoryOptionCombos[id,name,categoryOptions],categories[id,name,categoryOptions[id~rename(value),name~rename(label)]]]",
            },
        },
    };
    return useQuery<{ [key: string]: any }, Error>(
        ["data-set", dataSetId],
        async () => {
            try {
                const { dataSet }: any = await engine.query(namespaceQuery);
                // setAvailableCategories(categories);
                // setAvailableCategoryOptionCombos(categoryOptionCombos);
                // const selectedCategories = categories.map(
                //   ({ id, categoryOptions }: any, index: number) => [
                //     id,
                //     index === 0
                //       ? [categoryOptions[categoryOptions.length - 1]]
                //       : categoryOptions,
                //   ]
                // );
                // // setCategorization();
                // return fromPairs(selectedCategories);
                return {};
            } catch (error) {
                console.error(error);
                return {};
            }
        }
    );
};

export const getDHIS2Resources = async <T>({
    currentDHIS2,
    params,
    resource,
    resourceKey,
    dataSource,
}: Partial<{
    params: { [key: string]: string };
    resource: string;
    currentDHIS2: boolean;
    resourceKey: string;
    dataSource: AxiosInstance | undefined;
}>) => {
    const engine = useDataEngine();
    if (currentDHIS2 && resource && resourceKey) {
        const { data }: any = await engine.query({
            dimensions: {
                resource,
                params,
            },
        });
        return getOr<T[]>([], resourceKey, data);
    } else if (dataSource && resource && resourceKey) {
        const { data } = await dataSource.get<{ [key: string]: T[] }>(
            resource,
            {
                params,
                string: "",
            }
        );
        return data[resourceKey];
    }
    return [];
};
export const useDHIS2Resource = <T>({}: {
    params: { [key: string]: string };
    id: string;
    resource: string;
}) => {};

export const useDimensions = (
    currentDHIS2: boolean | undefined,
    dataSource: AxiosInstance | undefined
) => {
    return useQuery<Array<INamed & { items: INamed[] }>, Error>(
        ["dimensions", currentDHIS2],
        async () => {
            return getDHIS2Resources<INamed & { items: INamed[] }>({
                currentDHIS2,
                resource: "dimensions.json",
                params: { fields: "id,name,items[id,name]", paging: "false" },
                dataSource,
            });
        }
    );
};

export const useDataElements = (
    page: number,
    pageSize: number,
    q = "",
    currentDHIS2: boolean | undefined,
    dataSource: AxiosInstance | undefined
) => {
    let params: { [key: string]: any } = {
        page,
        pageSize,
        fields: "id,name",
        order: "name:ASC",
    };

    if (q) {
        params = {
            ...params,
            filter: `identifiable:token:${q}`,
        };
    }
    return useQuery<INamed[], Error>(
        ["data-elements", page, pageSize, q, currentDHIS2],
        async () => {
            return getDHIS2Resources<INamed>({
                currentDHIS2,
                resource: "dataElements.json",
                params,
                dataSource,
            });
        }
    );
};

export const useDataElementGroups = (
    page: number,
    pageSize: number,
    q = "",
    currentDHIS2: boolean | undefined,
    dataSource: AxiosInstance | undefined
) => {
    let params: { [key: string]: any } = {
        page,
        pageSize,
        fields: "id,name",
        order: "name:ASC",
    };

    if (q) {
        params = {
            ...params,
            filter: `identifiable:token:${q}`,
        };
    }
    return useQuery<INamed[], Error>(
        ["data-element-groups", page, pageSize, q],
        async () => {
            return getDHIS2Resources<INamed>({
                currentDHIS2,
                resource: "dataElementGroups.json",
                params,
                dataSource,
            });
        }
    );
};

export const useDataElementGroupSets = (
    page: number,
    pageSize: number,
    q = "",
    currentDHIS2: boolean | undefined,
    dataSource: AxiosInstance | undefined
) => {
    let params: { [key: string]: any } = {
        page,
        pageSize,
        fields: "id,name",
        order: "name:ASC",
    };

    if (q) {
        params = {
            ...params,
            filter: `identifiable:token:${q}`,
        };
    }
    return useQuery<INamed[], Error>(
        ["data-element-group-sets", page, pageSize, q],
        async () => {
            return getDHIS2Resources<INamed>({
                currentDHIS2,
                resource: "dataElementGroupSets.json",
                params,
                dataSource,
            });
        }
    );
};

export const useIndicators = (
    page: number,
    pageSize: number,
    q = "",
    currentDHIS2: boolean | undefined,
    dataSource: AxiosInstance | undefined
) => {
    let params: { [key: string]: any } = {
        page,
        pageSize,
        fields: "id,name",
        order: "name:ASC",
    };

    if (q) {
        params = { ...params, filter: `identifiable:token:${q}` };
    }
    return useQuery<INamed[], Error>(
        ["indicators", page, pageSize, q],
        async () => {
            return getDHIS2Resources<INamed>({
                currentDHIS2,
                resource: "indicators.json",
                params,
                dataSource,
            });
        }
    );
};

export const useSQLViews = (
    currentDHIS2: boolean | undefined,
    dataSource: AxiosInstance | undefined
) => {
    const params = {
        paging: "false",
        fields: "id,name,sqlQuery",
    };
    return useQuery<Array<INamed & { sqlQuery: string }>, Error>(
        ["sql-views"],
        async () => {
            return getDHIS2Resources<INamed & { sqlQuery: string }>({
                currentDHIS2,
                resource: "sqlViews.json",
                params,
                dataSource,
            });
        }
    );
};

export const useDHIS2Visualizations = (
    currentDHIS2: boolean | undefined,
    dataSource: AxiosInstance | undefined
) => {
    const params = {
        fields: "id,name",
    };
    return useQuery<INamed[], Error>(["dhis-visualizations"], async () => {
        return getDHIS2Resources<INamed>({
            currentDHIS2,
            resource: "sqlViews.json",
            params,
            dataSource,
        });
    });
};

export const useProgramIndicators = (
    page: number,
    pageSize: number,
    q = "",
    currentDHIS2: boolean | undefined,
    dataSource: AxiosInstance | undefined
) => {
    let params: { [key: string]: any } = {
        page,
        pageSize,
        fields: "id,name",
        order: "name:ASC",
    };

    if (q) {
        params = { ...params, filter: `identifiable:token:${q}` };
    }

    return useQuery<INamed[], Error>(
        ["program-indicators", page, pageSize, q],
        async () => {
            return getDHIS2Resources<INamed>({
                currentDHIS2,
                resource: "programIndicators.json",
                params,
                dataSource,
            });
        }
    );
};

export const useOrganisationUnitGroups = (
    page: number,
    pageSize: number,
    q = "",
    currentDHIS2: boolean | undefined,
    dataSource: AxiosInstance | undefined
) => {
    let params: { [key: string]: any } = {
        page,
        pageSize,
        fields: "id,name",
    };
    if (q) {
        params = { ...params, filter: `identifiable:token:${q}` };
    }
    return useQuery<INamed[], Error>(
        ["organisation-unit-groups", page, pageSize],
        async () => {
            return getDHIS2Resources<INamed>({
                currentDHIS2,
                resource: "organisationUnitGroups.json",
                params,
                dataSource,
            });
        }
    );
};

export const useOrganisationUnitGroupSets = (
    page: number,
    pageSize: number,
    q = "",
    currentDHIS2: boolean | undefined,
    dataSource: AxiosInstance | undefined
) => {
    let params: { [key: string]: any } = {
        page,
        pageSize,
        fields: "id,name",
    };
    if (q) {
        params = { ...params, filter: `identifiable:token:${q}` };
    }
    return useQuery<INamed[], Error>(
        ["organisation-unit-group-sets", page, pageSize],
        async () => {
            return getDHIS2Resources<INamed>({
                currentDHIS2,
                resource: "organisationUnitGroupSets.json",
                params,
                dataSource,
            });
        }
    );
};

export const useOrganisationUnitLevels = (
    page: number,
    pageSize: number,
    q = "",
    currentDHIS2: boolean | undefined,
    dataSource: AxiosInstance | undefined
) => {
    let params: { [key: string]: any } = {
        page,
        pageSize,
        fields: "id,level,name",
    };
    if (q) {
        params = { ...params, filter: `identifiable:token:${q}` };
    }
    return useQuery<Array<INamed & { level: number }>, Error>(
        ["organisation-unit-levels", page, pageSize],
        async () => {
            return getDHIS2Resources<INamed & { level: number }>({
                currentDHIS2,
                resource: "organisationUnitLevels.json",
                params,
                dataSource,
            });
        }
    );
};
const findDimension = (
    dimension: IDimension,
    globalFilters: { [key: string]: any } = {}
) => {
    return Object.entries(dimension).map(
        ([key, { resource, type, dimension, prefix }]) => {
            const globalValue = globalFilters[key];
            if (globalValue) {
                return {
                    resource,
                    type,
                    dimension,
                    value: globalValue
                        .map((a: any) => `${prefix || ""}${a}`)
                        .join(";"),
                };
            }
            return {
                resource,
                type,
                dimension,
                value: `${prefix || ""}${key}`,
            };
        }
    );
};

export const findLevelsAndOus = (indicator: IIndicator2 | undefined) => {
    if (indicator) {
        const denDimensions = indicator.denominator?.dataDimensions || {};
        const numDimensions = indicator.numerator?.dataDimensions || {};
        const denExpressions = indicator.denominator?.expressions || {};
        const numExpressions = indicator.numerator?.expressions || {};
        const ous = uniq([
            ...Object.entries(denDimensions)
                .filter(([key, { resource }]) => resource === "ou")
                .map(([key]) => key),
            ...Object.entries(numDimensions)
                .filter(([_, { resource }]) => resource === "ou")
                .map(([key]) => key),
            ...Object.entries(denExpressions)
                .filter(([key]) => key === "ou")
                .map(([key, value]) => value.value),
            ...Object.entries(numExpressions)
                .filter(([key]) => key === "ou")
                .map(([key, value]) => value.value),
        ]);
        const levels = uniq([
            ...Object.entries(denDimensions)
                .filter(([key, { resource }]) => resource === "oul")
                .map(([key]) => key),
            ...Object.entries(numDimensions)
                .filter(([_, { resource }]) => resource === "oul")
                .map(([key]) => key),
            ...Object.entries(denExpressions)
                .filter(([key]) => key === "oul")
                .map(([key, value]) => value.value),
            ...Object.entries(numExpressions)
                .filter(([key]) => key === "oul")
                .map(([key, value]) => value.value),
        ]);
        return { levels, ous };
    }
    return { levels: [], ous: [] };
};

const makeDHIS2Query = (
    data: IData2,
    globalFilters: { [key: string]: any } = {},
    overrides: { [key: string]: any } = {}
) => {
    const filtered = fromPairs(
        Object.entries(data.dataDimensions).filter(
            ([id, dimension]) => dimension.type && dimension.dimension
        )
    );
    const allDimensions = findDimension(filtered, globalFilters);

    return Object.entries(
        groupBy(allDimensions, (v) => `${v.type}${v.dimension}`)
    )
        .flatMap(([x, y]) => {
            const first = y[0];
            const finalValues = y.map(({ value }) => value).join(";");
            if (y) {
                if (first.dimension === "") {
                    return y.map(({ value }) => `${first.type}=${value}`);
                }
                return [`${first.type}=${first.dimension}:${finalValues}`];
            }
            return [];
        })
        .join("&");
};

const makeSQLViewsQueries = (
    expressions: IExpressions = {},
    globalFilters: { [key: string]: any } = {},
    otherParameters: { [key: string]: any }
) => {
    let initial = otherParameters;
    Object.entries(expressions).forEach(([col, val]) => {
        if (val.isGlobal && globalFilters[val.value]) {
            initial = {
                ...initial,
                [`var=${col}`]: globalFilters[val.value].join("-"),
            };
        } else if (!val.isGlobal && val.value) {
            const keys = Object.keys(globalFilters).some(
                (e) => String(val.value).indexOf(e) !== -1
            );
            if (keys) {
                Object.entries(globalFilters).forEach(
                    ([globalId, globalValue]) => {
                        if (String(val.value).indexOf(globalId) !== -1) {
                            let currentValue = String(val.value).replaceAll(
                                globalId,
                                globalValue.join("-")
                            );
                            const calcIndex = currentValue.indexOf("calc");
                            if (calcIndex !== -1) {
                                const original = currentValue.slice(calcIndex);
                                const computed = evaluate(
                                    original.replaceAll("calc", "")
                                );
                                currentValue = currentValue.replaceAll(
                                    original,
                                    computed
                                );
                            }
                            initial = {
                                ...initial,
                                [`var=${col}`]: currentValue,
                            };
                        }
                    }
                );
            } else {
                initial = { ...initial, [`var=${col}`]: val.value };
            }
        }
    });
    return Object.entries(initial)
        .map(([key, value]) => `${key}:${value}`)
        .join("&");
};

const generateDHIS2Query = (
    indicators: IIndicator2[],
    globalFilters: { [key: string]: any } = {},
    overrides: { [key: string]: string } = {}
) => {
    return indicators.map((indicator) => {
        let query: { numerator?: string; denominator?: string } = {};
        if (
            indicator.numerator?.type === "ANALYTICS" &&
            Object.keys(indicator.numerator.dataDimensions).length > 0
        ) {
            const params = makeDHIS2Query(
                indicator.numerator,
                globalFilters,
                overrides
            );
            if (params) {
                query = {
                    ...query,
                    numerator: `analytics.json?${params}`,
                };
            }
        } else if (
            indicator.numerator?.type === "SQL_VIEW" &&
            Object.keys(indicator.numerator.dataDimensions).length > 0
        ) {
            let currentParams = "";
            const allParams = fromPairs(
                getSearchParams(indicator.numerator.query).map((re) => [
                    `var=${re}`,
                    "NULL",
                ])
            );
            const params = makeSQLViewsQueries(
                indicator.numerator.expressions,
                globalFilters,
                allParams
            );
            if (params) {
                currentParams = `?${params}&paging=false`;
            }
            query = {
                ...query,
                numerator: `sqlViews/${
                    Object.keys(indicator.numerator.dataDimensions)[0]
                }/data.json${currentParams}`,
            };
        }
        if (
            indicator.denominator?.type === "ANALYTICS" &&
            Object.keys(indicator.denominator.dataDimensions).length > 0
        ) {
            const params = makeDHIS2Query(indicator.denominator, globalFilters);
            if (params) {
                query = {
                    ...query,
                    denominator: `analytics.json?${params}`,
                };
            }
        } else if (
            indicator.denominator?.type === "SQL_VIEW" &&
            Object.keys(indicator.denominator.dataDimensions).length > 0
        ) {
            let currentParams = "";
            const allParams = fromPairs(
                getSearchParams(indicator.denominator.query).map((re) => [
                    `var=${re}`,
                    "NULL",
                ])
            );
            const params = makeSQLViewsQueries(
                indicator.denominator.expressions,
                globalFilters,
                allParams
            );
            if (params) {
                currentParams = `?${params}&paging=false`;
            }
            query = {
                ...query,
                denominator: `sqlViews/${
                    Object.keys(indicator.denominator.dataDimensions)[0]
                }/data.json${currentParams}`,
            };
        }
        return { query, indicator };
    });
};

const generateKeys = (
    indicators: IIndicator2[] = [],
    globalFilters: { [key: string]: any } = {}
) => {
    const all = indicators.flatMap((indicator) => {
        const numKeys = Object.keys(indicator?.numerator?.dataDimensions || {});
        const denKeys = Object.keys(
            indicator?.denominator?.dataDimensions || {}
        );
        const numExpressions = Object.entries(
            indicator?.numerator?.expressions || {}
        ).map(([e, value]) => {
            return value.value;
        });
        const denExpressions = Object.entries(
            indicator?.denominator?.expressions || {}
        ).map(([e, value]) => {
            return value.value;
        });
        return uniq([
            ...numKeys,
            ...denKeys,
            ...numExpressions,
            ...denExpressions,
        ]).flatMap((id) => {
            return globalFilters[id] || [id];
        });
    });
    return uniq(all);
};

const processDHIS2Data = (
    data: any,
    options: Partial<{
        fromColumn: string;
        toColumn: string;
        flatteningOption: string;
        joinData: any[];
        otherFilters: { [key: string]: any };
        fromFirst: boolean;
    }>
) => {
    if (data.headers || data.listGrid) {
        let rows: string[][] | undefined = undefined;
        let headers: any[] | undefined = undefined;
        if (data.listGrid) {
            headers = data.listGrid.headers;
            rows = data.listGrid.rows;
        } else {
            headers = data.headers;
            rows = data.rows;
        }
        if (headers !== undefined && rows !== undefined) {
            const processed = flattenDHIS2Data(
                rows.map((row: string[]) => {
                    let others = {};

                    if (data.metaData && data.metaData.items) {
                        row.forEach((r, index) => {
                            if (index < row.length - 1) {
                                others = {
                                    ...others,
                                    [`${headers?.[index].name}-name`]:
                                        data.metaData.items[r]?.name || "",
                                };
                            }
                        });
                    }
                    return {
                        ...others,
                        ...fromPairs(
                            row.map((value, index) => {
                                const header = headers?.[index];
                                return [header.name, value];
                            })
                        ),
                    };
                }),
                options.flatteningOption
            );
            if (options.joinData && options.fromColumn && options.toColumn) {
                return merge2DataSources(
                    processed,
                    options.joinData,
                    options.fromColumn,
                    options.toColumn,
                    options.fromFirst || false
                );
            }

            if (!isEmpty(options.otherFilters)) {
                return processed.filter((data: any) => {
                    const values = Object.entries(
                        options.otherFilters || {}
                    ).map(
                        ([key, value]) =>
                            data[key] === String(value).padStart(2, "0")
                    );
                    return every(values);
                });
            }
            return processed;
        }
    }
    if (options.joinData && options.fromColumn && options.toColumn) {
        const merged = merge2DataSources(
            flattenDHIS2Data(data, options.flatteningOption),
            options.joinData,
            options.fromColumn,
            options.toColumn,
            options.fromFirst || false
        );
        if (!isEmpty(options.otherFilters)) {
            return merged.filter((data: any) => {
                const values = Object.entries(options.otherFilters || {}).map(
                    ([key, value]) =>
                        data[key] === String(value).padStart(2, "0")
                );
                return every(values);
            });
        }
        return merged;
    }

    return flattenDHIS2Data(data, options.flatteningOption);
};

const getDHIS2Query = (
    query: IData2,
    globalFilters: { [key: string]: any } = {},
    overrides: { [key: string]: string } = {}
) => {
    if (query.type === "ANALYTICS") {
        const params = makeDHIS2Query(query, globalFilters, overrides);
        return `analytics.json?${params}`;
    }
    if (query.type === "SQL_VIEW") {
        let currentParams = "";
        const allParams = fromPairs(
            getSearchParams(query.query).map((re) => [`var=${re}`, "NULL"])
        );
        const params = makeSQLViewsQueries(
            query.expressions,
            globalFilters,
            allParams
        );
        if (params) {
            currentParams = `?${params}&paging=false`;
        }
        return `sqlViews/${
            Object.keys(query.dataDimensions)[0]
        }/data.json${currentParams}`;
    }

    if (query.type === "API") {
        return query.query;
    }
};

const queryDHIS2 = async (
    engine: any,
    vq: IData2 | undefined,
    globalFilters: { [key: string]: any } = {},
    otherFilters: { [key: string]: any } = {}
) => {
    if (vq) {
        const joinData: any = await queryDHIS2(
            engine,
            vq.joinTo,
            globalFilters,
            otherFilters
        );
        if (vq.dataSource && vq.dataSource.type === "DHIS2") {
            const query = getDHIS2Query(vq, globalFilters);
            if (vq.dataSource.isCurrentDHIS2) {
                const { data } = await engine.query({
                    data: {
                        resource: query,
                    },
                });
                return processDHIS2Data(data, {
                    flatteningOption: vq.flatteningOption,
                    joinData,
                    otherFilters,
                    fromColumn: vq.fromColumn,
                    toColumn: vq.toColumn,
                    fromFirst: vq.fromFirst,
                });
            }
            const { data } = await axios.get(
                `${vq.dataSource.authentication.url}/api/${query}`,
                {
                    auth: {
                        username: vq.dataSource.authentication.username,
                        password: vq.dataSource.authentication.password,
                    },
                    string: "",
                }
            );

            return processDHIS2Data(data, {
                flatteningOption: vq.flatteningOption,
                joinData,
                otherFilters,
                fromColumn: vq.fromColumn,
                toColumn: vq.toColumn,
                fromFirst: vq.fromFirst,
            });
        }

        if (vq.dataSource && vq.dataSource.type === "API") {
            const { data } = await axios.get(vq.dataSource.authentication.url, {
                auth: {
                    username: vq.dataSource.authentication.username,
                    password: vq.dataSource.authentication.password,
                },
                string: "",
            });
            return data;
        }

        if (vq.dataSource && vq.dataSource.type === "INDEX_DB") {
            return await db.events.toArray();
        }
        if (
            vq.dataSource &&
            vq.dataSource.type === "ELASTICSEARCH" &&
            vq.query
        ) {
            const { data } = await axios.post(
                vq.dataSource.authentication.url,
                JSON.parse(
                    vq.query
                        .replaceAll("${ou}", globalFilters["mclvD0Z9mfT"])
                        .replaceAll("${pe}", globalFilters["m5D13FqKZwN"])
                        .replaceAll("${le}", globalFilters["GQhi6pRnTKF"])
                        .replaceAll("${gp}", globalFilters["of2WvtwqbHR"])
                ),
                {
                    auth: {
                        username: vq.dataSource.authentication.username,
                        password: vq.dataSource.authentication.password,
                    },
                    string: "",
                }
            );
            return data;
        }
    }
    return undefined;
};

const computeIndicator = (
    indicator: IIndicator2,
    currentValue: any,
    numeratorValue: string,
    denominatorValue: string
) => {
    if (indicator.custom && numeratorValue && denominatorValue) {
        const expression = indicator.factor
            .replaceAll("x", numeratorValue)
            .replaceAll("y", denominatorValue);
        return {
            ...currentValue,
            value: evaluate(expression),
        };
    }

    if (numeratorValue && denominatorValue && indicator.factor !== "1") {
        const computed = Number(numeratorValue) / Number(denominatorValue);
        return {
            ...currentValue,
            value: evaluate(`${computed}${indicator.factor}`),
        };
    }

    if (numeratorValue && denominatorValue) {
        const computed = Number(numeratorValue) / Number(denominatorValue);
        return {
            ...currentValue,
            value: computed,
        };
    }
    return { ...currentValue, value: 0 };
};

const queryIndicator = async (
    engine: any,
    indicator: IIndicator2,
    globalFilters: { [key: string]: any } = {},
    otherFilters: { [key: string]: any } = {}
) => {
    const numerator = await queryDHIS2(
        engine,
        indicator.numerator,
        globalFilters,
        otherFilters
    );
    const denominator = await queryDHIS2(
        engine,
        indicator.denominator,
        globalFilters,
        otherFilters
    );

    if (numerator && denominator) {
        return numerator.map((currentValue: { [key: string]: string }) => {
            const { value: v1, total: t1, ...others } = currentValue;
            const columns = Object.values(others).sort().join("");

            const denominatorSearch = denominator.find(
                (row: { [key: string]: string }) => {
                    const { value, total, ...someOthers } = row;
                    return (
                        columns === Object.values(someOthers).sort().join("")
                    );
                }
            );

            if (denominatorSearch) {
                const { value: v1, total: t1 } = currentValue;
                const { value: v2, total: t2 } = denominatorSearch;

                const numeratorValue = v1 || t1;
                const denominatorValue = v2 || t2;

                return computeIndicator(
                    indicator,
                    currentValue,
                    numeratorValue,
                    denominatorValue
                );
            }
            return { ...currentValue, value: 0 };
        });
    }
    return numerator;
};

const processVisualization = async (
    engine: any,
    visualization: IVisualization2,
    globalFilters: { [key: string]: any } = {},
    otherFilters: { [key: string]: any } = {}
) => {
    const data = await Promise.all(
        visualization.indicators.map((indicator) =>
            queryIndicator(engine, indicator, globalFilters, otherFilters)
        )
    );

    visualizationDataApi.updateVisualizationData({
        visualizationId: visualization.id,
        data: flatten(data),
    });
    return flatten(data);
};

export const useVisualizationMetadata = (
    visualization: IVisualization,
    storage: Storage
) => {
    const engine = useDataEngine();
    return useQuery<IVisualization2, Error>(
        [
            "visualizations-metadata",
            visualization.id,
            ...visualization.indicators,
        ],
        async ({ signal }) => {
            const indicators = await Promise.all(
                visualization.indicators.map((id) =>
                    getOneRecord<IIndicator>(storage, id, {
                        namespace: "i-indicators",
                        otherQueries: [],
                        signal,
                        engine,
                        systemId: "",
                    })
                )
            );

            const queries = await Promise.all(
                indicators
                    .flatMap(({ numerator, denominator }) => {
                        if (numerator && denominator) {
                            return [numerator, denominator];
                        } else if (numerator) {
                            return numerator;
                        }
                        return "";
                    })
                    .filter((x) => x !== "")
                    .map((id) =>
                        getOneRecord<IData>(storage, id, {
                            namespace: "i-visualization-queries",
                            otherQueries: [],
                            signal,
                            engine,
                            systemId: "",
                        })
                    )
            );

            const dataSources = await Promise.all(
                queries
                    .map(({ dataSource }) => {
                        if (dataSource) {
                            return dataSource;
                        }
                        return "";
                    })
                    .filter((x) => x !== "")
                    .map((id) =>
                        getOneRecord<IDataSource>(storage, id, {
                            namespace: "i-data-sources",
                            otherQueries: [],
                            signal,
                            engine,
                            systemId: "",
                        })
                    )
            );

            const processedIndicators: Array<IIndicator2> = indicators.map(
                (i) => {
                    let numerator1 = queries.find((q) => q.id === i.numerator);
                    let denominator1 = queries.find(
                        (q) => q.id === i.denominator
                    );
                    let numerator: IData2 | undefined = undefined;
                    let denominator: IData2 | undefined = undefined;

                    if (numerator1) {
                        let joiner = queries.find(
                            (q) => q.id === numerator1?.joinTo
                        );
                        let joinTo: IData2 | undefined = undefined;

                        if (joiner) {
                            joinTo = {
                                id: joiner.id,
                                name: joiner.name,
                                description: joiner.description,
                                type: joiner.type,
                                accessor: joiner.accessor,
                                expressions: joiner.expressions,
                                fromFirst: joiner.fromFirst,
                                flatteningOption: joiner.flatteningOption,
                                fromColumn: joiner.fromColumn,
                                toColumn: joiner.toColumn,
                                query: joiner.query,
                                dataDimensions: joiner.dataDimensions,
                                dataSource: dataSources.find(
                                    (ds) => ds.id === joiner?.dataSource
                                ),
                            };
                        }
                        numerator = {
                            id: numerator1.id,
                            name: numerator1.name,
                            description: numerator1.description,
                            type: numerator1.type,
                            accessor: numerator1.accessor,
                            expressions: numerator1.expressions,
                            fromFirst: numerator1.fromFirst,
                            flatteningOption: numerator1.flatteningOption,
                            fromColumn: numerator1.fromColumn,
                            toColumn: numerator1.toColumn,
                            query: numerator1.query,
                            dataDimensions: numerator1.dataDimensions,
                            dataSource: dataSources.find(
                                (ds) => ds.id === numerator1?.dataSource
                            ),
                            joinTo,
                        };
                    }

                    if (denominator1) {
                        let joiner = queries.find(
                            (q) => q.id === denominator1?.joinTo
                        );
                        let joinTo: IData2 | undefined = undefined;

                        if (joiner) {
                            joinTo = {
                                id: joiner.id,
                                name: joiner.name,
                                description: joiner.description,
                                type: joiner.type,
                                accessor: joiner.accessor,
                                expressions: joiner.expressions,
                                fromFirst: joiner.fromFirst,
                                flatteningOption: joiner.flatteningOption,
                                fromColumn: joiner.fromColumn,
                                toColumn: joiner.toColumn,
                                query: joiner.query,
                                dataDimensions: joiner.dataDimensions,
                                dataSource: dataSources.find(
                                    (ds) => ds.id === joiner?.dataSource
                                ),
                            };
                        }
                        denominator = {
                            id: denominator1.id,
                            name: denominator1.name,
                            description: denominator1.description,
                            type: denominator1.type,
                            accessor: denominator1.accessor,
                            expressions: denominator1.expressions,
                            fromFirst: denominator1.fromFirst,
                            flatteningOption: denominator1.flatteningOption,
                            fromColumn: denominator1.fromColumn,
                            toColumn: denominator1.toColumn,
                            query: denominator1.query,
                            dataDimensions: denominator1.dataDimensions,
                            dataSource: dataSources.find(
                                (ds) => ds.id === denominator1?.dataSource
                            ),
                            joinTo,
                        };
                    }
                    return {
                        id: i.id,
                        name: i.name,
                        description: i.description,
                        query: i.query,
                        custom: i.custom,
                        factor: i.factor,
                        numerator,
                        denominator,
                    };
                }
            );

            const realVisualization: IVisualization2 = {
                ...visualization,
                indicators: processedIndicators,
            };
            return realVisualization;
        }
    );
};

export const useVisualization = (
    visualization: IVisualization2,
    refreshInterval?: string,
    globalFilters?: { [key: string]: any },
    otherFilters?: { [key: string]: any }
) => {
    const engine = useDataEngine();
    let currentInterval: boolean | number = false;
    if (refreshInterval && refreshInterval !== "off") {
        currentInterval = Number(refreshInterval) * 1000;
    }
    const otherKeys = generateKeys(visualization.indicators, globalFilters);
    const overrides = visualization.overrides || {};

    return useQuery<any, Error>(
        [
            "visualizations",
            ...visualization.indicators,
            ...otherKeys,
            ...Object.values(overrides),
            ...Object.values(otherFilters || {}),
        ],
        async ({ signal }) => {
            return processVisualization(
                engine,
                visualization,
                globalFilters,
                otherFilters
            );
        },
        {
            refetchInterval: currentInterval,
            refetchIntervalInBackground: true,
            refetchOnWindowFocus: true,
        }
    );
};

export const useMaps = (
    levels: string[],
    parents: string[],
    data: any[],
    thresholds: Threshold[],
    otherKeys: string[]
) => {
    const engine = useDataEngine();
    const parent = parents
        .map((p) => {
            return `parent=${p}`;
        })
        .join("&");
    const level = levels
        .map((l) => {
            return `level=${l}`;
        })
        .join("&");

    let resource = `organisationUnits.geojson?${parent}`;
    if (level) {
        resource = `organisationUnits.geojson?${parent}&${level}`;
    }
    let query = {
        geojson: {
            resource,
        },
    };

    const levelsQuery = levels.map((l) => [
        `level${l}`,
        {
            resource: "organisationUnits.json",
            params: {
                level: l,
                fields: "id,name",
                paging: false,
            },
        },
    ]);

    query = { ...query, ...fromPairs(levelsQuery) };
    return useQuery<any, Error>(
        ["maps", ...levels, ...parents, ...otherKeys],
        async () => {
            const { geojson, ...otherLevels }: any = await engine.query(query);
            return processMap(geojson, otherLevels, data, thresholds);
        },
        { refetchInterval: 7 }
    );
};

export const saveDocument = async <TData extends INamed>(
    storage: Storage,
    index: string,
    systemId: string,
    document: Partial<TData>,
    engine: any,
    type: "create" | "update" | "view"
) => {
    if (storage === "es") {
        const { data } = await api.post(`wal/index?index=${index}`, {
            ...document,
            systemId,
        });
        return data;
    }
    if (document) {
        const mutation: any = {
            type,
            resource: `dataStore/${index}/${document.id}`,
            data: document,
        };
        return engine.mutate(mutation);
    }
};

export const deleteDocument = async (
    storage: Storage,
    index: string,
    id: string,
    engine: any
) => {
    if (storage === "es") {
        const { data } = await api.post(`wal/delete?index=${index}&id=${id}`);
        return data;
    }
    const mutation: any = {
        type: "delete",
        resource: `dataStore/${index}/${id}`,
    };
    return engine.mutate(mutation);
};

export const useOptionSet = (optionSetId: string) => {
    const engine = useDataEngine();
    const query = {
        optionSet: {
            resource: `optionSets/${optionSetId}.json`,
            params: {
                fields: "options[name,code]",
            },
        },
    };

    return useQuery<{ code: string; name: string }[], Error>(
        ["optionSet", optionSetId],
        async () => {
            if (optionSetId) {
                const {
                    optionSet: { options },
                }: any = await engine.query(query);
                return options;
            }
            return [];
        }
    );
};

export const useTheme = (optionSetId: string) => {
    const engine = useDataEngine();
    const query = {
        optionSet: {
            resource: `optionSets/${optionSetId}.json`,
            params: {
                fields: "options[name,code]",
            },
        },
    };

    return useQuery<boolean, Error>(["optionSet", optionSetId], async () => {
        const themes = await db.themes.toArray();
        if (themes.length === 0) {
            const {
                optionSet: { options },
            }: any = await engine.query(query);
            await db.themes.bulkAdd(
                options.map(({ code, name }: any) => {
                    return {
                        title: name,
                        key: code,
                        id: code,
                        pId: "",
                        value: code,
                    };
                })
            );
        }
        return true;
    });
};

export const useFilterResources = (dashboards: IDashboard[]) => {
    let parents: DataNode[] = dashboards.map((dashboard) => {
        return {
            pId: "",
            nodeSource: {},
            key: dashboard.id,
            value: dashboard.id,
            title: dashboard.name,
            id: dashboard.id,
            checkable: false,
            isLeaf: dashboard.filters ? dashboard.filters.length === 0 : true,
        };
    });
    const engine = useDataEngine();
    return useQuery<DataNode[], Error>(
        ["filters", dashboards.map(({ id }) => id).join() || ""],
        async () => {
            for (const dashboard of dashboards) {
                if (dashboard.filters) {
                    const queries = fromPairs(
                        dashboard.filters.map(({ id, resource }) => [
                            id,
                            {
                                resource,
                            },
                        ])
                    );
                    const response: any = await engine.query(queries);
                    const children = dashboard.filters.flatMap(
                        ({ id, resourceKey }) => {
                            const data = response[id];
                            if (data && data.options) {
                                return data.options.map(
                                    ({ code, id, name }: any) => {
                                        const node: DataNode = {
                                            pId: dashboard.id,
                                            nodeSource: { search: resourceKey },
                                            key: id,
                                            value: code,
                                            title: name,
                                            id,
                                            isLeaf: true,
                                            checkable: false,
                                            hasChildren: false,
                                            selectable: true,
                                            actual: dashboard.child,
                                        };
                                        return node;
                                    }
                                );
                            } else if (data && data.dataElementGroups) {
                                return data.dataElementGroups.map(
                                    ({ code, id, name }: any) => {
                                        const node: DataNode = {
                                            pId: dashboard.id,
                                            nodeSource: { search: resourceKey },
                                            key: id,
                                            value: code,
                                            title: name,
                                            id,
                                            isLeaf: true,
                                            // checkable: true,
                                            hasChildren: false,
                                            selectable: true,
                                            actual: dashboard.child,
                                        };
                                        return node;
                                    }
                                );
                            }
                            return [];
                        }
                    );
                    parents = [...parents, ...children];
                }
            }

            return parents;
        }
    );
};
