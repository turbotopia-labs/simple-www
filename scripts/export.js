const fs = require("fs");
const path = require("path");

const {
  absoluteUrl,
  escapeXml,
  jsonFeed,
  loadedConfig,
  publicDir,
  root,
  rssFeed,
  sitePayload,
} = require("../server");

const distDir = path.join(root, "dist");
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
}

function patchIndexForStaticData() {
  const indexPath = path.join(distDir, "index.html");
  const html = fs.readFileSync(indexPath, "utf8");
  const staticDataScript = '    <script>window.SIMPLE_WWW_DATA_PATH = "data/site.json";</script>\n';
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

function exportSite() {
  const payload = sitePayload();

  copyPublic();
  patchIndexForStaticData();

  writeFile(path.join(dataDir, "site.json"), JSON.stringify(payload, null, 2));
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

  console.log(`Exported ${payload.version} to ${distDir}`);
  console.log(`Config: ${loadedConfig.source}`);
}

exportSite();
