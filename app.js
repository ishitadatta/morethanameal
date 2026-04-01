const tabs = document.querySelectorAll(".tab-button");
const screens = document.querySelectorAll("[data-screen]");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const targetId = tab.dataset.target;

    tabs.forEach((item) => item.classList.remove("active"));
    screens.forEach((screen) => screen.classList.remove("active"));

    tab.classList.add("active");

    const target = document.getElementById(targetId);
    if (target) {
      target.classList.add("active");
    }
  });
});
