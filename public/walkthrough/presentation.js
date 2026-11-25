const chapters = [...document.querySelectorAll('main .chapter')];
    const main = document.getElementById('walkthrough');
    const present = document.getElementById('present');
    const previous = document.getElementById('previous');
    const next = document.getElementById('next');
    const progress = document.getElementById('progress');
    const lightbox = document.getElementById('lightbox');
    let presenting = false;
    let current = 0;

    function showChapter(index, focus = true) {
      current = Math.max(0, Math.min(index, chapters.length - 1));
      chapters.forEach((section, position) => { section.hidden = presenting && position !== current; });
      previous.disabled = current === 0;
      next.disabled = current === chapters.length - 1;
      progress.textContent = chapters[current].dataset.title + ' · ' + (current + 1) + ' of ' + chapters.length;
      if (presenting) {
        main.scrollTop = 0;
        if (focus) chapters[current].querySelector('h1, h2').focus({ preventScroll: true });
      }
    }

    function togglePresentation(enable) {
      if (enable) {
        const offset = document.querySelector('.masthead').offsetHeight + 70;
        const visible = chapters.findLastIndex((section) => section.getBoundingClientRect().top <= offset);
        current = Math.max(0, visible);
      }
      presenting = enable;
      document.body.classList.toggle('stage', enable);
      present.setAttribute('aria-pressed', String(enable));
      present.textContent = enable ? 'Exit presentation' : 'Present';
      showChapter(current, enable);
      if (!enable) {
        chapters[current].scrollIntoView({ block: 'start', behavior: 'instant' });
        present.focus({ preventScroll: true });
      }
    }

    present.addEventListener('click', () => togglePresentation(!presenting));
    previous.addEventListener('click', () => showChapter(current - 1));
    next.addEventListener('click', () => showChapter(current + 1));
    document.addEventListener('click', (event) => {
      if (!presenting || event.defaultPrevented) return;
      const link = event.target.closest('a[href^="#"]');
      if (!link) return;
      const index = chapters.findIndex((chapter) => '#' + chapter.id === link.getAttribute('href'));
      if (index < 0) return;
      event.preventDefault();
      showChapter(index);
    });
    document.addEventListener('keydown', (event) => {
      if (!presenting || lightbox.open || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'ArrowRight' || event.key === 'PageDown') {
        event.preventDefault();
        showChapter(current + 1);
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault();
        showChapter(current - 1);
      } else if (event.key === 'Escape') {
        togglePresentation(false);
      }
    });
    for (const button of document.querySelectorAll('[data-zoom]')) {
      button.addEventListener('click', () => {
        const source = button.querySelector('img');
        const large = document.getElementById('large-image');
        large.src = source.currentSrc || source.src;
        large.alt = source.alt;
        document.getElementById('lightbox-title').textContent = button.getAttribute('aria-label').replace('Enlarge the ', '').replace(' screenshot', '');
        lightbox.showModal();
      });
    }
    document.getElementById('close-image').addEventListener('click', () => lightbox.close());
    lightbox.addEventListener('click', (event) => { if (event.target === lightbox) lightbox.close(); });
