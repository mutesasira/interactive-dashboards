// import { Stack, Box, Button } from "@chakra-ui/react";
// import { ConfigProvider, Table } from "antd";
// import type { ColumnsType } from "antd/es/table";
// import { flatten, uniq } from "lodash";
// import React, { useEffect, useState } from "react";
// import { useElementSize } from "usehooks-ts";
// import { ChartProps, Column, Threshold } from "../../interfaces";
// import { columnTree } from "../../utils/components";
// import { SPECIAL_COLUMNS } from "../constants";
// import { processTable } from "../processors";
// import { CSVLink } from "react-csv";

// const Tables = ({ visualization, data, dimensions, others }: ChartProps) => {
//   const [squareRef, { height, width }] = useElementSize();
//   const flattenedData = flatten(data);
//   const rows = String(visualization.properties?.["rows"] ?? "").split(",");
//   const columns = String(visualization.properties?.["columns"] ?? "").split(
//     ","
//   );

//   const thresholds: Threshold[] =
//     visualization.properties?.["data.thresholds"] ?? [];
//   const aggregation = visualization.properties?.["aggregation"] ?? "count";
//   const aggregationColumn =
//     visualization.properties?.["aggregationColumn"] ?? "";

//   const [initial, setInitial] = useState<{
//     finalColumns: Column[][];
//     finalRows: Column[][];
//     finalData: any[];
//   }>(
//     processTable(
//       flattenedData,
//       rows,
//       columns.filter((c) => SPECIAL_COLUMNS.indexOf(c) === -1),
//       columns.filter((c) => SPECIAL_COLUMNS.indexOf(c) !== -1),
//       aggregation,
//       thresholds,
//       aggregationColumn,
//       dimensions,
//       visualization.properties
//     )
//   );
//   const real: Array<ColumnsType<any>> = columns.map((a) => {
//     return uniq(data.map((d: any) => d[a]))
//       .filter((d: any) => !!d)
//       .map((d) => {
//         return {
//           title: visualization.properties[`${String(d)}.name`] || String(d),
//           dataIndex: String(d),
//           key: String(d),
//         };
//       });
//   });

//   const [available, setAvailable] = useState<ColumnsType<any>>([]);

//   useEffect(() => {
//     setInitial(() =>
//       processTable(
//         flattenedData,
//         rows,
//         columns.filter((c) => SPECIAL_COLUMNS.indexOf(c) === -1),
//         columns.filter((c) => SPECIAL_COLUMNS.indexOf(c) !== -1),
//         aggregation,
//         thresholds,
//         aggregationColumn,
//         dimensions,
//         visualization.properties
//       )
//     );
//     const allColumns = columnTree(real, visualization.properties);
//     const othersColumns: ColumnsType<any> = rows.map((d, index) => {
//       return {
//         title: visualization.properties[`${d}.name`] || d,
//         key: String(d),
//         fixed: "left",
//         render: (text, data) => {
//           const value = data[String(d)];
//           return visualization.properties[`${value}.name`] || value;
//         },
//         onCell: (data, index) => {
//           const value = data[String(d)];
//           const obj: any = {
//             flex: 1,
//           };
//           if (index !== undefined) {
//             if (
//               index >= 1 &&
//               initial.finalData[index - 1] &&
//               value === initial.finalData[index - 1][d]
//             ) {
//               obj.rowSpan = 0;
//             } else {
//               for (
//                 let i = 0;
//                 index + i !== initial.finalData.length &&
//                 initial.finalData[index + i] &&
//                 value === initial.finalData[index + i][d];
//                 i += 1
//               ) {
//                 obj.rowSpan = i + 1;
//               }
//             }
//           }
//           return obj;
//         },
//       };
//     });
//     const specialColumns: ColumnsType<any> = columns
//       .filter((c) => SPECIAL_COLUMNS.indexOf(c) !== -1)
//       .map((c) => ({
//         title: visualization.properties[`${c}.name`] || c,
//         dataIndex: String(c),
//         key: c,
//         fixed: "left",
//         width: "auto",
//         align: "center",
//         render: (text, data) => data[String(c)],
//       }));
//     setAvailable(() => [...othersColumns, ...specialColumns, ...allColumns[0]]);
//   }, [JSON.stringify(visualization.properties)]);

