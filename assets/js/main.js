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

  // --- Back to Top ---
  const backToTop = document.getElementById('back-to-top');
  const scrollThreshold = 400;

  const updateBackToTop = () => {
    if (!backToTop) return;
    backToTop.classList.toggle('visible', window.scrollY > scrollThreshold);
  };

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: smoothBehavior });
    });
  }
  window.addEventListener('scroll', updateBackToTop, { passive: true });
  updateBackToTop();

  // --- Hero Background Video (native autoplay; hide poster once playing) ---
  const heroVideo = document.querySelector('.hero-bg');
  if (heroVideo) {
    const hidePoster = () => heroVideo.parentElement.classList.add('hero-video-playing');
    heroVideo.addEventListener('playing', hidePoster);
    if (!heroVideo.paused) hidePoster();
    heroVideo.play().catch(() => {});
  }

  // --- Gallery / Store Horizontal Strips (shared logic) ---
  const itemMatchesFilter = (item, filter) => {
    if (filter === 'all') return true;
    const tags = item.getAttribute('data-tags');
    if (tags) return tags.split(',').map(t => t.trim()).includes(filter);
    return item.getAttribute('data-category') === filter;
  };

  function initGalleryStrip({ track, prevBtn, nextBtn, progressFill, counter, filters, onOpen }) {
    if (!track) return null;

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
      track.scrollBy({ left: delta, behavior: smoothBehavior });
    };

    track.addEventListener('scroll', updateControls);
    updateControls();

    // Drag to scroll with click-vs-drag guard
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
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      track.scrollLeft = startLeft - dx;
      if (Math.abs(dx) > 5 && !dragMoved) {
        dragMoved = true;
        track.classList.add('dragging');
      }
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

    // Arrow buttons
    if (prevBtn) prevBtn.addEventListener('click', () => scrollTrackBy(-cardStep()));
    if (nextBtn) nextBtn.addEventListener('click', () => scrollTrackBy(cardStep()));

    // Keyboard navigation on the strip
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        scrollTrackBy(cardStep());
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        scrollTrackBy(-cardStep());
      }
    });

    // Filter tabs
    filters.forEach(btn => {
      btn.addEventListener('click', () => {
        filters.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filterValue = btn.getAttribute('data-filter');

        track.querySelectorAll('.gallery-item').forEach(item => {
          if (itemMatchesFilter(item, filterValue)) {
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

        setTimeout(() => {
          const visible = getVisibleItems();
          visible.forEach(item => {
            item.style.opacity = '1';
            item.style.transform = 'scale(1)';
          });
          track.scrollLeft = 0;
          updateControls();
        }, 350);
      });
    });

    // Open lightbox on click / keyboard
    track.querySelectorAll('.gallery-item').forEach(item => {
      item.addEventListener('click', () => onOpen(item, getVisibleItems()));
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(item, getVisibleItems());
        }
      });
    });

    return { getVisibleItems, updateControls };
  }

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
  const lightboxStore = document.getElementById('lightbox-store');
  const lightboxPrice = document.getElementById('lightbox-price');
  const lightboxBuy = document.getElementById('lightbox-buy');
  const lightboxSold = document.getElementById('lightbox-sold');

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

    const forSale = item.getAttribute('data-for-sale') === 'true';
    const price = item.getAttribute('data-price');
    const buyUrl = item.getAttribute('data-buy-url');
    const sold = item.getAttribute('data-sold') === 'true';

    if (lightboxStore) lightboxStore.hidden = !forSale;
    if (lightboxPrice) lightboxPrice.textContent = price || '';
    if (lightboxSold) lightboxSold.hidden = !(forSale && sold);
    if (lightboxBuy) {
      lightboxBuy.hidden = !(forSale && buyUrl && !sold);
      if (buyUrl) lightboxBuy.href = buyUrl;
    }

    const hasNav = lightboxItems.length > 1;
    if (lightboxPrev) lightboxPrev.classList.toggle('hidden', !hasNav);
    if (lightboxNext) lightboxNext.classList.toggle('hidden', !hasNav);
  }

  function openLightbox(item, items) {
    lastLightboxItem = item;
    lightboxItems = items || [];
    lightboxIndex = lightboxItems.indexOf(item);
    if (lightboxIndex === -1) lightboxIndex = 0;

    populateLightbox(item);

    if (lightboxClose) {
      const isStore = item.classList.contains('store-item');
      lightboxClose.setAttribute('aria-label', isStore ? 'Cerrar y volver a la tienda' : 'Cerrar y volver a la galería');
      const label = lightboxClose.querySelector('.lightbox-close-label');
      if (label) label.textContent = isStore ? 'Volver a la tienda' : 'Volver a la galería';
    }

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

  // --- Instantiate strips ---
  initGalleryStrip({
    track: document.getElementById('gallery-track'),
    prevBtn: document.getElementById('gallery-prev'),
    nextBtn: document.getElementById('gallery-next'),
    progressFill: document.getElementById('gallery-progress-fill'),
    counter: document.getElementById('gallery-counter'),
    filters: document.querySelectorAll('.portfolio-section .filter-btn'),
    onOpen: openLightbox,
  });

  initGalleryStrip({
    track: document.getElementById('store-track'),
    prevBtn: document.getElementById('store-prev'),
    nextBtn: document.getElementById('store-next'),
    progressFill: document.getElementById('store-progress-fill'),
    counter: document.getElementById('store-counter'),
    filters: document.querySelectorAll('#store-filters .filter-btn'),
    onOpen: openLightbox,
  });
});
