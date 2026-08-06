document.addEventListener('DOMContentLoaded', () => {
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

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
  });

  // --- Hero Background Video (native autoplay; hide poster once playing) ---
  const heroVideo = document.querySelector('.hero-bg');
  if (heroVideo) {
    const hidePoster = () => heroVideo.parentElement.classList.add('hero-video-playing');
    heroVideo.addEventListener('playing', hidePoster);
    if (!heroVideo.paused) hidePoster();
    heroVideo.play().catch(() => {});
  }

  // --- Category Filter Tabs ---
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterCategory = btn.getAttribute('data-filter');

      galleryItems.forEach(item => {
        const itemCategory = item.getAttribute('data-category');

        if (filterCategory === 'all' || itemCategory === filterCategory) {
          item.style.display = 'block';
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
    });
  });

  // --- Modal Lightbox ---
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxCategory = document.getElementById('lightbox-category');
  const lightboxBody = document.getElementById('lightbox-body');
  const lightboxClose = document.getElementById('lightbox-close');

  function openLightbox(item) {
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
  }

  galleryItems.forEach(item => {
    item.addEventListener('click', () => openLightbox(item));
  });

  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
  }

  if (lightboxModal) {
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) {
        closeLightbox();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightboxModal && lightboxModal.classList.contains('active')) {
      closeLightbox();
    }
  });
});
