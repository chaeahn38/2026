// Typeface-card hover: cycle a random look every 1s while hovered. Opt in per
// card on the .type-grid__card, plus --typeface-font (see typefaces-index.html):
//   - data-weights / data-styles (comma-separated) for typefaces that vary by
//     weight/italic, e.g. Terra, Espinosa.
//   - data-families (comma-separated font-family names) for typefaces that
//     vary by family instead, e.g. Sinfonie's optical-size cuts.
// A card can use either or both — no changes needed here for a new typeface.
// Touch devices have no real hover state to trigger this on, so instead of
// waiting for mouseenter/mouseleave, every card just auto-plays continuously —
// but running non-stop at the same pace as the hover version feels frantic,
// so mobile runs at half speed (double the timings).
const isTouch = window.matchMedia("(hover: none)").matches;
const FADE_MS = isTouch ? 300 : 150;
const CYCLE_MS = isTouch ? 1000 : 500;

document
  .querySelectorAll(".type-grid__card[data-weights], .type-grid__card[data-families]")
  .forEach((card) => {
    const name = card.querySelector(".type-grid__name");
    if (!name) return;

    const weights = card.dataset.weights
      ? card.dataset.weights.split(",").map((w) => w.trim())
      : null;
    const styles = card.dataset.weights
      ? (card.dataset.styles || "normal").split(",").map((s) => s.trim())
      : null;
    const families = card.dataset.families
      ? card.dataset.families.split(",").map((f) => f.trim())
      : null;
    const comboCount =
      (weights ? weights.length * styles.length : 1) * (families ? families.length : 1);

    let cycleInterval = null;
    let fadeTimeout = null;
    let lastWeight = null;
    let lastStyle = null;
    let lastFamily = null;

    function pickStyle() {
      name.style.opacity = "0";
      fadeTimeout = setTimeout(() => {
        let weight, style, family;
        do {
          weight = weights ? weights[Math.floor(Math.random() * weights.length)] : null;
          style = styles ? styles[Math.floor(Math.random() * styles.length)] : null;
          family = families ? families[Math.floor(Math.random() * families.length)] : null;
        } while (
          comboCount > 1 &&
          weight === lastWeight &&
          style === lastStyle &&
          family === lastFamily
        );
        lastWeight = weight;
        lastStyle = style;
        lastFamily = family;
        if (weight !== null) name.style.fontWeight = weight;
        if (style !== null) name.style.fontStyle = style;
        if (family !== null) name.style.fontFamily = family;
        name.style.opacity = "1";
      }, FADE_MS);
    }

    if (isTouch) {
      pickStyle();
      cycleInterval = setInterval(pickStyle, CYCLE_MS);
      return;
    }

    card.addEventListener("mouseenter", () => {
      pickStyle();
      cycleInterval = setInterval(pickStyle, CYCLE_MS);
    });

    card.addEventListener("mouseleave", () => {
      clearInterval(cycleInterval);
      clearTimeout(fadeTimeout);
      cycleInterval = null;
      fadeTimeout = null;
      lastWeight = null;
      lastStyle = null;
      lastFamily = null;
      name.style.fontWeight = "";
      name.style.fontStyle = "";
      name.style.fontFamily = "";
      name.style.opacity = "1";
    });
  });
