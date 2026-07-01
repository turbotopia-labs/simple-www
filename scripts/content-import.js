const fs = require("fs");
const path = require("path");

const { allContentFieldNames, contentDir, loadedConfig, root, serializeMarkdown, slugify, validateContentFields } = require("../server");

const contentFields = [
  "title",
  "date",
  "updated",
  "author",
  "category",
  "summary",
  "slug",
  "draft",
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
];

function argValue(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1] || fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
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
    throw new Error(`Refusing to read outside project root: ${resolvedTarget}`);
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted && char === '"' && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (!quoted && char === ",") {
      row.push(cell);
      cell = "";
    } else if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((value) => value !== "")) rows.push(row);
  return rows;
}

function csvToRecords(text) {
  const rows = parseCsv(text);
  const headers = rows.shift() || [];
  return rows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])));
}

function parseBoolean(value) {
  if (value === true || value === "true") return true;
  if (value === false || value === "false" || value === "") return false;
  return value;
}

function parseTags(value) {
  if (Array.isArray(value)) return value.map((tag) => String(tag).trim()).filter(Boolean);
  return String(value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function loadRecords(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  if (formatFrom(filePath) === "csv") return csvToRecords(text);

  const parsed = JSON.parse(text);
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.items)) return parsed.items;
  throw new Error("JSON import must be an array or an object with an items array.");
}

function contentPathFor(moduleId, slug) {
  const filePath = path.resolve(contentDir, moduleId, `${slug}.md`);
  if (!filePath.startsWith(path.resolve(contentDir))) throw new Error(`Invalid content path for ${moduleId}/${slug}.`);
  return filePath;
}

function backupFile(filePath, moduleId, slug) {
  if (!fs.existsSync(filePath)) return;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(contentDir, ".backups", "import", moduleId, `${slug}.${stamp}.md`);
  fs.mkdirSync(path.dirname(backupPath), { recursive: true });
  fs.copyFileSync(filePath, backupPath);
}

function normalizeRecord(record, index) {
  const moduleId = String(record.module || "").trim();
  const rawSlug = String(record.slug || record.title || `item-${index + 1}`).trim();
  const slug = slugify(rawSlug);
  const fields = {};
  const importFields = allContentFieldNames(moduleId);

  importFields.forEach((field) => {
    if (record[field] !== undefined) fields[field] = record[field];
  });

  fields.slug = slug;
  fields.title = String(fields.title || "").trim();
  fields.category = String(fields.category || "general").trim();
  fields.draft = parseBoolean(fields.draft);
  fields.pinned = parseBoolean(fields.pinned);
  fields.priority = fields.priority === "" || fields.priority === undefined ? 0 : Number(fields.priority);
  fields.tags = parseTags(fields.tags);

  const item = {
    ...Object.fromEntries(importFields.map((field) => [field, fields[field] ?? ""])),
    slug,
    draft: fields.draft,
    pinned: fields.pinned,
    priority: fields.priority,
    tags: fields.tags,
  };

  return { moduleId, slug, fields, body: String(record.body || ""), item };
}

function main() {
  const inputPath = argValue("--file", "");
  const dryRun = hasFlag("--dry-run");
  const duplicates = argValue("--duplicates", "fail");
  if (!inputPath || !["fail", "skip", "replace"].includes(duplicates)) {
    console.error("Usage: node scripts/content-import.js --file import.json|import.csv [--format json|csv] [--dry-run] [--duplicates fail|skip|replace]");
    process.exit(1);
  }

  const resolvedInputPath = path.resolve(root, inputPath);
  ensureInsideRoot(resolvedInputPath);
  const records = loadRecords(resolvedInputPath);
  const seenTargets = new Set();
  const actions = [];
  const errors = [];

  records.forEach((record, index) => {
    const normalized = normalizeRecord(record, index);
    const { moduleId, slug, fields, body, item } = normalized;

    if (!loadedConfig.config.modules[moduleId]) errors.push(`row ${index + 1}: module does not exist: ${moduleId}`);
    errors.push(...validateContentFields(moduleId, item, `row ${index + 1}`));

    const targetPath = contentPathFor(moduleId, slug);
    const targetKey = `${moduleId}/${slug}`;
    const exists = fs.existsSync(targetPath) || seenTargets.has(targetKey);
    if (exists && duplicates === "fail") errors.push(`row ${index + 1}: duplicate content target: ${targetKey}`);
    if (exists && duplicates === "skip") {
      actions.push({ action: "skip", moduleId, slug, targetPath });
      return;
    }

    seenTargets.add(targetKey);
    actions.push({ action: exists ? "replace" : "create", moduleId, slug, targetPath, fields, body });
  });

  if (errors.length) {
    console.error(`Import validation failed with ${errors.length} error(s):`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  actions.forEach((action) => {
    console.log(`${dryRun ? "Would " : ""}${action.action}: ${action.moduleId}/${action.slug}`);
  });

  if (dryRun) {
    console.log(`Dry run complete. No files changed.`);
    return;
  }

  actions.forEach((action) => {
    if (action.action === "skip") return;
    if (action.action === "replace") backupFile(action.targetPath, action.moduleId, action.slug);
    fs.mkdirSync(path.dirname(action.targetPath), { recursive: true });
    fs.writeFileSync(action.targetPath, serializeMarkdown(action.fields, action.body, action.slug));
  });

  console.log(`Imported ${actions.filter((action) => action.action !== "skip").length} content item(s).`);
}

main();
