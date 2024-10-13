export function getDataReplacementMap(decompiledCode: string): {
  dataReplacementMap: { [key: string]: string };
} {
  const dataReplacementMap: { [key: string]: string } = {};
  const decompiledCodeLines: string[] = decompiledCode.split("\n");
  decompiledCodeLines.forEach((line) => {
    if (line.includes(`b"`)) {
      const datas = line.split(`b"`).slice(1);
      datas.forEach((data) => {
        const dataPart = data.split('"')[0];
        const dataFull = `b"${dataPart}"`;
        // Use the length of dataReplacementMap as the unique identifier
        const dataCut = `b"DATA:${Object.keys(dataReplacementMap).length}"`;
        dataReplacementMap[dataCut] = dataFull;
      });
    }
  });
  return { dataReplacementMap };
}
