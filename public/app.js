const app = document.querySelector("#app");
const nav = document.querySelector("#module-nav");
const title = document.querySelector("#site-title");
const description = document.querySelector("#site-description");
const themeToggle = document.querySelector("#theme-toggle");
const themePack = document.querySelector("#theme-pack");
const footerLabel = document.querySelector("#site-footer-label");
const footerDonate = document.querySelector("#site-footer-donate");
const footerContact = document.querySelector("#site-footer-contact");
const donateOverlay = document.querySelector("#donate-overlay");
const donateDetails = document.querySelector("#donate-details");
const donateClose = document.querySelector("#donate-close");
const layoutButtons = document.querySelectorAll("[data-layout]");
const siteSearch = document.querySelector("#site-search");
const siteLanguage = document.querySelector("#site-language");
const siteLanguageLabel = document.querySelector(".header-language");

let state = {
  activeModule: "",
  modules: {},
  content: {},
  collections: {},
  languages: ["en"],
  language: "en",
  searchIndex: [],
  diagnostics: {},
  warnings: [],
  commentsEnabled: false,
  storePaymentsEnabled: false,
  layout: "cards",
  filterType: "all",
  filterValue: "",
  itemSlug: "",
  search: "",
  adminMessage: "",
  adminContent: {},
  adminAccountsEnabled: false,
  adminToken: localStorage.getItem("simple-www-admin-token") || "",
  activeCollection: "",
  media: [],
  donateBitcoinAddress: "",
  donateEthereumAddress: "",
};
let searchTimer;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeUrl(value) {
  const url = String(value || "").trim();
  if (/^(https?:|mailto:|\/|#|\.\.?\/)/i.test(url)) return url;
  if (/^[a-z0-9./_-]+$/i.test(url)) return url;
  return "#";
}

function tokenStore() {
  const tokens = [];
  return {
    add(html) {
      const key = `@@TOKEN${tokens.length}@@`;
      tokens.push({ key, html });
      return key;
    },
    restore(html) {
      return tokens.reduce((value, token) => value.replaceAll(token.key, token.html), html);
    },
  };
}

function inlineMarkdown(value) {
  const store = tokenStore();
  let text = String(value || "");

  text = text.replace(/`([^`]+)`/g, (_, code) => store.add(`<code>${escapeHtml(code)}</code>`));
  text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]+)")?\)/g, (_, alt, src, title) => {
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
    return store.add(`<img src="${escapeHtml(safeUrl(src))}" alt="${escapeHtml(alt)}"${titleAttr}>`);
  });
  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]+)")?\)/g, (_, label, href, title) => {
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
    return store.add(`<a href="${escapeHtml(safeUrl(href))}"${titleAttr}>${escapeHtml(label)}</a>`);
  });

  let html = escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/_([^_]+)_/g, "<em>$1</em>")
    .replace(/~~([^~]+)~~/g, "<del>$1</del>");

  return store.restore(html);
}

function isTableSeparator(line) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function tableCells(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function renderTable(lines) {
  const header = tableCells(lines[0]);
  const rows = lines.slice(2).map(tableCells);
  return `
    <table>
      <thead><tr>${header.map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${inlineMarkdown(cell)}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>
  `;
}

function markdownToHtml(markdown) {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    const fence = trimmed.match(/^```(\w+)?\s*$/);
    if (fence) {
      const code = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        code.push(lines[i]);
        i += 1;
      }
      i += 1;
      const language = fence[1] ? ` class="language-${escapeHtml(fence[1])}"` : "";
      html.push(`<pre><code${language}>${escapeHtml(code.join("\n"))}</code></pre>`);
      continue;
    }

    if (lines[i + 1] && isTableSeparator(lines[i + 1])) {
      const tableLines = [lines[i], lines[i + 1]];
      i += 2;
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        tableLines.push(lines[i]);
        i += 1;
      }
      html.push(renderTable(tableLines));
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = Math.min(6, heading[1].length);
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      i += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      html.push("<hr>");
      i += 1;
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      const quote = [];
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        quote.push(lines[i].trim().replace(/^>\s?/, ""));
        i += 1;
      }
      html.push(`<blockquote>${markdownToHtml(quote.join("\n"))}</blockquote>`);
      continue;
    }

    const unordered = trimmed.match(/^[-*+]\s+(.+)$/);
    const ordered = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (unordered || ordered) {
      const tag = unordered ? "ul" : "ol";
      const items = [];
      while (i < lines.length) {
        const item = lines[i].trim().match(unordered ? /^[-*+]\s+(.+)$/ : /^\d+[.)]\s+(.+)$/);
        if (!item) break;
        items.push(`<li>${inlineMarkdown(item[1])}</li>`);
        i += 1;
      }
      html.push(`<${tag}>${items.join("")}</${tag}>`);
      continue;
    }

    const paragraph = [trimmed];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,6})\s+/.test(lines[i].trim()) &&
      !/^([-*+]|\d+[.)])\s+/.test(lines[i].trim()) &&
      !/^>\s?/.test(lines[i].trim()) &&
      !/^```/.test(lines[i].trim()) &&
      !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim())
    ) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
  }

  return html.join("");
}

function enabledModuleIds() {
  return Object.keys(state.modules)
    .filter((moduleId) => state.modules[moduleId].enabled)
    .sort((a, b) => state.modules[a].order - state.modules[b].order);
}

function collectionIds() {
  return Object.keys(state.collections || {}).sort((a, b) => {
    const left = state.collections[a]?.label || a;
    const right = state.collections[b]?.label || b;
    return left.localeCompare(right);
  });
}

function routeFromHash() {
  const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  if (parts[0] === "donate") {
    return { donate: true };
  }
  if (parts[0] === "search") {
    return { moduleId: "", filterType: "all", filterValue: "", itemSlug: "", search: parts.slice(1).join("/") };
  }
  if (parts[0] === "preview") {
    return { moduleId: parts[1] || "", filterType: "all", filterValue: "", itemSlug: parts[2] || "", search: "", preview: true };
  }
  if (parts[0] === "collections") {
    return { moduleId: "", collectionId: parts[1] || "", collectionSlug: parts[2] || "", filterType: "all", filterValue: "", itemSlug: "", search: "" };
  }

  const moduleId = parts[0] || "";
  const itemSlug = parts[1] && !["category", "tag", "archive"].includes(parts[1]) ? parts[1] : "";
  const filterType = itemSlug ? "all" : ["category", "tag", "archive"].includes(parts[1]) ? parts[1] : "all";
  const filterValue = filterType === "all" ? "" : parts[2] || "";

  return { moduleId, filterType, filterValue, itemSlug, search: "" };
}

function setRouteHash(moduleId, filterType = "all", filterValue = "") {
  const encodedModule = encodeURIComponent(moduleId);
  if (filterType === "all" || !filterValue) {
    location.hash = `/${encodedModule}`;
    return;
  }

  location.hash = `/${encodedModule}/${encodeURIComponent(filterType)}/${encodeURIComponent(filterValue)}`;
}

function setItemHash(moduleId, slug) {
  location.hash = `/${encodeURIComponent(moduleId)}/${encodeURIComponent(slug)}`;
}

function setCollectionHash(collectionId, slug = "") {
  location.hash = slug ? `/collections/${encodeURIComponent(collectionId)}/${encodeURIComponent(slug)}` : `/collections/${encodeURIComponent(collectionId)}`;
}

function setSearchHash(query) {
  const trimmed = String(query || "").trim();
  const fallback = state.activeCollection ? `/collections/${encodeURIComponent(state.activeCollection)}` : `/${encodeURIComponent(state.activeModule || enabledModuleIds()[0] || "")}`;
  location.hash = trimmed ? `/search/${encodeURIComponent(trimmed)}` : fallback;
}

function applyRoute(route) {
  if (route.donate) {
    openDonateOverlay();
    return true;
  }

  if (route.search) {
    state.filterType = "all";
    state.filterValue = "";
    state.itemSlug = "";
    state.search = route.search;
    state.activeCollection = "";
    renderSearch();
    return true;
  }

  if (route.collectionId) {
    state.filterType = "all";
    state.filterValue = "";
    state.itemSlug = "";
    state.activeModule = "";
    state.activeCollection = route.collectionId;
    state.search = "";
    siteSearch.value = "";
    route.collectionSlug ? renderCollectionDetail(route.collectionId, route.collectionSlug) : renderCollection(route.collectionId);
    return true;
  }

  if (!route.moduleId || !state.modules[route.moduleId]) return false;

  if (route.preview && route.itemSlug) {
    renderPreview(route.moduleId, route.itemSlug);
    return true;
  }

  state.filterType = route.filterType;
  state.filterValue = route.filterValue;
  state.itemSlug = route.itemSlug;
  state.activeCollection = "";
  state.search = "";
  siteSearch.value = "";
  if (route.itemSlug) {
    renderDetail(route.moduleId, route.itemSlug);
  } else {
    renderModule(route.moduleId);
  }
  return true;
}

function renderNav() {
  const moduleButtons = enabledModuleIds()
    .map((moduleId) => {
      const module = state.modules[moduleId];
      const current = moduleId === state.activeModule ? ' aria-current="page"' : "";
      return `<button type="button" data-module="${escapeHtml(moduleId)}"${current}>${escapeHtml(module.label)}</button>`;
    })
    .join("");
  const collectionButtons = collectionIds()
    .map((collectionId) => {
      const collection = state.collections[collectionId];
      const current = collectionId === state.activeCollection ? ' aria-current="page"' : "";
      return `<button type="button" data-collection="${escapeHtml(collectionId)}"${current}>${escapeHtml(collection.label)}</button>`;
    })
    .join("");
  nav.innerHTML = moduleButtons + collectionButtons;
}

function detailList(details) {
  const rows = details.filter((detail) => detail.value || detail.html);
  if (!rows.length) return "";

  return `
    <dl class="details">
      ${rows.map((detail) => `<div${detail.className ? ` class="${escapeHtml(detail.className)}"` : ""}><dt>${escapeHtml(detail.label)}</dt><dd>${detail.html || escapeHtml(detail.value)}</dd></div>`).join("")}
    </dl>
  `;
}

function moduleFieldRows(moduleId, item, viewName) {
  const module = state.modules[moduleId] || {};
  const fields = Array.isArray(module.fields) ? module.fields : [];
  const explicitView = Array.isArray(module.views?.[viewName]) ? module.views[viewName] : [];
  const selected = explicitView.length ? explicitView : fields.filter((field) => field[viewName]).map((field) => field.name);

  return selected
    .map((fieldName) => {
      const field = fields.find((entry) => entry.name === fieldName) || { name: fieldName, label: fieldName };
      const value = Array.isArray(item[fieldName]) ? item[fieldName].join(", ") : item[fieldName];
      return { label: field.label || field.name, value };
    })
    .filter((row) => row.value !== undefined && row.value !== "");
}

function actionLink(href, label) {
  if (!href) return "";
  return `<p class="action-link"><a href="${escapeHtml(safeUrl(href))}">${escapeHtml(label)}</a></p>`;
}

function repositoryIconLink(href) {
  if (!href) return "";
  return `
    <a class="repo-icon-link" href="${escapeHtml(safeUrl(href))}" title="GitHub repository" aria-label="GitHub repository">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 .7a11.3 11.3 0 0 0-3.6 22c.6.1.8-.2.8-.5v-2c-3.3.7-4-1.4-4-1.4-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.6.1-3.2 0 0 1-.3 3.3 1.2a11.4 11.4 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.3 2.9.1 3.2.8.9 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.2c0 .3.2.6.8.5A11.3 11.3 0 0 0 12 .7Z"></path>
      </svg>
    </a>
  `;
}

function untappdIconLink(href) {
  if (!href) return "";
  return `
    <a class="untappd-icon-link" href="${escapeHtml(safeUrl(href))}" title="Untappd beer profile" aria-label="Untappd beer profile">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect x="2" y="2" width="20" height="20" rx="4"></rect>
        <path d="M8.1 7.2h3.2l-1.4 9.6H6.7L8.1 7.2Zm4.6 0h3.2l1.4 9.6h-3.2L12.7 7.2Zm-3.2 2.1 5 5m.1-5.1-5.2 5.1"></path>
      </svg>
    </a>
  `;
}

function projectStatusDetail(item) {
  return {
    label: "Status",
    className: "status-detail",
    html: `<span class="status-with-repo">${escapeHtml(item.status || "")}${repositoryIconLink(item.repository)}</span>`,
  };
}

function beerRatingDetail(item) {
  if (item.category !== "beer-rating" || !item.rating) return null;
  const rating = Math.max(1, Math.min(5, Number(item.rating) || 0));
  const percentage = (rating / 5) * 100;
  return {
    label: "Rating",
    className: "rating-detail",
    html: `
      <span class="beer-rating">
        <span class="rating-bar" aria-label="${escapeHtml(`${rating.toFixed(2)} out of 5`)}">
          <span style="width: ${percentage}%"></span>
        </span>
        <span>${escapeHtml(rating.toFixed(2))}/5</span>
        ${untappdIconLink(item.untappd)}
      </span>
    `,
  };
}

function progressParts(item) {
  let from = item.progressFrom;
  let to = item.progressTo;
  let current = item.progressCurrent;
  if (!(from && to && current) && item.progress) {
    const versions = String(item.progress).match(/\d+\.\d+\.\d+/g) || [];
    [from, to, current] = versions;
  }
  return from && to && current ? { from, to, current } : null;
}

function versionProgressScore(version) {
  const [major, minor, patch] = String(version || "").split(".").map(Number);
  return major * 10 + minor + patch / 100;
}

function roadmapProgressDetail(item) {
  const progress = progressParts(item);
  if (!progress) return null;
  const fromScore = versionProgressScore(progress.from);
  const toScore = versionProgressScore(progress.to);
  const currentScore = versionProgressScore(progress.current);
  const percentage = toScore === fromScore ? 100 : Math.max(0, Math.min(100, ((currentScore - fromScore) / (toScore - fromScore)) * 100));
  return {
    label: "Progress",
    className: "progress-detail",
    html: `
      <span class="roadmap-progress">
        <span class="progress-bar" aria-label="${escapeHtml(`${Math.round(percentage)} percent`)}">
          <span style="width: ${percentage}%"></span>
        </span>
        <span class="progress-versions">${escapeHtml(`${progress.current} / ${progress.to}`)}</span>
      </span>
    `,
  };
}

function stripMarkdown(markdown) {
  return String(markdown || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function itemSummary(item) {
  const summary = item.summary || stripMarkdown(item.body);
  return summary.length > 180 ? `${summary.slice(0, 177).trim()}...` : summary;
}

function itemActions(moduleId, item) {
  const canonical = actionLink(item.canonicalUrl, "Canonical URL");

  if (moduleId === "projects") {
    return [actionLink(item.link, "Project link"), canonical].join("");
  }

  if (moduleId === "downloads") {
    return [actionLink(item.file, "Download file"), actionLink(item.link, "More info"), canonical].join("");
  }

  if (moduleId === "store") {
    const checkout = state.storePaymentsEnabled ? actionLink(item.checkoutUrl, "Checkout") : "";
    return [actionLink(item.link, "Product link"), checkout, canonical].join("");
  }

  return canonical;
}

function footerText(site, version) {
  return String(site.footerText || "simple-www v.{VERSION}").replaceAll("{VERSION}", version || "");
}

function setFooterContact(email) {
  const value = String(email || "").trim();
  footerContact.hidden = !value;
  footerContact.href = value ? `mailto:${value}` : "";
}

function donationRows() {
  const rows = [
    { label: "Bitcoin", value: state.donateBitcoinAddress },
    { label: "Ethereum", value: state.donateEthereumAddress },
  ].filter((row) => row.value);

  if (!rows.length) return '<p class="empty">Adresses not set</p>';

  return `
    <dl>
      ${rows.map((row) => `<div><dt>${escapeHtml(row.label)}</dt><dd><code>${escapeHtml(row.value)}</code></dd></div>`).join("")}
    </dl>
    <div class="donate-warning">
      <h3>Before sending</h3>
      <ul>
        <li>Send only the matching currency to each address.</li>
        <li>Check the full address before confirming the transaction.</li>
        <li>Crypto transactions are normally irreversible.</li>
        <li>Start with a small test transfer if the amount matters.</li>
        <li>Network fees are paid by the sender.</li>
      </ul>
    </div>
  `;
}

function openDonateOverlay() {
  donateDetails.innerHTML = donationRows();
  donateOverlay.hidden = false;
  donateClose.focus();
}

function closeDonateOverlay() {
  donateOverlay.hidden = true;
  footerDonate.focus();
}

function itemInLanguage(item) {
  return !item.lang || item.lang === state.language;
}

function languageFilteredItems(items) {
  return (items || []).filter(itemInLanguage);
}

function themePackHref(themeName) {
  const safeName = /^[a-z0-9_-]+$/i.test(String(themeName || "")) ? themeName : "classic";
  return `themes/${safeName}.css`;
}

function itemImage(item) {
  if (!item.image) return "";
  return `<img class="entry-image" src="${escapeHtml(safeUrl(item.image))}" alt="${escapeHtml(item.imageAlt || item.title || "")}">`;
}

function renderCommentsShell(moduleId, slug) {
  if (!state.commentsEnabled) return "";
  return `
    <section class="card comments-card" data-comments-for="${escapeHtml(moduleId)}:${escapeHtml(slug)}">
      <h2>Comments</h2>
      <div id="comments-list"><p class="empty">Loading comments...</p></div>
      <form id="comment-form" class="comment-form" data-module="${escapeHtml(moduleId)}" data-slug="${escapeHtml(slug)}">
        <label>Author<input name="author" maxlength="80" required></label>
        <label>Comment<textarea name="body" rows="4" maxlength="2000" required></textarea></label>
        <div class="form-actions"><button type="submit">Submit for review</button></div>
      </form>
      <p id="comment-message" class="admin-message"></p>
    </section>
  `;
}

function renderComments(comments) {
  if (!comments.length) return '<p class="empty">No approved comments yet.</p>';
  return comments
    .map((comment) => `
      <article class="comment">
        <div class="meta">${escapeHtml([comment.author, comment.date ? comment.date.slice(0, 10) : ""].filter(Boolean).join(" / "))}</div>
        <p>${escapeHtml(comment.body)}</p>
      </article>
    `)
    .join("");
}

async function loadComments(moduleId, slug) {
  if (!state.commentsEnabled) return;
  const list = document.querySelector("#comments-list");
  if (!list) return;
  try {
    const response = await fetch(`/api/comments?module=${encodeURIComponent(moduleId)}&slug=${encodeURIComponent(slug)}`);
    const result = await response.json();
    list.innerHTML = renderComments(result.comments || []);
  } catch (error) {
    list.innerHTML = `<p class="empty">${escapeHtml(error.message)}</p>`;
  }
}

function editableModuleIds() {
  return enabledModuleIds().filter((moduleId) => moduleId !== "admin");
}

function emptyAdminFields(moduleId = editableModuleIds()[0] || "news") {
  return {
    module: moduleId,
    slug: "",
    title: "",
    date: "",
    lang: "",
    translationKey: "",
    category: "general",
    summary: "",
    tags: "",
    updated: "",
    author: "",
    image: "",
    imageAlt: "",
    pinned: false,
    priority: "",
    canonicalUrl: "",
    draft: false,
    publishAt: "",
    status: "",
    link: "",
    repository: "",
    untappd: "",
    rating: "",
    progress: "",
    progressFrom: "",
    progressTo: "",
    progressCurrent: "",
    file: "",
    version: "",
    sku: "",
    price: "",
    checkoutUrl: "",
    paymentProvider: "",
    paymentProviderProductId: "",
    paymentProviderPriceId: "",
    body: "",
  };
}

function adminForm(values = emptyAdminFields()) {
  const moduleOptions = editableModuleIds()
    .map((moduleId) => `<option value="${escapeHtml(moduleId)}"${moduleId === values.module ? " selected" : ""}>${escapeHtml(state.modules[moduleId].label)}</option>`)
    .join("");

  return `
    <section class="card">
      <h2>Content editor</h2>
      <form id="admin-form" class="admin-form">
        <label>Module<select name="module">${moduleOptions}</select></label>
        <label>Slug<input name="slug" value="${escapeHtml(values.slug)}" required></label>
        <label>Title<input name="title" value="${escapeHtml(values.title)}" required></label>
        <label>Date<input name="date" value="${escapeHtml(values.date)}" placeholder="YYYY-MM-DD"></label>
        <label>Language<input name="lang" value="${escapeHtml(values.lang)}" placeholder="${escapeHtml(state.language)}"></label>
        <label>Translation key<input name="translationKey" value="${escapeHtml(values.translationKey)}"></label>
        <label>Category<input name="category" value="${escapeHtml(values.category)}"></label>
        <label>Summary<input name="summary" value="${escapeHtml(values.summary)}"></label>
        <label>Tags<input name="tags" value="${escapeHtml(values.tags)}" placeholder="one, two"></label>
        <label>Updated<input name="updated" value="${escapeHtml(values.updated)}" placeholder="YYYY-MM-DD"></label>
        <label>Author<input name="author" value="${escapeHtml(values.author)}"></label>
        <label>Image<input name="image" value="${escapeHtml(values.image)}"></label>
        <label>Image alt<input name="imageAlt" value="${escapeHtml(values.imageAlt)}"></label>
        <label class="checkbox-label"><input name="pinned" type="checkbox"${values.pinned ? " checked" : ""}> Pinned</label>
        <label>Priority<input name="priority" value="${escapeHtml(values.priority)}" placeholder="0"></label>
        <label>Canonical URL<input name="canonicalUrl" value="${escapeHtml(values.canonicalUrl)}"></label>
        <label class="checkbox-label"><input name="draft" type="checkbox"${values.draft ? " checked" : ""}> Draft</label>
        <label>Publish at<input name="publishAt" value="${escapeHtml(values.publishAt)}" placeholder="YYYY-MM-DD or ISO date/time"></label>
        <label>Status<input name="status" value="${escapeHtml(values.status)}"></label>
        <label>Link<input name="link" value="${escapeHtml(values.link)}"></label>
        <label>Repository<input name="repository" value="${escapeHtml(values.repository)}"></label>
        <label>Untappd<input name="untappd" value="${escapeHtml(values.untappd)}"></label>
        <label>Rating<input name="rating" value="${escapeHtml(values.rating)}" placeholder="1.00-5.00"></label>
        <label>Progress<input name="progress" value="${escapeHtml(values.progress)}" placeholder="0.1.0, 1.0.0, 0.3.0"></label>
        <label>Progress from<input name="progressFrom" value="${escapeHtml(values.progressFrom)}" placeholder="0.1.0"></label>
        <label>Progress to<input name="progressTo" value="${escapeHtml(values.progressTo)}" placeholder="1.0.0"></label>
        <label>Progress current<input name="progressCurrent" value="${escapeHtml(values.progressCurrent)}" placeholder="0.3.0"></label>
        <label>File<input name="file" value="${escapeHtml(values.file)}"></label>
        <label>Version<input name="version" value="${escapeHtml(values.version)}"></label>
        <label>SKU<input name="sku" value="${escapeHtml(values.sku)}"></label>
        <label>Price<input name="price" value="${escapeHtml(values.price)}"></label>
        <label>Checkout URL<input name="checkoutUrl" value="${escapeHtml(values.checkoutUrl)}"></label>
        <label>Payment provider<input name="paymentProvider" value="${escapeHtml(values.paymentProvider)}"></label>
        <label>Provider product ID<input name="paymentProviderProductId" value="${escapeHtml(values.paymentProviderProductId)}"></label>
        <label>Provider price ID<input name="paymentProviderPriceId" value="${escapeHtml(values.paymentProviderPriceId)}"></label>
        <label class="full-row">Body<textarea name="body" rows="10">${escapeHtml(values.body)}</textarea></label>
        <div class="form-actions">
          <button type="button" data-admin-action="new">New</button>
          <button type="submit" data-admin-action="create">Create</button>
          <button type="submit" data-admin-action="edit">Save</button>
          <button type="button" data-admin-action="delete">Delete</button>
          ${values.slug ? `<a href="#/preview/${escapeHtml(values.module)}/${escapeHtml(values.slug)}">Preview</a>` : ""}
        </div>
      </form>
      ${state.adminMessage ? `<p class="admin-message">${escapeHtml(state.adminMessage)}</p>` : ""}
    </section>
  `;
}

function formValues(form) {
  return {
    module: form.elements.module.value,
    slug: form.elements.slug.value.trim(),
    fields: {
      title: form.elements.title.value.trim(),
      date: form.elements.date.value.trim(),
      lang: form.elements.lang.value.trim(),
      translationKey: form.elements.translationKey.value.trim(),
      category: form.elements.category.value.trim(),
      summary: form.elements.summary.value.trim(),
      tags: form.elements.tags.value.split(",").map((tag) => tag.trim()).filter(Boolean),
      updated: form.elements.updated.value.trim(),
      author: form.elements.author.value.trim(),
      image: form.elements.image.value.trim(),
      imageAlt: form.elements.imageAlt.value.trim(),
      pinned: form.elements.pinned.checked,
      priority: form.elements.priority.value.trim(),
      canonicalUrl: form.elements.canonicalUrl.value.trim(),
      draft: form.elements.draft.checked,
      publishAt: form.elements.publishAt.value.trim(),
      status: form.elements.status.value.trim(),
      link: form.elements.link.value.trim(),
      repository: form.elements.repository.value.trim(),
      untappd: form.elements.untappd.value.trim(),
      rating: form.elements.rating.value.trim(),
      progress: form.elements.progress.value.trim(),
      progressFrom: form.elements.progressFrom.value.trim(),
      progressTo: form.elements.progressTo.value.trim(),
      progressCurrent: form.elements.progressCurrent.value.trim(),
      file: form.elements.file.value.trim(),
      version: form.elements.version.value.trim(),
      sku: form.elements.sku.value.trim(),
      price: form.elements.price.value.trim(),
      checkoutUrl: form.elements.checkoutUrl.value.trim(),
      paymentProvider: form.elements.paymentProvider.value.trim(),
      paymentProviderProductId: form.elements.paymentProviderProductId.value.trim(),
      paymentProviderPriceId: form.elements.paymentProviderPriceId.value.trim(),
    },
    body: form.elements.body.value,
  };
}

function valuesFromItem(moduleId, item) {
  return {
    module: moduleId,
    slug: item.slug,
    title: item.title,
    date: item.date,
    lang: item.lang,
    translationKey: item.translationKey,
    category: item.category,
    summary: item.summary,
    tags: (item.tags || []).join(", "),
    updated: item.updated,
    author: item.author,
    image: item.image,
    imageAlt: item.imageAlt,
    pinned: item.pinned,
    priority: item.priority === 0 ? "" : item.priority,
    canonicalUrl: item.canonicalUrl,
    draft: item.draft,
    publishAt: item.publishAt,
    status: item.status,
    link: item.link,
    repository: item.repository,
    untappd: item.untappd,
    rating: item.rating,
    progress: item.progress,
    progressFrom: item.progressFrom,
    progressTo: item.progressTo,
    progressCurrent: item.progressCurrent,
    file: item.file,
    version: item.version,
    sku: item.sku,
    price: item.price,
    checkoutUrl: item.checkoutUrl,
    paymentProvider: item.paymentProvider,
    paymentProviderProductId: item.paymentProviderProductId,
    paymentProviderPriceId: item.paymentProviderPriceId,
    body: item.body,
  };
}

function editorialStatus(item) {
  if (item.draft) return "draft";
  if (item.publishAt && Date.parse(item.publishAt) > Date.now()) return "scheduled";
  return "published";
}

async function loadAdminContentList() {
  try {
    const response = await fetch("/api/admin/content", { headers: adminAuthHeaders() });
    const result = await response.json();
    state.adminContent = result.content || {};
    const list = document.querySelector("#admin-content-list");
    if (list) list.innerHTML = adminContentList();
  } catch (error) {
    const list = document.querySelector("#admin-content-list");
    if (list) list.innerHTML = `<section class="card"><p class="empty">${escapeHtml(error.message)}</p></section>`;
  }
}

function formatBytes(bytes) {
  const size = Number(bytes) || 0;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function renderMediaLibrary() {
  const items = state.media || [];
  return `
    <section class="card">
      <h2>Media library</h2>
      ${
        items.length
          ? `<ul class="admin-list media-list">${items.map((item) => `
              <li>
                <a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">${escapeHtml(item.path)}</a>
                <span class="meta">${escapeHtml([formatBytes(item.size), item.type].filter(Boolean).join(" / "))}</span>
              </li>
            `).join("")}</ul>`
          : `<p class="empty">No media files. Add local assets to the media folder.</p>`
      }
    </section>
  `;
}

async function loadMediaLibrary() {
  try {
    const response = await fetch(window.SIMPLE_WWW_MEDIA_PATH || "/api/media");
    const result = await response.json();
    state.media = Array.isArray(result.items) ? result.items : [];
    const panel = document.querySelector("#media-library");
    if (panel) panel.innerHTML = renderMediaLibrary();
  } catch {
    state.media = [];
  }
}

function adminContentList() {
  return editableModuleIds()
    .map((moduleId) => {
      const items = state.adminContent[moduleId] || state.content[moduleId] || [];
      return `
        <section class="card">
          <h2>${escapeHtml(state.modules[moduleId].label)}</h2>
          ${
            items.length
              ? `<ul class="admin-list">${items.map((item) => `<li><button type="button" data-admin-load="${escapeHtml(moduleId)}:${escapeHtml(item.slug)}">${escapeHtml(item.title)}</button> <span class="meta">${escapeHtml(editorialStatus(item))}</span></li>`).join("")}</ul>`
              : `<p class="empty">No content.</p>`
          }
        </section>
      `;
    })
    .join("");
}

function renderModuleTools(moduleId, items) {
  const categories = [...new Set(items.map((item) => item.category).filter(Boolean))];
  const tags = [...new Set(items.flatMap((item) => item.tags || []).filter(Boolean))];
  const years = [...new Set(items.map((item) => item.date.slice(0, 4)).filter(Boolean))];
  const months = [...new Set(items.map((item) => item.date.slice(0, 7)).filter((value) => value.length === 7))];
  const archives = [...years, ...months];

  if (!categories.length && !tags.length && !years.length) return "";

  const button = (label, type, value = "") => {
    const pressed = state.filterType === type && state.filterValue === value ? ' aria-pressed="true"' : "";
    return `<button type="button" data-filter-type="${escapeHtml(type)}" data-filter-value="${escapeHtml(value)}"${pressed}>${escapeHtml(label)}</button>`;
  };

  return `
    <section class="module-tools">
      <div class="tool-row"><span class="filter-label">Filter</span>${button("All", "all")}${categories.map((category) => button(category, "category", category)).join("")}</div>
      ${tags.length ? `<div class="tool-row"><span class="filter-label">Tags</span>${tags.map((tag) => button(tag, "tag", tag)).join("")}</div>` : ""}
      ${archives.length ? `<div class="tool-row"><span class="filter-label">Archive</span>${archives.map((archive) => button(archive, "archive", archive)).join("")}</div>` : ""}
    </section>
  `;
}

function visibleItems(moduleId, items) {
  return items.filter((item) => {
    if (state.filterType === "category" && item.category !== state.filterValue) return false;
    if (state.filterType === "tag" && !(item.tags || []).includes(state.filterValue)) return false;
    if (state.filterType === "archive" && !item.date.startsWith(state.filterValue)) return false;
    return true;
  });
}

function itemMatchesSearch(item, query) {
  return [item.title, item.summary, item.category, item.author, item.rating, item.progress, item.progressCurrent, item.body, ...(item.tags || [])]
    .join(" ")
    .toLowerCase()
    .includes(query.toLowerCase());
}

function normalizeSearchQuery(value) {
  return String(value || "")
    .replace(/[#>*_~`|()[\]{}:;,.!?/\\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function resultFromSearchIndex(entry) {
  if (entry.lang && entry.lang !== state.language) return null;
  if (entry.type === "collection") {
    const item = (state.collections[entry.collection]?.items || []).find((candidate) => candidate.slug === entry.slug);
    return item ? { collectionId: entry.collection, item } : null;
  }
  const item = (state.content[entry.module] || []).find((candidate) => candidate.slug === entry.slug);
  return item ? { moduleId: entry.module, item } : null;
}

