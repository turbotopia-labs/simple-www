const fs = require("fs");
const http = require("http");
const path = require("path");

const root = __dirname;
const publicDir = path.join(root, "public");
const contentDir = path.join(root, "content");
const dataDir = path.join(root, "data");
const port = Number(process.env.PORT || 6625);
const version = fs.readFileSync(path.join(root, "VERSION"), "utf8").trim();

const defaultModules = {
  news: {
    label: "News",
    enabled: true,
    emptyState: "No news has been published yet.",
    order: 10,
    sort: "date-desc",
    limit: null,
  },
  projects: {
    label: "Projects",
    enabled: true,
    emptyState: "No projects have been added yet.",
    order: 20,
    sort: "date-desc",
    limit: null,
  },
  blog: {
    label: "Blog",
    enabled: true,
    emptyState: "No blog posts have been published yet.",
    order: 30,
    sort: "date-desc",
    limit: null,
  },
  downloads: {
    label: "Downloads",
    enabled: true,
    emptyState: "No downloads are available yet.",
    order: 40,
    sort: "date-desc",
    limit: null,
  },
  store: {
    label: "Store",
    enabled: false,
    emptyState: "No store items are listed yet.",
    order: 50,
    sort: "title-asc",
    limit: null,
  },
  admin: {
    label: "Admin",
    enabled: false,
    emptyState: "No admin tools are enabled.",
    order: 60,
    sort: "title-asc",
    limit: null,
  },
};

const defaultConfig = {
  site: {
    title: "simple-www",
    description: "A small Markdown-powered website.",
    language: "en",
    author: "",
    timezone: "UTC",
    baseUrl: "http://127.0.0.1:6625",
    layout: "cards",
    adminEditing: false,
  },
  modules: defaultModules,
};

const validSorts = new Set(["date-desc", "date-asc", "title-asc", "title-desc", "slug-asc", "slug-desc"]);
const validLayouts = new Set(["list", "cards", "compact"]);
const editableFields = [
  "title",
  "date",
  "category",
  "summary",
  "slug",
  "draft",
  "tags",
  "status",
  "link",
  "repository",
  "file",
  "version",
  "sku",
  "price",
];

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

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function absoluteUrl(baseUrl, moduleId, item) {
  const base = String(baseUrl || "").replace(/\/+$/, "");
  return `${base}/#/${encodeURIComponent(moduleId)}/${encodeURIComponent(item.slug)}`;
}

function feedItems(moduleId) {
  const payload = sitePayload();
  const items = moduleId
    ? (payload.content[moduleId] || []).map((item) => ({ ...item, module: moduleId }))
    : Object.entries(payload.content).flatMap(([id, items]) => items.map((item) => ({ ...item, module: id })));

  return { payload, items: sortItems(items, "date-desc") };
}

function rssFeed(moduleId) {
  const { payload, items } = feedItems(moduleId);
  const site = payload.config.site;
  const module = payload.config.modules[moduleId];
  const feedTitle = `${site.title} - ${module.label}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(feedTitle)}</title>
    <link>${escapeXml(site.baseUrl)}</link>
    <description>${escapeXml(site.description)}</description>
    <language>${escapeXml(site.language)}</language>
    ${items
      .map((item) => {
        const itemUrl = absoluteUrl(site.baseUrl, moduleId, item);
        return `<item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(itemUrl)}</link>
      <guid>${escapeXml(itemUrl)}</guid>
      <pubDate>${escapeXml(item.date ? new Date(`${item.date}T00:00:00Z`).toUTCString() : "")}</pubDate>
      <description>${escapeXml(item.summary || item.body)}</description>
    </item>`;
      })
      .join("\n    ")}
  </channel>
</rss>`;
}

