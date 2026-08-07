document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const smoothBehavior = prefersReducedMotion ? 'auto' : 'smooth';

  // --- Mobile Nav Toggle ---
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');

  const closeNav = () => {
    if (navToggle && navLinks) {
      navToggle.classList.remove('active');
      navToggle.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('open');
    }
  };

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.classList.toggle('active', isOpen);
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeNav);
    });
  }

  // --- Hero Background Video (native autoplay; hide poster once playing) ---
  const heroVideo = document.querySelector('.hero-bg');
  if (heroVideo) {
    const hidePoster = () => heroVideo.parentElement.classList.add('hero-video-playing');
    heroVideo.addEventListener('playing', hidePoster);
    if (!heroVideo.paused) hidePoster();
    heroVideo.play().catch(() => {});
  }

  // --- Gallery Horizontal Strip ---
  const track = document.getElementById('gallery-track');
  const prevBtn = document.getElementById('gallery-prev');
  const nextBtn = document.getElementById('gallery-next');
  const progressFill = document.getElementById('gallery-progress-fill');
  const counter = document.getElementById('gallery-counter');

  const getVisibleItems = () =>
    Array.from(track.querySelectorAll('.gallery-item')).filter(
      item => item.style.display !== 'none'
    );

  const cardStep = () => {
    const first = track.querySelector('.gallery-item');
    if (!first) return track.clientWidth;
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    return first.offsetWidth + gap;
  };

  const updateControls = () => {
    if (!track) return;
    const max = track.scrollWidth - track.clientWidth;
    const pos = track.scrollLeft;

    if (prevBtn) prevBtn.disabled = pos <= 1;
    if (nextBtn) nextBtn.disabled = pos >= max - 1;

    if (progressFill) {
      progressFill.style.width = max > 0 ? `${(pos / max) * 100}%` : '0%';
    }

    if (counter) {
      const items = getVisibleItems();
      const trackRect = track.getBoundingClientRect();
      const center = trackRect.left + track.clientWidth / 2;
      let current = items.length;
      let bestDist = Infinity;
      for (let i = 0; i < items.length; i++) {
        const r = items[i].getBoundingClientRect();
        const dist = Math.abs((r.left + r.right) / 2 - center);
        if (dist < bestDist) {
          bestDist = dist;
          current = i + 1;
        }
      }
      counter.textContent = `${current} / ${items.length}`;
    }
  };

  const scrollTrackBy = (delta) => {
    if (track) track.scrollBy({ left: delta, behavior: smoothBehavior });
  };

  if (track) {
    track.addEventListener('scroll', updateControls);
    updateControls();
  }

  // Drag to scroll with click-vs-drag guard
  if (track) {
    let isDown = false;
    let startX = 0;
    let startLeft = 0;
    let dragMoved = false;

    track.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      isDown = true;
      dragMoved = false;
      startX = e.clientX;
      startLeft = track.scrollLeft;
      track.classList.add('dragging');
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 5) dragMoved = true;
      track.scrollLeft = startLeft - dx;
    });

    const endDrag = () => {
      isDown = false;
      track.classList.remove('dragging');
      setTimeout(() => { dragMoved = false; }, 0);
    };

    window.addEventListener('mouseup', endDrag);
    track.addEventListener('mouseleave', endDrag);

    track.addEventListener('click', (e) => {
      if (dragMoved) {
        e.preventDefault();
        e.stopPropagation();
        dragMoved = false;
      }
    }, true);
  }

  // Arrow buttons
  if (prevBtn) prevBtn.addEventListener('click', () => scrollTrackBy(-cardStep()));
  if (nextBtn) nextBtn.addEventListener('click', () => scrollTrackBy(cardStep()));

  // Keyboard navigation on the strip
  if (track) {
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        scrollTrackBy(cardStep());
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        scrollTrackBy(-cardStep());
      }
    });
  }

  // --- Category Filter Tabs ---
  const filterBtns = document.querySelectorAll('.filter-btn');

  const applyFilter = () => {
    const visible = getVisibleItems();
    visible.forEach(item => {
      item.style.opacity = '1';
      item.style.transform = 'scale(1)';
    });

    if (track) {
      track.scrollLeft = 0;
      updateControls();
    }
    return visible;
  };

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterCategory = btn.getAttribute('data-filter');

      track.querySelectorAll('.gallery-item').forEach(item => {
        const itemCategory = item.getAttribute('data-category');

        if (filterCategory === 'all' || itemCategory === filterCategory) {
          item.style.display = 'block';
          item.style.opacity = '0';
          item.style.transform = 'scale(0.95)';
          setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'scale(1)';
          }, 50);
        } else {
          item.style.opacity = '0';
          item.style.transform = 'scale(0.95)';
          setTimeout(() => {
            item.style.display = 'none';
          }, 300);
        }
      });

      setTimeout(applyFilter, 350);
    });
  });

  // --- FAQ Accordion ---
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (!question) return;

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      faqItems.forEach(other => {
        other.classList.remove('open');
        const btn = other.querySelector('.faq-question');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('open');
        question.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // --- Modal Lightbox ---
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxCategory = document.getElementById('lightbox-category');
  const lightboxBody = document.getElementById('lightbox-body');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');

  let lightboxItems = [];
  let lightboxIndex = 0;
  let lastLightboxItem = null;

  function populateLightbox(item) {
    const imgSrc = item.getAttribute('data-image');
    const title = item.getAttribute('data-title');
    const category = item.getAttribute('data-category');
    const description = item.getAttribute('data-description');
    const titleScript = item.getAttribute('data-title-script') === 'true';

    if (lightboxImg) {
      lightboxImg.querySelectorAll('source').forEach(s => s.remove());
      const avifSrc = item.getAttribute('data-image-avif');
      if (avifSrc) {
        const s = document.createElement('source');
        s.src = avifSrc;
        s.type = 'image/avif';
        lightboxImg.appendChild(s);
      }
      lightboxImg.src = imgSrc;
    }
    if (lightboxTitle) {
      lightboxTitle.textContent = title;
      lightboxTitle.classList.toggle('script', titleScript);
    }
    if (lightboxCategory) lightboxCategory.textContent = category;
    if (lightboxBody) lightboxBody.textContent = description || '';

    const hasNav = lightboxItems.length > 1;
    if (lightboxPrev) lightboxPrev.classList.toggle('hidden', !hasNav);
    if (lightboxNext) lightboxNext.classList.toggle('hidden', !hasNav);
  }

  function openLightbox(item) {
    lastLightboxItem = item;
    lightboxItems = getVisibleItems();
    lightboxIndex = lightboxItems.indexOf(item);
    if (lightboxIndex === -1) lightboxIndex = 0;

    populateLightbox(item);

    if (lightboxModal) {
      lightboxModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeLightbox() {
    if (lightboxModal) {
      lightboxModal.classList.remove('active');
      document.body.style.overflow = 'auto';
    }
    if (lastLightboxItem && typeof lastLightboxItem.focus === 'function') {
      lastLightboxItem.focus();
    }
  }

  function navigateLightbox(delta) {
    if (!lightboxItems.length) return;
    lightboxIndex = (lightboxIndex + delta + lightboxItems.length) % lightboxItems.length;
    populateLightbox(lightboxItems[lightboxIndex]);
  }

  track.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => openLightbox(item));
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(item);
      }
    });
  });

  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
  }
  if (lightboxPrev) lightboxPrev.addEventListener('click', (e) => {
    e.stopPropagation();
    navigateLightbox(-1);
  });
  if (lightboxNext) lightboxNext.addEventListener('click', (e) => {
    e.stopPropagation();
    navigateLightbox(1);
  });

  if (lightboxModal) {
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) {
        closeLightbox();
      }
    });
  }

  // Swipe between images inside the lightbox
  if (lightboxModal) {
    let touchStartX = 0;
    lightboxModal.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });

    lightboxModal.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 50) {
        navigateLightbox(dx < 0 ? 1 : -1);
      }
    }, { passive: true });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
    if (lightboxModal && lightboxModal.classList.contains('active')) {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateLightbox(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateLightbox(-1);
      }
    }
  });
});
