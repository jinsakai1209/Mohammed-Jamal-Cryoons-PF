(function () {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Hero load-in: pieces pop, rise and drop into place once the splash closes
    const hero = document.querySelector('.hero');
    let heroGo = () => {};
    if (hero && !reduced) {
        const line = hero.querySelector('.hero-line');
        if (line) {
            [...line.childNodes].forEach(node => {
                if (node.nodeType === 3) {
                    const frag = document.createDocumentFragment();
                    node.textContent.split(/(\s+)/).forEach(part => {
                        if (!part) return;
                        if (/^\s+$/.test(part)) { frag.append(part); return; }
                        const w = document.createElement('span');
                        w.className = 'w';
                        w.textContent = part;
                        frag.append(w);
                    });
                    node.replaceWith(frag);
                } else if (node.nodeType === 1) {
                    node.classList.add('w');
                }
            });
        }
        const steps = [];
        const at = (sel, kind, d, step = 0) => hero.querySelectorAll(sel).forEach((el, i) => steps.push([el, kind, d + i * step]));
        at('.my-name', 'up', 0);
        at('.select-box', 'pop', .05);
        at('.hero-name .ch', 'rise', .25, .07);
        at('.select-box .dims', 'up', .6);
        at('.name-stage .s1', 'drop-sm', .7);
        at('.name-stage .s2', 'drop-sm', .8);
        at('.name-stage .s3', 'drop-lg', .85);
        at('.name-stage .s4', 'drop-md', .95);
        at('.name-stage .arrow', 'drop-md', 1.05, .06);
        at('.status', 'up', 1.05);
        at('.hero-line .w', 'rise', 1.15, .05);
        at('.hero-sub', 'up', 1.75);
        at('.hero-ctas', 'up', 1.85);
        at('.avatar', 'up', 1.95, .1);
        steps.forEach(([el, kind, d]) => { el.dataset.in = kind; el.style.setProperty('--d', d.toFixed(2) + 's'); });
        hero.classList.add('hero-wait');
        heroGo = () => hero.classList.add('hero-go');
    }

    // Intro: "You found me!" types once per visit, click to skip
    const intro = document.getElementById('intro');
    if (intro) {
        let seen = false;
        try { seen = sessionStorage.getItem('mj-intro') === '1'; } catch (e) {}
        if (reduced || seen) {
            intro.remove();
            heroGo();
        } else {
            try { sessionStorage.setItem('mj-intro', '1'); } catch (e) {}
            const out = document.getElementById('introText');
            const msg = 'You found me!';
            let i = 0;
            const close = () => { intro.classList.add('done'); heroGo(); setTimeout(() => intro.remove(), 600); };
            const tick = setInterval(() => {
                out.textContent = msg.slice(0, ++i);
                if (i >= msg.length) { clearInterval(tick); setTimeout(close, 650); }
            }, 55);
            intro.addEventListener('click', () => { clearInterval(tick); close(); });
        }
    } else {
        heroGo();
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
    // Negative lenses follow the pointer inside their zone
    if (!reduced) {
        document.querySelectorAll('.neg-zone, .cs-frame').forEach(zone => {
            const lens = zone.querySelector('.negative, .see-lens');
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
