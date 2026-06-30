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
  state.search = "";
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
