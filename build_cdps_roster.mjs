import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const desktop = "C:/Users/user/Desktop";
const outputDir = "outputs/cdps-roster-20260906";
const entries = await fs.readdir(desktop, { recursive: true });
const templateRelative = entries.find((entry) => entry.includes("1142_SMMC-EMI_Student list_0405_Tina Lin.xlsx"));
if (!templateRelative) throw new Error("Template workbook not found");

const input = await FileBlob.load(`${desktop}/${templateRelative.replaceAll("\\", "/")}`);
const workbook = await SpreadsheetFile.importXlsx(input);
const sheet = workbook.worksheets.getItem("工作表1");

// Preserve the template's title/header and first-group row styles.
for (const table of [...sheet.tables.items]) table.delete();
sheet.getRange("A1").values = [["1151 Co-opetitive Dynamics and Platform Strategy (EMI)"]];
sheet.getRange("A3:E6").values = [
  ["國際企業學系碩士班一年級", "115212509", "楊絜茹", null, "G1"],
  ["國際企業學系學士班四年級", "112212015", "王怡婷", "Tina Wang", "G1"],
  ["國際企業學系學士班三年級", "113212016", "林庭伃", "Tina Lin", "G1"],
  ["國際文教與比較教育學系學士班三年級", "113402010", "吳云青", null, "G1"],
];
sheet.getRange("A7:E44").clear({ applyTo: "all" });
sheet.getRange("A1:A6").format.columnWidth = 35;

// Explicitly retain the required language-specific body fonts.
sheet.getRange("A3:A6").format.font = { name: "標楷體", size: 12 };
sheet.getRange("C3:C6").format.font = { name: "標楷體", size: 12 };
sheet.getRange("B3:B6").format.font = { name: "Times New Roman", size: 12 };
sheet.getRange("D3:D6").format.font = { name: "Times New Roman", size: 12 };
sheet.getRange("E3:E6").format.font = { name: "Times New Roman", size: 12 };
sheet.getRange("B3:B6").format.horizontalAlignment = "center";
sheet.getRange("E3:E6").format.horizontalAlignment = "center";

const check = await workbook.inspect({
  kind: "table,region,computedStyle",
  sheetId: "工作表1",
  range: "A1:E6",
  maxChars: 6000,
  tableMaxRows: 10,
  tableMaxCols: 5,
});
console.log(check.ndjson);
const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!",
  options: { useRegex: true, maxResults: 100 },
  summary: "formula error scan",
});
console.log(errors.ndjson);

const preview = await workbook.render({ sheetName: "工作表1", range: "A1:E6", scale: 2, format: "png" });
await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(`${outputDir}/preview.png`, new Uint8Array(await preview.arrayBuffer()));
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(`${outputDir}/1151_CDPS-EMI_Student_List.xlsx`);
