const app = document.querySelector("#app");
const nav = document.querySelector("#module-nav");
const title = document.querySelector("#site-title");
const description = document.querySelector("#site-description");
const themeToggle = document.querySelector("#theme-toggle");
const footerLabel = document.querySelector("#site-footer-label");
const layoutButtons = document.querySelectorAll("[data-layout]");
const siteSearch = document.querySelector("#site-search");

let state = {
  activeModule: "",
  modules: {},
  content: {},
  diagnostics: {},
  warnings: [],
  layout: "cards",
  filterType: "all",
  filterValue: "",
  itemSlug: "",
  search: "",
  adminMessage: "",
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

function routeFromHash() {
  const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  if (parts[0] === "search") {
    return { moduleId: "", filterType: "all", filterValue: "", itemSlug: "", search: parts.slice(1).join("/") };
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

function setSearchHash(query) {
  const trimmed = String(query || "").trim();
  location.hash = trimmed ? `/search/${encodeURIComponent(trimmed)}` : `/${encodeURIComponent(state.activeModule || enabledModuleIds()[0] || "")}`;
}

function applyRoute(route) {
  if (route.search) {
    state.filterType = "all";
    state.filterValue = "";
    state.itemSlug = "";
    state.search = route.search;
    renderSearch();
    return true;
  }

  if (!route.moduleId || !state.modules[route.moduleId]) return false;

  state.filterType = route.filterType;
  state.filterValue = route.filterValue;
  state.itemSlug = route.itemSlug;
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
  nav.innerHTML = enabledModuleIds()
    .map((moduleId) => {
      const module = state.modules[moduleId];
      const current = moduleId === state.activeModule ? ' aria-current="page"' : "";
      return `<button type="button" data-module="${escapeHtml(moduleId)}"${current}>${escapeHtml(module.label)}</button>`;
    })
    .join("");
}

function detailList(details) {
  const rows = details.filter((detail) => detail.value);
  if (!rows.length) return "";

  return `
    <dl class="details">
      ${rows.map((detail) => `<div><dt>${escapeHtml(detail.label)}</dt><dd>${escapeHtml(detail.value)}</dd></div>`).join("")}
    </dl>
  `;
}

function actionLink(href, label) {
  if (!href) return "";
  return `<p class="action-link"><a href="${escapeHtml(safeUrl(href))}">${escapeHtml(label)}</a></p>`;
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
  if (moduleId === "projects") {
    return [actionLink(item.link, "Project link"), actionLink(item.repository, "Repository")].join("");
  }

  if (moduleId === "downloads") {
    return [actionLink(item.file, "Download file"), actionLink(item.link, "More info")].join("");
  }

  if (moduleId === "store") {
    return actionLink(item.link, "Product link");
  }

  return "";
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
    category: "general",
    summary: "",
    tags: "",
    draft: false,
    status: "",
    link: "",
    repository: "",
    file: "",
    version: "",
    sku: "",
    price: "",
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
        <label>Category<input name="category" value="${escapeHtml(values.category)}"></label>
        <label>Summary<input name="summary" value="${escapeHtml(values.summary)}"></label>
        <label>Tags<input name="tags" value="${escapeHtml(values.tags)}" placeholder="one, two"></label>
        <label class="checkbox-label"><input name="draft" type="checkbox"${values.draft ? " checked" : ""}> Draft</label>
        <label>Status<input name="status" value="${escapeHtml(values.status)}"></label>
        <label>Link<input name="link" value="${escapeHtml(values.link)}"></label>
        <label>Repository<input name="repository" value="${escapeHtml(values.repository)}"></label>
        <label>File<input name="file" value="${escapeHtml(values.file)}"></label>
        <label>Version<input name="version" value="${escapeHtml(values.version)}"></label>
        <label>SKU<input name="sku" value="${escapeHtml(values.sku)}"></label>
        <label>Price<input name="price" value="${escapeHtml(values.price)}"></label>
        <label class="full-row">Body<textarea name="body" rows="10">${escapeHtml(values.body)}</textarea></label>
        <div class="form-actions">
          <button type="button" data-admin-action="new">New</button>
          <button type="submit" data-admin-action="create">Create</button>
          <button type="submit" data-admin-action="edit">Save</button>
          <button type="button" data-admin-action="delete">Delete</button>
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
      category: form.elements.category.value.trim(),
      summary: form.elements.summary.value.trim(),
      tags: form.elements.tags.value.split(",").map((tag) => tag.trim()).filter(Boolean),
      draft: form.elements.draft.checked,
      status: form.elements.status.value.trim(),
      link: form.elements.link.value.trim(),
      repository: form.elements.repository.value.trim(),
      file: form.elements.file.value.trim(),
      version: form.elements.version.value.trim(),
      sku: form.elements.sku.value.trim(),
      price: form.elements.price.value.trim(),
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
    category: item.category,
    summary: item.summary,
    tags: (item.tags || []).join(", "),
    draft: item.draft,
    status: item.status,
    link: item.link,
    repository: item.repository,
    file: item.file,
    version: item.version,
    sku: item.sku,
    price: item.price,
    body: item.body,
  };
}

function adminContentList() {
  return editableModuleIds()
    .map((moduleId) => {
      const items = state.content[moduleId] || [];
      return `
        <section class="card">
          <h2>${escapeHtml(state.modules[moduleId].label)}</h2>
          ${
            items.length
              ? `<ul class="admin-list">${items.map((item) => `<li><button type="button" data-admin-load="${escapeHtml(moduleId)}:${escapeHtml(item.slug)}">${escapeHtml(item.title)}</button></li>`).join("")}</ul>`
              : `<p class="empty">No published content.</p>`
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

  if (!categories.length && !tags.length && !years.length) return "";

  const button = (label, type, value = "") => {
    const pressed = state.filterType === type && state.filterValue === value ? ' aria-pressed="true"' : "";
    return `<button type="button" data-filter-type="${escapeHtml(type)}" data-filter-value="${escapeHtml(value)}"${pressed}>${escapeHtml(label)}</button>`;
  };

  return `
    <section class="module-tools">
      <div class="tool-row">${button("All", "all")}${categories.map((category) => button(category, "category", category)).join("")}</div>
      <div class="tool-row">${tags.map((tag) => button(`#${tag}`, "tag", tag)).join("")}</div>
      <div class="tool-row">${years.map((year) => button(year, "archive", year)).join("")}${months.map((month) => button(month, "archive", month)).join("")}</div>
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
  return [item.title, item.summary, item.category, item.body, ...(item.tags || [])]
    .join(" ")
    .toLowerCase()
    .includes(query.toLowerCase());
}

function searchResults(query) {
  const trimmed = String(query || "").trim();
  if (!trimmed) return [];

  return editableModuleIds()
    .flatMap((moduleId) => (state.content[moduleId] || []).map((item) => ({ moduleId, item })))
    .filter((result) => itemMatchesSearch(result.item, trimmed));
}

function renderItem(moduleId, item) {
  const details = [];

  if (moduleId === "projects") {
    details.push({ label: "Status", value: item.status });
  }

  if (moduleId === "downloads") {
    details.push({ label: "Version", value: item.version });
  }

  if (moduleId === "store") {
    details.push({ label: "SKU", value: item.sku }, { label: "Price", value: item.price });
  }

  return `
    <article class="card">
      <h2>${escapeHtml(item.title)}</h2>
      <div class="meta">${escapeHtml([item.date, item.category].filter(Boolean).join(" / "))}</div>
      <p>${inlineMarkdown(itemSummary(item))}</p>
      ${detailList(details)}
      ${item.tags && item.tags.length ? `<div class="tags">${item.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
      <p class="action-link"><a href="#/${escapeHtml(moduleId)}/${escapeHtml(item.slug)}">Read more</a></p>
    </article>
  `;
}

function renderDetail(moduleId, slug) {
  const module = state.modules[moduleId];
  const item = (state.content[moduleId] || []).find((entry) => entry.slug === slug);

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
      <div class="meta">${escapeHtml([item.date, item.category].filter(Boolean).join(" / "))}</div>
      ${item.summary ? `<p class="summary">${inlineMarkdown(item.summary)}</p>` : ""}
      ${detailList([
        { label: "Status", value: item.status },
        { label: "Version", value: item.version },
        { label: "SKU", value: item.sku },
        { label: "Price", value: item.price },
      ])}
      ${item.tags && item.tags.length ? `<div class="tags">${item.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
      <div class="content">${markdownToHtml(item.body)}</div>
      ${itemActions(moduleId, item)}
    </article>
  `;
}

function renderSearch() {
  const query = state.search.trim();
  const results = searchResults(query);
  state.activeModule = "";
  siteSearch.value = query;
  renderNav();
  app.dataset.layout = state.layout;
  app.innerHTML = `
    <section class="module-tools">
      <div class="meta">${escapeHtml(results.length)} result${results.length === 1 ? "" : "s"} for "${escapeHtml(query)}"</div>
    </section>
    ${
      results.length
        ? results.map((result) => renderItem(result.moduleId, result.item)).join("")
        : `<section class="card"><h2>Search</h2><p class="empty">No matching content.</p></section>`
    }
  `;
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
        { label: "Warnings", value: String(state.warnings.length) },
        { label: "Editing", value: editing ? "enabled" : "disabled" },
      ])}
    </section>
    ${
      editing
        ? `${adminForm(state.adminDraft || emptyAdminFields())}${adminContentList()}`
        : `<section class="card"><h2>Editing disabled</h2><p class="empty">Set site.adminEditing to true in config to enable local create, edit, and delete.</p></section>`
    }
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
}

function renderModule(moduleId) {
  const module = state.modules[moduleId];
  const items = state.content[moduleId] || [];

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
  const button = event.target.closest("button[data-module]");
  if (!button) return;
  state.filterType = "all";
  state.filterValue = "";
  state.itemSlug = "";
  state.search = "";
  siteSearch.value = "";
  setRouteHash(button.dataset.module);
  renderModule(button.dataset.module);
});

app.addEventListener("click", (event) => {
  const adminLoad = event.target.closest("[data-admin-load]");
  if (adminLoad) {
    const [moduleId, slug] = adminLoad.dataset.adminLoad.split(":");
    const item = (state.content[moduleId] || []).find((entry) => entry.slug === slug);
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
  const form = event.target.closest("#admin-form");
  if (!form) return;
  event.preventDefault();
  const submitter = event.submitter?.dataset.adminAction;
  adminSubmit(submitter === "edit" ? "PUT" : "POST", formValues(form));
});

async function adminSubmit(method, payload) {
  try {
    const response = await fetch("/api/admin/content", {
      method,
      headers: { "Content-Type": "application/json" },
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

window.addEventListener("hashchange", () => {
  applyRoute(routeFromHash());
});

function applyPayload(payload) {
  const config = payload.config || {};
  const site = config.site || {};

  state.modules = config.modules || {};
  state.content = payload.content || {};
  state.diagnostics = payload.diagnostics || {};
  state.warnings = payload.warnings || [];
  title.textContent = site.title || config.siteTitle || "simple-www";
  description.textContent = site.description || config.siteDescription || "";
  document.title = `${title.textContent} v.${payload.version || ""}`;
  document.documentElement.lang = site.language || "en";
  footerLabel.textContent = `${title.textContent} v.${payload.version || ""}`;
  setLayout(localStorage.getItem("simple-www-layout") || site.layout || "cards");

  state.warnings.forEach((warning) => {
    console.warn(`[simple-www:${warning.type}]`, warning);
  });
}

async function boot() {
  const response = await fetch(window.SIMPLE_WWW_DATA_PATH || "/api/site");
  const payload = await response.json();
  applyPayload(payload);

  const firstModule = enabledModuleIds()[0];
  if (applyRoute(routeFromHash())) {
    return;
  }

  if (firstModule) {
    renderModule(firstModule);
  } else {
    app.innerHTML = '<section class="card"><h2>No modules enabled</h2></section>';
  }
}

setTheme(localStorage.getItem("simple-www-theme") || "light");
boot().catch(() => {
  app.innerHTML = '<section class="card"><h2>Site could not load</h2><p>Check the server logs.</p></section>';
});
