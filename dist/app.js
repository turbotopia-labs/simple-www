const app = document.querySelector("#app");
const nav = document.querySelector("#module-nav");
const title = document.querySelector("#site-title");
const description = document.querySelector("#site-description");
const themeToggle = document.querySelector("#theme-toggle");
const footerLabel = document.querySelector("#site-footer-label");
const layoutButtons = document.querySelectorAll("[data-layout]");

let state = {
  activeModule: "",
  modules: {},
  content: {},
  diagnostics: {},
  warnings: [],
  layout: "cards",
  filterType: "all",
  filterValue: "",
  search: "",
};
let searchTimer;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function markdownToHtml(markdown) {
  const lines = markdown.split(/\r?\n/);
  let inList = false;
  const html = [];

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      return;
    }

    if (trimmed.startsWith("### ")) {
      if (inList) html.push("</ul>");
      inList = false;
      html.push(`<h3>${escapeHtml(trimmed.slice(4))}</h3>`);
      return;
    }

    if (trimmed.startsWith("## ")) {
      if (inList) html.push("</ul>");
      inList = false;
      html.push(`<h2>${escapeHtml(trimmed.slice(3))}</h2>`);
      return;
    }

    if (trimmed.startsWith("# ")) {
      if (inList) html.push("</ul>");
      inList = false;
      html.push(`<h2>${escapeHtml(trimmed.slice(2))}</h2>`);
      return;
    }

    if (trimmed.startsWith("- ")) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${escapeHtml(trimmed.slice(2))}</li>`);
      return;
    }

    if (inList) {
      html.push("</ul>");
      inList = false;
    }
    html.push(`<p>${escapeHtml(trimmed)}</p>`);
  });

  if (inList) html.push("</ul>");
  return html.join("");
}

function enabledModuleIds() {
  return Object.keys(state.modules)
    .filter((moduleId) => state.modules[moduleId].enabled)
    .sort((a, b) => state.modules[a].order - state.modules[b].order);
}

function routeFromHash() {
  const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  const moduleId = parts[0] || "";
  const filterType = ["category", "tag", "archive"].includes(parts[1]) ? parts[1] : "all";
  const filterValue = filterType === "all" ? "" : parts[2] || "";

  return { moduleId, filterType, filterValue };
}

function setRouteHash(moduleId, filterType = "all", filterValue = "") {
  const encodedModule = encodeURIComponent(moduleId);
  if (filterType === "all" || !filterValue) {
    location.hash = `/${encodedModule}`;
    return;
  }

  location.hash = `/${encodedModule}/${encodeURIComponent(filterType)}/${encodeURIComponent(filterValue)}`;
}

function applyRoute(route) {
  if (!route.moduleId || !state.modules[route.moduleId]) return false;

  state.filterType = route.filterType;
  state.filterValue = route.filterValue;
  state.search = "";
  renderModule(route.moduleId);
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
  return `<p class="action-link"><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></p>`;
}

function renderModuleTools(moduleId, items) {
  const categories = [...new Set(items.map((item) => item.category).filter(Boolean))];
  const tags = [...new Set(items.flatMap((item) => item.tags || []).filter(Boolean))];
  const years = [...new Set(items.map((item) => item.date.slice(0, 4)).filter(Boolean))];
  const months = [...new Set(items.map((item) => item.date.slice(0, 7)).filter((value) => value.length === 7))];

  if (!categories.length && !tags.length && !years.length && !state.search) return "";

  const button = (label, type, value = "") => {
    const pressed = state.filterType === type && state.filterValue === value ? ' aria-pressed="true"' : "";
    return `<button type="button" data-filter-type="${escapeHtml(type)}" data-filter-value="${escapeHtml(value)}"${pressed}>${escapeHtml(label)}</button>`;
  };

  return `
    <section class="module-tools">
      <div class="search-row"><input type="search" id="module-search" value="${escapeHtml(state.search)}" placeholder="Search"></div>
      <div class="tool-row">${button("All", "all")}${categories.map((category) => button(category, "category", category)).join("")}</div>
      <div class="tool-row">${tags.map((tag) => button(`#${tag}`, "tag", tag)).join("")}</div>
      <div class="tool-row">${years.map((year) => button(year, "archive", year)).join("")}${months.map((month) => button(month, "archive", month)).join("")}</div>
    </section>
  `;
}

function visibleItems(moduleId, items) {
  const search = state.search.trim().toLowerCase();

  return items.filter((item) => {
    if (state.filterType === "category" && item.category !== state.filterValue) return false;
    if (state.filterType === "tag" && !(item.tags || []).includes(state.filterValue)) return false;
    if (state.filterType === "archive" && !item.date.startsWith(state.filterValue)) return false;

    if (!search) return true;

    return [item.title, item.summary, item.category, item.body, ...(item.tags || [])]
      .join(" ")
      .toLowerCase()
      .includes(search);
  });
}

function renderItem(moduleId, item) {
  const details = [];
  let actions = "";

  if (moduleId === "projects") {
    details.push({ label: "Status", value: item.status });
    actions = [actionLink(item.link, "Project link"), actionLink(item.repository, "Repository")].join("");
  }

  if (moduleId === "downloads") {
    details.push({ label: "Version", value: item.version });
    actions = [actionLink(item.file, "Download file"), actionLink(item.link, "More info")].join("");
  }

  if (moduleId === "store") {
    details.push({ label: "SKU", value: item.sku }, { label: "Price", value: item.price });
    actions = actionLink(item.link, "Product link");
  }

  return `
    <article class="card">
      <h2>${escapeHtml(item.title)}</h2>
      <div class="meta">${escapeHtml([item.date, item.category].filter(Boolean).join(" / "))}</div>
      ${item.summary ? `<p>${escapeHtml(item.summary)}</p>` : ""}
      ${detailList(details)}
      ${item.tags && item.tags.length ? `<div class="tags">${item.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
      <div class="content">${markdownToHtml(item.body)}</div>
      ${actions}
    </article>
  `;
}

function renderAdmin() {
  app.dataset.layout = "list";
  const diagnostics = state.diagnostics || {};
  const modules = diagnostics.modules || {};

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
      ])}
    </section>
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
  state.search = "";
  setRouteHash(button.dataset.module);
  renderModule(button.dataset.module);
});

app.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-filter-type]");
  if (!button) return;
  state.filterType = button.dataset.filterType;
  state.filterValue = button.dataset.filterValue || "";
  setRouteHash(state.activeModule, state.filterType, state.filterValue);
  renderModule(state.activeModule);
});

app.addEventListener("input", (event) => {
  const input = event.target.closest("#module-search");
  if (!input) return;
  state.search = input.value;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    renderModule(state.activeModule);
    const nextInput = document.querySelector("#module-search");
    if (nextInput) {
      nextInput.focus();
      nextInput.setSelectionRange(nextInput.value.length, nextInput.value.length);
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

async function boot() {
  const response = await fetch(window.SIMPLE_WWW_DATA_PATH || "/api/site");
  const payload = await response.json();
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