function jsonFeed(moduleId = "") {
  const { payload, items } = feedItems(moduleId);
  const site = payload.config.site;
  const module = payload.config.modules[moduleId];
  const title = moduleId && module ? `${site.title} - ${module.label}` : site.title;

  return {
    version: "https://jsonfeed.org/version/1.1",
    title,
    home_page_url: site.baseUrl,
    feed_url: moduleId ? `${site.baseUrl}/feeds/${moduleId}.json` : `${site.baseUrl}/feed.json`,
    description: site.description,
    authors: site.author ? [{ name: site.author }] : [],
    items: items.map((item) => ({
      id: absoluteUrl(site.baseUrl, item.module, item),
      url: absoluteUrl(site.baseUrl, item.module, item),
      title: item.title,
      summary: item.summary,
      content_text: item.body,
      date_published: item.date ? `${item.date}T00:00:00Z` : undefined,
      tags: item.tags,
    })),
  };
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function parseConfigValue(value) {
  const trimmed = value.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  if (/^-?\d+$/.test(trimmed)) return Number(trimmed);

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  }

  return trimmed.replace(/^["']|["']$/g, "");
}

function parseSimpleYaml(raw) {
  const rootConfig = {};
  const stack = [{ indent: -1, value: rootConfig }];

  raw.split(/\r?\n/).forEach((line, index) => {
    if (!line.trim() || line.trim().startsWith("#")) return;

    const indent = line.match(/^\s*/)[0].length;
    const trimmed = line.trim();
    const match = trimmed.match(/^([^:]+):(.*)$/);

    if (!match) {
      throw new Error(`Invalid YAML line ${index + 1}: ${trimmed}`);
    }

    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].value;
    const key = match[1].trim();
    const value = match[2].trim();

    if (!value) {
      parent[key] = {};
      stack.push({ indent, value: parent[key] });
      return;
    }

    parent[key] = parseConfigValue(value);
  });

  return rootConfig;
}

function readConfigFile() {
  const envConfig = process.env.CONFIG_FILE ? path.resolve(root, process.env.CONFIG_FILE) : "";
  const candidates = envConfig
    ? [envConfig]
    : [path.join(dataDir, "config.json"), path.join(dataDir, "config.yaml"), path.join(dataDir, "config.yml")];

  const filePath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!filePath) {
    return { raw: {}, source: "defaults" };
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".json") {
    return { raw: JSON.parse(raw), source: filePath };
  }

  if (ext === ".yaml" || ext === ".yml") {
    return { raw: parseSimpleYaml(raw), source: filePath };
  }

  throw new Error(`Unsupported config file type: ${filePath}`);
}

function validateRawConfig(raw, source) {
  const errors = [];

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return [`${source}: config must be an object.`];
  }

  if (raw.site !== undefined && (typeof raw.site !== "object" || Array.isArray(raw.site))) {
    errors.push(`${source}: site must be an object.`);
  }

  ["title", "description", "language", "author", "timezone", "baseUrl", "layout"].forEach((field) => {
    if (raw.site && raw.site[field] !== undefined && typeof raw.site[field] !== "string") {
      errors.push(`${source}: site.${field} must be a string.`);
    }
  });

  if (raw.site?.adminEditing !== undefined && typeof raw.site.adminEditing !== "boolean") {
    errors.push(`${source}: site.adminEditing must be true or false.`);
  }

  if (raw.site?.layout !== undefined && !validLayouts.has(raw.site.layout)) {
    errors.push(`${source}: site.layout must be one of ${Array.from(validLayouts).join(", ")}.`);
  }

  if (raw.modules !== undefined && (typeof raw.modules !== "object" || Array.isArray(raw.modules))) {
    errors.push(`${source}: modules must be an object.`);
  }

  Object.entries(raw.modules || {}).forEach(([moduleId, moduleConfig]) => {
    if (!moduleConfig || typeof moduleConfig !== "object" || Array.isArray(moduleConfig)) {
      errors.push(`${source}: modules.${moduleId} must be an object.`);
      return;
    }

    if (moduleConfig.label !== undefined && typeof moduleConfig.label !== "string") {
      errors.push(`${source}: modules.${moduleId}.label must be a string.`);
    }
    if (moduleConfig.enabled !== undefined && typeof moduleConfig.enabled !== "boolean") {
      errors.push(`${source}: modules.${moduleId}.enabled must be true or false.`);
    }
    if (moduleConfig.emptyState !== undefined && typeof moduleConfig.emptyState !== "string") {
      errors.push(`${source}: modules.${moduleId}.emptyState must be a string.`);
    }
    if (moduleConfig.order !== undefined && !Number.isInteger(moduleConfig.order)) {
      errors.push(`${source}: modules.${moduleId}.order must be an integer.`);
    }
    if (
      moduleConfig.limit !== undefined &&
      moduleConfig.limit !== null &&
      (!Number.isInteger(moduleConfig.limit) || moduleConfig.limit < 0)
    ) {
      errors.push(`${source}: modules.${moduleId}.limit must be null or a non-negative integer.`);
    }
    if (moduleConfig.sort !== undefined && !validSorts.has(moduleConfig.sort)) {
      errors.push(`${source}: modules.${moduleId}.sort must be one of ${Array.from(validSorts).join(", ")}.`);
    }
  });

  return errors;
}

