// Demo behaviour: theme switch, copy button, native dialog, sticky chrome, step rail, agent menu, step-in
// motion and page turns. No dependencies. Loaded deferred and render-blocking, so pagereveal is heard.
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
  const copyKeys = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘C' : 'Ctrl+C';
  document.querySelectorAll('[data-copy]').forEach((button) => {
    const label = button.innerHTML;
    let reset;
    button.addEventListener('click', async () => {
      clearTimeout(reset);
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
        button.textContent = `Selected: press ${copyKeys}`;
        if (copyStatus) copyStatus.textContent = `Text selected. Press ${copyKeys} to copy it.`;
      }
      reset = setTimeout(() => { button.innerHTML = label; }, 2000);
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

  // Last input: keyboard-initiated changes show their result at once, without motion.
  let viaKeys = false;
  let pressing = false;
  document.addEventListener('keydown', () => { viaKeys = true; }, true);
  document.addEventListener('pointerdown', () => { viaKeys = false; pressing = true; }, true);
  document.addEventListener('pointerup', () => { pressing = false; }, true);
  const calm = matchMedia('(prefers-reduced-motion: reduce)');

  // The sticky chrome's real heights, for the bars below it and for scroll padding. On phones the
  // wordmark and theme rows tuck up under the top edge and only the page links stay.
  const bar = document.querySelector('.demo-bar');
  const buildbar = document.querySelector('.demo-buildbar');
  const rail = document.querySelector('.demo-rail');
  const phone = matchMedia('(max-width: 47.99rem)');
  const measure = () => {
    const nav = bar.querySelector('.demo-bar__nav');
    root.style.setProperty('--demo-bar-height', `${bar.offsetHeight}px`);
    root.style.setProperty('--demo-bar-tuck', `${phone.matches ? nav.offsetTop : 0}px`);
    if (buildbar) root.style.setProperty('--demo-buildbar-height', `${buildbar.offsetHeight}px`);
    if (rail) root.style.setProperty('--demo-rail-height', `${rail.offsetHeight}px`);
  };
  if (bar && 'ResizeObserver' in window) {
    const ro = new ResizeObserver(measure);
    [bar, buildbar, rail].forEach((el) => el && ro.observe(el));
    phone.addEventListener('change', measure);
  }

  // Step rail: mark the step currently in view with aria-current="step".
  const studs = new Map([...document.querySelectorAll('[data-rail]')].map((a) => [a.dataset.rail, a]));
  // Under the studs, name the step in view, or the stud being pointed at or focused.
  const now = document.querySelector('[data-rail-now]');
  let currentId = null;
  // With no step in view (above the first, below the last) the label invites a jump instead.
  const name = (a) => a?.dataset.label ?? (now?.dataset.railNow || '');
  const show = (a) => { if (now) now.textContent = name(a); };
  studs.forEach((a) => {
    ['mouseenter', 'focus'].forEach((type) => a.addEventListener(type, () => show(a)));
    ['mouseleave', 'blur'].forEach((type) => a.addEventListener(type, () => show(studs.get(currentId))));
  });
  show(studs.get(currentId));
  const targets = [...studs.keys()].map((id) => document.getElementById(id)).filter(Boolean);
  if (targets.length) {
    const setCurrent = (id) => {
      if (id === currentId) return;
      currentId = id;
      studs.forEach((a, key) => {
        if (key === id) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current');
      });
      if (!document.activeElement?.matches('[data-rail]')) show(studs.get(id));
      // A rail that scrolls sideways keeps the current stud in view (without moving the page).
      const stud = studs.get(id);
      const list = stud?.closest('ol');
      if (stud && list.scrollWidth > list.clientWidth) {
        const s = stud.getBoundingClientRect();
        const l = list.getBoundingClientRect();
        if (s.left < l.left || s.right > l.right) list.scrollLeft += s.left - l.left - (l.width - s.width) / 2;
      }
    };
    // Steps that sit side by side (a sheet pair) share their row: reading down it, the left step is
    // current for the first half and the right one for the second, in either scroll direction.
    const sideBySide = (el) => {
      const row = [...el.parentElement.children].filter((c) => targets.includes(c));
      const tops = row.map((c) => c.getBoundingClientRect().top);
      return row.length > 1 && tops.every((t) => Math.abs(t - tops[0]) < 2) ? row : null;
    };
    // A jump to a stud keeps that step current until the reader scrolls on.
    let pinned = location.hash ? { id: location.hash.slice(1), y: null } : null;
    studs.forEach((a, id) => a.addEventListener('click', () => { pinned = { id, y: null }; }));
    const pick = () => {
      if (pinned && studs.has(pinned.id)) {
        pinned.y ??= scrollY;
        if (Math.abs(scrollY - pinned.y) < 48) return pinned.id;
      }
      pinned = null;
      // The reading line sits just above the middle of the screen.
      const line = innerHeight * 0.475;
      if (line < targets[0].getBoundingClientRect().top || line >= targets.at(-1).getBoundingClientRect().bottom) return null;
      for (const t of targets) {
        const row = sideBySide(t);
        const box = (row ? t.parentElement : t).getBoundingClientRect();
        if (box.top <= line && line < box.bottom) {
          return row ? row[Math.min(row.length - 1, Math.floor(((line - box.top) / box.height) * row.length))].id : t.id;
        }
      }
      return currentId; // between two steps: the last one stays current
    };
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const id = pick();
        if (id) setCurrent(id);
        else if (currentId) {
          currentId = null;
          studs.forEach((a) => a.removeAttribute('aria-current'));
          if (!document.activeElement?.matches('[data-rail]')) show(null);
        }
      });
    };
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();
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
  let resizeFrame = 0;
  addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(markScrollers); // once per frame, not once per event
  });
  document.addEventListener('toggle', markScrollers, true); // folded markup measures once it opens

  // A floating disclosure (the overview's "For your agent" list) closes on Escape, a click elsewhere, or
  // when focus leaves it. It scales in from its summary; opened or closed from the keyboard, it just appears.
  document.querySelectorAll('.demo-agents__menu').forEach((menu) => {
    const summary = menu.querySelector('summary');
    const list = menu.querySelector('.demo-agents__list');
    let closing = 0;
    const close = ({ focus = false, animate = !viaKeys } = {}) => {
      if (!menu.open || closing) return;
      if (focus) summary.focus();
      const done = () => { clearTimeout(closing); closing = 0; menu.classList.remove('is-closing'); menu.open = false; };
      if (!animate || calm.matches) { done(); return; }
      menu.classList.add('is-closing');
      closing = setTimeout(done, 200); // in case the animation never runs
      list.addEventListener('animationend', done, { once: true });
    };
    summary.addEventListener('click', (e) => {
      if (menu.open) { e.preventDefault(); close(); return; }
      menu.classList.toggle('is-instant', viaKeys);
      list.style.setProperty('--demo-menu-origin', `${summary.offsetLeft + summary.offsetWidth / 2}px`);
    });
    document.addEventListener('click', (e) => { if (!menu.contains(e.target)) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.open) close({ focus: true, animate: false }); });
    menu.addEventListener('focusout', (e) => {
      // Tabbing out closes it; a click elsewhere is the click handler's job, and leaving the window is neither.
      if (!pressing && document.hasFocus() && !menu.contains(e.relatedTarget)) close({ animate: false });
    });
  });

  // The Exploded view switch pulls the page's layouts apart (or settles them back) with animated padding.
  // The page scrolls along, frame by frame, so the part being read stays put. Flipped from the keyboard,
  // the tags show at once.
  const explode = document.getElementById('explode');
  const chrome = '.demo-bar, .demo-buildbar';
  // The element under the middle of the screen (or just beside it, if the middle is a big box or a
  // gap), never the sticky bars.
  const anchorAt = () => {
    let best = null;
    for (const [x, y] of [[0.5, 0.5], [0.5, 0.45], [0.5, 0.55], [0.3, 0.5], [0.7, 0.5]]) {
      const el = document.elementFromPoint(innerWidth * x, innerHeight * y);
      if (!el || el === root || el === document.body || el.closest(chrome)) continue;
      const h = el.getBoundingClientRect().height;
      if (h < innerHeight / 2) return el;
      if (!best || h < best.getBoundingClientRect().height) best = el;
    }
    return best;
  };
  let follow = 0;
  explode?.addEventListener('change', () => {
    if (viaKeys) {
      document.body.classList.add('demo-instant');
      requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('demo-instant')));
    }
    cancelAnimationFrame(follow);
    const anchor = scrollY > 0 && anchorAt();
    if (!anchor) return; // at the very top the page grows downwards and the reader stays at the top
    const top = anchor.getBoundingClientRect().top;
    // The padding takes --duration-slow (350ms); with reduced motion it jumps, so one frame corrects it.
    const until = performance.now() + (calm.matches ? 50 : 350 + 100);
    root.style.overflowAnchor = 'none'; // the browser's own scroll anchoring would fight the correction
    const step = (t) => {
      const drift = anchor.getBoundingClientRect().top - top;
      if (Math.abs(drift) >= 0.5) scrollBy(0, drift);
      if (t < until) follow = requestAnimationFrame(step);
      else root.style.overflowAnchor = '';
    };
    follow = requestAnimationFrame(step);
  });

  // Step-in motion: the arrow draws and the misfit drops once a step is in view (the parts themselves
  // settle with a CSS scroll timeline). Content is visible without it, and the CSS moves nothing unless
  // prefers-reduced-motion is no-preference. Steps seen while motion was reduced get their turn if the
  // setting changes.
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || calm.matches) return;
        entry.target.classList.add('is-seating');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -15% 0px' });
    const watch = () => document.querySelectorAll('.demo-step:not(.is-seating)').forEach((step) => {
      io.unobserve(step);
      io.observe(step);
    });
    watch();
    calm.addEventListener('change', watch);
  }

  // Page turns between the booklet's three pages: forward (Overview, Parts inventory, Read before you
  // build) zooms the page out and slides it left; back reverses it. Part sheets and other pages only
  // cross-fade. These events exist only with cross-document view transitions; elsewhere nothing happens.
  const PAGES = ['index.html', 'status.html', 'content.html'];
  const base = new URL('.', document.currentScript?.src || location.href);
  const order = (url) => {
    const u = url && new URL(url, location.href);
    if (!u || u.origin !== base.origin || !u.pathname.startsWith(base.pathname)) return -1;
    return PAGES.indexOf(u.pathname.slice(base.pathname.length) || 'index.html');
  };
  const turn = (from, to) => {
    const a = order(from);
    const b = order(to);
    return a < 0 || b < 0 || a === b ? null : b > a ? 'forward' : 'back';
  };
  addEventListener('pageswap', (e) => {
    const type = e.viewTransition && turn(location.href, e.activation?.entry?.url);
    if (type) e.viewTransition.types.add(type);
  });
  addEventListener('pagereveal', (e) => {
    const type = e.viewTransition && turn(window.navigation?.activation?.from?.url, location.href);
    if (type) e.viewTransition.types.add(type);
  });
})();
