import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "C:/Users/Alex/AppData/Local/Temp/codex-file-preview-wIlEFT/DA40_Startstreckenrechner_Schema.xlsx";
const outputDir = "C:/Users/Alex/.codex/.chatgpt-projects/g-p-6a6c6a84067c8191a637bc61b5d3c13c/outputs/automatischer_startstreckenrechner";
const outputPath = `${outputDir}/DA40_Startstreckenrechner_automatisiert.xlsx`;
const previewPath = `${outputDir}/eingaben_preview.png`;

function interpolation({ inputX, inputY, xAxis, yAxis, grid, rows, guard }) {
  const [loX, hiX, loY, hiY, output] = rows.map((row) => `B${row}`);
  const valid = `OR(${guard})`;
  const at = (x, y) => `INDEX(${grid},MATCH(${y},${yAxis},0),MATCH(${x},${xAxis},0))`;
  const alongX = (y) => `IF(${hiX}=${loX},${at(loX, y)},${at(loX, y)}+(${inputX}-${loX})/(${hiX}-${loX})*(${at(hiX, y)}-${at(loX, y)}))`;
  return [
    `=IF(${valid},"",INDEX(${xAxis},1,MATCH(${inputX},${xAxis},1)))`,
    `=IF(NOT(ISNUMBER(${loX})),"",IF(${loX}=${inputX},${inputX},INDEX(${xAxis},1,MATCH(${inputX},${xAxis},1)+1)))`,
    `=IF(NOT(ISNUMBER(${loX})),"",INDEX(${yAxis},MATCH(${inputY},${yAxis},1)))`,
    `=IF(NOT(ISNUMBER(${loY})),"",IF(${loY}=${inputY},${inputY},INDEX(${yAxis},MATCH(${inputY},${yAxis},1)+1)))`,
    `=IF(OR(NOT(ISNUMBER(${loX})),NOT(ISNUMBER(${hiX})),NOT(ISNUMBER(${loY})),NOT(ISNUMBER(${hiY}))),"",IF(${hiY}=${loY},${alongX(loY)},${alongX(loY)}+(${inputY}-${loY})/(${hiY}-${loY})*(${alongX(hiY)}-${alongX(loY)})))`,
  ];
}

const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);
const inputs = workbook.worksheets.getItem("Eingaben");
const base = workbook.worksheets.getItem("Lookup_Base");
const obstacle = workbook.worksheets.getItem("Lookup_Hindernis");
const corrections = workbook.worksheets.getItem("Korrekturen");
const calc = workbook.worksheets.getItem("Berechnung");
const result = workbook.worksheets.getItem("Ergebnis");

base.getRange("A7").values = [[10000]];
obstacle.getRange("A3").values = [[50]];
inputs.getRange("A8:C10").values = [
  ["Gras / Höhe", "Kein Gras", null],
  ["Nass", "Nein", null],
  ["Steigung > 2 %", "Nein", null],
];
inputs.getRange("B7:B8").dataValidation = null;
inputs.getRange("B7").dataValidation = { rule: { type: "list", values: [0, 50] } };
inputs.getRange("B8").dataValidation = { rule: { type: "list", values: ["Kein Gras", "Gras <5 cm", "Gras 5-10 cm", "Gras >10 cm"] } };
inputs.getRange("B9:B10").dataValidation = { rule: { type: "list", values: ["Nein", "Ja"] } };

corrections.getRange("A1:B7").values = [
  ["Bedingung", "Multiplikator"], ["Kein Gras", 1], ["Gras <5 cm", 1.1],
  ["Gras 5-10 cm", 1.15], ["Gras >10 cm", 1.25], ["Nass", 1.1], ["Steigung >2%", 1.1],
];
corrections.getRange("B2:B7").format.numberFormat = "0.00\"x\"";

calc.getRange("A1:B53").clear({ applyTo: "contents" });
calc.getRange("A1:B53").format = { font: { name: "Calibri", size: 11 }, verticalAlignment: "center" };
calc.getRange("A1:B6").values = [
  ["Berechnung der Startstrecke", null], ["Druckhöhe [ft]", null], ["Außentemperatur [°C]", null],
  ["Masse [kg]", null], ["Windkomponente [kt]", null], ["Hindernishöhe [ft]", null],
];
calc.getRange("B2:B6").formulas = [["=Eingaben!B3"], ["=Eingaben!B4"], ["=Eingaben!B5"], ["=Eingaben!B6"], ["=Eingaben!B7"]];

