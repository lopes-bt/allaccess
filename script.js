/* ALL ACCESS AGENCY — film reel interactions
   - Watches active frame, ticks chapter counter (top-right)
   - Morphs the bottom-left chapter label
   - Updates the scroll progress bar
   - Live NYC timecode (HH:MM)
   - Internal "Next →" anchors snap inside the reel container
   - Arrow / PageUp / PageDown / Home / End navigation
*/
(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  const reel        = $('#reel');
  const frames      = $$('.frame', reel);
  const chapterEl   = $('#chapter');
  const numEl       = $('#chapterNum');
  const nameEl      = $('#chapterName');
  const labelWrap   = $('.meta--label');
  const progressBar = $('#progressBar');
  const timeEl      = $('#time');

  let activeNum = '01';

  /* ---------------- Chapter switching ---------------- */
  const setChapter = (num, name) => {
    if (num === activeNum) return;
    activeNum = num;

    chapterEl.style.opacity = '0';
    labelWrap.classList.add('is-changing');

    setTimeout(() => {
      chapterEl.textContent = num;
      numEl.textContent     = num;
      nameEl.textContent    = name;
      chapterEl.style.opacity = '1';
      labelWrap.classList.remove('is-changing');
    }, 180);
  };

  /* ---------------- Active-frame observer ---------------- */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      let top = null;
      entries.forEach(e => {
        if (!top || e.intersectionRatio > top.intersectionRatio) top = e;
      });
      if (top && top.isIntersecting && top.intersectionRatio > 0.55) {
        const el = top.target;
        el.classList.add('is-active');
        frames.forEach(f => { if (f !== el) f.classList.remove('is-active'); });
        setChapter(el.dataset.num, el.dataset.label);
      }
    }, { root: reel, threshold: [0.55, 0.75, 0.95] });

    frames.forEach(f => io.observe(f));
  } else {
    frames.forEach(f => f.classList.add('is-active'));
  }

  /* ---------------- Internal jump-links ---------------- */
  // Anchors with [data-jump] live inside the reel; default # behavior would scroll
  // the document, but our scroll container is .reel — so target in-reel manually.
  $$('[data-jump]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Brand mark also targets cover inside the reel
  const markLink = $('.mark');
  if (markLink) {
    markLink.addEventListener('click', (e) => {
      e.preventDefault();
      $('#cover').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* ---------------- Scroll progress ---------------- */
  const onScroll = () => {
    const max = reel.scrollHeight - reel.clientHeight;
    const p = max > 0 ? reel.scrollTop / max : 0;
    progressBar.style.transform = `scaleX(${p})`;
  };
  reel.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------- Keyboard navigation ---------------- */
  document.addEventListener('keydown', (e) => {
    const keys = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const idx = Math.max(0, frames.findIndex(f => f.classList.contains('is-active')));
    let next = idx;
    if (e.key === 'ArrowDown' || e.key === 'PageDown') next = Math.min(frames.length - 1, idx + 1);
    if (e.key === 'ArrowUp'   || e.key === 'PageUp')   next = Math.max(0, idx - 1);
    if (e.key === 'Home') next = 0;
    if (e.key === 'End')  next = frames.length - 1;
    if (next !== idx) frames[next].scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* ---------------- Contact form → /api/contact (Postgres) ---------------- */
  const form    = $('#contactForm');
  const success = $('#contactSuccess');
  const submit  = $('#contactSubmit');

  if (form && success && submit) {
    const submitLabel = submit.querySelector('.contact__submit-label');
    const setLabel = (txt) => { if (submitLabel) submitLabel.textContent = txt; };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // honeypot — silently drop bot submissions
      if (form.botcheck && form.botcheck.checked) return;

      // basic native validation
      if (!form.checkValidity()) { form.reportValidity(); return; }

      submit.disabled = true;
      setLabel('Sending…');

      const data = new FormData(form);
      const payload = {
        name:    data.get('name')    || '',
        email:   data.get('email')   || '',
        phone:   data.get('phone')   || '',
        message: data.get('message') || '',
      };

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({}));

        if (res.ok && json.success) {
          form.classList.add('is-hidden');
          success.hidden = false;
          success.setAttribute('aria-live', 'polite');
        } else {
          throw new Error(json.error || `HTTP ${res.status}`);
        }
      } catch (err) {
        console.error('[contact]', err);
        setLabel('Try again →');
        submit.disabled = false;
      }
    });
  }

  /* ---------------- Live local timecode (visitor's tz) ---------------- */
  const zoneEl = $('#zone');
  if (timeEl) {
    // Resolve visitor timezone label once (e.g. "PST", "EST", "BST", "CET")
    let zoneLabel = '';
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZoneName: 'short',
        hour: '2-digit'
      }).formatToParts(new Date());
      const z = parts.find(p => p.type === 'timeZoneName');
      if (z) zoneLabel = z.value;
    } catch { /* noop */ }
    if (!zoneLabel) {
      try { zoneLabel = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local'; } catch { zoneLabel = 'Local'; }
    }
    if (zoneEl) zoneEl.textContent = zoneLabel;

    const tick = () => {
      try {
        const t = new Date().toLocaleTimeString([], {
          hour: '2-digit', minute: '2-digit', hour12: false
        });
        timeEl.textContent = t;
      } catch { /* noop */ }
    };
    tick();
    setInterval(tick, 30000);
  }
})();
