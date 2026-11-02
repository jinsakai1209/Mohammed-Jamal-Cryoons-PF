(() => {
    'use strict';

    // ---- Hero: mouse-scrub video + typewriter ----
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const narrow = matchMedia('(max-width: 768px)').matches;

    // Scrub the hero video with horizontal cursor movement.
    //
    // Deliberately NOT gated on pointer/reduced-motion media queries: those are
    // proxies that misreport (a touchscreen laptop claims pointer:coarse; Windows
    // with animation effects off reports reduced-motion) and silently killed the
    // whole interaction. Instead we wait for a real mousemove with real movement,
    // which is direct proof a pointer exists. The motion here is entirely
    // user-driven - nothing moves on its own - so it stays reduced-motion safe.
    const hv = document.getElementById('heroVideo');
    if (hv && !narrow) {
        const SENSITIVITY = 0.8;
        let prevX = null, targetTime = 0, easedTime = 0, live = false, raf = 0;

        const start = () => {
            if (raf) return;
            live = true;
            document.querySelector('.hero-media')?.classList.add('scrub-live');
            const tick = () => {
                if (hv.duration) {
                    easedTime += (targetTime - easedTime) * 0.18;
                    if (!hv.seeking && Math.abs(easedTime - hv.currentTime) > 0.008) {
                        try { hv.currentTime = easedTime; } catch (e) { /* not seekable yet */ }
                    }
                }
                raf = requestAnimationFrame(tick);
            };
            raf = requestAnimationFrame(tick);
        };

        window.addEventListener('mousemove', e => {
            if (prevX === null) { prevX = e.clientX; return; }
            const delta = e.clientX - prevX;
            prevX = e.clientX;
            if (!delta) return;
            if (!live) {                      // first real movement proves a pointer
                easedTime = targetTime = hv.currentTime || 0;
                start();
            }
            if (!hv.duration) return;
            targetTime += (delta / window.innerWidth) * SENSITIVITY * hv.duration;
            targetTime = Math.max(0, Math.min(hv.duration, targetTime));
        }, { passive: true });
    }

    // Reveal the hero paragraph word by word: each word fades up out of a
    // slight blur. Words are laid out immediately (just invisible), so unlike
    // a typewriter there is no reflow and no waiting to read.
    const typeEl = document.getElementById('heroType');
    if (typeEl) {
        const words = typeEl.textContent.trim().split(/\s+/);
        if (reducedMotion) {
            typeEl.textContent = words.join(' ');
        } else {
            typeEl.textContent = '';
            words.forEach(w => {
                const span = document.createElement('span');
                span.className = 'word-rise';
                span.textContent = w;
                // real space between spans keeps the text selectable and readable
                typeEl.append(span, document.createTextNode(' '));
            });
            requestAnimationFrame(() => {
                typeEl.querySelectorAll('.word-rise').forEach((span, i) => {
                    setTimeout(() => span.classList.add('is-in'), 300 + i * 32);
                });
            });
        }
    }

    // Actions fade up on their own timer, not gated on the typing finishing.
    const actions = document.querySelector('.hero-actions');
    if (actions && !reducedMotion) {
        actions.classList.remove('rv');
        actions.classList.add('is-pending');
        setTimeout(() => {
            actions.classList.add('is-in');
            actions.classList.remove('is-pending');
        }, 400);
    }

    // Theme
    const root = document.documentElement;
    const btn = document.getElementById('themeBtn');
    root.setAttribute('data-theme', localStorage.getItem('portfolio-theme') || 'dark');

    if (btn) {
        btn.addEventListener('click', () => {
            const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', next);
            localStorage.setItem('portfolio-theme', next);
        });
    }

    // Reveal on scroll
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('on');
                obs.unobserve(e.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.rv').forEach(el => obs.observe(el));

    // Stagger children of index-style lists
    document.querySelectorAll('.work-index, .blog-list, .tools-grid, .approach-steps, .stat-row').forEach(group => {
        const kids = group.querySelectorAll('.rv');
        if (!kids.length) return;
        const gObs = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    kids.forEach((c, i) => setTimeout(() => c.classList.add('on'), i * 90));
                    gObs.unobserve(group);
                }
            });
        }, { threshold: 0.1 });
        gObs.observe(group);
    });

    // Mobile menu
    const burger = document.getElementById('burger');
    const mob = document.getElementById('mobMenu');
    if (burger && mob) {
        burger.addEventListener('click', () => {
            burger.classList.toggle('open');
            mob.classList.toggle('open');
            document.body.style.overflow = mob.classList.contains('open') ? 'hidden' : '';
        });
        mob.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
            burger.classList.remove('open');
            mob.classList.remove('open');
            document.body.style.overflow = '';
        }));
    }

    // Nav collapse on scroll
    const navEl = document.querySelector('nav');
    if (navEl) {
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                navEl.classList.toggle('nav-collapsed', window.scrollY > 40);
                ticking = false;
            });
        }, { passive: true });
    }

    // Smooth scroll for in-page anchors
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        const href = a.getAttribute('href');
        if (href === '#') return;
        a.addEventListener('click', e => {
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();
            window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
        });
    });

    // Active nav link
    const links = document.querySelectorAll('.nav-links a[href^="#"]');
    if (links.length) {
        const sections = document.querySelectorAll('section[id]');
        const visible = new Set();
        const secObs = new IntersectionObserver(entries => {
            entries.forEach(e => e.isIntersecting ? visible.add(e.target) : visible.delete(e.target));
            // Highest section still in view wins, so the order never depends on callback order.
            const top = [...visible].sort((a, b) => a.offsetTop - b.offsetTop)[0];
            links.forEach(l => l.classList.toggle(
                'is-active', !!top && l.getAttribute('href') === `#${top.id}`
            ));
        }, { threshold: 0.25, rootMargin: '-80px 0px -50% 0px' });
        sections.forEach(s => secObs.observe(s));
    }
})();
