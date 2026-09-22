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

  const applyFilter = (filter) => {
    let shown = 0;
    projectCards.forEach((card) => {
      const match = filter === 'all' || card.dataset.cat === filter;
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
    const url = filter === 'all'
      ? location.pathname
      : `${location.pathname}?filter=${filter}`;
    history.replaceState(null, '', url);

    document.querySelectorAll('.nav-subitem a').forEach((a) => {
      a.classList.toggle('is-active', a.getAttribute('href').endsWith(`filter=${filter}`));
    });
  };

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => applyFilter(btn.dataset.filter));
  });

  const requested = new URLSearchParams(location.search).get('filter');
  const valid = requested &&
    Array.from(filterButtons).some((b) => b.dataset.filter === requested);
  applyFilter(valid ? requested : 'all');
}

/* ---------- enquiry form (contact.html) ----------
   Posts for real. If the Web3Forms access key hasn't been pasted in
   yet, it says so plainly and points the visitor at the email and
   phone number instead of silently swallowing the message. */
const contactForm = document.querySelector('#contact-form');

if (contactForm) {
  const status = document.querySelector('#form-status');
  const submitBtn = contactForm.querySelector('button[type="submit"]');
  const keyField = contactForm.querySelector('input[name="access_key"]');
  const key = keyField ? keyField.value.trim() : '';
  const isConfigured = key.length > 10 && !/^PASTE-/i.test(key);

  const say = (html, isError) => {
    if (!status) return;
    status.innerHTML = html;
    status.classList.toggle('form-status--error', !!isError);
    status.hidden = false;
  };

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!isConfigured) {
      say('This form isn&rsquo;t connected yet. Please email ' +
          '<a href="mailto:studio@arthanisa.com">studio@arthanisa.com</a> ' +
          'or call <a href="tel:+919769619011">+91 97696 19011</a>.', true);
      return;
    }

    const original = submitBtn.textContent;
    submitBtn.textContent = 'Sending…';
    submitBtn.disabled = true;
    say('Sending your message…');

    try {
      const res = await fetch(contactForm.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(contactForm),
      });

      if (res.ok) {
        say('Thank you — your message has reached the studio. We&rsquo;ll be in touch within two working days.');
        contactForm.reset();
      } else {
        throw new Error('Request failed: ' + res.status);
      }
    } catch (err) {
      // the message is NOT cleared, so nothing typed is lost
      say('Something went wrong sending that. Please try again, or email ' +
          '<a href="mailto:studio@arthanisa.com">studio@arthanisa.com</a> directly.', true);
    } finally {
      submitBtn.textContent = original;
      submitBtn.disabled = false;
    }
  });
}

/* ---------- footer year ---------- */
const yearEl = document.querySelector('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
