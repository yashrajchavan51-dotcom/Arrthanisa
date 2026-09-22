/* =========================================================
   ARTHANISA DESIGN STUDIO — site script

   Removed from the previous version, all of it dead:
     · the scroll-reveal IntersectionObserver (the CSS that made it
       work was disabled, so it was observing every element to do
       nothing)
     · syncAboutPhotoHeight() — targeted .about-split, a layout that
       no longer exists
     · a query for .project-card, which no page contains
   ========================================================= */

/* ---------- header scroll state ---------- */
const header = document.querySelector('.site-header');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const navMenu = document.querySelector('.nav-menu');

const closeMenu = () => {
  if (navLinks) navLinks.classList.remove('is-open');
  if (navToggle) {
    navToggle.classList.remove('is-active');
    navToggle.setAttribute('aria-expanded', 'false');
  }
};

if (header) {
  let wasScrolled = null;
  const onScroll = () => {
    const isScrolled = window.scrollY > 40;
    if (isScrolled === wasScrolled) return;
    // Only close the menu when the header actually changes mode — on a
    // wide screen the nav switches from an inline row to a dropdown at
    // that point. The old code closed the menu on *any* scroll, which
    // on iOS meant the address bar collapsing shut the menu the moment
    // you opened it.
    if (wasScrolled !== null) closeMenu();
    wasScrolled = isScrolled;
    header.classList.toggle('is-scrolled', isScrolled);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ---------- menu toggle ---------- */
if (navToggle && navLinks) {
  navToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = navLinks.classList.toggle('is-open');
    navToggle.classList.toggle('is-active', open);
    navToggle.setAttribute('aria-expanded', String(open));
  });

  navLinks.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));

  document.addEventListener('click', (e) => {
    if (navMenu && !navMenu.contains(e.target)) closeMenu();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('is-open')) {
      closeMenu();
      navToggle.focus();
    }
  });
}

/* ---------- project filter (projects.html) ---------- */
const filterButtons = document.querySelectorAll('.filter-btn');

if (filterButtons.length) {
  const projectCards = document.querySelectorAll('.project-feature');
  const emptyState = document.querySelector('#projects-empty');
  // whichever button is first in the markup is the landing view
  const DEFAULT_FILTER = filterButtons[0].dataset.filter;

  // updateUrl is false on first load, so arriving at projects.html
  // doesn't immediately rewrite the address bar with ?filter=...
  const applyFilter = (filter, updateUrl) => {
    let shown = 0;
    projectCards.forEach((card) => {
      const match = card.dataset.cat === filter;
      card.classList.toggle('is-hidden', !match);
      if (match) shown++;
    });
    // a filter with no projects used to leave a blank page
    if (emptyState) emptyState.hidden = shown > 0;

    filterButtons.forEach((b) => {
      const active = b.dataset.filter === filter;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-pressed', String(active));
    });

    // keep the address bar in step so a filtered view can be shared
    if (updateUrl) {
      history.replaceState(null, '', `${location.pathname}?filter=${filter}`);
    }

    document.querySelectorAll('.nav-subitem a').forEach((a) => {
      a.classList.toggle('is-active', a.getAttribute('href').endsWith(`filter=${filter}`));
    });
  };

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => applyFilter(btn.dataset.filter, true));
  });

  const requested = new URLSearchParams(location.search).get('filter');
  const valid = requested &&
    Array.from(filterButtons).some((b) => b.dataset.filter === requested);
  applyFilter(valid ? requested : DEFAULT_FILTER, false);
}

/* ---------- enquiry form (contact.html) ----------
   Two independent destinations, either or both:

   1. Web3Forms  -> a formatted email to the studio inbox.
      Paste the access key into contact.html.
   2. Google Sheet -> one row per enquiry, so there's a permanent,
      sortable record. Paste the Apps Script /exec URL below.
      Code and instructions: _setup/

   Whatever is configured gets the submission. If nothing is, the form
   says so and points the visitor at the email and phone number — it
   never fakes a success. */

const SHEET_ENDPOINT = '';   // <- paste the Google Apps Script /exec URL, or leave empty

const contactForm = document.querySelector('#contact-form');

if (contactForm) {
  const status = document.querySelector('#form-status');
  const submitBtn = contactForm.querySelector('button[type="submit"]');
  const keyField = contactForm.querySelector('input[name="access_key"]');
  const key = keyField ? keyField.value.trim() : '';

  const hasEmail = key.length > 10 && !/^PASTE-/i.test(key);
  const hasSheet = /^https:\/\/script\.google\.com\//.test(SHEET_ENDPOINT.trim());

  const say = (html, isError) => {
    if (!status) return;
    status.innerHTML = html;
    status.classList.toggle('form-status--error', !!isError);
    status.hidden = false;
  };

  const FALLBACK =
    'Please email <a href="mailto:studio@arthanisa.com">studio@arthanisa.com</a> ' +
    'or call <a href="tel:+919769619011">+91 97696 19011</a>.';

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!hasEmail && !hasSheet) {
      say('This form isn&rsquo;t connected yet. ' + FALLBACK, true);
      return;
    }

    const data = new FormData(contactForm);

    // A subject that names the project type and the enquirer, so the
    // studio inbox can be filtered and scanned without opening anything.
    const who = (data.get('Full Name') || 'Website visitor').toString().trim();
    const type = (data.get('Project Type') || '').toString().trim();
    data.set('subject', `Enquiry${type ? ' — ' + type : ''} — ${who}`);

    // Reply-to the enquirer, so hitting Reply in the inbox just works.
    const from = (data.get('Email Address') || '').toString().trim();
    if (from) data.set('replyto', from);

    const original = submitBtn.textContent;
    submitBtn.textContent = 'Sending…';
    submitBtn.disabled = true;
    say('Sending your message…');

    const jobs = [];

    if (hasEmail) {
      jobs.push(fetch(contactForm.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: data,
      }).then((r) => {
        if (!r.ok) throw new Error('web3forms ' + r.status);
      }));
    }

    if (hasSheet) {
      // urlencoded on purpose: a "simple" request, so the browser skips
      // the CORS preflight that Apps Script would reject.
      const params = new URLSearchParams();
      data.forEach((v, k) => { if (k !== 'access_key') params.append(k, v); });
      jobs.push(fetch(SHEET_ENDPOINT.trim(), { method: 'POST', body: params })
        .then((r) => { if (!r.ok) throw new Error('sheet ' + r.status); }));
    }

    const results = await Promise.allSettled(jobs);
    const anyOk = results.some((r) => r.status === 'fulfilled');

    if (anyOk) {
      say('Thank you — your message has reached the studio. We&rsquo;ll be in touch within two working days.');
      contactForm.reset();
      results.filter((r) => r.status === 'rejected')
             .forEach((r) => console.warn('Enquiry: one destination failed —', r.reason));
    } else {
      // nothing typed is cleared, so the visitor can just press Send again
      say('Something went wrong sending that. Please try again, or ' + FALLBACK, true);
      results.forEach((r) => r.status === 'rejected' && console.error('Enquiry failed:', r.reason));
    }

    submitBtn.textContent = original;
    submitBtn.disabled = false;
  });
}

/* ---------- footer year ---------- */
const yearEl = document.querySelector('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
