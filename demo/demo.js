// Demo behaviour: theme switch, copy button, native dialog, step-in motion. No dependencies.
(() => {
  const root = document.documentElement;
  const THEMES = ['light', 'dark', 'auto'];
  const choices = document.querySelectorAll('[data-theme-choice]');
  const setTheme = (value) => {
    if (!THEMES.includes(value)) return;
    root.dataset.theme = value;
    choices.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.themeChoice === value)));
    try { localStorage.setItem('mcss-lite-demo-theme', value); } catch {}
  };
  let saved = null;
  try { saved = localStorage.getItem('mcss-lite-demo-theme'); } catch {}
  setTheme(new URLSearchParams(location.search).get('theme') || saved || 'light');
  choices.forEach((b) => b.addEventListener('click', () => setTheme(b.dataset.themeChoice)));

  document.querySelectorAll('[data-copy]').forEach((button) => {
    const status = document.querySelector('[data-copy-status]');
    button.addEventListener('click', async () => {
      const text = document.getElementById(button.dataset.copy).textContent;
      try {
        await navigator.clipboard.writeText(text);
        button.textContent = 'Copied';
        if (status) status.textContent = 'Install command copied.';
      } catch {
        button.textContent = 'Select and copy';
      }
      setTimeout(() => { button.textContent = 'Copy'; }, 2000);
    });
  });

  // Native <dialog class="c-modal">: the browser handles focus, Escape and inertness.
  document.querySelectorAll('[data-open-dialog]').forEach((opener) => {
    const dialog = document.getElementById(opener.dataset.openDialog);
    opener.addEventListener('click', () => dialog.showModal());
    dialog.querySelectorAll('[data-close-dialog]').forEach((b) => b.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  });

  // Step-in motion: parts drop into place along the arrow. Content is visible without it.
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-seating');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -15% 0px' });
    document.querySelectorAll('.demo-step').forEach((step) => io.observe(step));
  }
})();
