// Pre-launch soft gate for pages not ready for public viewing (about,
// typefaces, projects). This is NOT real security: the site is static with
// no backend, so the real page content is still delivered to every visitor
// regardless — this only hides it visually until the password is entered,
// which stops casual visitors, not anyone who opens dev tools. The password
// itself is compared as a SHA-256 hash rather than stored in plaintext here.
(() => {
  const PASSWORD_HASH = "24f72b4b9b2c88dbab71cc20d37ef895da8275e2a507d07ea2a7e8d0015c909d";
  const STORAGE_KEY = "site-access-granted";

  if (sessionStorage.getItem(STORAGE_KEY) === "granted") return;

  // Hide everything immediately (before first paint) to avoid any flash of
  // the real content; the gate overlay below explicitly opts back in to
  // visible.
  document.documentElement.style.visibility = "hidden";

  const sha256Hex = async (text) => {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const showGate = () => {
    const overlay = document.createElement("div");
    overlay.className = "access-gate";
    overlay.innerHTML = `
      <form class="access-gate__form">
        <input type="password" name="access-password" autocomplete="off" placeholder="Password" autofocus />
        <button type="submit">Enter</button>
        <p class="access-gate__error" hidden>Incorrect password.</p>
      </form>
    `;
    document.body.appendChild(overlay);
    // Only the overlay opts back in to visible — the real page content
    // (still hidden via documentElement's inline style) stays hidden until
    // the password is correct.
    overlay.style.visibility = "visible";

    const form = overlay.querySelector("form");
    const input = overlay.querySelector("input");
    const error = overlay.querySelector(".access-gate__error");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const hash = await sha256Hex(input.value);
      if (hash === PASSWORD_HASH) {
        sessionStorage.setItem(STORAGE_KEY, "granted");
        document.documentElement.style.visibility = "visible";
        overlay.remove();
      } else {
        error.hidden = false;
        input.value = "";
        input.focus();
      }
    });
  };

  if (document.body) showGate();
  else document.addEventListener("DOMContentLoaded", showGate);
})();
