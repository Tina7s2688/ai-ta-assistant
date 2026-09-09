import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const desktop = "C:/Users/user/Desktop";
const entries = await fs.readdir(desktop, { recursive: true });
const relative = entries.find((entry) => entry.includes("1142_SMMC-EMI_Student list_0405_Tina Lin.xlsx"));
if (!relative) throw new Error("Template workbook not found");
const inputPath = `${desktop}/${relative.replaceAll("\\", "/")}`;
const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);
console.log(workbook.help("range.clear", { include: "index,examples,notes", maxChars: 3000 }).ndjson);
console.log(workbook.help("table.resize", { include: "index,examples,notes", maxChars: 3000 }).ndjson);
const summary = await workbook.inspect({
  kind: "workbook,sheet,table,region,computedStyle",
  maxChars: 12000,
  tableMaxRows: 50,
  tableMaxCols: 20,
  tableMaxCellChars: 120,
});
console.log(summary.ndjson);
for (const sheet of workbook.worksheets.items) {
  const preview = await workbook.render({ sheetName: sheet.name, autoCrop: "all", scale: 1.5, format: "png" });
  await fs.writeFile(`template-${sheet.name}.png`, new Uint8Array(await preview.arrayBuffer()));
}
