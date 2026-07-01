const fs = require("fs");
const http = require("http");
const path = require("path");

const root = __dirname;
const publicDir = path.join(root, "public");
const contentDir = path.join(root, "content");
const dataDir = path.join(root, "data");
const commentsDir = path.join(dataDir, "comments");
const modulesDir = path.join(root, "modules");
const themesDir = path.join(root, "themes");
const port = Number(process.env.PORT || 6625);
const version = fs.readFileSync(path.join(root, "VERSION"), "utf8").trim();
const requiredThemeVariables = [
  "bg",
  "panel",
  "text",
  "muted",
  "border",
  "border-strong",
  "link",
  "accent",
  "accent-strong",
  "shadow",
  "button",
];

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
    footerText: "simple-www v.{VERSION}",
    theme: "classic",
    layout: "cards",
    adminEditing: false,
    commentsEnabled: false,
  },
  modules: defaultModules,
};

const validSorts = new Set(["date-desc", "date-asc", "title-asc", "title-desc", "slug-asc", "slug-desc"]);
const validLayouts = new Set(["list", "cards", "compact"]);
const validManifestFieldTypes = new Set(["string", "text", "date", "boolean", "integer", "url", "tags"]);
const editableFields = [
  "title",
  "date",
  "category",
  "summary",
  "slug",
  "draft",
  "tags",
  "updated",
  "author",
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

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function validateModuleManifest(moduleId, manifest, source) {
  const errors = [];
  const allowedFieldNames = new Set(editableFields);

  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    return [`${source}: manifest must be an object.`];
  }

  if (manifest.id !== undefined && manifest.id !== moduleId) errors.push(`${source}: id must match file name: ${moduleId}.`);
  if (manifest.label !== undefined && typeof manifest.label !== "string") errors.push(`${source}: label must be a string.`);
  if (manifest.enabled !== undefined && typeof manifest.enabled !== "boolean") errors.push(`${source}: enabled must be true or false.`);
  if (manifest.emptyState !== undefined && typeof manifest.emptyState !== "string") errors.push(`${source}: emptyState must be a string.`);
  if (manifest.order !== undefined && !Number.isInteger(manifest.order)) errors.push(`${source}: order must be an integer.`);
  if (manifest.limit !== undefined && manifest.limit !== null && (!Number.isInteger(manifest.limit) || manifest.limit < 0)) {
    errors.push(`${source}: limit must be null or a non-negative integer.`);
  }
  if (manifest.sort !== undefined && !validSorts.has(manifest.sort)) errors.push(`${source}: sort must be one of ${Array.from(validSorts).join(", ")}.`);

  if (manifest.fields !== undefined && !Array.isArray(manifest.fields)) {
    errors.push(`${source}: fields must be an array.`);
  }

  (manifest.fields || []).forEach((field, index) => {
    if (!field || typeof field !== "object" || Array.isArray(field)) {
      errors.push(`${source}: fields[${index}] must be an object.`);
      return;
    }
    if (!/^[a-z][a-z0-9]*$/i.test(String(field.name || ""))) errors.push(`${source}: fields[${index}].name must use letters and numbers.`);
    if (!validManifestFieldTypes.has(field.type || "string")) errors.push(`${source}: fields[${index}].type is not supported.`);
    if (field.label !== undefined && typeof field.label !== "string") errors.push(`${source}: fields[${index}].label must be a string.`);
    ["required", "list", "detail"].forEach((key) => {
      if (field[key] !== undefined && typeof field[key] !== "boolean") errors.push(`${source}: fields[${index}].${key} must be true or false.`);
    });
    if (field.name) allowedFieldNames.add(field.name);
  });

  ["list", "detail"].forEach((viewName) => {
    const view = manifest.views?.[viewName];
    if (view !== undefined && !Array.isArray(view)) errors.push(`${source}: views.${viewName} must be an array.`);
    (view || []).forEach((field) => {
      if (!allowedFieldNames.has(field)) errors.push(`${source}: views.${viewName} contains unknown field: ${field}.`);
    });
  });

  const required = manifest.validation?.required;
  if (required !== undefined && !Array.isArray(required)) errors.push(`${source}: validation.required must be an array.`);
  (required || []).forEach((field) => {
    if (!allowedFieldNames.has(field)) errors.push(`${source}: validation.required contains unknown field: ${field}.`);
  });

  return errors;
}

