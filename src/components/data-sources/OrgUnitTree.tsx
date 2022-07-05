import { Stack } from "@chakra-ui/react";
import { useState } from "react";
import { IndicatorProps } from "../../interfaces";
import { globalIds } from "../../utils/utils";
import GlobalAndFilter from "./GlobalAndFilter";

const OrgUnitTree = ({ denNum, onChange }: IndicatorProps) => {
  const [dimension, setDimension] = useState<"filter" | "dimension">("filter");
  const selected = Object.entries(denNum?.dataDimensions || {})
    .filter(([k, { what }]) => what === "ou")
    .map(([key, { label }]) => {
      return key;
    });
  const [useGlobal, setUseGlobal] = useState<boolean>(
    selected.indexOf("mclvD0Z9mfT") !== -1
  );
  return (
    <Stack spacing="20px">
      <GlobalAndFilter
        denNum={denNum}
        dimension={dimension}
        setDimension={setDimension}
        useGlobal={useGlobal}
        setUseGlobal={setUseGlobal}
        type="ou"
        onChange={onChange}
        id={globalIds[5].value}
      />
    </Stack>
  );
};

export default OrgUnitTree;
