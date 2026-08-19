/* ============================================================
   MAIN.JS — shared behaviour across every page
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---- mobile menu open/close ---- */
  const burger = document.getElementById('burgerBtn');
  const header = document.getElementById('siteHeader');

  if (burger && header) {
    burger.addEventListener('click', () => {
      const open = header.classList.toggle('open');
      burger.setAttribute('aria-expanded', open);
    });

    // close the mobile menu after a plain nav link is followed
    document.querySelectorAll('nav.links > .nav-item > a:not(.has-dropdown-trigger), .header-cta, .dropdown a')
      .forEach(a => a.addEventListener('click', () => header.classList.remove('open')));
  }

  /* ---- mobile accordion for the Services dropdown ---- */
  document.querySelectorAll('.nav-item.has-dropdown > a').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      if (window.innerWidth > 720) return; // desktop uses hover
      const item = trigger.closest('.nav-item');
      const alreadyOpen = item.classList.contains('open');
      // only intercept the click to expand/collapse on mobile
      e.preventDefault();
      item.classList.toggle('open', !alreadyOpen);
    });
  });

  /* ---- hero slideshow ---- */
  const heroSection = document.getElementById('heroSlideshow');
  if (heroSection) {
    const slides = heroSection.querySelectorAll('.hero-slide');
    const dots = heroSection.querySelectorAll('.hero-dot');
    let current = 0;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function goTo(index) {
      slides[current].classList.remove('active');
      dots[current].classList.remove('active');
      current = (index + slides.length) % slides.length;
      slides[current].classList.add('active');
      dots[current].classList.add('active');
    }

    dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));

    if (!prefersReduced && slides.length > 1) {
      setInterval(() => goTo(current + 1), 5500);
    }
  }

  /* ---- carousels (team / testimonials) ---- */
  document.querySelectorAll('[data-carousel]').forEach(btn => {
    btn.addEventListener('click', () => {
      const track = document.getElementById(btn.dataset.carousel);
      if (!track) return;
      const card = track.querySelector(':scope > *');
      const step = card ? card.getBoundingClientRect().width + 24 : 260; // card width + gap
      const dir = btn.classList.contains('next') ? 1 : -1;
      track.scrollBy({ left: dir * step, behavior: 'smooth' });
    });
  });

  /* ---- auto-sliding carousels (team / testimonials) ---- */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setupAutoCarousel(trackId, intervalMs) {
    const track = document.getElementById(trackId);
    if (!track || prefersReducedMotion) return;
    let timer;

    function step() {
      const card = track.querySelector(':scope > *');
      const gap = 24;
      const cardStep = card ? card.getBoundingClientRect().width + gap : 260;
      const maxScroll = track.scrollWidth - track.clientWidth;
      if (track.scrollLeft >= maxScroll - 4) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        track.scrollBy({ left: cardStep, behavior: 'smooth' });
      }
    }

    function start() { timer = setInterval(step, intervalMs); }
    function stop() { clearInterval(timer); }

    start();
    track.addEventListener('mouseenter', stop);
    track.addEventListener('mouseleave', start);
    track.addEventListener('touchstart', stop, { passive: true });
    track.addEventListener('touchend', start);
  }

  setupAutoCarousel('team-track', 3200);
  setupAutoCarousel('testi-track', 4200);

  /* ---- partner logo carousel ---- */
  const partnerCarousel = document.getElementById('partnerCarousel');
  if (partnerCarousel) {
    const track = document.getElementById('partnerTrack');
    const dotsWrap = document.getElementById('partnerDots');
    const logos = Array.from(track.children);
    let pages = [];
    let page = 0;
    let timer;

    function perPage() {
      if (window.innerWidth <= 620) return 2;
      if (window.innerWidth <= 920) return 3;
      return 5;
    }

    function goTo(i, animate = true) {
      page = (i + pages.length) % pages.length;
      track.style.transition = animate ? 'transform .6s ease' : 'none';
      track.style.transform = `translateX(-${page * 100}%)`;
      dotsWrap.querySelectorAll('.partner-dot').forEach((d, idx) => d.classList.toggle('active', idx === page));
    }

    function startAuto() {
      clearInterval(timer);
      if (pages.length > 1 && !prefersReducedMotion) {
        timer = setInterval(() => goTo(page + 1), 4000);
      }
    }

    function build() {
      const n = perPage();
      pages = [];
      for (let i = 0; i < logos.length; i += n) pages.push(logos.slice(i, i + n));

      track.innerHTML = '';
      pages.forEach(group => {
        const pageEl = document.createElement('div');
        pageEl.className = 'partner-page';
        group.forEach(logo => pageEl.appendChild(logo));
        track.appendChild(pageEl);
      });

      dotsWrap.innerHTML = '';
      pages.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'partner-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `Show partners page ${i + 1}`);
        dot.addEventListener('click', () => { goTo(i); startAuto(); });
        dotsWrap.appendChild(dot);
      });
      dotsWrap.style.display = pages.length > 1 ? 'flex' : 'none';

      page = Math.min(page, pages.length - 1);
      goTo(page, false);
    }

    build();
    startAuto();

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { build(); startAuto(); }, 200);
    });
  }

  /* ---- animated stat counters ---- */
  const statNums = document.querySelectorAll('.stats .num[data-count]');
  if (statNums.length) {
    const animateCount = (el) => {
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      const plain = el.dataset.plain === 'true';
      const format = (n) => plain ? String(n) : n.toLocaleString();

      if (prefersReducedMotion) {
        el.textContent = format(target) + suffix;
        return;
      }

      const duration = 1600;
      const start = performance.now();

      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = format(Math.round(target * eased));
        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          el.textContent = format(target) + suffix;
        }
      }
      requestAnimationFrame(tick);
    };

    const statObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          statObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    statNums.forEach(el => statObs.observe(el));
  }

  /* ---- scroll-reveal ---- */
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
});