const stages = [
  {
    header: 8, output: 13, title: "1. Basisstrecke: Druckhöhe und Temperatur", labels: ["Temperatur unten [°C]", "Temperatur oben [°C]", "Druckhöhe unten [ft]", "Druckhöhe oben [ft]", "Basisstrecke [m]"],
    spec: { inputX: "B3", inputY: "B2", xAxis: "Lookup_Base!$B$1:$I$1", yAxis: "Lookup_Base!$A$2:$A$7", grid: "Lookup_Base!$B$2:$I$7", rows: [9, 10, 11, 12, 13], guard: 'NOT(ISNUMBER(B2)),NOT(ISNUMBER(B3)),B2<0,B2>10000,B3<-20,B3>50,AND(B2>8000,B3>30)' },
  },
  {
    header: 16, output: 21, title: "2. Massenkorrektur", labels: ["Strecke unten [m]", "Strecke oben [m]", "Masse unten [kg]", "Masse oben [kg]", "Strecke nach Masse [m]"],
    spec: { inputX: "B13", inputY: "B4", xAxis: "Lookup_Masse!$B$1:$M$1", yAxis: "Lookup_Masse!$A$2:$A$6", grid: "Lookup_Masse!$B$2:$M$6", rows: [17, 18, 19, 20, 21], guard: 'NOT(ISNUMBER(B13)),NOT(ISNUMBER(B4)),B13<100,B13>1200,B4<850,B4>1200' },
  },
  {
    header: 24, output: 29, title: "3. Windkorrektur", labels: ["Strecke unten [m]", "Strecke oben [m]", "Wind unten [kt]", "Wind oben [kt]", "Strecke nach Wind [m]"],
    spec: { inputX: "B21", inputY: "B5", xAxis: "Lookup_Wind!$B$1:$L$1", yAxis: "Lookup_Wind!$A$2:$A$7", grid: "Lookup_Wind!$B$2:$L$7", rows: [25, 26, 27, 28, 29], guard: 'NOT(ISNUMBER(B21)),NOT(ISNUMBER(B5)),B21<200,B21>1200,B5<-5,B5>20' },
  },
  {
    header: 32, output: 37, title: "4. Hinderniskorrektur", labels: ["Strecke unten [m]", "Strecke oben [m]", "Hindernis unten [ft]", "Hindernis oben [ft]", "Strecke über Hindernis [m]"],
    spec: { inputX: "B29", inputY: "B6", xAxis: "Lookup_Hindernis!$B$1:$M$1", yAxis: "Lookup_Hindernis!$A$2:$A$3", grid: "Lookup_Hindernis!$B$2:$M$3", rows: [33, 34, 35, 36, 37], guard: 'NOT(ISNUMBER(B29)),NOT(ISNUMBER(B6)),B29<100,B29>1200,B6<0,B6>50' },
  },
];
for (const stage of stages) {
  calc.getRange(`A${stage.header}:B${stage.header}`).values = [[stage.title, null]];
  calc.getRange(`A${stage.header + 1}:A${stage.output}`).values = stage.labels.map((label) => [label]);
  calc.getRange(`B${stage.header + 1}:B${stage.output}`).formulas = interpolation(stage.spec).map((formula) => [formula]);
}

// The supplied obstacle chart has two discrete reference curves: 0 ft and 50 ft.
// The input control intentionally permits only those two published values.
calc.getRange("B37").formulas = [["=IF(OR(NOT(ISNUMBER(B29)),B29<100,B29>1200),\"\",IF(B6=0,B29,IF(B6=50,IF(B34=B33,INDEX(Lookup_Hindernis!$B$3:$M$3,1,MATCH(B33,Lookup_Hindernis!$B$1:$M$1,0)),INDEX(Lookup_Hindernis!$B$3:$M$3,1,MATCH(B33,Lookup_Hindernis!$B$1:$M$1,0))+(B29-B33)/(B34-B33)*(INDEX(Lookup_Hindernis!$B$3:$M$3,1,MATCH(B34,Lookup_Hindernis!$B$1:$M$1,0))-INDEX(Lookup_Hindernis!$B$3:$M$3,1,MATCH(B33,Lookup_Hindernis!$B$1:$M$1,0)))),\"\")))"]];

