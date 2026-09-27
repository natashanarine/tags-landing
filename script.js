const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

/* ---------- reveal on scroll ---------- */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add("in");
      // after the entrance, drop the stagger delay so hover effects feel instant
      setTimeout(() => (el.style.transitionDelay = "0s"), 1800);
      revealObserver.unobserve(el);
    });
  },
  { threshold: 0.18, rootMargin: "0px 0px -40px 0px" }
);
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

/* ---------- count-up stats ---------- */
function countUp(el) {
  const target = Number(el.dataset.count);
  const prefix = el.dataset.prefix || "";
  const suffix = el.dataset.suffix || "";
  if (reduceMotion) {
    el.textContent = prefix + target + suffix;
    return;
  }
  const duration = 1600;
  const start = performance.now();
  const tick = (now) => {
    const t = clamp((now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = prefix + Math.round(target * eased) + suffix;
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
const statObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      setTimeout(() => countUp(entry.target), 350);
      statObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.6 }
);
document.querySelectorAll("[data-count]").forEach((el) => statObserver.observe(el));

/* ---------- scroll-linked effects ---------- */
const nav = document.querySelector(".nav");
const hero = document.querySelector("[data-hero]");
const demo = document.querySelector("[data-demo]");
const demoVideo = demo.querySelector("video");

function onScroll() {
  const vh = window.innerHeight;
  nav.classList.toggle("scrolled", window.scrollY > 10);

  // hero laptop flattens as you scroll
  hero.style.setProperty("--p", clamp(window.scrollY / (vh * 0.55)).toFixed(3));

  // demo laptop grows while the section is pinned
  const r = demo.getBoundingClientRect();
  const p = clamp(-r.top / (r.height - vh) * 1.4);
  demo.style.setProperty("--p", p.toFixed(3));
}

if (!reduceMotion) {
  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        onScroll();
        ticking = false;
      });
    },
    { passive: true }
  );
  window.addEventListener("resize", onScroll);
  onScroll();
}

/* autoplay the demo video while it's on screen (only if a video file exists) */
new IntersectionObserver(
  ([entry]) => {
    if (entry.isIntersecting) demoVideo.play().catch(() => {});
    else demoVideo.pause();
  },
  { threshold: 0.5 }
).observe(demoVideo);
