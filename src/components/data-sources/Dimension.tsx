import {
  Checkbox,
  Heading,
  Input,
  Stack,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { ChangeEvent, useState } from "react";
import { IndicatorProps } from "../../interfaces";
import { globalIds } from "../../utils/utils";
import GlobalAndFilter from "./GlobalAndFilter";
import GlobalSearchFilter from "./GlobalSearchFilter";

interface DimensionProps extends IndicatorProps {
  dimensionItem: { [key: string]: any };
}

const Dimension = ({ denNum, onChange, dimensionItem }: DimensionProps) => {
  const [type, setType] = useState<"filter" | "dimension">("dimension");
  const selected = Object.entries(denNum?.dataDimensions || {})
    .filter(([k, { resource }]) => resource === "dimension")
    .map(([key]) => {
      return key;
    });
  const [useGlobal, setUseGlobal] = useState<boolean>(
    () => selected.indexOf("GQhi6pRnTKF") !== -1
  );
  const [q, setQ] = useState<string>("");

  return (
    <Stack spacing="5px">
      <GlobalSearchFilter
        denNum={denNum}
        dimension={dimensionItem.id}
        setType={setType}
        useGlobal={useGlobal}
        setUseGlobal={setUseGlobal}
        resource="dimension"
        type={type}
        onChange={onChange}
        setQ={setQ}
        q={q}
        id={dimensionItem.id}
      />

      {!useGlobal && (
        <Table variant="striped" colorScheme="gray" textTransform="none">
          <Thead>
            <Tr py={1}>
              <Th w="10px">
                <Checkbox />
              </Th>
              <Th>
                <Heading as="h6" size="xs" textTransform="none">
                  Id
                </Heading>
              </Th>
              <Th>
                <Heading as="h6" size="xs" textTransform="none">
                  Name
                </Heading>
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {dimensionItem.items.map((record: any) => (
              <Tr key={record.id}>
                <Td>
                  <Checkbox
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      if (e.target.checked) {
                        onChange({
                          id: record.id,
                          type,
                          dimension: dimensionItem.id,
                          resource: "dimension",
                        });
                      } else {
                        onChange({
                          id: record.id,
                          type,
                          dimension: dimensionItem.id,
                          resource: "dimension",
                          remove: true,
                        });
                      }
                    }}
                    isChecked={!!denNum?.dataDimensions?.[record.id]}
                  />
                </Td>
                <Td>{record.id}</Td>
                <Td>{record.name}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </Stack>
  );
};

export default Dimension;