//   return (
//     <Stack
//       w="100%"
//       bg="white"
//       p="0"
//       m="0"
//       spacing="0"
//       h="100%"
//       overflow="auto"
//       ref={squareRef}
//       position="relative"
//     >
//       <ConfigProvider
//         theme={{
//           token: {
//             borderRadius: 0,
//           },
//           components: {
//             Table: {},
//           },
//         }}
//       >
//         <Box position="absolute" top="10px" right="10px" zIndex={10}>
//           <Button
//             colorScheme="blue"
//             size="sm"
//             _hover={{ bg: "blue.600" }}
//             _active={{ bg: "blue.700" }}
//           >
//             <CSVLink
//               data={initial.finalData}
//               headers={available.map((column) => ({
//                 label: column.title,
//                 key: column.key,
//               }))}
//               filename="table-data.csv"
//             >
//               Download Table
//             </CSVLink>
//           </Button>
//         </Box>

//         <Table
//           size="large"
//           columns={available}
//           dataSource={initial.finalData}
//           bordered
//           pagination={false}
//           rowKey="key"
//           sticky
//         />
//       </ConfigProvider>
//     </Stack>
//   );
// };

// export default Tables;

import { Stack, Box, Button } from "@chakra-ui/react";
import { ConfigProvider, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { flatten, uniq } from "lodash";
import React, { useEffect, useState } from "react";
import { useElementSize } from "usehooks-ts";
import { ChartProps, Column, Threshold } from "../../interfaces";
import { columnTree } from "../../utils/components";
import { SPECIAL_COLUMNS } from "../constants";
import { processTable } from "../processors";
import { Workbook } from "exceljs";
import { saveAs } from "file-saver";
import { utils } from "xlsx";

const Tables = ({ visualization, data, dimensions, others }: ChartProps) => {
  const [squareRef, { height, width }] = useElementSize();
  const flattenedData = flatten(data);
  const rows = String(visualization.properties?.["rows"] ?? "").split(",");
  const columns = String(visualization.properties?.["columns"] ?? "").split(",");


  const thresholds: Threshold[] =
    visualization.properties?.["data.thresholds"] ?? [];
  const aggregation = visualization.properties?.["aggregation"] ?? "count";
  const aggregationColumn =
    visualization.properties?.["aggregationColumn"] ?? "";

  const [initial, setInitial] = useState<{
    finalColumns: Column[][];
    finalRows: Column[][];
    finalData: any[];
  }>(
    processTable(
      flattenedData,
      rows,
      columns.filter((c) => SPECIAL_COLUMNS.indexOf(c) === -1),
      columns.filter((c) => SPECIAL_COLUMNS.indexOf(c) !== -1),
      aggregation,
      thresholds,
      aggregationColumn,
      dimensions,
      visualization.properties
    )
  );

  const real: any[] = columns.map((a) => {
    return uniq(data.map((d: any) => d[a]))
      .filter((d: any) => !!d)
      .map((d) => ({
        title: visualization.properties[`${String(d)}.name`] || String(d),
        dataIndex: String(d),
        key: String(d),
      }));
  });

  const [available, setAvailable] = useState<any[]>([]);

  useEffect(() => {
    setInitial(() =>
      processTable(
        flattenedData,
        rows,
        columns.filter((c) => SPECIAL_COLUMNS.indexOf(c) === -1),
        columns.filter((c) => SPECIAL_COLUMNS.indexOf(c) !== -1),
        aggregation,
        thresholds,
        aggregationColumn,
        dimensions,
        visualization.properties
      )
    );

    const allColumns = columnTree(real, visualization.properties);

    const othersColumns: ColumnsType<any> = rows.map((d) => ({
      title: visualization.properties[`${d}.name`] || d,
      key: String(d),
      fixed: "left",
      render: (text, data) => {
        const value = data[String(d)];
        return visualization.properties[`${value}.name`] || value;
      },
      onCell: (data, index) => {
        const value = data[String(d)];
        const obj: any = { flex: 1 };
        if (index !== undefined) {
          if (
            index >= 1 &&
            initial.finalData[index - 1] &&
            value === initial.finalData[index - 1][d]
          ) {
            obj.rowSpan = 0;
          } else {
            for (
              let i = 0;
              index + i !== initial.finalData.length &&
              initial.finalData[index + i] &&
              value === initial.finalData[index + i][d];
              i += 1
            ) {
              obj.rowSpan = i + 1;
            }
          }
        }
        return obj;
      },
    }));

    const specialColumns: ColumnsType<any> = columns
      .filter((c) => SPECIAL_COLUMNS.indexOf(c) !== -1)
      .map((c) => ({
        title: visualization.properties[`${c}.name`] || c,
        dataIndex: String(c),
        key: c,
        fixed: "left",
        width: "auto",
        align: "center",
        render: (text, data) => data[String(c)],
      }));

    setAvailable(() => [...othersColumns, ...specialColumns, ...allColumns[0]]);
  }, [JSON.stringify(visualization.properties)]);

  const downloadAsExcel = () => {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("Table Data");


    const headerRow = available
      .map((col, index) => {
        if (index > 1) {
          return ["Achieved", "Commenced", "Not Implemented"].map(() => col.title);
        }
        return col.title;
      })
      .flat();
    worksheet.addRow(headerRow);

    const secondRow = available
      .map((col, index) => {
        if (index > 1) {
          return ["Achieved", "Commenced", "Not Implemented"];
        }
        return "";
      })
      .flat();
    worksheet.addRow(secondRow);


    const specialColumns: string[] = columns
      .filter((c) => SPECIAL_COLUMNS.indexOf(c) !== -1)

    initial.finalData.forEach((row, rowIndex) => {
      const actualData = initial.finalColumns[initial.finalColumns.length - 1].map((col) => {
        return row[col.value];

      });
      const others = rows.concat(specialColumns).map((col) => {
        return row[col]
      });

      const rowData = [...others, ...actualData]

      worksheet.addRow(rowData);
    });

    let colIndex = 0;
    available.forEach((col, index) => {
      if (index > 1) {
        ["00FF00", "FFFF00", "FF0000"].forEach((color) => {
          const cellAddress = utils.encode_cell({ r: 1, c: colIndex });
          const cell = worksheet.getCell(cellAddress);
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: color },
          };
          colIndex++;
        });
      } else {
        colIndex++;
      }
    });

    workbook.xlsx.writeBuffer().then((buffer) => {
      const file = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(file, "table-data.xlsx");
    });
  };

  return (
    <Stack
      w="100%"
      bg="white"
      p="0"
      m="0"
      spacing="0"
      h="100%"
      overflow="auto"
      ref={squareRef}
      position="relative"
    >
      <ConfigProvider
        theme={{
          token: {
            borderRadius: 0,
          },
          components: {
            Table: {},
          },
        }}
      >
        <Box position="absolute" top="10px" right="10px" zIndex={10}>
          <Button
            colorScheme="blue"
            size="sm"
            _hover={{ bg: "blue.600" }}
            _active={{ bg: "blue.700" }}
            onClick={downloadAsExcel}
          >
            Download Table as Excel
          </Button>
        </Box>

        <Table
          size="large"
          columns={available}
          dataSource={initial.finalData}
          bordered
          pagination={false}
          rowKey="key"
          sticky
        />
      </ConfigProvider>
    </Stack>
  );
};

export default Tables;