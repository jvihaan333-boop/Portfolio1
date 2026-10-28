(function () {
  const SEARCH_DEBOUNCE_MS = 150;

  function getInitialTheme() {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark") return saved;
    } catch (err) {
      /* storage may be blocked */
    }
    try {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
      if (window.matchMedia("(prefers-color-scheme: light)").matches) return "light";
    } catch (err) {
      /* matchMedia unavailable */
    }
    return "dark";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const toggle = document.getElementById("theme-toggle");
    if (!toggle) return;
    const isDark = theme === "dark";
    toggle.setAttribute("aria-checked", isDark ? "true" : "false");
    toggle.setAttribute(
      "aria-label",
      isDark ? "Switch to light mode" : "Switch to dark mode"
    );
  }

  function toggleTheme() {
    const current = document.documentElement.dataset.theme === "light" ? "light" : "dark";
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    try {
      localStorage.setItem("theme", next);
    } catch (err) {
      /* ignore quota / private mode */
    }
  }

  function enableThemeTransitions() {
    requestAnimationFrame(function () {
      document.documentElement.classList.add("theme-ready");
    });
  }

  function initTheme() {
    applyTheme(getInitialTheme());
    const toggle = document.getElementById("theme-toggle");
    if (toggle) toggle.addEventListener("click", toggleTheme);
    window.addEventListener("load", enableThemeTransitions);
  }

  function initMobileNav() {
    const toggle = document.getElementById("nav-toggle");
    const nav = document.getElementById("primary-nav");
    if (!toggle || !nav) return;

    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }

    toggle.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setOpen(false);
      });
    });
  }

  function initActiveNav() {
    const links = Array.from(document.querySelectorAll(".nav-link"));
    const sections = links
      .map(function (link) {
        return document.querySelector(link.getAttribute("href"));
      })
      .filter(Boolean);

    if (!sections.length || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          links.forEach(function (link) {
            link.classList.toggle("is-active", link.getAttribute("href") === "#" + id);
          });
        });
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0.1 }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  function matchesQuery(project, query) {
    if (!query) return true;
    const haystack = [
      project.title,
      project.description,
      project.tag,
      (project.technologies || []).join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  }

  function matchesCategory(project, category) {
    if (!category || category === "All") return true;
    return (project.categories || []).indexOf(category) !== -1;
  }

  function createEl(tag, className) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    return el;
  }

  function renderCard(project) {
    const card = createEl("article", "card");

    const tag = createEl("p", "card__tag");
    tag.textContent = project.tag;
    card.appendChild(tag);

    const title = createEl("h3");
    title.textContent = project.title;
    card.appendChild(title);

    const desc = createEl("p");
    desc.textContent = project.description;
    card.appendChild(desc);

    const techList = createEl("ul", "card__tech");
    (project.technologies || []).forEach(function (tech) {
      const item = createEl("li");
      item.textContent = tech;
      techList.appendChild(item);
    });
    card.appendChild(techList);

    const links = createEl("div", "card__links");
    const github = createEl("a");
    github.href = project.githubUrl || "#";
    github.target = "_blank";
    github.rel = "noopener noreferrer";
    github.textContent = "GitHub";
    links.appendChild(github);

    if (project.liveUrl) {
      const live = createEl("a");
      live.href = project.liveUrl;
      live.target = "_blank";
      live.rel = "noopener noreferrer";
      live.textContent = "Live App ↗";
      links.appendChild(live);
    }

    card.appendChild(links);
    return card;
  }

  function getProjects() {
    return Array.isArray(window.projects) ? window.projects : [];
  }

  function initProjects() {
    const grid = document.getElementById("project-grid");
    const empty = document.getElementById("project-empty");
    const countEl = document.getElementById("project-count");
    const search = document.getElementById("project-search");
    const chips = Array.from(document.querySelectorAll(".chip"));
    if (!grid) return;

    let query = "";
    let category = "All";
    let debounceId = null;

    function render() {
      const list = getProjects().filter(function (project) {
        return matchesQuery(project, query) && matchesCategory(project, category);
      });

      grid.replaceChildren();
      list.forEach(function (project) {
        grid.appendChild(renderCard(project));
      });

      if (empty) empty.hidden = list.length > 0;
      if (countEl) {
        countEl.textContent =
          list.length === 1 ? "1 project shown" : list.length + " projects shown";
      }
    }

    if (search) {
      search.addEventListener("input", function () {
        window.clearTimeout(debounceId);
        debounceId = window.setTimeout(function () {
          query = search.value.toLowerCase().trim();
          render();
        }, SEARCH_DEBOUNCE_MS);
      });
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        category = chip.getAttribute("data-filter") || "All";
        chips.forEach(function (btn) {
          btn.classList.toggle("is-active", btn === chip);
        });
        render();
      });
    });

    render();
  }

  function initContactForm() {
    const form = document.getElementById("contact-form");
    const status = document.getElementById("form-status");
    if (!form) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (status) status.textContent = "Thanks — your message is ready. Opening your email client.";
      const name = document.getElementById("contact-name");
      const email = document.getElementById("contact-email");
      const message = document.getElementById("contact-message");
      const subject = encodeURIComponent("Portfolio message from " + (name && name.value ? name.value : "visitor"));
      const body = encodeURIComponent(
        (message && message.value ? message.value : "") +
          "\n\nFrom: " +
          (email && email.value ? email.value : "")
      );
      window.location.href = "mailto:jvihaan333@gmail.com?subject=" + subject + "&body=" + body;
    });
  }

  function showProfileFallback(img, fallback) {
    img.hidden = true;
    fallback.hidden = false;
  }

  function initProfileFallback() {
    const img = document.querySelector(".profile-img");
    const fallback = document.querySelector(".profile-fallback");
    if (!img || !fallback) return;
    img.addEventListener("error", function () {
      showProfileFallback(img, fallback);
    });
    if (img.complete && img.naturalWidth === 0) {
      showProfileFallback(img, fallback);
    }
  }

  initTheme();
  initMobileNav();
  initActiveNav();
  initProjects();
  initContactForm();
  initProfileFallback();
})();
