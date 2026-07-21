// Typeface detail pages (typefaces/terra.html, espinosa.html, ...): slide
// navigation, the image carousel with dot indicators, style-picker
// interactions, and sample-text editing/randomization.

// Information slide: click "58 languages" to reveal the full language list.
// On mobile the list is force-hidden by CSS regardless of this class, so the
// toggle is effectively a no-op there.
const langToggle = document.getElementById("info-lang-toggle");
const langList = document.getElementById("info-lang-list");
if (langToggle && langList) {
  langToggle.addEventListener("click", () => {
    langList.classList.toggle("open");
  });
}

// font-info buttons scroll their matching full-screen slide into view
const slideButtons = document.querySelectorAll(".font-info button[data-target]");
slideButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = document.getElementById(btn.dataset.target);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

// Bold whichever font-info button matches the slide currently in view
const slidesContainer = document.querySelector(".font-preview");
if (slideButtons.length && slidesContainer) {
  const setActiveSlide = (id) => {
    slideButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.target === id);
    });
    document.body.classList.toggle("image-slide-active", id === "image-slide");
  };

  const slideObserver = new IntersectionObserver(
    (entries) => {
      const mostVisible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (mostVisible) setActiveSlide(mostVisible.target.id);
    },
    { root: slidesContainer, threshold: 0.5 },
  );

  slideButtons.forEach((btn) => {
    const target = document.getElementById(btn.dataset.target);
    if (target) slideObserver.observe(target);
  });
}

// Scroll-to-top button: shown once scrolled past the Styles slide's boundary, scrolls back to it when clicked
const scrollTopBtn = document.getElementById("scrollTopBtn");
const stylesSlide = document.getElementById("styles-slide");

