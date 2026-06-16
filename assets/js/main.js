/* ===== Automated Systems Biology — interactions ===== */
(function () {
  // --- Theme ---
  const root = document.documentElement;
  const saved = localStorage.getItem("asb-theme");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  setTheme(saved || (prefersDark ? "dark" : "light"));

  function setTheme(t) {
    root.setAttribute("data-theme", t);
    localStorage.setItem("asb-theme", t);
    const btn = document.getElementById("theme-toggle");
    if (btn) btn.textContent = t === "dark" ? "☀" : "☾";
  }
  document.addEventListener("click", function (e) {
    if (e.target.closest("#theme-toggle")) {
      setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
    }
    // mobile nav
    if (e.target.closest("#nav-toggle")) {
      document.getElementById("nav-links").classList.toggle("open");
    } else if (!e.target.closest("#nav-links")) {
      const l = document.getElementById("nav-links");
      if (l) l.classList.remove("open");
    }
  });

  // --- Lightbox ---
  const lb = document.getElementById("lightbox");
  if (lb) {
    const lbImg = lb.querySelector("img");
    document.addEventListener("click", function (e) {
      const z = e.target.closest("[data-zoom]");
      if (z) {
        const img = z.tagName === "IMG" ? z : z.querySelector("img");
        if (img) { lbImg.src = img.src; lb.classList.add("open"); }
      } else if (e.target.closest("#lightbox")) {
        lb.classList.remove("open");
      }
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") lb.classList.remove("open"); });
  }

  // --- Scrollspy (highlight active nav link) ---
  const navLinks = Array.from(document.querySelectorAll(".links a[href^='#']"));
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);
  if (sections.length) {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            navLinks.forEach((a) => a.classList.toggle("active",
              a.getAttribute("href") === "#" + en.target.id));
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => obs.observe(s));
  }

  // --- Back to top (resources page) ---
  const bt = document.getElementById("backtop");
  if (bt) {
    window.addEventListener("scroll", () => {
      bt.style.display = window.scrollY > 500 ? "grid" : "none";
    });
    bt.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }
})();
