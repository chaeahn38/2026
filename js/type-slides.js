// Typeface detail pages (typefaces/terra.html, espinosa.html, ...): slide
// navigation, the image carousel with dot indicators, style-picker
// interactions, and sample-text editing/randomization.

// Style list + preview sample-text weight: applied from data-weight here
// rather than CSS attribute selectors, since CSS can't match arbitrary
// numeric values — this way any weight a typeface actually uses (100-900)
// works with no CSS changes needed for a new typeface.
document.querySelectorAll(".type-detail__slide-styles p[data-weight]").forEach((p) => {
  p.style.fontWeight = p.dataset.weight;
});
document.querySelectorAll(".type-detail__style-preview[data-weight]").forEach((block) => {
  block.querySelectorAll(".type-detail__sample-text").forEach((el) => {
    el.style.fontWeight = block.dataset.weight;
  });
});

// Information slide's long-form text: authored as however many <p> tags (or
// just one flowing paragraph) — their text is merged, then (desktop only —
// the info text is a single stacked column below 850px, see typeface-
// detail.css, so there's nothing to balance there) split word-by-word (never
// mid-word, but mid-sentence is fine) so the two columns render the same
// number of *visual* lines — the right column takes the extra line when the
// total is odd. Runs after fonts load (measuring against a fallback font
// would give the wrong line count) and again on resize, since line-wrapping
// depends on the column's rendered width, and mobile just wants the one block.
const infoTextMobile = window.matchMedia("(max-width: 850px)");

(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
  document.querySelectorAll(".type-detail__info-fulltext").forEach((container) => {
    const fullText = Array.from(container.querySelectorAll("p"))
      .map((p) => p.textContent.trim())
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (!fullText) return;

    const words = fullText.split(" ");

    container.innerHTML = "";
    const left = document.createElement("p");
    const right = document.createElement("p");
    container.append(left);

    // The info-fulltext <p> uses flex:1, so both columns are equal width regardless
    // of content — safe to measure the left <p> alone at each candidate split.
    const countLines = (el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const tops = new Set(Array.from(range.getClientRects()).map((r) => Math.round(r.top)));
      return tops.size;
    };

    const rebalance = () => {
      if (infoTextMobile.matches || words.length < 2) {
        left.textContent = fullText;
        right.remove();
        return;
      }

      container.append(right);
      left.textContent = fullText;
      right.textContent = "";
      const totalLines = countLines(left);
      if (totalLines < 2) return;
      const leftTarget = Math.floor(totalLines / 2);

      // Binary search the largest word count that still fits in leftTarget
      // lines — countLines only ever grows as words are added, so this holds.
      let lo = 1;
      let hi = words.length;
      let splitIndex = 1;
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        left.textContent = words.slice(0, mid).join(" ");
        if (countLines(left) <= leftTarget) {
          splitIndex = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }

      left.textContent = words.slice(0, splitIndex).join(" ");
      right.textContent = words.slice(splitIndex).join(" ");
    };

    rebalance();
    window.addEventListener("resize", rebalance);
  });
});

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

// Slide-nav buttons scroll their matching full-screen slide into view
const slideButtons = document.querySelectorAll(".type-detail__nav button[data-target]");
slideButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = document.getElementById(btn.dataset.target);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

// Bold whichever slide-nav button matches the slide currently in view
const slidesContainer = document.querySelector(".type-detail__slides");
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
document.querySelectorAll(".type-detail__slide-styles p").forEach((p) => {
  p.addEventListener("click", () => {
    const target = document.getElementById(`${p.id}-preview`);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
  });
});

// Returns whichever sample text is currently shown in a style-preview block
// (the single .type-detail__sample-text, or the .active one inside a .type-detail__random-text group)
const getVisibleSampleText = (container) => {
  if (!container) return null;
  const randomGroup = container.querySelector(".type-detail__random-text");
  if (randomGroup) return randomGroup.querySelector(".type-detail__sample-text.active");
  return container.querySelector(".type-detail__sample-text");
};

// Align buttons: default to "mid", clicking sets the active icon and aligns the sample text
const alignClassMap = {
  "type-detail__align-btn--left": "left",
  "type-detail__align-btn--mid": "center",
  "type-detail__align-btn--right": "right",
};

