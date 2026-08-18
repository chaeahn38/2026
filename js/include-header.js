// Injects the shared header/nav/about-panel markup (html/partials/header.html)
// into every page's <div id="header-placeholder">, so that block only
// needs to be edited in one place.
(() => {
  const placeholder = document.getElementById("header-placeholder");
  if (!placeholder) return;

  fetch("/html/partials/header.html")
    .then((res) => res.text())
    .then((html) => {
      placeholder.outerHTML = html;
    });
})();
