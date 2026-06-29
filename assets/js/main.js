/* ===== Automated Systems Biology — interactions ===== */
(function () {
  const root = document.documentElement;

  // --- Theme ---
  function setTheme(t) {
    root.setAttribute("data-theme", t);
    localStorage.setItem("asb-theme", t);
    const b = document.getElementById("theme-toggle");
    if (b) {
      const dark = t === "dark";
      b.setAttribute("aria-checked", dark ? "true" : "false");
      const thumb = b.querySelector(".ts-thumb");
      if (thumb) thumb.textContent = dark ? "☀" : "☾";
    }
  }
  (function initTheme() {
    const s = localStorage.getItem("asb-theme");
    const d = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(s || (d ? "dark" : "light"));
  })();

  document.addEventListener("click", function (e) {
    if (e.target.closest("#theme-toggle"))
      setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
    if (e.target.closest("#nav-toggle"))
      document.getElementById("nav-links").classList.toggle("open");
    else if (!e.target.closest("#nav-links")) {
      const l = document.getElementById("nav-links");
      if (l) l.classList.remove("open");
    }
    // lightbox open
    const z = e.target.closest("[data-zoom], .slide, .res-content .doc img");
    const lb = document.getElementById("lightbox");
    if (lb && z && !e.target.closest(".car-btn, .car-dots")) {
      const img = z.tagName === "IMG" ? z : z.querySelector("img");
      if (img) { lb.querySelector("img").src = img.src; lb.classList.add("open"); }
    } else if (lb && e.target.closest("#lightbox")) {
      lb.classList.remove("open");
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { const lb = document.getElementById("lightbox"); if (lb) lb.classList.remove("open"); }
  });

  // --- Carousels (auto-advance + arrows + dots) ---
  document.querySelectorAll(".carousel").forEach(function (car) {
    const slides = Array.from(car.querySelectorAll(".slide"));
    if (!slides.length) return;
    const dotsWrap = car.querySelector(".car-dots");
    let i = slides.findIndex((s) => s.classList.contains("is-active"));
    if (i < 0) i = 0;
    const dots = slides.map((_, k) => {
      const d = document.createElement("button");
      d.setAttribute("aria-label", "Go to slide " + (k + 1));
      d.addEventListener("click", () => go(k, true));
      if (dotsWrap) dotsWrap.appendChild(d);
      return d;
    });
    function go(n, user) {
      slides[i].classList.remove("is-active"); dots[i] && dots[i].classList.remove("on");
      i = (n + slides.length) % slides.length;
      slides[i].classList.add("is-active"); dots[i] && dots[i].classList.add("on");
      if (user) restart();
    }
    go(i);
    car.querySelector(".car-next")?.addEventListener("click", () => go(i + 1, true));
    car.querySelector(".car-prev")?.addEventListener("click", () => go(i - 1, true));
    const delay = parseInt(car.dataset.auto || "5000", 10);
    let timer = null;
    function start() { if (delay > 0) timer = setInterval(() => go(i + 1), delay); }
    function stop() { if (timer) clearInterval(timer); }
    function restart() { stop(); start(); }
    car.addEventListener("mouseenter", stop);
    car.addEventListener("mouseleave", start);
    start();
  });

  // --- Scrollspy ---
  const navLinks = Array.from(document.querySelectorAll(".links a[href^='#']"));
  const sections = navLinks.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  if (sections.length) {
    const obs = new IntersectionObserver((es) => es.forEach((en) => {
      if (en.isIntersecting) navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id));
    }), { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => obs.observe(s));
  }

  // --- Back to top (resources) ---
  const bt = document.getElementById("backtop");
  if (bt) {
    window.addEventListener("scroll", () => { bt.style.display = window.scrollY > 500 ? "grid" : "none"; });
    bt.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }
})();