function labelFromModuleId(moduleId) {
  return moduleId
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function normalizeConfig(raw) {
  const site = {
    ...defaultConfig.site,
    ...(raw.site || {}),
  };

  if (raw.siteTitle && !raw.site?.title) site.title = raw.siteTitle;
  if (raw.siteDescription && !raw.site?.description) site.description = raw.siteDescription;

  const moduleIds = new Set([...Object.keys(defaultModules), ...Object.keys(raw.modules || {})]);
  const modules = {};

  moduleIds.forEach((moduleId) => {
    const fallback = defaultModules[moduleId] || {
      label: labelFromModuleId(moduleId),
      enabled: false,
      emptyState: "No content yet.",
      order: 1000,
      sort: "date-desc",
      limit: null,
    };

    modules[moduleId] = {
      ...fallback,
      ...((raw.modules || {})[moduleId] || {}),
    };
  });

  return { site, modules };
}

function loadConfig() {
  const { raw, source } = readConfigFile();
  const errors = validateRawConfig(raw, source);

  if (errors.length) {
    throw new Error(`Config validation failed:\n- ${errors.join("\n- ")}`);
  }

  return { config: normalizeConfig(raw), source };
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
    status: String(meta.status || ""),
    link: String(meta.link || ""),
    repository: String(meta.repository || ""),
    file: String(meta.file || ""),
    version: String(meta.version || ""),
    sku: String(meta.sku || ""),
    price: String(meta.price || ""),
    body,
  };
}

function readRequestJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("Request body is too large."));
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Request body must be valid JSON."));
      }
    });

    req.on("error", reject);
  });
}

function adminEditingEnabled() {
  return loadedConfig.config.site.adminEditing === true;
}

function contentPathFor(moduleId, slug) {
  const modulePath = path.join(contentDir, moduleId);
  const filePath = path.join(modulePath, `${slug}.md`);
  if (!filePath.startsWith(contentDir)) {
    throw new Error("Invalid content path.");
  }

  return filePath;
}

function validateAdminContentInput(input, mode) {
  const errors = [];
  const moduleId = String(input.module || "").trim();
  const rawSlug = String(input.slug || input.fields?.slug || "").trim();
  const slug = slugify(rawSlug);
  const fields = input.fields && typeof input.fields === "object" && !Array.isArray(input.fields) ? input.fields : {};
  const body = String(input.body || "");

  if (!/^[a-z0-9_-]+$/.test(moduleId)) errors.push("module must use lowercase letters, numbers, hyphens, or underscores.");
  if (!loadedConfig.config.modules[moduleId]) errors.push(`module does not exist: ${moduleId}`);
  if (!rawSlug) errors.push("slug is required.");
  if (rawSlug && slug !== rawSlug.toLowerCase()) errors.push(`slug must be normalized as: ${slug}`);
  if (mode !== "delete") {
    if (!fields.title || typeof fields.title !== "string") errors.push("title is required.");
    if (fields.date && !/^\d{4}-\d{2}-\d{2}$/.test(String(fields.date))) errors.push("date must use YYYY-MM-DD.");
    if (fields.draft !== undefined && typeof fields.draft !== "boolean") errors.push("draft must be true or false.");
    if (fields.tags !== undefined && !Array.isArray(fields.tags) && typeof fields.tags !== "string") {
      errors.push("tags must be an array or comma-separated string.");
    }

    Object.keys(fields).forEach((field) => {
      if (!editableFields.includes(field)) errors.push(`unsupported field: ${field}`);
      if (typeof fields[field] === "string" && /[\r\n]/.test(fields[field])) {
        errors.push(`${field} cannot contain new lines.`);
      }
    });
  }

  const filePath = moduleId && slug ? contentPathFor(moduleId, slug) : "";
  if (filePath) {
    const exists = fs.existsSync(filePath);
    if (mode === "create" && exists) errors.push("content file already exists.");
    if ((mode === "edit" || mode === "delete") && !exists) errors.push("content file does not exist.");
  }

  return { body, errors, fields, filePath, moduleId, slug };
}

