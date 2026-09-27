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
const heroPin = hero.querySelector(".hero-pin");
const heroStage = hero.querySelector(".hero-stage");
let pinTop = 0;

// centre the pinned hero laptop vertically in the viewport
function measureHeroPin() {
  pinTop = Math.max(16, (window.innerHeight - heroStage.offsetHeight) / 2);
  hero.style.setProperty("--pin-top", pinTop + "px");
}
measureHeroPin();
window.addEventListener("resize", measureHeroPin);
const demoVideo = demo.querySelector("video");

function onScroll() {
  const vh = window.innerHeight;
  nav.classList.toggle("scrolled", window.scrollY > 10);

  // hero laptop flattens as it rises, finishing exactly when it pins in the middle
  const pinStart = heroPin.getBoundingClientRect().top + window.scrollY - pinTop;
  hero.style.setProperty("--p", clamp(window.scrollY / Math.max(1, pinStart)).toFixed(3));

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

/* ---------- product carousel (manual: arrows, dots, click; loops forever) ---------- */
const carousel = document.querySelector("[data-carousel]");
const items = [...carousel.querySelectorAll(".carousel-item")];
const captions = [...carousel.querySelectorAll(".caption")];
const dots = [...carousel.querySelectorAll("[data-go]")];
const [prevBtn, nextBtn] = carousel.querySelectorAll(".carousel-btn");
const slideCount = items.length;
const mod = (n, m) => ((n % m) + m) % m;

// `pos` keeps counting up forever; each item sits at its looped distance from it
let pos = 0;
let target = 0;
let activeSlide = -1;

function renderCarousel() {
  items.forEach((item, i) => {
    // distance wrapped into [-n/2, n/2) so the loop has no seam
    const d = mod(i - pos + slideCount / 2, slideCount) - slideCount / 2;
    const ad = Math.abs(d);
    // fade to 0 at the far edge, where an item wraps from one side to the other
    const o = ad <= 1 ? 1 - ad * 0.5 : Math.max(0, 0.5 * (1 - (ad - 1) / 0.5));
    item.style.setProperty("--d", d.toFixed(3));
    item.style.setProperty("--ad", ad.toFixed(3));
    item.style.setProperty("--o", o.toFixed(3));
    item.style.zIndex = String(10 - Math.round(ad * 3));
  });
  const current = mod(Math.round(pos), slideCount);
  if (current === activeSlide) return;
  activeSlide = current;
  items.forEach((el, i) => el.classList.toggle("is-active", i === current));
  captions.forEach((el, i) => el.classList.toggle("is-active", i === current));
  dots.forEach((el, i) => el.classList.toggle("is-active", i === current));
}

// ease pos toward target
let lastFrame = performance.now();
function frame(now) {
  const dt = Math.min(64, now - lastFrame);
  lastFrame = now;
  const diff = target - pos;
  pos = Math.abs(diff) < 0.001 ? target : pos + diff * (1 - Math.exp(-dt / 170));
  renderCarousel();
  requestAnimationFrame(frame);
}

function step(dir) {
  target = Math.round(target) + dir;
  if (reduceMotion) pos = target;
}
// jump to slide i the short way round the loop
function goTo(i) {
  const delta = mod(i - mod(Math.round(target), slideCount) + slideCount / 2, slideCount) - slideCount / 2;
  step(Math.round(delta));
}

prevBtn.addEventListener("click", () => step(-1));
nextBtn.addEventListener("click", () => step(1));
dots.forEach((dot) => dot.addEventListener("click", () => goTo(Number(dot.dataset.go))));
items.forEach((item, i) => item.addEventListener("click", () => i !== activeSlide && goTo(i)));

renderCarousel();
requestAnimationFrame(frame);

/* ---------- nav: collapse into a corner button on scroll ---------- */
const navToggle = nav.querySelector(".nav-toggle");
const COLLAPSE_AFTER = 140; // px scrolled before the nav collapses
let lastNavY = window.scrollY;
let openedAtY = null; // where the user re-opened it with the button

function setNavCollapsed(collapsed) {
  if (nav.classList.contains("collapsed") === collapsed) return;
  nav.classList.toggle("collapsed", collapsed);
  navToggle.setAttribute("aria-expanded", String(!collapsed));
}

window.addEventListener(
  "scroll",
  () => {
    const y = window.scrollY;
    if (y < COLLAPSE_AFTER * 0.6) {
      openedAtY = null;
      setNavCollapsed(false);
    } else if (y > lastNavY + 2 && y > COLLAPSE_AFTER) {
      // re-opened by hand: stay open until the user scrolls on a bit further
      if (openedAtY === null || y - openedAtY > 120) {
        openedAtY = null;
        setNavCollapsed(true);
      }
    }
    lastNavY = y;
  },
  { passive: true }
);

navToggle.addEventListener("click", () => {
  openedAtY = window.scrollY;
  setNavCollapsed(false);
});
setNavCollapsed(window.scrollY > COLLAPSE_AFTER);

/* ---------- outfit conveyor: measure one image set so the loop is seamless ---------- */
const conveyor = document.querySelector("[data-conveyor]");
const conveyorTrack = conveyor.querySelector(".conveyor-track");
function measureConveyor() {
  // distance from the first image to its duplicate = exact length of one set
  const imgs = conveyorTrack.children;
  const half = imgs[imgs.length / 2].offsetLeft - imgs[0].offsetLeft;
  conveyor.style.setProperty("--half", half.toFixed(2));
}
measureConveyor();
window.addEventListener("resize", measureConveyor);
