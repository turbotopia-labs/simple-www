const fs = require("fs");
const path = require("path");

const { allContentFieldNames, contentDir, loadedConfig, parseMarkdownFile, root, version } = require("../server");

const baseFields = [
  "module",
  "slug",
  "title",
  "date",
  "updated",
  "author",
  "category",
  "summary",
  "draft",
  "publishAt",
  "tags",
  "image",
  "imageAlt",
  "pinned",
  "priority",
  "canonicalUrl",
  "status",
  "link",
  "repository",
  "file",
  "version",
  "sku",
  "price",
  "body",
];

function argValue(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1] || fallback;
}

function formatFrom(filePath) {
  const explicit = argValue("--format", "").toLowerCase();
  if (explicit) return explicit;
  return path.extname(filePath).toLowerCase() === ".csv" ? "csv" : "json";
}

function ensureInsideRoot(targetPath) {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(targetPath);
  if (resolvedTarget !== resolvedRoot && !resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error(`Refusing to write outside project root: ${resolvedTarget}`);
  }
}

function csvValue(value) {
  const text = Array.isArray(value) ? value.join(", ") : String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function rowsToCsv(rows) {
  const fields = exportFields(rows);
  return [fields.join(","), ...rows.map((row) => fields.map((field) => csvValue(row[field])).join(","))].join("\n") + "\n";
}

function exportFields(rows) {
  const moduleFields = rows.flatMap((row) => allContentFieldNames(row.module));
  return [...new Set([...baseFields, ...moduleFields, ...rows.flatMap((row) => Object.keys(row))])];
}

function readItems(moduleFilter) {
  const moduleIds = Object.keys(loadedConfig.config.modules || {}).filter((moduleId) => !moduleFilter || moduleId === moduleFilter);
  return moduleIds.flatMap((moduleId) => {
    const modulePath = path.join(contentDir, moduleId);
    if (!fs.existsSync(modulePath)) return [];

    return fs
      .readdirSync(modulePath)
      .filter((fileName) => fileName.endsWith(".md"))
      .map((fileName) => {
        const item = parseMarkdownFile(path.join(modulePath, fileName));
        return { module: moduleId, ...item };
      });
  });
}

function main() {
  const outPath = argValue("--out", "");
  if (!outPath) {
    console.error("Usage: node scripts/content-export.js --out export.json|export.csv [--format json|csv] [--module projects]");
    process.exit(1);
  }

  const moduleFilter = argValue("--module", "");
  const items = readItems(moduleFilter);
  const outputPath = path.resolve(root, outPath);
  ensureInsideRoot(outputPath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  if (formatFrom(outputPath) === "csv") {
    fs.writeFileSync(outputPath, rowsToCsv(items));
  } else {
    fs.writeFileSync(outputPath, JSON.stringify({ version, exportedAt: new Date().toISOString(), items }, null, 2));
  }

  console.log(`Exported ${items.length} content item(s) to ${outputPath}`);
}

main();
