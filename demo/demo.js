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

  const copyStatus = document.querySelector('[data-copy-status]');
  document.querySelectorAll('[data-copy]').forEach((button) => {
    const label = button.innerHTML;
    button.addEventListener('click', async () => {
      const text = document.getElementById(button.dataset.copy).textContent;
      try {
        await navigator.clipboard.writeText(text);
        button.textContent = 'Copied';
        if (copyStatus) copyStatus.textContent = button.dataset.copied || 'Copied.';
      } catch {
        // No clipboard access: select the text so Ctrl+C / Cmd+C copies it.
        const range = document.createRange();
        range.selectNodeContents(document.getElementById(button.dataset.copy));
        getSelection().removeAllRanges();
        getSelection().addRange(range);
        button.textContent = 'Selected: press Ctrl+C';
      }
      setTimeout(() => { button.innerHTML = label; }, 2000);
    });
  });

  // Toggle groups inside the examples really toggle, so aria-pressed never lies.
  document.querySelectorAll('.demo-stage [role="group"]').forEach((group) => {
    const toggles = group.querySelectorAll('[aria-pressed]');
    toggles.forEach((t) => t.addEventListener('click', () => {
      toggles.forEach((o) => o.setAttribute('aria-pressed', String(o === t)));
    }));
  });

  // Native <dialog class="c-modal">: the browser handles focus, Escape and inertness.
  document.querySelectorAll('[data-open-dialog]').forEach((opener) => {
    const dialog = document.getElementById(opener.dataset.openDialog);
    opener.addEventListener('click', () => dialog.showModal());
    dialog.querySelectorAll('[data-close-dialog]').forEach((b) => b.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  });

  // Step rail: mark the step currently in view with aria-current="step".
  const studs = new Map([...document.querySelectorAll('[data-rail]')].map((a) => [a.dataset.rail, a]));
  // Under the studs, name the step in view, or the stud being pointed at or focused.
  const now = document.querySelector('[data-rail-now]');
  let currentId = studs.keys().next().value ?? null;
  const name = (a) => a?.dataset.label ?? '';
  const show = (a) => { if (now) now.textContent = name(a); };
  studs.forEach((a) => {
    ['mouseenter', 'focus'].forEach((type) => a.addEventListener(type, () => show(a)));
    ['mouseleave', 'blur'].forEach((type) => a.addEventListener(type, () => show(studs.get(currentId))));
  });
  show(studs.get(currentId));
  if (studs.size && 'IntersectionObserver' in window) {
    const setCurrent = (id) => {
      currentId = id;
      studs.forEach((a, key) => {
        if (key === id) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current');
      });
      if (!document.activeElement?.matches('[data-rail]')) show(studs.get(id));
    };
    const railIo = new IntersectionObserver((entries) => {
      entries.filter((e) => e.isIntersecting).forEach((e) => setCurrent(e.target.id));
    }, { rootMargin: '-45% 0px -50% 0px' });
    studs.forEach((_, id) => { const el = document.getElementById(id); if (el) railIo.observe(el); });
  }

  // Alert dismiss, as the c-alert contract describes: the app hides the alert and moves focus somewhere sensible.
  document.addEventListener('click', (event) => {
    const close = event.target.closest('.c-alert__close');
    if (!close) return;
    const alert = close.closest('.c-alert');
    alert.hidden = true;
    // In the demo, a dismissed alert can come back, so the example is never lost.
    const restore = document.createElement('button');
    restore.type = 'button';
    restore.className = 'c-button c-button--sm';
    restore.textContent = 'Show the alert again';
    restore.addEventListener('click', () => { alert.hidden = false; restore.remove(); alert.querySelector('.c-alert__close')?.focus(); });
    alert.after(restore);
    restore.focus();
  });

  // Example forms are for looking at: submitting one never leaves the page.
  document.addEventListener('submit', (event) => {
    if (event.target.closest('.demo-stage')) event.preventDefault();
  });

  // A code block that scrolls sideways must be reachable by keyboard, and named.
  const markScrollers = () => document.querySelectorAll('pre.demo-code').forEach((pre) => {
    if (pre.scrollWidth > pre.clientWidth + 1) {
      pre.tabIndex = 0;
      pre.setAttribute('role', 'region');
      pre.setAttribute('aria-label', 'Markup, scrolls sideways');
    } else if (pre.hasAttribute('role')) {
      pre.removeAttribute('tabindex');
      pre.removeAttribute('role');
      pre.removeAttribute('aria-label');
    }
  });
  markScrollers();
  addEventListener('resize', markScrollers);
  document.addEventListener('toggle', markScrollers, true); // folded markup measures once it opens

  // Step-in motion: parts drop into place along the arrow. Content is visible without it.
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        // Parts in an inset step seat one after another.
        entry.target.querySelectorAll('.demo-step--inset .demo-stage :is(.c-checkbox, .c-radio, .c-toggle, .c-alert)')
          .forEach((part, i) => part.style.setProperty('--demo-i', i));
        entry.target.classList.add('is-seating');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -15% 0px' });
    document.querySelectorAll('.demo-step').forEach((step) => io.observe(step));
  }
})();
