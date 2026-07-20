// About page: clicking a data-o link reveals its matching data-ob sentence
// fragment (progressive reveal of the intro paragraph).
document.querySelectorAll("a[data-o]").forEach((link) => {
  link.addEventListener("click", (e) => {
    const href = link.getAttribute("href");
    const isExternal = href && href !== "#";
    if (!isExternal) {
      e.preventDefault();
    }
    const target = document.querySelector(`span[data-ob="${link.dataset.o}"]`);
    if (target) {
      target.classList.add("on");
    }
    link.classList.add("clicked");
  });
});
