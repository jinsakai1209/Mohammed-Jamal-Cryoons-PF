(function () {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Intro: "You found me!" types once per visit, click to skip
    const intro = document.getElementById('intro');
    if (intro) {
        let seen = false;
        try { seen = sessionStorage.getItem('mj-intro') === '1'; } catch (e) {}
        if (reduced || seen) {
            intro.remove();
        } else {
            try { sessionStorage.setItem('mj-intro', '1'); } catch (e) {}
            const out = document.getElementById('introText');
            const msg = 'You found me!';
            let i = 0;
            const close = () => { intro.classList.add('done'); setTimeout(() => intro.remove(), 600); };
            const tick = setInterval(() => {
                out.textContent = msg.slice(0, ++i);
                if (i >= msg.length) { clearInterval(tick); setTimeout(close, 650); }
            }, 55);
            intro.addEventListener('click', () => { clearInterval(tick); close(); });
        }
    }

    // Mobile menu
    const burger = document.getElementById('burger');
    const menu = document.getElementById('mobMenu');
    if (burger && menu) {
        const set = open => {
            burger.setAttribute('aria-expanded', String(open));
            menu.classList.toggle('open', open);
        };
        burger.addEventListener('click', () => set(burger.getAttribute('aria-expanded') !== 'true'));
        menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => set(false)));
        document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
    }

    // Reveal on scroll
    const rv = document.querySelectorAll('.rv');
    if (reduced || !('IntersectionObserver' in window)) {
        rv.forEach(el => el.classList.add('on'));
    } else {
        const io = new IntersectionObserver(entries => {
            entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } });
        }, { rootMargin: '0px 0px -8% 0px' });
        rv.forEach(el => io.observe(el));
    }

    // Highlight the nav tab for the section in view
    const tabs = document.querySelectorAll('.nav-tabs a[data-spy]');
    const sections = [...tabs].map(t => document.getElementById(t.dataset.spy)).filter(Boolean);
    if (sections.length) {
        const spy = () => {
            const y = window.scrollY + window.innerHeight * .35;
            let current = sections[0].id;
            sections.forEach(s => { if (s.offsetTop <= y) current = s.id; });
            tabs.forEach(t => t.classList.toggle('active', t.dataset.spy === current));
        };
        window.addEventListener('scroll', spy, { passive: true });
        spy();
    }
    // Negative lens follows the pointer inside its zone
    if (!reduced) {
        document.querySelectorAll('.neg-zone').forEach(zone => {
            const lens = zone.querySelector('.negative');
            if (!lens) return;
            zone.addEventListener('pointermove', e => {
                const r = zone.getBoundingClientRect();
                lens.style.setProperty('--nx', (e.clientX - r.left) + 'px');
                lens.style.setProperty('--ny', (e.clientY - r.top) + 'px');
            });
            zone.addEventListener('pointerleave', () => {
                lens.style.removeProperty('--nx');
                lens.style.removeProperty('--ny');
            });
        });
    }
})();