function loadModuleManifests() {
  if (!fs.existsSync(modulesDir)) return { manifests: {}, errors: [] };

  const manifests = {};
  const errors = [];
  fs.readdirSync(modulesDir)
    .filter((fileName) => fileName.endsWith(".json"))
    .forEach((fileName) => {
      const moduleId = path.basename(fileName, ".json");
      const source = path.join(modulesDir, fileName);
      if (!/^[a-z0-9_-]+$/.test(moduleId)) {
        errors.push(`${source}: module file name must use lowercase letters, numbers, hyphens, or underscores.`);
        return;
      }

      try {
        const manifest = readJsonFile(source);
        errors.push(...validateModuleManifest(moduleId, manifest, source));
        manifests[moduleId] = {
          id: moduleId,
          label: labelFromModuleId(moduleId),
          enabled: false,
          emptyState: "No content yet.",
          order: 1000,
          sort: "date-desc",
          limit: null,
          fields: [],
          views: {},
          validation: {},
          ...manifest,
        };
      } catch (error) {
        errors.push(`${source}: ${error.message}`);
      }
    });

  return { manifests, errors };
}

const loadedModuleManifests = loadModuleManifests();
const moduleManifests = loadedModuleManifests.manifests;

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type });
  res.end(body);
}

function sendJson(res, status, value) {
  send(res, status, JSON.stringify(value, null, 2), "application/json; charset=utf-8");
}

function errorPage(status, title, message) {
  return `<!doctype html>
<html lang="${escapeXml(loadedConfig?.config?.site?.language || "en")}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeXml(status)} ${escapeXml(title)}</title>
    <link rel="stylesheet" href="styles.css">
  </head>
  <body>
    <main class="layout" data-layout="list">
      <section class="card">
        <h1>${escapeXml(status)} ${escapeXml(title)}</h1>
        <p>${escapeXml(message)}</p>
        <p><a href="/">Back to site</a></p>
      </section>
    </main>
  </body>
</html>`;
}

