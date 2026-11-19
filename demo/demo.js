// Demo behaviour: theme switch, copy button, native dialog, sticky chrome, step rail, agent menu, step-in
// motion, Exploded view and page turns. No dependencies. Loaded deferred and render-blocking.
//
// The three booklet pages (Overview, Parts inventory, Read before you build) turn in place: a click on a
// header link fetches the next page, swaps everything under the header inside a same-document view
// transition and pushes a history entry. Everything wired to a page's content lives in initPage(), which
// returns its own teardown, so nothing leaks or doubles up across swaps. Without JS the links are links.
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
  // The header (and its theme buttons) stays put through page turns, so these are wired once.
  choices.forEach((b) => b.addEventListener('click', () => setTheme(b.dataset.themeChoice)));

  // Last input: keyboard-initiated changes show their result at once, without motion. Scrolling with a
  // wheel or a finger counts as pointing again.
  let viaKeys = false;
  let pressing = false;
  document.addEventListener('keydown', () => { viaKeys = true; }, true);
  document.addEventListener('pointerdown', () => { viaKeys = false; pressing = true; }, true);
  document.addEventListener('pointerup', () => { pressing = false; }, true);
  ['wheel', 'touchstart'].forEach((type) => document.addEventListener(type, () => { viaKeys = false; }, { capture: true, passive: true }));
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const frames = (fn) => requestAnimationFrame(() => requestAnimationFrame(fn));

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
  let resizeFrame = 0;
  addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(markScrollers); // once per frame, not once per event
  });
  document.addEventListener('toggle', markScrollers, true); // folded markup measures once it opens

  // The sticky chrome's real heights, for the bars below it and for scroll padding. On phones the
  // wordmark and theme rows tuck up under the top edge and only the page links stay; the build bar
  // sticks under them at every width. The header stays; the build bar and rail come with each page.
  const bar = document.querySelector('.demo-bar');
  const phone = matchMedia('(max-width: 47.99rem)');
  const measure = () => {
    if (!bar) return;
    const nav = bar.querySelector('.demo-bar__nav');
    const buildbar = document.querySelector('.demo-buildbar');
    const rail = document.querySelector('.demo-rail');
    root.style.setProperty('--demo-bar-height', `${bar.offsetHeight}px`);
    root.style.setProperty('--demo-bar-tuck', `${phone.matches && nav ? nav.offsetTop : 0}px`);
    if (buildbar) root.style.setProperty('--demo-buildbar-height', `${buildbar.offsetHeight}px`);
    if (rail) root.style.setProperty('--demo-rail-height', `${rail.offsetHeight}px`);
  };
  const sizes = 'ResizeObserver' in window ? new ResizeObserver(measure) : null;
  if (bar && sizes) {
    sizes.observe(bar);
    phone.addEventListener('change', measure);
  }

  // Everything below is wired to one page's content. It returns a teardown that removes every listener
  // (one AbortController), disconnects every observer and cancels pending frames.
  const initPage = (scope) => {
    const abort = new AbortController();
    const { signal } = abort;
    const on = (target, type, fn, options = {}) => target.addEventListener(type, fn, { ...options, signal });
    const cleanups = [];
    const $$ = (selector) => scope.querySelectorAll(selector);

    // Sticky chrome: watch this page's build bar or rail, and measure them now.
    const sized = [scope.querySelector('.demo-buildbar'), scope.querySelector('.demo-rail')].filter(Boolean);
    if (sizes) {
      sized.forEach((el) => sizes.observe(el));
      cleanups.push(() => sized.forEach((el) => sizes.unobserve(el)));
    }
    measure();
    markScrollers();

    // Copy buttons: the label crossfades to a check and "Copied" (CSS), then comes back about 1.6s later.
    // The status line below the page announces it; the button keeps its name.
    const copyStatus = scope.querySelector('[data-copy-status]');
    const copyKeys = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘C' : 'Ctrl+C';
    $$('[data-copy]').forEach((button) => {
      if (!button.classList.contains('demo-copy')) {
        button.classList.add('demo-copy');
        button.innerHTML = `<span class="demo-copy__label">${button.innerHTML}</span><span class="demo-copy__done" aria-hidden="true"><svg class="c-icon c-icon--sm" aria-hidden="true" focusable="false"><use href="#mcss-icon-check"></use></svg><span>Copied</span></span>`;
      }
      const done = button.querySelector('.demo-copy__done > span');
      let reset;
      cleanups.push(() => clearTimeout(reset));
      on(button, 'click', async () => {
        clearTimeout(reset);
        const source = document.getElementById(button.dataset.copy);
        try {
          await navigator.clipboard.writeText(source.textContent);
          done.textContent = 'Copied';
          if (copyStatus) copyStatus.textContent = button.dataset.copied || 'Copied.';
        } catch {
          // No clipboard access: select the text so Ctrl+C / Cmd+C copies it.
          const range = document.createRange();
          range.selectNodeContents(source);
          getSelection().removeAllRanges();
          getSelection().addRange(range);
          done.textContent = `Selected: press ${copyKeys}`;
          if (copyStatus) copyStatus.textContent = `Text selected. Press ${copyKeys} to copy it.`;
        }
        button.classList.toggle('is-instant', viaKeys);
        button.classList.add('is-copied');
        reset = setTimeout(() => button.classList.remove('is-copied'), 1600);
      });
    });

    // Toggle groups inside the examples really toggle, so aria-pressed never lies.
    $$('.demo-stage [role="group"]').forEach((group) => {
      const toggles = group.querySelectorAll('[aria-pressed]');
      toggles.forEach((t) => on(t, 'click', () => {
        toggles.forEach((o) => o.setAttribute('aria-pressed', String(o === t)));
      }));
    });

    // Native <dialog class="c-modal">: the browser handles focus, Escape and inertness.
    $$('[data-open-dialog]').forEach((opener) => {
      const dialog = document.getElementById(opener.dataset.openDialog);
      if (!dialog) return;
      on(opener, 'click', () => dialog.showModal());
      dialog.querySelectorAll('[data-close-dialog]').forEach((b) => on(b, 'click', () => dialog.close()));
      on(dialog, 'click', (e) => { if (e.target === dialog) dialog.close(); });
    });

    // Step rail: mark the step currently in view with aria-current="step".
    const buildbar = scope.querySelector('.demo-buildbar');
    const studs = new Map([...$$('[data-rail]')].map((a) => [a.dataset.rail, a]));
    // Under the studs, name the step in view, or the stud being pointed at or focused.
    const now = scope.querySelector('[data-rail-now]');
    let currentId = null;
    // With no step in view (above the first, below the last) the label invites a jump instead.
    const name = (a) => a?.dataset.label ?? (now?.dataset.railNow || '');
    const show = (a) => { if (now) now.textContent = name(a); };
    studs.forEach((a) => {
      ['mouseenter', 'focus'].forEach((type) => on(a, type, () => show(a)));
      ['mouseleave', 'blur'].forEach((type) => on(a, type, () => show(studs.get(currentId))));
    });
    show(studs.get(currentId));
    // The build bar's ink marker glides to the current stud (CSS moves it with transform). It lands at once
    // the first time, after a resize, and when the jump came from the keyboard.
    const markList = buildbar?.querySelector('.demo-rail__list');
    let placed = false;
    const mark = (stud, instant = !placed || viaKeys) => {
      if (!markList) return;
      markList.classList.toggle('has-current', Boolean(stud));
      if (!stud) return;
      markList.classList.toggle('is-instant', instant);
      markList.classList.toggle('is-wrong', stud.classList.contains('demo-rail__stud--wrong'));
      markList.style.setProperty('--demo-stud-x', `${stud.offsetLeft}px`);
      markList.style.setProperty('--demo-stud-y', `${stud.offsetTop}px`);
      placed = true;
      if (instant) frames(() => markList.classList.remove('is-instant'));
    };
    on(window, 'resize', () => mark(studs.get(currentId), true));
    const targets = [...studs.keys()].map((id) => document.getElementById(id)).filter(Boolean);
    if (targets.length) {
      const setCurrent = (id) => {
        if (id === currentId) return;
        currentId = id;
        studs.forEach((a, key) => {
          if (key === id) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current');
        });
        if (!document.activeElement?.matches('[data-rail]')) show(studs.get(id));
        mark(studs.get(id));
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
      studs.forEach((a, id) => on(a, 'click', () => { pinned = { id, y: null }; }));
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
      cleanups.push(() => cancelAnimationFrame(frame));
      const update = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const id = pick();
          if (id) setCurrent(id);
          else if (currentId) {
            currentId = null;
            studs.forEach((a) => a.removeAttribute('aria-current'));
            mark(null);
            if (!document.activeElement?.matches('[data-rail]')) show(null);
          }
        });
      };
      on(window, 'scroll', update, { passive: true });
      on(window, 'resize', update);
      update();
    }

    // A floating disclosure (the overview's "For your agent" list) closes on Escape, a click elsewhere, or
    // when focus leaves it. It scales in from its summary; opened or closed from the keyboard, it just appears.
    $$('.demo-agents__menu').forEach((menu) => {
      const summary = menu.querySelector('summary');
      const list = menu.querySelector('.demo-agents__list');
      let closing = 0;
      cleanups.push(() => clearTimeout(closing));
      const close = ({ focus = false, animate = !viaKeys } = {}) => {
        if (!menu.open || closing) return;
        if (focus) summary.focus();
        const done = () => { clearTimeout(closing); closing = 0; menu.classList.remove('is-closing'); menu.open = false; };
        if (!animate) { done(); return; } // with reduced motion the CSS only fades it
        menu.classList.add('is-closing');
        closing = setTimeout(done, 200); // in case the animation never runs
        on(list, 'animationend', done, { once: true });
      };
      on(summary, 'click', (e) => {
        if (menu.open) { e.preventDefault(); close(); return; }
        menu.classList.toggle('is-instant', viaKeys);
        list.style.setProperty('--demo-menu-origin', `${summary.offsetLeft + summary.offsetWidth / 2}px`);
      });
      on(document, 'click', (e) => { if (!menu.contains(e.target)) close(); });
      on(document, 'keydown', (e) => { if (e.key === 'Escape' && menu.open) close({ focus: true, animate: false }); });
      on(menu, 'focusout', (e) => {
        // Tabbing out closes it; a click elsewhere is the click handler's job, and leaving the window is neither.
        if (!pressing && document.hasFocus() && !menu.contains(e.relatedTarget)) close({ animate: false });
      });
    });

    // Exploded view. The page's switch (on all three booklet pages) pulls every layout apart, or settles it
    // back, with animated padding; step 1's own switch does the same for its build alone. The page scrolls
    // along, frame by frame, so the part being read stays put. Flipped from the keyboard, the change lands
    // at once.
    const explode = scope.querySelector('#explode');
    const plate = scope.querySelector('#plate-explode');
    // Step 1 is pulled apart when the page's switch is on or its own is. Its switch shows on (and rests)
    // while the page's is on, and returns to its own setting when the page's goes off.
    let plateOwn = Boolean(plate?.checked);
    const syncPlate = () => {
      if (!plate) return;
      const all = Boolean(explode?.checked);
      plate.checked = all || plateOwn;
      plate.disabled = all;
    };
    syncPlate();
    const chrome = '.demo-bar, .demo-buildbar';
    // The element under the middle of the screen (or just beside it, if the middle is a big box or a
    // gap), never the sticky bars. A point that lands in a layout's padding or gap hits the layout itself,
    // whose contents move inside it as the padding changes, so the anchor goes down to the part nearest
    // the point.
    const nearest = (el, y) => {
      const gap = (k) => { const r = k.getBoundingClientRect(); return y < r.top ? r.top - y : Math.max(0, y - r.bottom); };
      for (let kids; (kids = [...el.children].filter((k) => k.getBoundingClientRect().width > 1)).length;) {
        el = kids.reduce((a, k) => (gap(k) < gap(a) ? k : a));
      }
      return el;
    };
    const anchorAt = () => {
      let best = null;
      for (const [x, y] of [[0.5, 0.5], [0.5, 0.45], [0.5, 0.55], [0.3, 0.5], [0.7, 0.5]]) {
        const hit = document.elementFromPoint(innerWidth * x, innerHeight * y);
        if (!hit || hit === root || hit === document.body || hit.closest(chrome)) continue;
        const el = nearest(hit, innerHeight * y);
        const h = el.getBoundingClientRect().height;
        if (h < innerHeight / 2) return el;
        if (!best || h < best.getBoundingClientRect().height) best = el;
      }
      return best;
    };
    let follow = 0;
    cleanups.push(() => { cancelAnimationFrame(follow); root.style.overflowAnchor = ''; });
    const pullApart = () => {
      if (viaKeys) {
        document.body.classList.add('demo-instant');
        frames(() => document.body.classList.remove('demo-instant'));
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
    };
    if (explode) on(explode, 'change', () => { pullApart(); syncPlate(); });
    if (plate) on(plate, 'change', () => { plateOwn = plate.checked; pullApart(); });

    // Step-in motion: the arrow draws and the misfit drops once a step is in view (the parts themselves
    // settle with a CSS scroll timeline). Content is visible without it, and the CSS moves nothing unless
    // prefers-reduced-motion is no-preference. Steps seen while motion was reduced get their turn if the
    // setting changes.
    // Inset steps (6 and 7) seat their parts on a clock, so they start as soon as their stage peeks in.
    if ('IntersectionObserver' in window) {
      const seat = (entries, io) => entries.forEach((entry) => {
        if (!entry.isIntersecting || calm.matches) return;
        entry.target.closest('.demo-step').classList.add('is-seating');
        io.unobserve(entry.target);
      });
      const io = new IntersectionObserver(seat, { rootMargin: '0px 0px -15% 0px' });
      const peek = new IntersectionObserver(seat);
      cleanups.push(() => { io.disconnect(); peek.disconnect(); });
      const watch = () => $$('.demo-step:not(.is-seating)').forEach((step) => {
        const inset = step.classList.contains('demo-step--inset') && step.querySelector('.demo-stage');
        const [obs, el] = inset ? [peek, inset] : [io, step];
        obs.unobserve(el);
        obs.observe(el);
      });
      watch();
      on(calm, 'change', watch);
    }

    return () => {
      abort.abort();
      cleanups.forEach((fn) => fn());
    };
  };

  let teardown = initPage(document.body);

  // ---------- Page turns ----------
  // Only the three booklet pages turn, and only from the header's links. Part sheets and every other link
  // navigate as before (Chromium cross-fades those with its cross-document view transition).
  const PAGES = ['index.html', 'status.html', 'content.html'];
  const base = new URL('.', document.currentScript?.src || location.href);
  const order = (url) => {
    const u = url && new URL(url, location.href);
    if (!u || u.origin !== base.origin || !u.pathname.startsWith(base.pathname)) return -1;
    return PAGES.indexOf(u.pathname.slice(base.pathname.length) || 'index.html');
  };
  let current = order(location.href);
  if (current < 0 || !bar) return;

  // REVIEW-TIME ONLY: four turn styles to compare. ?turn=flip|slide|push|wipe picks one and keeps it for the
  // session; the "Page turn" chooser then appears in the corner. Remove both (and the unchosen styles in
  // demo.css) once a style is picked.
  const TURNS = ['flip', 'slide', 'push', 'wipe'];
  const TURN_KEY = 'mcss-lite-demo-turn';
  const asked = new URLSearchParams(location.search).get('turn');
  let turnStyle = TURNS.includes(asked) ? asked : null;
  try {
    if (turnStyle) sessionStorage.setItem(TURN_KEY, turnStyle);
    else turnStyle = TURNS.includes(sessionStorage.getItem(TURN_KEY)) ? sessionStorage.getItem(TURN_KEY) : null;
  } catch {}
  const reviewing = Boolean(turnStyle);
  turnStyle ||= 'flip';
  if (reviewing) {
    const picker = document.createElement('div');
    picker.className = 'demo-turn-picker';
    picker.dataset.turnKeep = '';
    picker.setAttribute('role', 'group');
    picker.setAttribute('aria-labelledby', 'demo-turn-picker-label');
    picker.innerHTML = `<span class="demo-turn-picker__label" id="demo-turn-picker-label">Page turn</span>${TURNS.map((t) => `<button type="button" class="c-button c-button--sm" data-turn-choice="${t}" aria-pressed="${t === turnStyle}">${t[0].toUpperCase()}${t.slice(1)}</button>`).join('')}`;
    picker.addEventListener('click', (e) => {
      const button = e.target.closest('[data-turn-choice]');
      if (!button) return;
      turnStyle = button.dataset.turnChoice;
      try { sessionStorage.setItem(TURN_KEY, turnStyle); } catch {}
      picker.querySelectorAll('[data-turn-choice]').forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
    });
    document.body.append(picker);
  }

  // History: every entry carries a key and its last scroll position. The browser's own restoration is off,
  // because it would scroll the old page before the turn captures it; demo.js restores instead.
  const newKey = () => Math.random().toString(36).slice(2);
  const scrolls = new Map();
  let entryKey = history.state?.key || newKey();
  // Between Back/Forward and the swap, the entry has moved but the old page is still showing: no stamps.
  let turning = false;
  const stamp = () => {
    if (turning) return;
    try { history.replaceState({ ...(history.state || {}), key: entryKey, scroll: scrollY }, ''); } catch {}
  };
  const restoreTo = history.state?.scroll;
  stamp();
  try { history.scrollRestoration = 'manual'; } catch {}
  // A reload, or Back to this document after it left memory, lands where the reader was.
  const navType = performance.getEntriesByType?.('navigation')[0]?.type;
  if (typeof restoreTo === 'number' && (navType === 'reload' || navType === 'back_forward')) {
    requestAnimationFrame(() => scrollTo({ top: restoreTo, left: 0, behavior: 'instant' }));
  }
  let stampTimer = 0;
  addEventListener('scroll', () => {
    if (turning) return;
    scrolls.set(entryKey, scrollY);
    clearTimeout(stampTimer);
    stampTimer = setTimeout(stamp, 200);
  }, { passive: true });

  // The next page's HTML, fetched once and kept. A pointer over a header link or focus on it starts the
  // fetch, so by the click it is usually here.
  const pages = new Map();
  const fetchPage = (url) => {
    const key = url.href.split('#')[0];
    if (!pages.has(key)) {
      pages.set(key, fetch(key, { credentials: 'same-origin' }).then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${key}`);
        return r.text();
      }).catch((error) => { pages.delete(key); throw error; }));
    }
    return pages.get(key);
  };
  const turnLink = (target) => {
    const a = target?.closest?.('.demo-bar a[href]');
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return null;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.hash || order(url) < 0) return null;
    return url;
  };
  const warm = (e) => {
    const url = turnLink(e.target);
    if (url && order(url) !== current) fetchPage(url).catch(() => {});
  };
  document.addEventListener('pointerover', warm, { passive: true });
  document.addEventListener('focusin', warm);

  // Swap everything that differs between the pages: title, description, body classes, the header's
  // current link (its underline glides, view-transition-name demo-page-mark) and all of the body after the
  // header (main, the build bar inside it, the footer, the dialog, the status line).
  const swap = (doc) => {
    document.title = doc.title;
    const description = document.querySelector('meta[name="description"]');
    const next = doc.querySelector('meta[name="description"]');
    if (description && next) description.content = next.content;
    const links = bar.querySelector('.demo-bar__links');
    const nextLinks = doc.querySelector('.demo-bar__links');
    if (links && nextLinks) links.innerHTML = nextLinks.innerHTML;
    const nextBar = doc.querySelector('.demo-bar');
    // Exploded view is a reading mode: it carries over to the next page.
    const exploded = document.getElementById('explode')?.checked;
    const nextExplode = doc.getElementById('explode');
    if (nextExplode) nextExplode.checked = Boolean(exploded);
    for (let n = bar.nextSibling; n;) {
      const after = n.nextSibling;
      if (!(n.nodeType === 1 && n.hasAttribute('data-turn-keep'))) n.remove();
      n = after;
    }
    const fresh = document.createDocumentFragment();
    for (let n = nextBar.nextSibling; n;) {
      const after = n.nextSibling;
      fresh.append(document.adoptNode(n));
      n = after;
    }
    bar.after(fresh);
    document.body.className = doc.body.className;
  };

  // Screen readers hear the new page: focus goes to its heading (a ring only after keyboard use).
  const focusHeading = () => {
    const h1 = document.querySelector('main h1');
    if (!h1) return;
    if (!h1.hasAttribute('tabindex')) h1.tabIndex = -1;
    h1.focus({ preventScroll: true });
  };

  let seq = 0;
  let active = null;
  // Turn to url. push: a new history entry (a click); otherwise Back/Forward already moved the entry.
  const turnTo = async (url, { push, key, scroll = 0 }) => {
    const id = ++seq;
    const bail = () => (push ? location.assign(url.href) : location.reload());
    let doc;
    try {
      doc = new DOMParser().parseFromString(await fetchPage(url), 'text/html');
      if (!doc.querySelector('.demo-bar') || !doc.querySelector('main')) throw new Error('Not a booklet page');
    } catch {
      bail();
      return;
    }
    if (id !== seq) return; // a later turn took over
    const to = order(url);
    const dir = to > current ? 'forward' : 'back';
    if (push) stamp();
    let pushed = false;
    const update = () => {
      teardown();
      teardown = () => {};
      swap(doc);
      if (push) {
        entryKey = newKey();
        history.pushState({ key: entryKey, scroll: 0 }, '', url.href);
        pushed = true;
      } else {
        entryKey = key;
        turning = false;
      }
      current = to;
      scrollTo({ top: scroll, left: 0, behavior: 'instant' });
      teardown = initPage(document.body);
      focusHeading();
    };
    const fail = () => (pushed ? location.reload() : bail());
    if (!document.startViewTransition) {
      try { update(); } catch { fail(); }
      return;
    }
    active?.skipTransition();
    root.dataset.turnDir = dir;
    root.dataset.turn = turnStyle;
    const transition = document.startViewTransition(update);
    active = transition;
    transition.updateCallbackDone.catch(fail);
    transition.ready.catch(() => {}); // a turn cut short by the next one is not an error
    transition.finished.catch(() => {}).finally(() => {
      if (active !== transition) return;
      active = null;
      delete root.dataset.turnDir;
      delete root.dataset.turn;
    });
  };

  // A plain left click on a header link to another booklet page turns in place; anything else (a new
  // tab, a modifier key, the page you're on) is left to the browser.
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const url = turnLink(e.target);
    if (!url || order(url) === current) return;
    e.preventDefault();
    turnTo(url, { push: true });
  });

  // Back and Forward between booklet pages turn the same way, in the direction of the pages' order, and
  // land where the reader left that entry. Moves within one page (a jumped-to step) keep their place.
  addEventListener('popstate', (e) => {
    const to = order(location.href);
    const key = e.state?.key;
    const scroll = scrolls.get(key) ?? e.state?.scroll;
    if (to < 0) { location.reload(); return; }
    if (to === current) {
      // A fragment link adds an entry without state (the browser scrolls); traversals carry a position.
      entryKey = key || newKey();
      if (typeof scroll === 'number') scrollTo({ top: scroll, left: 0, behavior: 'instant' });
      return;
    }
    turning = true;
    clearTimeout(stampTimer);
    turnTo(new URL(location.href), { push: false, key: key || newKey(), scroll: typeof scroll === 'number' ? scroll : 0 });
  });
})();
