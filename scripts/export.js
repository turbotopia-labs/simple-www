const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const {
  absoluteUrl,
  escapeXml,
  exportDir,
  jsonFeed,
  loadedConfig,
  mediaDir,
  mediaPayload,
  publicDir,
  root,
  rssFeed,
  buildAnalyticsExport,
  buildSearchIndex,
  collectionsPayload,
  collectionUrl,
  sitePayload,
  themesDir,
} = require("../server");

const distDir = exportDir;
const dataDir = path.join(distDir, "data");
const feedsDir = path.join(distDir, "feeds");
const rssDir = path.join(distDir, "rss");

function ensureInsideRoot(targetPath) {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(targetPath);
  if (!resolvedTarget.startsWith(resolvedRoot)) {
    throw new Error(`Refusing to write outside project root: ${resolvedTarget}`);
  }
}

function writeFile(filePath, content) {
  ensureInsideRoot(filePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function copyPublic() {
  ensureInsideRoot(distDir);
  fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(distDir, { recursive: true });
  fs.cpSync(publicDir, distDir, { recursive: true });
  if (fs.existsSync(themesDir)) {
    fs.cpSync(themesDir, path.join(distDir, "themes"), { recursive: true });
  }
  if (fs.existsSync(mediaDir)) {
    fs.cpSync(mediaDir, path.join(distDir, "media"), { recursive: true });
  }
}

function patchIndexForStaticData() {
  const indexPath = path.join(distDir, "index.html");
  const html = fs.readFileSync(indexPath, "utf8");
  const staticDataScript = '    <script>window.SIMPLE_WWW_DATA_PATH = "data/site.json"; window.SIMPLE_WWW_SEARCH_INDEX_PATH = "data/search-index.json"; window.SIMPLE_WWW_MEDIA_PATH = "data/media.json";</script>\n';
  writeFile(indexPath, html.replace("    <script src=\"app.js\"></script>", `${staticDataScript}    <script src="app.js"></script>`));
}

function sitemapXml(payload) {
  const site = payload.config.site;
  const baseUrl = String(site.baseUrl || "").replace(/\/+$/, "");
  const urls = [baseUrl || "http://127.0.0.1:6625"];

  Object.entries(payload.content).forEach(([moduleId, items]) => {
    urls.push(`${baseUrl}/#/${encodeURIComponent(moduleId)}`);
    items.forEach((item) => {
      urls.push(absoluteUrl(baseUrl, moduleId, item));
    });
  });
  Object.entries(payload.collections || {}).forEach(([collectionId, collection]) => {
    urls.push(`${baseUrl}/#/collections/${encodeURIComponent(collectionId)}`);
    collection.items.forEach((item) => {
      urls.push(collectionUrl(baseUrl, collectionId, item));
    });
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((url) => `  <url>
    <loc>${escapeXml(url)}</loc>
  </url>`)
  .join("\n")}
</urlset>
`;
}

function robotsTxt(payload) {
  const baseUrl = String(payload.config.site.baseUrl || "").replace(/\/+$/, "");
  return `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;
}

function notFoundHtml(payload) {
  return `<!doctype html>
<html lang="${payload.config.site.language}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>404 Not found</title>
    <link rel="stylesheet" href="styles.css">
  </head>
  <body>
    <main class="layout" data-layout="list">
      <section class="card">
        <h1>404 Not found</h1>
        <p>The requested page or file does not exist.</p>
        <p><a href="index.html">Back to site</a></p>
      </section>
    </main>
  </body>
</html>`;
}

function hookPayload(payload) {
  return {
    version: payload.version,
    exportedAt: new Date().toISOString(),
    exportDir: distDir,
    configSource: loadedConfig.source,
    site: {
      title: payload.config.site.title,
      baseUrl: payload.config.site.baseUrl,
    },
    counts: {
      content: payload.diagnostics.contentItemCount,
      collections: payload.diagnostics.collectionItemCount,
      media: payload.diagnostics.mediaItemCount,
    },
  };
}

function runCommandHook(command, context, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      cwd: root,
      shell: true,
      windowsHide: true,
      env: {
        ...process.env,
        SIMPLE_WWW_VERSION: context.version,
        SIMPLE_WWW_EXPORT_DIR: context.exportDir,
        SIMPLE_WWW_CONFIG_SOURCE: context.configSource,
      },
      timeout: timeoutMs,
    });
    let output = "";

    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve(output.trim());
        return;
      }
      reject(new Error(`command exited with ${code}: ${command}${output.trim() ? `\n${output.trim()}` : ""}`));
    });
  });
}