function sendError(res, status, title, message) {
  send(res, status, errorPage(status, title, message), "text/html; charset=utf-8");
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

  ["title", "description", "language", "author", "timezone", "baseUrl", "footerText", "theme", "layout"].forEach((field) => {
    if (raw.site && raw.site[field] !== undefined && typeof raw.site[field] !== "string") {
      errors.push(`${source}: site.${field} must be a string.`);
    }
  });

  if (raw.site?.adminEditing !== undefined && typeof raw.site.adminEditing !== "boolean") {
    errors.push(`${source}: site.adminEditing must be true or false.`);
  }

  if (raw.site?.commentsEnabled !== undefined && typeof raw.site.commentsEnabled !== "boolean") {
    errors.push(`${source}: site.commentsEnabled must be true or false.`);
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

function themePath(themeName) {
  const safeName = String(themeName || "").trim();
  if (!/^[a-z0-9_-]+$/i.test(safeName)) return null;
  const filePath = path.resolve(themesDir, `${safeName}.css`);
  return filePath.startsWith(path.resolve(themesDir)) ? filePath : null;
}

function validateThemePack(themeName) {
  const filePath = themePath(themeName);
  if (!filePath || !fs.existsSync(filePath)) {
    return [`theme does not exist: ${themeName}`];
  }

  const css = fs.readFileSync(filePath, "utf8");
  return requiredThemeVariables
    .filter((variable) => !new RegExp(`--${variable}\\s*:`).test(css))
    .map((variable) => `${path.relative(root, filePath)} is missing --${variable}.`);
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

  const moduleIds = new Set([...Object.keys(defaultModules), ...Object.keys(moduleManifests), ...Object.keys(raw.modules || {})]);
  const modules = {};

  moduleIds.forEach((moduleId) => {
    const fallback = defaultModules[moduleId] || moduleManifests[moduleId] || {
      label: labelFromModuleId(moduleId),
      enabled: false,
      emptyState: "No content yet.",
      order: 1000,
      sort: "date-desc",
      limit: null,
      fields: [],
      views: {},
      validation: {},
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
  const errors = [...loadedModuleManifests.errors, ...validateRawConfig(raw, source)];

  if (errors.length) {
    throw new Error(`Config validation failed:\n- ${errors.join("\n- ")}`);
  }

  const config = normalizeConfig(raw);
  const themeErrors = validateThemePack(config.site.theme);
  if (themeErrors.length) {
    throw new Error(`Theme validation failed:\n- ${themeErrors.join("\n- ")}`);
  }

  return { config, source };
}

function slugify(value, fallback = "item") {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || fallback;
}

function isDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isSafeContentUrl(value) {
  const url = String(value || "").trim();
  if (!url) return true;
  if (/^(https?:|mailto:|\/|#|\.\.?\/)/i.test(url)) return true;
  return /^[a-z0-9./_-]+$/i.test(url);
}

function booleanValue(value) {
  return value === true;
}

function integerValue(value, fallback = 0) {
  const number = Number(value);
  return Number.isInteger(number) ? number : fallback;
}

function moduleDefinition(moduleId) {
  return loadedConfig?.config?.modules?.[moduleId] || moduleManifests[moduleId] || {};
}

function moduleFieldDefinitions(moduleId) {
  return Array.isArray(moduleDefinition(moduleId).fields) ? moduleDefinition(moduleId).fields : [];
}

function allContentFieldNames(moduleId) {
  return [...new Set([...editableFields, ...moduleFieldDefinitions(moduleId).map((field) => field.name).filter(Boolean)])];
}

function requiredFieldsForModule(moduleId) {
  const definition = moduleDefinition(moduleId);
  const manifestRequired = [
    ...(definition.validation?.required || []),
    ...moduleFieldDefinitions(moduleId)
      .filter((field) => field.required)
      .map((field) => field.name),
  ];
  if (manifestRequired.length) return [...new Set(["title", ...manifestRequired])];
  if (moduleId === "news" || moduleId === "blog") return ["title", "date"];
  if (moduleId === "projects") return ["title", "status"];
  if (moduleId === "downloads") return ["title", "version"];
  if (moduleId === "store") return ["title", "sku", "price"];
  return ["title"];
}

function validateContentFields(moduleId, item, source) {
  const errors = [];
  requiredFieldsForModule(moduleId).forEach((field) => {
    if (!item[field]) errors.push(`${source}: ${field} is required for ${moduleId}.`);
  });

  ["date", "updated"].forEach((field) => {
    if (item[field] && !isDateString(item[field])) errors.push(`${source}: ${field} must use YYYY-MM-DD.`);
  });

  ["link", "repository", "file", "image", "canonicalUrl"].forEach((field) => {
    if (item[field] && !isSafeContentUrl(item[field])) errors.push(`${source}: ${field} must be a safe URL or relative path.`);
  });

  if (typeof item.draft !== "boolean") errors.push(`${source}: draft must be true or false.`);
  if (typeof item.pinned !== "boolean") errors.push(`${source}: pinned must be true or false.`);
  if (!Number.isInteger(item.priority)) errors.push(`${source}: priority must be an integer.`);

  moduleFieldDefinitions(moduleId).forEach((field) => {
    const value = item[field.name];
    if (value === undefined || value === "") return;
    if (field.type === "date" && !isDateString(value)) errors.push(`${source}: ${field.name} must use YYYY-MM-DD.`);
    if (field.type === "boolean" && typeof value !== "boolean") errors.push(`${source}: ${field.name} must be true or false.`);
    if (field.type === "integer" && !Number.isInteger(Number(value))) errors.push(`${source}: ${field.name} must be an integer.`);
    if (field.type === "url" && !isSafeContentUrl(value)) errors.push(`${source}: ${field.name} must be a safe URL or relative path.`);
    if (field.type === "tags" && !Array.isArray(value)) errors.push(`${source}: ${field.name} must be a list.`);
  });

  return errors;
}

function parseFrontMatterValue(value) {
  const trimmed = value.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
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
  const moduleId = path.relative(contentDir, path.dirname(filePath)).split(path.sep)[0];
  const slug = slugify(meta.slug || fileSlug, fileSlug);
  const customFields = Object.fromEntries(
    moduleFieldDefinitions(moduleId)
      .filter((field) => field.name && !editableFields.includes(field.name))
      .map((field) => [field.name, field.type === "tags" ? normalizeTags(meta[field.name]) : meta[field.name] ?? ""])
  );

  return {
    slug,
    source: path.relative(contentDir, filePath).replace(/\\/g, "/"),
    title: String(meta.title || slug.replace(/[-_]/g, " ")),
    date: String(meta.date || ""),
    category: String(meta.category || "general"),
    summary: String(meta.summary || ""),
    draft: booleanValue(meta.draft),
    tags: normalizeTags(meta.tags),
    updated: String(meta.updated || ""),
    author: String(meta.author || ""),
    image: String(meta.image || ""),
    imageAlt: String(meta.imageAlt || ""),
    pinned: booleanValue(meta.pinned),
    priority: integerValue(meta.priority),
    canonicalUrl: String(meta.canonicalUrl || ""),
    status: String(meta.status || ""),
    link: String(meta.link || ""),
    repository: String(meta.repository || ""),
    file: String(meta.file || ""),
    version: String(meta.version || ""),
    sku: String(meta.sku || ""),
    price: String(meta.price || ""),
    ...customFields,
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

function commentsEnabled() {
  return loadedConfig.config.site.commentsEnabled === true;
}

function contentPathFor(moduleId, slug) {
  const modulePath = path.join(contentDir, moduleId);
  const filePath = path.join(modulePath, `${slug}.md`);
  if (!filePath.startsWith(contentDir)) {
    throw new Error("Invalid content path.");
  }

  return filePath;
}

function commentsPathFor(moduleId, slug) {
  const filePath = path.resolve(commentsDir, moduleId, `${slug}.json`);
  if (!filePath.startsWith(path.resolve(commentsDir))) {
    throw new Error("Invalid comments path.");
  }

  return filePath;
}

function validCommentTarget(moduleId, slug) {
  return /^[a-z0-9_-]+$/.test(moduleId) && slugify(slug) === slug && Boolean(loadedConfig.config.modules[moduleId]);
}

function readComments(moduleId, slug) {
  const filePath = commentsPathFor(moduleId, slug);
  if (!fs.existsSync(filePath)) return [];
  const comments = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return Array.isArray(comments) ? comments : [];
}

function writeComments(moduleId, slug, comments) {
  const filePath = commentsPathFor(moduleId, slug);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(comments, null, 2));
}

function publicComments(moduleId, slug) {
  return readComments(moduleId, slug).filter((comment) => comment.approved === true && comment.hidden !== true);
}

function allComments() {
  if (!fs.existsSync(commentsDir)) return [];

  return fs
    .readdirSync(commentsDir)
    .flatMap((moduleId) => {
      const modulePath = path.join(commentsDir, moduleId);
      if (!fs.statSync(modulePath).isDirectory()) return [];

      return fs
        .readdirSync(modulePath)
        .filter((fileName) => fileName.endsWith(".json"))
        .flatMap((fileName) => {
          const slug = path.basename(fileName, ".json");
          return readComments(moduleId, slug).map((comment) => ({ moduleId, slug, ...comment }));
        });
    })
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function validateCommentInput(input) {
  const author = String(input.author || "").trim();
  const body = String(input.body || "").trim();
  const errors = [];

  if (!author) errors.push("author is required.");
  if (author.length > 80) errors.push("author must be 80 characters or fewer.");
  if (!body) errors.push("body is required.");
  if (body.length > 2000) errors.push("body must be 2000 characters or fewer.");

  return { author, body, errors };
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
    requiredFieldsForModule(moduleId).forEach((field) => {
      if (!fields[field]) errors.push(`${field} is required for ${moduleId}.`);
    });
    ["date", "updated"].forEach((field) => {
      if (fields[field] && !isDateString(String(fields[field]))) errors.push(`${field} must use YYYY-MM-DD.`);
    });
    if (fields.draft !== undefined && typeof fields.draft !== "boolean") errors.push("draft must be true or false.");
    if (fields.pinned !== undefined && typeof fields.pinned !== "boolean") errors.push("pinned must be true or false.");
    if (fields.priority !== undefined && fields.priority !== "" && !Number.isInteger(Number(fields.priority))) errors.push("priority must be an integer.");
    ["link", "repository", "file", "image", "canonicalUrl"].forEach((field) => {
      if (fields[field] && !isSafeContentUrl(fields[field])) errors.push(`${field} must be a safe URL or relative path.`);
    });
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
  const fieldOrder = [...editableFields, ...Object.keys(normalizedFields).filter((field) => !editableFields.includes(field))];
  const lines = fieldOrder
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

async function handleComments(req, res, url) {
  if (!commentsEnabled()) {
    sendJson(res, 404, { error: "Comments are disabled." });
    return;
  }

  const moduleId = String(url.searchParams.get("module") || "").trim();
  const slug = String(url.searchParams.get("slug") || "").trim();
  if (!validCommentTarget(moduleId, slug)) {
    sendJson(res, 400, { error: "Invalid module or slug." });
    return;
  }

  if (req.method === "GET") {
    sendJson(res, 200, { comments: publicComments(moduleId, slug) });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  const input = await readRequestJson(req);
  const checked = validateCommentInput(input);
  if (checked.errors.length) {
    sendJson(res, 400, { errors: checked.errors });
    return;
  }

  const comments = readComments(moduleId, slug);
  const comment = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    author: checked.author,
    body: checked.body,
    date: new Date().toISOString(),
    approved: false,
    hidden: false,
  };
  comments.push(comment);
  writeComments(moduleId, slug, comments);
  sendJson(res, 200, { ok: true, pending: true });
}

async function handleAdminComments(req, res) {
  if (!adminEditingEnabled()) {
    sendJson(res, 403, { error: "Admin editing is disabled. Set site.adminEditing to true in config." });
    return;
  }

  if (!commentsEnabled()) {
    sendJson(res, 403, { error: "Comments are disabled. Set site.commentsEnabled to true in config." });
    return;
  }

  if (req.method === "GET") {
    sendJson(res, 200, { comments: allComments() });
    return;
  }

  if (req.method !== "PUT") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  const input = await readRequestJson(req);
  const moduleId = String(input.module || "").trim();
  const slug = String(input.slug || "").trim();
  const id = String(input.id || "").trim();

  if (!validCommentTarget(moduleId, slug) || !id) {
    sendJson(res, 400, { error: "Invalid module, slug, or comment id." });
    return;
  }

  const comments = readComments(moduleId, slug);
  const comment = comments.find((entry) => entry.id === id);
  if (!comment) {
    sendJson(res, 404, { error: "Comment not found." });
    return;
  }

  if (input.approved !== undefined) comment.approved = input.approved === true;
  if (input.hidden !== undefined) comment.hidden = input.hidden === true;
  writeComments(moduleId, slug, comments);
  sendJson(res, 200, { ok: true, comments: allComments() });
}

function validateSite() {
  const payload = sitePayload();
  const errors = [];
  const modules = payload.config.modules || {};

  Object.entries(payload.content).forEach(([moduleId, items]) => {
    if (!modules[moduleId]) errors.push(`Unknown content module: ${moduleId}`);

    items.forEach((item) => {
      errors.push(...validateContentFields(moduleId, item, item.source));
      if (item.slug !== slugify(item.slug)) errors.push(`${item.source}: slug is not normalized.`);
    });
  });

  payload.warnings.forEach((warning) => {
    if (warning.type === "duplicate-slug") {
      errors.push(`${warning.module}/${warning.slug}: duplicate slug in ${warning.sources.join(", ")}`);
    }
  });

  return {
    ok: errors.length === 0,
    errors,
    warnings: payload.warnings,
    version,
  };
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
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (a.priority !== b.priority) return b.priority - a.priority;
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
    commentsEnabled: commentsEnabled(),
    commentCount: commentsEnabled() ? allComments().length : 0,
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

function safeThemeAssetPath(urlPath) {
  if (!urlPath.startsWith("/themes/")) return null;
  const cleanPath = decodeURIComponent(urlPath.replace(/^\/themes\//, ""));
  const filePath = path.normalize(path.join(themesDir, cleanPath));
  return filePath.startsWith(themesDir) ? filePath : null;
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
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);

      if (url.pathname === "/health") {
        const validation = validateSite();
        sendJson(res, validation.ok ? 200 : 500, {
          ok: validation.ok,
          version,
          configSource: loadedConfig.source,
          errors: validation.errors,
        });
        return;
      }

      if (url.pathname === "/api/site") {
        sendJson(res, 200, sitePayload());
        return;
      }

      if (url.pathname === "/api/comments") {
        await handleComments(req, res, url);
        return;
      }

      if (url.pathname === "/api/admin/content") {
        await handleAdminContent(req, res, url);
        return;
      }

      if (url.pathname === "/api/admin/comments") {
        await handleAdminComments(req, res);
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

      const themeFilePath = safeThemeAssetPath(url.pathname);
      if (themeFilePath && fs.existsSync(themeFilePath) && !fs.statSync(themeFilePath).isDirectory()) {
        const ext = path.extname(themeFilePath).toLowerCase();
        send(res, 200, fs.readFileSync(themeFilePath), mimeTypes[ext] || "application/octet-stream");
        return;
      }

      const filePath = safePublicPath(url.pathname);
      if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        sendError(res, 404, "Not found", "The requested page or file does not exist.");
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      send(res, 200, fs.readFileSync(filePath), mimeTypes[ext] || "application/octet-stream");
    } catch (error) {
      console.error(error);
      sendError(res, 500, "Server error", "The server could not complete the request.");
    }
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
  allContentFieldNames,
  contentDir,
  createServer,
  escapeXml,
  jsonFeed,
  loadedConfig,
  parseMarkdownFile,
  publicDir,
  root,
  rssFeed,
  serializeMarkdown,
  sitePayload,
  slugify,
  startServer,
  themesDir,
  validateContentFields,
  validateSite,
  version,
};