document.querySelectorAll(".type-detail__align-group").forEach((group) => {
  const buttons = group.querySelectorAll("button");
  const container = group.closest(".type-detail__style-preview, .type-detail__slide-variable");

  const setActive = (activeBtn) => {
    buttons.forEach((btn) => btn.classList.toggle("active", btn === activeBtn));
    const alignClass = Object.keys(alignClassMap).find((cls) => activeBtn.classList.contains(cls));
    const sampleText = getVisibleSampleText(container);
    if (sampleText && alignClass) sampleText.style.textAlign = alignClassMap[alignClass];
  };

  buttons.forEach((btn) => btn.addEventListener("click", () => setActive(btn)));

  const defaultBtn = group.querySelector(".type-detail__align-btn--mid");
  if (defaultBtn) setActive(defaultBtn);
});

// Font-style dropdown: click to open, click an item to restyle this preview in place.
// Each dropdown item's data-style points at the id of its .type-detail__slide-styles <p>, which
// carries the actual data-weight/data-font-style to apply — so this works for any
// typeface's style list without a hardcoded per-typeface weight/style map.
document.querySelectorAll(".type-detail__dropdown").forEach((wrapper) => {
  const toggleBtn = wrapper.querySelector(".type-detail__dropdown-btn");
  const label = wrapper.querySelector(".type-detail__dropdown-label");
  const dropdown = wrapper.querySelector(".type-detail__dropdown-list");
  if (!dropdown) return; // static label with no picker (e.g. the Variable slide)
  const container = wrapper.closest(".type-detail__style-preview, .type-detail__slide-variable");

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
document.querySelectorAll(".type-detail__sample-text").forEach((p) => originalSampleText.set(p, p.textContent));

// Variable slide only: on hover-capable devices (mouse/trackpad), horizontal
// position across the sample text live-drives its variable axis instead of
// the automatic CSS breathing loop — left edge = axisMin, right edge =
// axisMax. Touch devices have no hover, so they keep the CSS animation (see
// the `@media (hover: hover)` override in typeface-detail.css that turns the
// animation off wherever this takes over).
const isHoverCapable = window.matchMedia("(hover: hover)").matches;
const AXIS_RANGE = { wght: [100, 900], opsz: [10, 50] };

document.querySelectorAll(".type-detail__random-text").forEach((group) => {
  const texts = Array.from(group.querySelectorAll(".type-detail__sample-text"));
  if (!texts.length) return;

  const container = group.closest(".type-detail__style-preview, .type-detail__slide-variable");
  const editBtn = container?.querySelector(".type-detail__edit-btn");

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

  if (!isHoverCapable || !container?.classList.contains("type-detail__slide-variable")) return;

  const axis = container.dataset.axis === "opsz" ? "opsz" : "wght";
  const [axisMin, axisMax] = AXIS_RANGE[axis];

  group.addEventListener("mousemove", (e) => {
    if (current.isContentEditable) return;
    const rect = group.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const value = axisMin + ratio * (axisMax - axisMin);
    if (axis === "opsz") current.style.fontVariationSettings = `"opsz" ${value}`;
    else current.style.fontWeight = Math.round(value);
  });
});

// Edit sample: click toggles the currently visible sample text into an editable field
document.querySelectorAll(".type-detail__edit-btn").forEach((btn) => {
  const container = btn.closest(".type-detail__style-preview, .type-detail__slide-variable");

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

document.querySelectorAll('.type-detail__controls input[type="range"]:not(.wght-axis)').forEach((slider) => {
  const container = slider.closest(".type-detail__style-preview, .type-detail__slide-variable");
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
document.querySelectorAll(".type-detail__img-slider").forEach((slider) => {
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
  const dotsContainer = slider.parentElement.querySelector(".type-detail__img-slider-dots");
  if (dotsContainer) {
    const VISIBLE_DOTS = 5;
    const track = document.createElement("div");
    track.className = "type-detail__img-slider-dots-track";
    dotsContainer.appendChild(track);

    const dots = images.map((img, i) => {
      const dot = document.createElement("button");
      dot.className = "type-detail__img-slider-dot";
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
    slider.classList.toggle("type-detail__img-slider--cursor-right", isRightHalf(e.clientX));
  });

  let dragging = false;
  let startX = 0;
  let startScrollLeft = 0;
  let startIndex = 0;

  const onDown = (e) => {
    // On mobile, native touch scrolling + CSS scroll-snap handle the swipe instead
    // (768px would leave a gap against the 850px mobile-layout breakpoint below)
    if (e.type === "touchstart" && window.matchMedia("(max-width: 850px)").matches) return;
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