async function runWebhookHook(webhook, context, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(webhook.url, {
      method: String(webhook.method || "POST").toUpperCase(),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(context),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`webhook returned HTTP ${response.status}: ${webhook.url}`);
  } finally {
    clearTimeout(timer);
  }
}

async function runExportHooks(payload) {
  const hooks = payload.config.exportHooks || {};
  if (hooks.enabled !== true) return;

  const context = hookPayload(payload);
  const timeoutMs = Number.isInteger(hooks.timeoutMs) ? hooks.timeoutMs : 30000;
  const failures = [];

  for (const command of hooks.commands || []) {
    try {
      await runCommandHook(command, context, timeoutMs);
      console.log(`Export hook command OK: ${command}`);
    } catch (error) {
      failures.push(error.message);
      console.warn(`Export hook command failed: ${error.message}`);
    }
  }

  for (const webhook of hooks.webhooks || []) {
    try {
      await runWebhookHook(webhook, context, timeoutMs);
      console.log(`Export hook webhook OK: ${webhook.url}`);
    } catch (error) {
      failures.push(error.message);
      console.warn(`Export hook webhook failed: ${error.message}`);
    }
  }

  if (failures.length && hooks.failOnError === true) {
    throw new Error(`Export hooks failed:\n- ${failures.join("\n- ")}`);
  }
}

async function exportSite() {
  const payload = sitePayload();

  copyPublic();
  patchIndexForStaticData();

  writeFile(path.join(dataDir, "site.json"), JSON.stringify(payload, null, 2));
  writeFile(path.join(dataDir, "search-index.json"), JSON.stringify(buildSearchIndex(payload), null, 2));
  writeFile(path.join(dataDir, "media.json"), JSON.stringify(mediaPayload(), null, 2));
  writeFile(path.join(dataDir, "collections.json"), JSON.stringify({ version: payload.version, collections: collectionsPayload() }, null, 2));
  writeFile(path.join(dataDir, "analytics.json"), JSON.stringify(buildAnalyticsExport(payload), null, 2));
  writeFile(path.join(distDir, "feed.json"), JSON.stringify(jsonFeed(), null, 2));
  writeFile(path.join(distDir, "feeds.json"), JSON.stringify(jsonFeed(), null, 2));
  writeFile(path.join(feedsDir, "news.json"), JSON.stringify(jsonFeed("news"), null, 2));
  writeFile(path.join(feedsDir, "blog.json"), JSON.stringify(jsonFeed("blog"), null, 2));
  writeFile(path.join(feedsDir, "news.xml"), rssFeed("news"));
  writeFile(path.join(feedsDir, "blog.xml"), rssFeed("blog"));
  writeFile(path.join(rssDir, "news.xml"), rssFeed("news"));
  writeFile(path.join(rssDir, "blog.xml"), rssFeed("blog"));
  writeFile(path.join(distDir, "sitemap.xml"), sitemapXml(payload));
  writeFile(path.join(distDir, "robots.txt"), robotsTxt(payload));
  writeFile(path.join(distDir, "404.html"), notFoundHtml(payload));

  console.log(`Exported ${payload.version} to ${distDir}`);
  console.log(`Config: ${loadedConfig.source}`);
  await runExportHooks(payload);
}

exportSite().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
