(function () {
  var STORAGE_KEY = 'theme';
  var html = document.documentElement;
  var toggleBtn = document.getElementById('theme-toggle');
  var sunIcon = document.getElementById('icon-sun');
  var moonIcon = document.getElementById('icon-moon');
  var hamburger = document.getElementById('hamburger');
  var navLinks = document.getElementById('nav-links');

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    if (sunIcon && moonIcon) {
      sunIcon.style.display = theme === 'dark' ? 'none' : 'block';
      moonIcon.style.display = theme === 'dark' ? 'block' : 'none';
    }
  }

  function storedTheme() {
    return localStorage.getItem(STORAGE_KEY) || 'light';
  }

  applyTheme(storedTheme());

  if (toggleBtn) {
    toggleBtn.addEventListener('click', function () {
      var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next);
    });
  }

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function () {
      navLinks.classList.toggle('open');
    });
    navLinks.addEventListener('click', function (e) {
      if (e.target.closest('a')) navLinks.classList.remove('open');
    });
  }
}());