if (scrollTopBtn && stylesSlide) {
  scrollTopBtn.addEventListener("click", () => {
    stylesSlide.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

if (stylesSlide && slidesContainer) {
  const topBoundaryObserver = new IntersectionObserver(
    ([entry]) => {
      document.body.classList.toggle("scrolled-past-styles", !entry.isIntersecting);
    },
    { root: slidesContainer, threshold: 0 },
  );
  topBoundaryObserver.observe(stylesSlide);
}

// Clicking a style name scrolls to that style's preview block
document.querySelectorAll(".font-style p").forEach((p) => {
  p.addEventListener("click", () => {
    const target = document.getElementById(`${p.id}-preview`);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
  });
});

// Returns whichever sample-text is currently shown in a style-preview-sample block
// (the single .sample-text, or the .active one inside a .random-text group)
const getVisibleSampleText = (container) => {
  if (!container) return null;
  const randomGroup = container.querySelector(".random-text");
  if (randomGroup) return randomGroup.querySelector(".sample-text.active");
  return container.querySelector(".sample-text");
};

// Align buttons: default to "mid", clicking sets the active icon and aligns the sample text
const alignClassMap = {
  "align-left": "left",
  "align-mid": "center",
  "align-right": "right",
};

document.querySelectorAll(".align-group").forEach((group) => {
  const buttons = group.querySelectorAll("button");
  const container = group.closest(".style-preview-sample, .font-variable");

  const setActive = (activeBtn) => {
    buttons.forEach((btn) => btn.classList.toggle("active", btn === activeBtn));
    const alignClass = Object.keys(alignClassMap).find((cls) => activeBtn.classList.contains(cls));
    const sampleText = getVisibleSampleText(container);
    if (sampleText && alignClass) sampleText.style.textAlign = alignClassMap[alignClass];
  };

  buttons.forEach((btn) => btn.addEventListener("click", () => setActive(btn)));

  const defaultBtn = group.querySelector(".align-mid");
  if (defaultBtn) setActive(defaultBtn);
});

// Font-style dropdown: click to open, click an item to restyle this preview in place.
// Each dropdown item's data-style points at the id of its .font-style <p>, which
// carries the actual data-weight/data-font-style to apply — so this works for any
// typeface's style list without a hardcoded per-typeface weight/style map.
document.querySelectorAll(".font-style-change").forEach((wrapper) => {
  const toggleBtn = wrapper.querySelector(".font-style-change-btn");
  const label = wrapper.querySelector(".font-style-change-label");
  const dropdown = wrapper.querySelector(".font-style-dropdown");
  if (!dropdown) return; // static label with no picker (e.g. the Variable slide)
  const container = wrapper.closest(".style-preview-sample, .font-variable");

  const closeDropdown = () => {
    dropdown.classList.remove("open");
    toggleBtn.setAttribute("aria-expanded", "false");
  };

  toggleBtn.addEventListener("click", () => {
    const isOpen = dropdown.classList.toggle("open");
    toggleBtn.setAttribute("aria-expanded", String(isOpen));
  });

  dropdown.querySelectorAll("button[data-style]").forEach((item) => {
    item.addEventListener("click", () => {
      const styleEl = document.getElementById(item.dataset.style);
      const sampleText = getVisibleSampleText(container);
      if (sampleText && styleEl) {
        sampleText.style.fontWeight = styleEl.dataset.weight;
        sampleText.style.fontStyle = styleEl.dataset.fontStyle;
        sampleText.style.fontFamily = styleEl.dataset.family || "";
      }
      label.textContent = item.textContent;
      closeDropdown();
    });
  });

  document.addEventListener("click", (e) => {
    if (!wrapper.contains(e.target)) closeDropdown();
  });
});

// Random-text groups: only one sample line shows at a time; click swaps in a random other one.
// Any edit made to the outgoing text is discarded (reset to its original wording) once it's hidden.
const originalSampleText = new WeakMap();
document.querySelectorAll(".sample-text").forEach((p) => originalSampleText.set(p, p.textContent));

// Horizontal mouse position over a random-text block also acts as a weight slider
// (left edge = mouseWeightMin, right edge = mouseWeightMax) — but only for typefaces
// whose style list actually spans more than one weight (so the static faces have
// something to switch between). Single-weight families (e.g. Espinosa's one weight,
// Sinfonie's optical-size cuts which are each a fixed weight) skip this entirely.
const styleWeights = new Set(
  Array.from(document.querySelectorAll(".font-style p[data-weight]")).map((p) => p.dataset.weight),
);
const hasWeightRange = styleWeights.size > 1;
const mouseWeightMin = 100;
const mouseWeightMax = 900;

document.querySelectorAll(".random-text").forEach((group) => {
  const texts = Array.from(group.querySelectorAll(".sample-text"));
  if (!texts.length) return;

  const container = group.closest(".style-preview-sample, .font-variable");
  const editBtn = container?.querySelector(".edit-sample-btn");

  let current = texts[Math.floor(Math.random() * texts.length)];
  current.classList.add("active");

  group.addEventListener("click", (e) => {
    if (e.target.isContentEditable) return;
    const options = texts.filter((p) => p !== current);
    if (!options.length) return;
    const next = options[Math.floor(Math.random() * options.length)];

    if (current.isContentEditable) {
      current.contentEditable = "false";
      if (editBtn) editBtn.textContent = "Edit sample";
    }
    if (originalSampleText.has(current)) current.textContent = originalSampleText.get(current);

    current.classList.remove("active");
    next.classList.add("active");
    current = next;
  });

  // The Variable slide's weight is driven by its own looping CSS animation instead
  if (!hasWeightRange || container?.classList.contains("font-variable")) return;

  group.addEventListener("mousemove", (e) => {
    if (current.isContentEditable) return;
    const rect = group.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    current.style.fontWeight = Math.round(mouseWeightMin + ratio * (mouseWeightMax - mouseWeightMin));
  });
});

// Edit sample: click toggles the currently visible sample-text into an editable field
document.querySelectorAll(".edit-sample-btn").forEach((btn) => {
  const container = btn.closest(".style-preview-sample, .font-variable");

  btn.addEventListener("click", () => {
    const sampleText = getVisibleSampleText(container);
    if (!sampleText) return;
    const editing = sampleText.isContentEditable;
    sampleText.contentEditable = String(!editing);
    btn.textContent = editing ? "Edit sample" : "Done";
    if (!editing) sampleText.focus();
  });
});

// Weight-para range slider controls the font size of the currently visible sample text
const sliderMinRem = 1;
const sliderMaxRem = 15;

document.querySelectorAll('.weight-para input[type="range"]:not(.wght-axis)').forEach((slider) => {
  const container = slider.closest(".style-preview-sample, .font-variable");
  if (!container) return;

  slider.addEventListener("input", () => {
    const sampleText = getVisibleSampleText(container);
    if (!sampleText) return;
    const ratio = (slider.value - slider.min) / (slider.max - slider.min);
    sampleText.style.fontSize = `${sliderMinRem + ratio * (sliderMaxRem - sliderMinRem)}rem`;
  });
});

// Img-slider: click-drag pans the strip; on release it always snaps exactly one
// image forward/back (or back to where it started), never leaving it mid-image
document.querySelectorAll(".img-slider").forEach((slider) => {
  const images = Array.from(slider.querySelectorAll("img"));
  if (!images.length) return;

  images.forEach((img) => img.addEventListener("dragstart", (e) => e.preventDefault()));

  // Mouse wheel / trackpad scroll over the slider must never move the images —
  // only the click/drag-to-snap interaction below does that. But the wheel
  // event's default action is what drives normal page scroll too, so instead
  // of just letting it fall through (which would pan the slider horizontally)
  // or blocking it outright (which would also swallow vertical page scroll),
  // preventDefault and replay the vertical component onto the page manually.
  slider.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      if (slidesContainer) slidesContainer.scrollTop += e.deltaY;
    },
    { passive: false },
  );

  const DRAG_THRESHOLD = 40; // px of movement needed to advance to the next/previous image
  const CLICK_THRESHOLD = 5; // px — at or below this, treat the release as a click, not a drag

  // Every image snaps centered in the viewport (not flush against an edge) —
  // the scroll target is the image's own midpoint minus half the viewport width.
  const centerScrollLeft = (img) => img.offsetLeft + img.offsetWidth / 2 - slider.clientWidth / 2;

  const closestIndex = (scrollLeft) =>
    images.reduce(
      (closest, img, i) =>
        Math.abs(centerScrollLeft(img) - scrollLeft) < Math.abs(centerScrollLeft(images[closest]) - scrollLeft)
          ? i
          : closest,
      0,
    );

  const snapTo = (index) => {
    const clamped = Math.min(images.length - 1, Math.max(0, index));
    slider.scrollTo({ left: centerScrollLeft(images[clamped]), behavior: "smooth" });
  };

  // The first/last image need room to scroll into on either side to reach dead
  // center too — there's nothing before the first or after the last to scroll
  // past otherwise — so pad the strip on both ends for whatever's needed.
  const padEdges = () => {
    const idx = closestIndex(slider.scrollLeft);
    const first = images[0];
    const last = images[images.length - 1];
    slider.style.paddingLeft = `${Math.max(0, (slider.clientWidth - first.offsetWidth) / 2)}px`;
    slider.style.paddingRight = `${Math.max(0, (slider.clientWidth - last.offsetWidth) / 2)}px`;
    slider.scrollLeft = centerScrollLeft(images[idx]);
  };

  const whenReady = (img, cb) => (img.complete ? cb() : img.addEventListener("load", cb, { once: true }));
  const lastImage = images[images.length - 1];
  whenReady(images[0], padEdges);
  if (lastImage !== images[0]) whenReady(lastImage, padEdges);
  window.addEventListener("resize", padEdges);

  // Dot indicators below the slider: an Instagram-style sliding window that only
  // ever shows VISIBLE_DOTS dots, shrinking the ones near the edge of the window
  const dotsContainer = slider.parentElement.querySelector(".img-slider-dots");
  if (dotsContainer) {
    const VISIBLE_DOTS = 5;
    const track = document.createElement("div");
    track.className = "img-slider-dots-track";
    dotsContainer.appendChild(track);

    const dots = images.map((img, i) => {
      const dot = document.createElement("button");
      dot.className = "img-slider-dot";
      dot.setAttribute("aria-label", `Go to image ${i + 1}`);
      dot.addEventListener("click", () => snapTo(i));
      track.appendChild(dot);
      return dot;
    });

    const dotStep = () => (dots.length > 1 ? dots[1].offsetLeft - dots[0].offsetLeft : 0);
    const maxWindowStart = Math.max(0, dots.length - VISIBLE_DOTS);

    const scaleForDistance = (distance) => (distance === 0 ? 1 : distance === 1 ? 0.7 : 0.4);

    const updateDots = () => {
      const idx = closestIndex(slider.scrollLeft);
      const windowStart = Math.min(Math.max(idx - Math.floor(VISIBLE_DOTS / 2), 0), maxWindowStart);

      track.style.transform = `translateX(${-windowStart * dotStep()}px)`;

      dots.forEach((dot, i) => {
        dot.classList.toggle("active", i === idx);
        dot.style.transform = `scale(${scaleForDistance(Math.abs(i - idx))})`;
      });
    };

    slider.addEventListener("scroll", updateDots, { passive: true });
    updateDots();
  }

  const pointerX = (e) => {
    if (e.touches?.length) return e.touches[0].clientX;
    if (e.changedTouches?.length) return e.changedTouches[0].clientX;
    return e.clientX;
  };

  const isRightHalf = (clientX) => {
    const rect = slider.getBoundingClientRect();
    return clientX > rect.left + rect.width / 2;
  };

  // Cursor swaps between the left- and right-pointing arrow depending on which half is hovered
  slider.addEventListener("mousemove", (e) => {
    slider.classList.toggle("cursor-right", isRightHalf(e.clientX));
  });

  let dragging = false;
  let startX = 0;
  let startScrollLeft = 0;
  let startIndex = 0;

  const onDown = (e) => {
    // On mobile, native touch scrolling + CSS scroll-snap handle the swipe instead
    if (e.type === "touchstart" && window.matchMedia("(max-width: 768px)").matches) return;
    dragging = true;
    startX = pointerX(e);
    startScrollLeft = slider.scrollLeft;
    startIndex = closestIndex(startScrollLeft);
    slider.classList.add("dragging");
  };

  const onMove = (e) => {
    if (!dragging) return;
    slider.scrollLeft = startScrollLeft - (pointerX(e) - startX);
    if (e.cancelable) e.preventDefault();
  };

  const onUp = (e) => {
    if (!dragging) return;
    dragging = false;
    slider.classList.remove("dragging");
    const endX = pointerX(e);
    const delta = endX - startX;

    if (Math.abs(delta) <= CLICK_THRESHOLD) {
      // Plain click, no real drag: right half of the slider advances, left half goes back
      snapTo(startIndex + (isRightHalf(endX) ? 1 : -1));
    } else if (delta > DRAG_THRESHOLD) snapTo(startIndex - 1);
    else if (delta < -DRAG_THRESHOLD) snapTo(startIndex + 1);
    else snapTo(startIndex);
  };

  slider.addEventListener("mousedown", onDown);
  slider.addEventListener("touchstart", onDown, { passive: true });
  window.addEventListener("mousemove", onMove, { passive: false });
  window.addEventListener("touchmove", onMove, { passive: false });
  window.addEventListener("mouseup", onUp);
  window.addEventListener("touchend", onUp);
});
