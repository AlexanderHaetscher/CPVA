import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "C:/Users/Alex/AppData/Local/Temp/codex-file-preview-wIlEFT/DA40_Startstreckenrechner_Schema.xlsx";
const previewPath = "C:/Users/Alex/.codex/.chatgpt-projects/g-p-6a6c6a84067c8191a637bc61b5d3c13c/eingaben_before.png";
const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);

const check = await workbook.inspect({
  kind: "table,formula,computedStyle",
  range: "Eingaben!A1:F14",
  maxChars: 6000,
  tableMaxRows: 20,
  tableMaxCols: 8,
});
console.log(check.ndjson);

const preview = await workbook.render({
  sheetName: "Eingaben",
  range: "A1:F14",
  scale: 2,
  format: "png",
});
await fs.writeFile(previewPath, new Uint8Array(await preview.arrayBuffer()));
console.log(`Preview saved: ${previewPath}`);