function searchResults(query) {
  const trimmed = String(query || "").trim();
  if (!trimmed) return [];
  const normalized = normalizeSearchQuery(trimmed);

  if (state.searchIndex.length) {
    return state.searchIndex
      .filter((entry) => String(entry.text || "").includes(normalized))
      .map(resultFromSearchIndex)
      .filter(Boolean);
  }

  return editableModuleIds()
    .flatMap((moduleId) => languageFilteredItems(state.content[moduleId]).map((item) => ({ moduleId, item })))
    .concat(collectionIds().flatMap((collectionId) => languageFilteredItems(state.collections[collectionId]?.items).map((item) => ({ collectionId, item }))))
    .filter((result) => itemMatchesSearch(result.item, trimmed));
}

function renderCollectionItem(collectionId, item) {
  return `
    <article class="card">
      <h2>${escapeHtml(item.title)}</h2>
      <div class="meta">${escapeHtml([item.date, item.updated ? `updated ${item.updated}` : "", item.author, item.category].filter(Boolean).join(" / "))}</div>
      ${itemImage(item)}
      <p>${inlineMarkdown(itemSummary(item))}</p>
      ${item.tags && item.tags.length ? `<div class="tags">${item.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
      <p class="action-link"><a href="#/collections/${escapeHtml(collectionId)}/${escapeHtml(item.slug)}">Read more</a></p>
    </article>
  `;
}

function renderItem(moduleId, item) {
  let details = moduleFieldRows(moduleId, item, "list");

  if (!details.length && moduleId === "projects") {
    details.push(projectStatusDetail(item));
  }

  const beerRating = moduleId === "blog" ? beerRatingDetail(item) : null;
  if (beerRating) details.push(beerRating);
  const roadmapProgress = moduleId === "blog" ? roadmapProgressDetail(item) : null;
  if (roadmapProgress) details.push(roadmapProgress);

  if (!details.length && moduleId === "downloads") {
    details.push({ label: "Version", value: item.version });
  }

  if (!details.length && moduleId === "store") {
    details.push({ label: "SKU", value: item.sku }, { label: "Price", value: item.price });
    if (state.storePaymentsEnabled && item.paymentProvider) details.push({ label: "Provider", value: item.paymentProvider });
  }

  return `
    <article class="card">
      <h2>${escapeHtml(item.title)}</h2>
      <div class="meta">${escapeHtml([item.date, item.updated ? `updated ${item.updated}` : "", item.author, item.category].filter(Boolean).join(" / "))}</div>
      ${itemImage(item)}
      <p>${inlineMarkdown(itemSummary(item))}</p>
      ${detailList(details)}
      ${item.tags && item.tags.length ? `<div class="tags">${item.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
      <p class="action-link"><a href="#/${escapeHtml(moduleId)}/${escapeHtml(item.slug)}">Read more</a></p>
    </article>
  `;
}

function renderDetail(moduleId, slug) {
  const module = state.modules[moduleId];
  const item = languageFilteredItems(state.content[moduleId]).find((entry) => entry.slug === slug);

  state.activeModule = moduleId;
  renderNav();
  app.dataset.layout = "list";

  if (!item) {
    app.innerHTML = `
      <section class="card">
        <h2>${escapeHtml(module.label)}</h2>
        <p class="empty">Content not found.</p>
        <p class="action-link"><a href="#/${escapeHtml(moduleId)}">Back to ${escapeHtml(module.label)}</a></p>
      </section>
    `;
    return;
  }

  app.innerHTML = `
    <article class="card detail-card">
      <p class="action-link"><a href="#/${escapeHtml(moduleId)}">Back to ${escapeHtml(module.label)}</a></p>
      <h2>${escapeHtml(item.title)}</h2>
      <div class="meta">${escapeHtml([item.date, item.updated ? `updated ${item.updated}` : "", item.author, item.category].filter(Boolean).join(" / "))}</div>
      ${itemImage(item)}
      ${item.summary ? `<p class="summary">${inlineMarkdown(item.summary)}</p>` : ""}
      ${detailList([
        ...(moduleId === "projects" ? [projectStatusDetail(item)] : [{ label: "Status", value: item.status }]),
        ...(moduleId === "blog" ? [beerRatingDetail(item)].filter(Boolean) : []),
        ...(moduleId === "blog" ? [roadmapProgressDetail(item)].filter(Boolean) : []),
        { label: "Version", value: item.version },
        { label: "SKU", value: item.sku },
        { label: "Price", value: item.price },
        ...(state.storePaymentsEnabled ? [{ label: "Provider", value: item.paymentProvider }] : []),
        ...moduleFieldRows(moduleId, item, "detail"),
      ])}
      ${item.tags && item.tags.length ? `<div class="tags">${item.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
      <div class="content">${markdownToHtml(item.body)}</div>
      ${itemActions(moduleId, item)}
    </article>
    ${renderCommentsShell(moduleId, item.slug)}
  `;
  loadComments(moduleId, item.slug);
}

async function renderPreview(moduleId, slug) {
  const module = state.modules[moduleId];
  state.activeModule = moduleId;
  state.filterType = "all";
  state.filterValue = "";
  state.itemSlug = slug;
  state.search = "";
  siteSearch.value = "";
  renderNav();
  app.dataset.layout = "list";
  app.innerHTML = '<section class="card"><h2>Preview</h2><p class="empty">Loading preview...</p></section>';

  try {
    const response = await fetch(`/api/preview?module=${encodeURIComponent(moduleId)}&slug=${encodeURIComponent(slug)}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Preview could not load.");
    const item = result.item;

    app.innerHTML = `
      <article class="card detail-card">
        <p class="action-link"><a href="#/${escapeHtml(moduleId)}">Back to ${escapeHtml(module.label)}</a></p>
        <div class="meta">Preview / ${escapeHtml(result.status)}${item.publishAt ? ` / publish at ${escapeHtml(item.publishAt)}` : ""}</div>
        <h2>${escapeHtml(item.title)}</h2>
        <div class="meta">${escapeHtml([item.date, item.updated ? `updated ${item.updated}` : "", item.author, item.category].filter(Boolean).join(" / "))}</div>
        ${itemImage(item)}
        ${item.summary ? `<p class="summary">${inlineMarkdown(item.summary)}</p>` : ""}
        ${detailList([
          { label: "Status", value: item.status },
          { label: "Version", value: item.version },
          { label: "SKU", value: item.sku },
          { label: "Price", value: item.price },
          { label: "Publish at", value: item.publishAt },
          ...(state.storePaymentsEnabled ? [{ label: "Provider", value: item.paymentProvider }] : []),
          ...moduleFieldRows(moduleId, item, "detail"),
        ])}
        ${item.tags && item.tags.length ? `<div class="tags">${item.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
        <div class="content">${markdownToHtml(item.body)}</div>
        ${itemActions(moduleId, item)}
      </article>
    `;
  } catch (error) {
    app.innerHTML = `
      <section class="card">
        <h2>Preview</h2>
        <p class="empty">${escapeHtml(error.message)}</p>
      </section>
    `;
  }
}

function renderCollection(collectionId) {
  const collection = state.collections[collectionId];
  state.activeModule = "";
  state.activeCollection = collectionId;
  renderNav();
  app.dataset.layout = state.layout;

  if (!collection) {
    app.innerHTML = '<section class="card"><h2>Collection</h2><p class="empty">Collection not found.</p></section>';
    return;
  }

  const items = languageFilteredItems(collection.items);
  app.innerHTML = items.length
    ? items.map((item) => renderCollectionItem(collectionId, item)).join("")
    : `<section class="card"><h2>${escapeHtml(collection.label)}</h2><p class="empty">No collection entries.</p></section>`;
}

function renderCollectionDetail(collectionId, slug) {
  const collection = state.collections[collectionId];
  const item = languageFilteredItems(collection?.items).find((entry) => entry.slug === slug);

  state.activeModule = "";
  state.activeCollection = collectionId;
  renderNav();
  app.dataset.layout = "list";

  if (!collection || !item) {
    app.innerHTML = `
      <section class="card">
        <h2>Collection</h2>
        <p class="empty">Collection content not found.</p>
        <p class="action-link"><a href="#/collections/${escapeHtml(collectionId)}">Back to collection</a></p>
      </section>
    `;
    return;
  }

  app.innerHTML = `
    <article class="card detail-card">
      <p class="action-link"><a href="#/collections/${escapeHtml(collectionId)}">Back to ${escapeHtml(collection.label)}</a></p>
      <h2>${escapeHtml(item.title)}</h2>
      <div class="meta">${escapeHtml([item.date, item.updated ? `updated ${item.updated}` : "", item.author, item.category].filter(Boolean).join(" / "))}</div>
      ${itemImage(item)}
      ${item.summary ? `<p class="summary">${inlineMarkdown(item.summary)}</p>` : ""}
      ${item.tags && item.tags.length ? `<div class="tags">${item.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
      <div class="content">${markdownToHtml(item.body)}</div>
      ${itemActions("", item)}
    </article>
  `;
}

function renderSearch() {
  const query = state.search.trim();
  const results = searchResults(query);
  state.activeModule = "";
  state.activeCollection = "";
  siteSearch.value = query;
  renderNav();
  app.dataset.layout = state.layout;
  app.innerHTML = `
    <section class="module-tools">
      <div class="meta">${escapeHtml(results.length)} result${results.length === 1 ? "" : "s"} for "${escapeHtml(query)}"</div>
    </section>
    ${
      results.length
        ? results.map((result) => (result.collectionId ? renderCollectionItem(result.collectionId, result.item) : renderItem(result.moduleId, result.item))).join("")
        : `<section class="card"><h2>Search</h2><p class="empty">No matching content.</p></section>`
    }
  `;
}

function commentsReviewCard() {
  if (!state.commentsEnabled) return "";
  return `
    <section class="card">
      <h2>Comment review</h2>
      <div id="admin-comments"><p class="empty">Loading comments...</p></div>
    </section>
  `;
}

function adminAuthHeaders(extra = {}) {
  return state.adminAccountsEnabled && state.adminToken
    ? { ...extra, Authorization: `Bearer ${state.adminToken}` }
    : extra;
}

function adminAccountCard() {
  if (!state.adminAccountsEnabled) return "";
  return `
    <section class="card">
      <h2>Admin account</h2>
      <form id="admin-token-form" class="comment-form">
        <label>Access token<input name="token" value="${escapeHtml(state.adminToken)}" autocomplete="off"></label>
        <div class="form-actions">
          <button type="submit">Use token</button>
          <button type="button" data-admin-action="clear-token">Clear</button>
        </div>
      </form>
    </section>
  `;
}

function renderAdminComments(comments) {
  if (!comments.length) return '<p class="empty">No comments yet.</p>';
  return `
    <ul class="admin-list comment-review-list">
      ${comments
        .map((comment) => `
          <li>
            <strong>${escapeHtml(comment.author)}</strong>
            <span class="meta">${escapeHtml([comment.moduleId, comment.slug, comment.date ? comment.date.slice(0, 10) : ""].filter(Boolean).join(" / "))}</span>
            <p>${escapeHtml(comment.body)}</p>
            <div class="form-actions">
              <button type="button" data-comment-action="approve" data-module="${escapeHtml(comment.moduleId)}" data-slug="${escapeHtml(comment.slug)}" data-id="${escapeHtml(comment.id)}"${comment.approved ? " disabled" : ""}>Approve</button>
              <button type="button" data-comment-action="unapprove" data-module="${escapeHtml(comment.moduleId)}" data-slug="${escapeHtml(comment.slug)}" data-id="${escapeHtml(comment.id)}"${!comment.approved ? " disabled" : ""}>Unapprove</button>
              <button type="button" data-comment-action="${comment.hidden ? "show" : "hide"}" data-module="${escapeHtml(comment.moduleId)}" data-slug="${escapeHtml(comment.slug)}" data-id="${escapeHtml(comment.id)}">${comment.hidden ? "Show" : "Hide"}</button>
            </div>
          </li>
        `)
        .join("")}
    </ul>
  `;
}

async function loadAdminComments() {
  const panel = document.querySelector("#admin-comments");
  if (!panel) return;
  try {
    const response = await fetch("/api/admin/comments", { headers: adminAuthHeaders() });
    const result = await response.json();
    panel.innerHTML = renderAdminComments(result.comments || []);
  } catch (error) {
    panel.innerHTML = `<p class="empty">${escapeHtml(error.message)}</p>`;
  }
}

function renderAdmin() {
  app.dataset.layout = "list";
  const diagnostics = state.diagnostics || {};
  const modules = diagnostics.modules || {};
  const editing = diagnostics.adminEditing === true;

  app.innerHTML = `
    <section class="card">
      <h2>Diagnostics</h2>
      ${detailList([
        { label: "Version", value: footerLabel.textContent },
        { label: "Config", value: diagnostics.configSource },
        { label: "Modules", value: String(diagnostics.moduleCount || 0) },
        { label: "Enabled", value: String(diagnostics.enabledModuleCount || 0) },
        { label: "Content", value: String(diagnostics.contentItemCount || 0) },
        { label: "Collections", value: String(diagnostics.collectionCount || 0) },
        { label: "Collection items", value: String(diagnostics.collectionItemCount || 0) },
        { label: "Media", value: String(diagnostics.mediaItemCount || 0) },
        { label: "Comments", value: String(diagnostics.commentCount || 0) },
        { label: "Warnings", value: String(state.warnings.length) },
        { label: "Editing", value: editing ? "enabled" : "disabled" },
        { label: "Accounts", value: state.adminAccountsEnabled ? "enabled" : "disabled" },
        { label: "Commenting", value: state.commentsEnabled ? "enabled" : "disabled" },
      ])}
    </section>
    ${adminAccountCard()}
    ${
      editing && (!state.adminAccountsEnabled || state.adminToken)
        ? `${adminForm(state.adminDraft || emptyAdminFields())}<div id="admin-content-list">${adminContentList()}</div><div id="media-library">${renderMediaLibrary()}</div>`
        : editing
        ? `<section class="card"><h2>Account required</h2><p class="empty">Enter an admin access token to use local editing.</p></section>`
        : `<section class="card"><h2>Editing disabled</h2><p class="empty">Set site.adminEditing to true in config to enable local create, edit, and delete.</p></section>`
    }
    ${editing ? commentsReviewCard() : ""}
    ${Object.keys(modules)
      .map((moduleId) => `
        <section class="card">
          <h2>${escapeHtml(state.modules[moduleId]?.label || moduleId)}</h2>
          ${detailList([
            { label: "Enabled", value: String(modules[moduleId].enabled) },
            { label: "Items", value: String(modules[moduleId].itemCount) },
            { label: "Order", value: String(modules[moduleId].order) },
            { label: "Sort", value: modules[moduleId].sort },
            { label: "Limit", value: modules[moduleId].limit === null ? "none" : String(modules[moduleId].limit) },
          ])}
        </section>
      `)
      .join("")}
  `;
  if (editing && (!state.adminAccountsEnabled || state.adminToken)) loadAdminContentList();
  if (editing) loadMediaLibrary();
  if (editing && state.commentsEnabled && (!state.adminAccountsEnabled || state.adminToken)) loadAdminComments();
}

function renderModule(moduleId) {
  const module = state.modules[moduleId];
  const items = languageFilteredItems(state.content[moduleId]);

  state.activeModule = moduleId;
  renderNav();

  if (moduleId === "admin") {
    renderAdmin();
    return;
  }

  if (!items.length) {
    app.dataset.layout = "list";
    app.innerHTML = `
      <section class="card">
        <h2>${escapeHtml(module.label)}</h2>
        <p class="empty">${escapeHtml(module.emptyState || "No content yet.")}</p>
      </section>
    `;
    return;
  }

  const shownItems = visibleItems(moduleId, items);
  app.dataset.layout = state.layout;
  app.innerHTML = `${renderModuleTools(moduleId, items)}${
    shownItems.length
      ? shownItems.map((item) => renderItem(moduleId, item)).join("")
      : `<section class="card"><h2>${escapeHtml(module.label)}</h2><p class="empty">No matching content.</p></section>`
  }`;
}

function setLayout(layout) {
  state.layout = ["list", "cards", "compact"].includes(layout) ? layout : "cards";
  app.dataset.layout = state.layout;
  localStorage.setItem("simple-www-layout", state.layout);

  layoutButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.layout === state.layout));
  });
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeToggle.textContent = theme === "dark" ? "\u2600" : "\u263e";
  localStorage.setItem("simple-www-theme", theme);
}

nav.addEventListener("click", (event) => {
  const collectionButton = event.target.closest("button[data-collection]");
  if (collectionButton) {
    state.filterType = "all";
    state.filterValue = "";
    state.itemSlug = "";
    state.search = "";
    siteSearch.value = "";
    setCollectionHash(collectionButton.dataset.collection);
    renderCollection(collectionButton.dataset.collection);
    return;
  }

  const button = event.target.closest("button[data-module]");
  if (!button) return;
  state.filterType = "all";
  state.filterValue = "";
  state.itemSlug = "";
  state.activeCollection = "";
  state.search = "";
  siteSearch.value = "";
  setRouteHash(button.dataset.module);
  renderModule(button.dataset.module);
});

app.addEventListener("click", (event) => {
  const commentAction = event.target.closest("[data-comment-action]");
  if (commentAction) {
    adminCommentAction(commentAction);
    return;
  }

  const adminLoad = event.target.closest("[data-admin-load]");
  if (adminLoad) {
    const [moduleId, slug] = adminLoad.dataset.adminLoad.split(":");
    const item = (state.adminContent[moduleId] || state.content[moduleId] || []).find((entry) => entry.slug === slug);
    if (item) {
      state.adminDraft = valuesFromItem(moduleId, item);
      state.adminMessage = "";
      renderAdmin();
    }
    return;
  }

  const adminAction = event.target.closest("[data-admin-action]");
  if (adminAction && adminAction.dataset.adminAction === "new") {
    state.adminDraft = emptyAdminFields();
    state.adminMessage = "";
    renderAdmin();
    return;
  }

  if (adminAction && adminAction.dataset.adminAction === "clear-token") {
    state.adminToken = "";
    localStorage.removeItem("simple-www-admin-token");
    state.adminMessage = "";
    renderAdmin();
    return;
  }

  if (adminAction && adminAction.dataset.adminAction === "delete") {
    const form = document.querySelector("#admin-form");
    if (!form) return;
    adminSubmit("DELETE", formValues(form));
    return;
  }

  const button = event.target.closest("button[data-filter-type]");
  if (!button) return;
  state.filterType = button.dataset.filterType;
  state.filterValue = button.dataset.filterValue || "";
  setRouteHash(state.activeModule, state.filterType, state.filterValue);
  renderModule(state.activeModule);
});

app.addEventListener("submit", (event) => {
  const tokenForm = event.target.closest("#admin-token-form");
  if (tokenForm) {
    event.preventDefault();
    state.adminToken = tokenForm.elements.token.value.trim();
    localStorage.setItem("simple-www-admin-token", state.adminToken);
    state.adminMessage = "";
    renderAdmin();
    return;
  }

  const commentForm = event.target.closest("#comment-form");
  if (commentForm) {
    event.preventDefault();
    submitComment(commentForm);
    return;
  }

  const form = event.target.closest("#admin-form");
  if (!form) return;
  event.preventDefault();
  const submitter = event.submitter?.dataset.adminAction;
  adminSubmit(submitter === "edit" ? "PUT" : "POST", formValues(form));
});

async function submitComment(form) {
  const message = document.querySelector("#comment-message");
  try {
    const response = await fetch(`/api/comments?module=${encodeURIComponent(form.dataset.module)}&slug=${encodeURIComponent(form.dataset.slug)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author: form.elements.author.value,
        body: form.elements.body.value,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      message.textContent = result.errors ? result.errors.join(" ") : result.error || "Comment failed.";
      return;
    }
    form.reset();
    message.textContent = "Submitted for review.";
  } catch (error) {
    message.textContent = error.message;
  }
}

async function adminCommentAction(button) {
  const action = button.dataset.commentAction;
  const payload = {
    module: button.dataset.module,
    slug: button.dataset.slug,
    id: button.dataset.id,
  };
  if (action === "approve") payload.approved = true;
  if (action === "unapprove") payload.approved = false;
  if (action === "hide") payload.hidden = true;
  if (action === "show") payload.hidden = false;

  const response = await fetch("/api/admin/comments", {
    method: "PUT",
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  if (response.ok) loadAdminComments();
}

async function adminSubmit(method, payload) {
  try {
    const response = await fetch("/api/admin/content", {
      method,
      headers: adminAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (!response.ok) {
      state.adminMessage = result.errors ? result.errors.join(" ") : result.error || "Admin request failed.";
      renderAdmin();
      return;
    }

    if (result.payload) {
      applyPayload(result.payload);
    }
    state.adminDraft = method === "DELETE" ? emptyAdminFields(payload.module) : valuesFromItem(payload.module, result.item || payload);
    state.adminMessage = method === "DELETE" ? "Deleted. Backup was created." : "Saved.";
    renderAdmin();
  } catch (error) {
    state.adminMessage = error.message;
    renderAdmin();
  }
}

siteSearch.addEventListener("input", () => {
  state.search = siteSearch.value;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    setSearchHash(state.search);
    if (state.search.trim()) {
      renderSearch();
    }
  }, 150);
});

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  setTheme(current === "dark" ? "light" : "dark");
});

layoutButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setLayout(button.dataset.layout);
  });
});

siteLanguage.addEventListener("change", () => {
  state.language = siteLanguage.value;
  document.documentElement.lang = state.language;
  localStorage.setItem("simple-www-language", state.language);
  if (!applyRoute(routeFromHash())) renderDefaultRoute();
});

footerDonate.addEventListener("click", (event) => {
  event.preventDefault();
  history.replaceState(null, "", "#donate");
  openDonateOverlay();
});

donateClose.addEventListener("click", closeDonateOverlay);

donateOverlay.addEventListener("click", (event) => {
  if (event.target === donateOverlay) closeDonateOverlay();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !donateOverlay.hidden) closeDonateOverlay();
});

window.addEventListener("hashchange", () => {
  if (!applyRoute(routeFromHash())) renderDefaultRoute();
});

function configureLanguages(site) {
  const configured = Array.isArray(site.languages) ? site.languages : [];
  const languages = [...new Set([site.language || "en", ...configured].map((value) => String(value || "").trim()).filter(Boolean))];
  state.languages = languages.length ? languages : ["en"];
  state.language = state.languages.includes(localStorage.getItem("simple-www-language"))
    ? localStorage.getItem("simple-www-language")
    : state.languages[0];
  document.documentElement.lang = state.language;

  siteLanguage.innerHTML = state.languages.map((language) => `<option value="${escapeHtml(language)}">${escapeHtml(language)}</option>`).join("");
  siteLanguage.value = state.language;
  siteLanguageLabel.hidden = state.languages.length < 2;
}

function applyPayload(payload) {
  const config = payload.config || {};
  const site = config.site || {};

  state.modules = config.modules || {};
  state.content = payload.content || {};
  state.collections = payload.collections || {};
  state.searchIndex = [];
  state.diagnostics = payload.diagnostics || {};
  state.warnings = payload.warnings || [];
  state.media = [];
  state.activeCollection = "";
  state.commentsEnabled = site.commentsEnabled === true;
  state.storePaymentsEnabled = site.storePaymentsEnabled === true;
  state.adminAccountsEnabled = config.adminAccounts?.enabled === true;
  state.donateBitcoinAddress = String(site.donateBitcoinAddress || "").trim();
  state.donateEthereumAddress = String(site.donateEthereumAddress || "").trim();
  configureLanguages(site);
  title.textContent = site.title || config.siteTitle || "simple-www";
  description.textContent = site.description || config.siteDescription || "";
  document.title = `${title.textContent} v.${payload.version || ""}`;
  themePack.href = themePackHref(site.theme || "classic");
  footerLabel.textContent = footerText(site, payload.version || "");
  setFooterContact(site.contactEmail);
  setLayout(localStorage.getItem("simple-www-layout") || site.layout || "cards");

  state.warnings.forEach((warning) => {
    console.warn(`[simple-www:${warning.type}]`, warning);
  });
}

async function loadSearchIndex() {
  try {
    const response = await fetch(window.SIMPLE_WWW_SEARCH_INDEX_PATH || "/api/search-index");
    if (!response.ok) return;
    const payload = await response.json();
    state.searchIndex = Array.isArray(payload.items) ? payload.items : [];
  } catch {
    state.searchIndex = [];
  }
}

async function boot() {
  const response = await fetch(window.SIMPLE_WWW_DATA_PATH || "/api/site");
  const payload = await response.json();
  applyPayload(payload);
  await loadSearchIndex();
  await loadMediaLibrary();

  if (applyRoute(routeFromHash())) {
    return;
  }

  renderDefaultRoute();
}

function renderDefaultRoute() {
  const firstModule = enabledModuleIds()[0];
  if (firstModule) {
    renderModule(firstModule);
  } else if (collectionIds()[0]) {
    renderCollection(collectionIds()[0]);
  } else {
    app.innerHTML = '<section class="card"><h2>No modules enabled</h2></section>';
  }
}

setTheme(localStorage.getItem("simple-www-theme") || "light");
boot().catch(() => {
  app.innerHTML = '<section class="card"><h2>Site could not load</h2><p>Check the server logs.</p></section>';
});