calc.getRange("A40:B44").values = [
  ["5. Zuschläge", null], ["Grasfaktor", null], ["Nässefaktor", null], ["Steigungsfaktor", null], ["Endgültige Startstrecke [m]", null],
];
calc.getRange("B41:B44").formulas = [
  ["=IF(Eingaben!B8=\"\",\"\",VLOOKUP(Eingaben!B8,Korrekturen!$A$2:$B$5,2,FALSE))"],
  ["=IF(Eingaben!B9=\"Ja\",Korrekturen!$B$6,1)"], ["=IF(Eingaben!B10=\"Ja\",Korrekturen!$B$7,1)"],
  ["=IF(OR(NOT(ISNUMBER(B37)),NOT(ISNUMBER(B41)),NOT(ISNUMBER(B42)),NOT(ISNUMBER(B43))),\"\",ROUND(B37*B41*B42*B43,0))"],
];

calc.getRange("A1:B1").format = { fill: "#DDEBD7", font: { name: "Calibri", size: 12, bold: true }, borders: { preset: "outside", style: "thin", color: "#A9D18E" } };
for (const row of [8, 16, 24, 32, 40]) calc.getRange(`A${row}:B${row}`).format = { fill: "#DDEBD7", font: { name: "Calibri", size: 11, bold: true }, borders: { preset: "outside", style: "thin", color: "#A9D18E" } };
calc.getRange("A1:A53").format.columnWidth = 34;
calc.getRange("B1:B53").format.columnWidth = 16;
calc.getRange("B13,B21,B29,B37,B44").format.numberFormat = "#,##0.0";
calc.getRange("B41:B43").format.numberFormat = "0.00\"x\"";

result.getRange("A1").values = [["Endgültige Startstrecke [m]"]];
result.getRange("A2").formulas = [["=Berechnung!B44"]];
result.getRange("A2").format.numberFormat = "#,##0";
inputs.getRange("D2:F2").values = [["Ergebnis", null, null]];
inputs.getRange("D3").values = [["Startstrecke über Hindernis"]];
inputs.getRange("E3").formulas = [["=Ergebnis!A2"]];
inputs.getRange("F3").values = [["m"]];
inputs.getRange("D2:F2").format = { fill: "#DDEBD7", font: { name: "Calibri", size: 11, bold: true, color: "#1F1F1F" }, horizontalAlignment: "center", verticalAlignment: "center", borders: { preset: "outside", style: "thin", color: "#A9D18E" } };
inputs.getRange("D3:F3").format = { font: { name: "Calibri", size: 11 }, verticalAlignment: "center", borders: { preset: "outside", style: "thin", color: "#A9D18E" } };
inputs.getRange("E3").format = { fill: "#E2F0D9", font: { name: "Calibri", size: 14, bold: true, color: "#1F1F1F" }, horizontalAlignment: "right", verticalAlignment: "center", numberFormat: "#,##0", borders: { preset: "outside", style: "thin", color: "#A9D18E" } };
inputs.getRange("D3").format.columnWidth = 25;
inputs.getRange("E3").format.columnWidth = 12;
inputs.getRange("F3").format.columnWidth = 8;
inputs.getRange("D2:F2").format.rowHeight = 22;
inputs.getRange("D3:F3").format.rowHeight = 26;

workbook.recalculate();
const check = await workbook.inspect({ kind: "table,formula", range: "Eingaben!A1:F10", maxChars: 3500, tableMaxRows: 12, tableMaxCols: 8 });
console.log(check.ndjson);
const calculationCheck = await workbook.inspect({ kind: "table", range: "Berechnung!A1:B44", maxChars: 7000, tableMaxRows: 50, tableMaxCols: 3 });
console.log(calculationCheck.ndjson);
const errors = await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!", options: { useRegex: true, maxResults: 100 }, summary: "formula error scan" });
console.log(errors.ndjson);

await fs.mkdir(outputDir, { recursive: true });
const preview = await workbook.render({ sheetName: "Eingaben", range: "A1:F10", scale: 2, format: "png" });
await fs.writeFile(previewPath, new Uint8Array(await preview.arrayBuffer()));
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(`Saved: ${outputPath}`);