function frontMatterValue(value) {
  if (Array.isArray(value)) return `[${value.map((item) => String(item).trim()).filter(Boolean).join(", ")}]`;
  if (typeof value === "boolean") return String(value);
  return String(value || "");
}

function serializeMarkdown(fields, body, slug) {
  const normalizedFields = { ...fields, slug };
  const lines = editableFields
    .filter((field) => normalizedFields[field] !== undefined && normalizedFields[field] !== "")
    .map((field) => `${field}: ${frontMatterValue(normalizedFields[field])}`);

  return `---\n${lines.join("\n")}\n---\n\n${String(body || "").trim()}\n`;
}

function backupContentFile(filePath, moduleId, slug) {
  if (!fs.existsSync(filePath)) return;

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(contentDir, ".backups", moduleId, `${slug}.${stamp}.md`);
  fs.mkdirSync(path.dirname(backupPath), { recursive: true });
  fs.copyFileSync(filePath, backupPath);
}

async function handleAdminContent(req, res, url) {
  if (!adminEditingEnabled()) {
    sendJson(res, 403, { error: "Admin editing is disabled. Set site.adminEditing to true in config." });
    return;
  }

  if (!["GET", "POST", "PUT", "DELETE"].includes(req.method)) {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  if (req.method === "GET") {
    const moduleId = String(url.searchParams.get("module") || "");
    const slug = String(url.searchParams.get("slug") || "");
    if (!/^[a-z0-9_-]+$/.test(moduleId) || slugify(slug) !== slug || !loadedConfig.config.modules[moduleId]) {
      sendJson(res, 400, { error: "Invalid module or slug." });
      return;
    }

    const filePath = contentPathFor(moduleId, slug);
    if (!fs.existsSync(filePath)) {
      sendJson(res, 404, { error: "Content file not found." });
      return;
    }

    sendJson(res, 200, parseMarkdownFile(filePath));
    return;
  }

  try {
    const input = await readRequestJson(req);
    const mode = req.method === "POST" ? "create" : req.method === "PUT" ? "edit" : "delete";
    const checked = validateAdminContentInput(input, mode);

    if (checked.errors.length) {
      sendJson(res, 400, { errors: checked.errors });
      return;
    }

    if (req.method === "DELETE") {
      backupContentFile(checked.filePath, checked.moduleId, checked.slug);
      fs.unlinkSync(checked.filePath);
      sendJson(res, 200, { ok: true, payload: sitePayload() });
      return;
    }

    if (req.method === "PUT") {
      backupContentFile(checked.filePath, checked.moduleId, checked.slug);
    } else {
      fs.mkdirSync(path.dirname(checked.filePath), { recursive: true });
    }

    fs.writeFileSync(checked.filePath, serializeMarkdown(checked.fields, checked.body, checked.slug));
    sendJson(res, 200, { ok: true, item: parseMarkdownFile(checked.filePath), payload: sitePayload() });
  } catch (error) {
    sendJson(res, 400, { error: error.message });
  }
}

function sortItems(items, sortMode) {
  const sorted = [...items];

  sorted.sort((a, b) => {
    if (sortMode === "date-asc") return String(a.date).localeCompare(String(b.date));
    if (sortMode === "title-asc") return String(a.title).localeCompare(String(b.title));
    if (sortMode === "title-desc") return String(b.title).localeCompare(String(a.title));
    if (sortMode === "slug-asc") return String(a.slug).localeCompare(String(b.slug));
    if (sortMode === "slug-desc") return String(b.slug).localeCompare(String(a.slug));
    return String(b.date).localeCompare(String(a.date));
  });

  return sorted;
}

function listModuleContent(moduleId, moduleConfig, warnings) {
  const modulePath = path.join(contentDir, moduleId);
  if (!modulePath.startsWith(contentDir) || !fs.existsSync(modulePath)) return [];

  const seenSlugs = new Map();
  const items = fs
    .readdirSync(modulePath)
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => parseMarkdownFile(path.join(modulePath, fileName)))
    .filter((item) => !item.draft);

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

  const sortedItems = sortItems(items, moduleConfig.sort);
  return moduleConfig.limit === null ? sortedItems : sortedItems.slice(0, moduleConfig.limit);
}

