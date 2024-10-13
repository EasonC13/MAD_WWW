import React, { useEffect, useState, useRef } from "react";
import { Table } from "flowbite-react";

interface CellData {
  value: string;
  edit: boolean;
}

interface DataRow {
  [key: string]: CellData;
}

interface TableProps {
  headers: string[];
  initialData: Array<{ [key: string]: string }>; // Original data format for input
}

const EditableTable: React.FC<TableProps> = ({ headers, initialData }) => {
  const [data, setData] = useState<DataRow[]>([]);

  useEffect(() => {
    const transformedData = initialData.map((row) => {
      const rowData: DataRow = {};
      headers.forEach((header) => {
        rowData[header] = { value: row[header] ?? "", edit: false }; // Use empty string for missing values
      });
      return rowData;
    });
    setData(transformedData);
  }, [initialData, headers]);

  const toggleEdit = (rowIndex: number, key: string) => {
    const newData = [...data];
    newData[rowIndex][key].edit = !newData[rowIndex][key].edit;
    setData(newData);
  };

  const handleChange = (value: string, rowIndex: number, key: string) => {
    const newData = [...data];
    newData[rowIndex][key].value = value;
    setData(newData);
  };

  const handleBlur = (rowIndex: number, key: string) => {
    toggleEdit(rowIndex, key); // Close edit mode when input loses focus
  };

  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto";
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [data]);

  const adjustHeight = (element: HTMLTextAreaElement) => {
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  };

  const columnWidth = `${100 / headers.length}%`;

  return (
    <div className="my-5 overflow-x-auto">
      <Table>
        <Table.Head>
          {headers.map((header) => (
            <Table.HeadCell
              key={header}
              className="border-2 border-[#3D3F40] bg-[#202222] text-white"
              style={{ width: columnWidth }}
            >
              {header}
            </Table.HeadCell>
          ))}
        </Table.Head>
        <Table.Body className="divide-y">
          {data.map((row, rowIndex) => (
            <Table.Row
              key={rowIndex}
              className="border-2 border-[#3D3F40] bg-[#202222] font-light text-white"
            >
              {headers.map((header) => (
                <Table.Cell
                  key={`${rowIndex}-${header}`}
                  className="border-2 border-[#3D3F40] bg-[#202222] font-medium text-white"
                  style={{
                    width: columnWidth,
                    wordBreak: "break-word",
                  }}
                >
                  {row[header].edit ? (
                    <textarea
                      value={row[header].value}
                      onChange={(e) => {
                        handleChange(e.target.value, rowIndex, header);
                        adjustHeight(e.target);
                      }}
                      onBlur={() => handleBlur(rowIndex, header)}
                      autoFocus
                      className="w-full border-none bg-[#202222] p-0 text-base font-medium text-white"
                      style={{
                        outline: "none",
                        resize: "none",
                        wordBreak: "break-word",
                      }}
                      rows={1} // Adjust the number of rows as needed
                      ref={textAreaRef}
                    />
                  ) : (
                    <span
                      onClick={() => toggleEdit(rowIndex, header)}
                      className="cursor-pointer text-base"
                    >
                      {row[header].value}
                    </span>
                  )}
                </Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
};

export default EditableTable;
