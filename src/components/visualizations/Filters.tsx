import { Stack, Text } from "@chakra-ui/react";
import { DropdownButton } from "@dhis2/ui";
import { useStore } from "effector-react";
import React from "react";
import { storeApi } from "../../Events";
import { Item, Period } from "../../interfaces";
import { $store } from "../../Store";
import OUTree from "../OUTree";
import PeriodPicker from "../PeriodPicker";

export default function Filters() {
    const store = useStore($store);
    const onChangePeriods = (periods: Period[]) => {
        storeApi.changePeriods(periods);
    };
    return (
        <Stack justifyContent="center">
            <DropdownButton
                component={
                    <Stack
                        w="600px"
                        p="15px"
                        mt="7px"
                        bg="white"
                        boxShadow="2xl"
                        overflow="auto"
                        h="calc(100vh - 170px)"
                    >
                        {/* <DashboardCategorization dataSet={dashboard.dataSet} /> */}
                        <Text fontSize="2xl" color="yellow.500">
                            Organisations
                        </Text>
                        <OUTree
                            value={store.organisations}
                            onChange={(value) =>
                                storeApi.setOrganisations(value)
                            }
                        />
                        <Text fontSize="2xl" color="yellow.500">
                            Period
                        </Text>
                        <PeriodPicker
                            selectedPeriods={store.periods}
                            onChange={onChangePeriods}
                        />
                    </Stack>
                }
                name="buttonName"
                value="buttonValue"
                className="nrm"
                primary
            >
                Filters
            </DropdownButton>
        </Stack>
    );
}
