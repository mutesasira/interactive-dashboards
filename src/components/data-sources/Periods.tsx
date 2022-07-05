import { Stack } from "@chakra-ui/react";
import React, { useState } from "react";
import { PeriodDimension } from "@dhis2/analytics";
import GlobalAndFilter from "./GlobalAndFilter";
import { IndicatorProps } from "../../interfaces";
import { globalIds } from "../../utils/utils";

const Periods = ({ denNum, onChange }: IndicatorProps) => {
  const [dimension, setDimension] = useState<"filter" | "dimension">("filter");
  const [useGlobal, setUseGlobal] = useState<boolean>(false);

  const selected = Object.entries(denNum?.dataDimensions || {})
    .filter(([k, { what }]) => what === "pe")
    .map(([key, { label }]) => {
      return { id: key, name: label };
    });
  return (
    <Stack spacing="20px">
      <GlobalAndFilter
        denNum={denNum}
        dimension={dimension}
        setDimension={setDimension}
        useGlobal={useGlobal}
        setUseGlobal={setUseGlobal}
        type="pe"
        onChange={onChange}
        id={globalIds[0].value}
      />
      {!useGlobal && (
        <PeriodDimension
          onSelect={({ items }: any) => {
            items.forEach(({ id, name, ...others }: any) => {
              console.log({ id, name, ...others });
              onChange({
                id,
                type: dimension,
                what: "pe",
                label: name,
              });
            });
          }}
          selectedPeriods={selected}
        />
      )}
    </Stack>
  );
};

export default Periods;
