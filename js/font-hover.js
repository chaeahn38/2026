// Terra type-name hover: cycle random weight/style every 0.2s
const terraContainer = document.getElementById("terra");
const terraName = terraContainer && terraContainer.querySelector(".typeface-name");
if (terraContainer && terraName) {
  const terraWeights = [300, 400, 500, 700, 900];
  const terraStyles = ["normal", "italic"];
  const FADE_MS = 150;
  let terraInterval = null;
  let fadeTimeout = null;
  let lastWeight = null;
  let lastStyle = null;

  function pickTerraStyle() {
    terraName.style.opacity = "0";
    fadeTimeout = setTimeout(() => {
      let weight, style;
      do {
        weight = terraWeights[Math.floor(Math.random() * terraWeights.length)];
        style = terraStyles[Math.floor(Math.random() * terraStyles.length)];
      } while (weight === lastWeight && style === lastStyle);
      lastWeight = weight;
      lastStyle = style;
      terraName.style.fontWeight = weight;
      terraName.style.fontStyle = style;
      terraName.style.opacity = "1";
    }, FADE_MS);
  }

  terraContainer.addEventListener("mouseenter", () => {
    pickTerraStyle();
    terraInterval = setInterval(pickTerraStyle, 1000);
  });

  terraContainer.addEventListener("mouseleave", () => {
    clearInterval(terraInterval);
    clearTimeout(fadeTimeout);
    terraInterval = null;
    fadeTimeout = null;
    lastWeight = null;
    lastStyle = null;
    terraName.style.fontWeight = "";
    terraName.style.fontStyle = "";
    terraName.style.opacity = "1";
  });
}
