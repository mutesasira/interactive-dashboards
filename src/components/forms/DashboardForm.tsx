import { useMatch, useSearch } from "@tanstack/react-location";
import { useStore } from "effector-react";
import { LocationGenerics } from "../../interfaces";
import { useDashboard } from "../../Queries";
import { $dashboardType, $settings, $store } from "../../Store";
import LoadingIndicator from "../LoadingIndicator";
import Dashboard from "./Dashboard";

export default function DashboardForm() {
    const store = useStore($store);
    const dashboardType = useStore($dashboardType);
    const { storage } = useStore($settings);
    const {
        params: { dashboardId },
    } = useMatch<LocationGenerics>();
    const { action } = useSearch<LocationGenerics>();
    const { isLoading, isSuccess, isError, error } = useDashboard(
        storage,
        dashboardId,
        store.systemId,
        dashboardType,
        action
    );
    if (isLoading) {
        return <LoadingIndicator />;
    }
    if (isError) {
        return <pre>{JSON.stringify(error)}</pre>;
    }
    if (isSuccess) {
        return <Dashboard />;
    }
    return null;
}
