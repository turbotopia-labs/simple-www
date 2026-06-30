const fs = require("fs");
const http = require("http");
const path = require("path");

const root = __dirname;
const publicDir = path.join(root, "public");
const contentDir = path.join(root, "content");
const dataDir = path.join(root, "data");
const port = Number(process.env.PORT || 6625);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type });
  res.end(body);
}

function sendJson(res, status, value) {
  send(res, status, JSON.stringify(value, null, 2), "application/json; charset=utf-8");
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function slugify(value, fallback = "item") {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || fallback;
}

function parseFrontMatterValue(value) {
  const trimmed = value.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  }

  return trimmed.replace(/^["']|["']$/g, "");
}

function parseFrontMatter(raw) {
  const frontMatter = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const meta = {};
  let body = raw;

  if (!frontMatter) {
    return { meta, body };
  }

  body = raw.slice(frontMatter[0].length);
  frontMatter[1].split(/\r?\n/).forEach((line) => {
    const splitAt = line.indexOf(":");
    if (splitAt === -1) return;
    const key = line.slice(0, splitAt).trim();
    const value = line.slice(splitAt + 1).trim();
    if (key) meta[key] = parseFrontMatterValue(value);
  });

  return { meta, body };
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

function parseMarkdownFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const { meta, body } = parseFrontMatter(raw);
  const fileSlug = path.basename(filePath, ".md");
  const slug = slugify(meta.slug || fileSlug, fileSlug);

  return {
    slug,
    source: path.relative(contentDir, filePath).replace(/\\/g, "/"),
    title: String(meta.title || slug.replace(/[-_]/g, " ")),
    date: String(meta.date || ""),
    category: String(meta.category || "general"),
    summary: String(meta.summary || ""),
    draft: meta.draft === true,
    tags: normalizeTags(meta.tags),
    body,
  };
}

function listModuleContent(moduleId, warnings) {
  const modulePath = path.join(contentDir, moduleId);
  if (!modulePath.startsWith(contentDir) || !fs.existsSync(modulePath)) return [];

  const seenSlugs = new Map();
  const items = fs
    .readdirSync(modulePath)
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => parseMarkdownFile(path.join(modulePath, fileName)))
    .filter((item) => !item.draft)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  items.forEach((item) => {
    if (!seenSlugs.has(item.slug)) {
      seenSlugs.set(item.slug, item.source);
      return;
    }

    warnings.push({
      type: "duplicate-slug",
      module: moduleId,
      slug: item.slug,
      sources: [seenSlugs.get(item.slug), item.source],
    });
  });

  return items;
}

function sitePayload() {
  const config = readJson(path.join(dataDir, "config.json"), {});
  const modules = config.modules || {};
  const content = {};
  const warnings = [];

  Object.keys(modules).forEach((moduleId) => {
    if (modules[moduleId] && modules[moduleId].enabled) {
      content[moduleId] = listModuleContent(moduleId, warnings);
    }
  });

  warnings.forEach((warning) => {
    console.warn(`[${warning.type}] ${warning.module}/${warning.slug}: ${warning.sources.join(", ")}`);
  });

  return { config, content, warnings };
}

function safePublicPath(urlPath) {
  const cleanPath = urlPath === "/" ? "/index.html" : decodeURIComponent(urlPath);
  const filePath = path.normalize(path.join(publicDir, cleanPath));
  return filePath.startsWith(publicDir) ? filePath : null;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/api/site") {
    sendJson(res, 200, sitePayload());
    return;
  }

  const filePath = safePublicPath(url.pathname);
  if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    send(res, 404, "Not found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  send(res, 200, fs.readFileSync(filePath), mimeTypes[ext] || "application/octet-stream");
});

server.listen(port, () => {
  console.log(`simple-www running at http://127.0.0.1:${port}`);
});
