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
  },
  modules: defaultModules,
};

const validSorts = new Set(["date-desc", "date-asc", "title-asc", "title-desc", "slug-asc", "slug-desc"]);
const validLayouts = new Set(["list", "cards", "compact"]);

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