function sitePayload() {
  const config = loadedConfig.config;
  const modules = config.modules || {};
  const content = {};
  const warnings = [];

  Object.keys(modules)
    .sort((a, b) => modules[a].order - modules[b].order)
    .forEach((moduleId) => {
    if (modules[moduleId] && modules[moduleId].enabled) {
      content[moduleId] = listModuleContent(moduleId, modules[moduleId], warnings);
    }
  });

  const diagnostics = {
    configSource: loadedConfig.source,
    moduleCount: Object.keys(modules).length,
    enabledModuleCount: Object.values(modules).filter((module) => module.enabled).length,
    contentItemCount: Object.values(content).reduce((total, items) => total + items.length, 0),
    adminEditing: adminEditingEnabled(),
    modules: Object.fromEntries(
      Object.keys(modules).map((moduleId) => [
        moduleId,
        {
          enabled: modules[moduleId].enabled,
          itemCount: (content[moduleId] || []).length,
          order: modules[moduleId].order,
          sort: modules[moduleId].sort,
          limit: modules[moduleId].limit,
        },
      ])
    ),
  };

  warnings.forEach((warning) => {
    console.warn(`[${warning.type}] ${warning.module}/${warning.slug}: ${warning.sources.join(", ")}`);
  });

  return { config, content, diagnostics, warnings, version };
}

function safePublicPath(urlPath) {
  const cleanPath = urlPath === "/" ? "/index.html" : decodeURIComponent(urlPath);
  const filePath = path.normalize(path.join(publicDir, cleanPath));
  return filePath.startsWith(publicDir) ? filePath : null;
}

let loadedConfig;

try {
  loadedConfig = loadConfig();
  console.log(`Loaded config from ${loadedConfig.source}`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

function createServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === "/api/site") {
      sendJson(res, 200, sitePayload());
      return;
    }

    if (url.pathname === "/api/admin/content") {
      await handleAdminContent(req, res, url);
      return;
    }

    if (url.pathname === "/feeds/news.xml" || url.pathname === "/rss/news.xml") {
      send(res, 200, rssFeed("news"), "application/rss+xml; charset=utf-8");
      return;
    }

    if (url.pathname === "/feeds/blog.xml" || url.pathname === "/rss/blog.xml") {
      send(res, 200, rssFeed("blog"), "application/rss+xml; charset=utf-8");
      return;
    }

    const jsonFeedMatch = url.pathname.match(/^\/feeds\/([^/]+)\.json$/);
    if (jsonFeedMatch) {
      sendJson(res, 200, jsonFeed(jsonFeedMatch[1]));
      return;
    }

    if (url.pathname === "/feed.json" || url.pathname === "/feeds.json") {
      sendJson(res, 200, jsonFeed());
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
}

function startServer() {
  createServer().listen(port, () => {
    console.log(`simple-www running at http://127.0.0.1:${port}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = {
  absoluteUrl,
  createServer,
  escapeXml,
  jsonFeed,
  loadedConfig,
  publicDir,
  root,
  rssFeed,
  sitePayload,
  startServer,
  version,
};
