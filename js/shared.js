// ===== Nav scroll effect =====
const nav = document.getElementById('nav');

// Inner pages start with scrolled nav (white bg)
if (document.body.dataset.innerPage === 'true') {
  nav.classList.add('scrolled');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 10 || true);
  });
} else {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  });
}

// ===== Mobile menu toggle =====
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ===== Scroll reveal =====
function initReveal() {
  const reveals = document.querySelectorAll('.reveal:not(.visible)');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach(el => observer.observe(el));
}
initReveal();

// ===== Language system =====
let currentLang = localStorage.getItem('eliteLang') || 'en';
const langBtns = document.querySelectorAll('.lang-btn');

// Callbacks that dynamic pages can register for language changes
window.eliteLangCallbacks = window.eliteLangCallbacks || [];

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('eliteLang', lang);

  langBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  // Plain text elements
  document.querySelectorAll('[data-en]').forEach(el => {
    const text = el.getAttribute('data-' + lang);
    if (text) {
      const svg = el.querySelector('svg');
      if (svg) {
        el.childNodes.forEach(node => {
          if (node.nodeType === 3) node.textContent = '';
        });
        el.insertBefore(document.createTextNode(text + ' '), svg);
        const nodes = Array.from(el.childNodes);
        let foundText = false;
        nodes.forEach(node => {
          if (node.nodeType === 3 && node.textContent.trim()) {
            if (foundText) node.remove();
            foundText = true;
          }
        });
      } else {
        el.textContent = text;
      }
    }
  });

  // HTML elements
  document.querySelectorAll('[data-en-html]').forEach(el => {
    const html = el.getAttribute('data-' + lang + '-html');
    if (html) el.innerHTML = html;
  });

  // Notify dynamic pages
  window.eliteLangCallbacks.forEach(cb => cb(lang));
}

window.setLanguage = setLanguage;
window.currentLang = currentLang;

// Update currentLang getter
Object.defineProperty(window, 'currentLang', {
  get: () => currentLang,
  set: (v) => { currentLang = v; }
});

langBtns.forEach(btn => {
  btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
});

if (currentLang !== 'en') {
  setLanguage(currentLang);
}

// Re-export for use
window.initReveal = initReveal;
