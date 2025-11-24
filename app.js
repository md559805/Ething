(() => {
	'use strict';

	// Utility: throttle
	const throttle = (fn, wait = 100) => {
		let last = 0;
		return (...args) => {
			const now = Date.now();
			if (now - last >= wait) {
				last = now;
				fn(...args);
			}
		};
	};

	// Smooth scroll for internal anchor links
	function initSmoothScrolling() {
		// Use native smooth behavior where available
		try {
			document.documentElement.style.scrollBehavior = 'smooth';
		} catch (e) {}

		document.addEventListener('click', (e) => {
			const anchor = e.target.closest('a[href^="#"]');
			if (!anchor) return;
			const href = anchor.getAttribute('href');
			if (!href || href === '#') return;
			const target = document.querySelector(href);
			if (target) {
				e.preventDefault();
				// Prefer native smooth scrolling
				target.scrollIntoView({ behavior: 'smooth', block: 'start' });
				// update URL hash without jumping
				history.replaceState(null, '', href);
			}
		});
	}

	// Reveal on scroll
	function initRevealOnScroll() {
		const selectors = [
			'.feature-card',
			'.stat-card',
			'.benefit-item',
			'.comparison-column',
			'.inspiration-image-container',
			'.big-picture-image',
			'.books-image',
			'.hero-section',
			'.section-title',
			'.footer'
		];

		const elems = Array.from(document.querySelectorAll(selectors.join(',')));
		elems.forEach((el) => {
			// set initial hidden state
			el.style.opacity = '0';
			el.style.transform = 'translateY(18px)';
			el.style.transition = 'opacity 560ms ease-out, transform 560ms ease-out';
			el.setAttribute('data-revealed', 'false');
		});

		const io = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				const el = entry.target;
				if (entry.isIntersecting && el.getAttribute('data-revealed') === 'false') {
					el.style.opacity = '1';
					el.style.transform = 'translateY(0)';
					el.setAttribute('data-revealed', 'true');
				}
			});
		}, { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

		elems.forEach((el) => io.observe(el));
	}

	// Lazy load images and set loading attr
	function initLazyImages() {
		const imgs = Array.from(document.querySelectorAll('img'));
		imgs.forEach((img) => {
			if (!img.hasAttribute('loading')) {
				img.setAttribute('loading', 'lazy');
			}
		});

		// Optional: if images have data-src for progressive loading
		const progressive = document.querySelectorAll('img[data-src]');
		if (progressive.length) {
			const io = new IntersectionObserver((entries, obs) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						const im = entry.target;
						im.src = im.dataset.src;
						im.removeAttribute('data-src');
						obs.unobserve(im);
					}
				});
			}, { rootMargin: '200px' });

			progressive.forEach((i) => io.observe(i));
		}
	}

	// Mobile hamburger menu: create and wire menu behavior
	function initMobileMenu() {
		const header = document.querySelector('.header');
		const headerContainer = document.querySelector('.header-container');
		const nav = document.querySelector('.navigation');
		if (!header || !headerContainer || !nav) return;

		// create hamburger button if not present
		if (!document.querySelector('.hamburger-toggle')) {
			const btn = document.createElement('button');
			btn.className = 'hamburger-toggle';
			btn.type = 'button';
			btn.setAttribute('aria-expanded', 'false');
			btn.setAttribute('aria-label', 'Open menu');
			btn.innerHTML = '<span class="hamburger-box"><span class="hamburger-inner"></span></span>';
			headerContainer.insertBefore(btn, headerContainer.firstChild);

			// basic styles appended via JS so they apply without editing CSS files
			const style = document.createElement('style');
			style.textContent = `
				.hamburger-toggle{display:none;background:transparent;border:none;padding:8px;cursor:pointer}
				.hamburger-box{display:inline-block;width:28px;height:18px;position:relative}
				.hamburger-inner, .hamburger-inner::before, .hamburger-inner::after{display:block;width:28px;height:3px;background:#111;border-radius:2px;position:absolute;left:0}
				.hamburger-inner{top:50%;transform:translateY(-50%)}
				.hamburger-inner::before{content:'';top:-8px}
				.hamburger-inner::after{content:'';top:8px}
				.mobile-nav-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;justify-content:flex-end;z-index:9999}
				.mobile-nav{width:320px;max-width:85%;background:#fff;height:100%;padding:40px 24px;overflow:auto}
				.mobile-nav .nav-list{flex-direction:column;gap:20px}
				.mobile-nav .nav-link{font-size:18px}
			`;
			document.head.appendChild(style);

			// overlay and panel
			let overlay = null;

			function openMobileNav() {
				if (overlay) return;
				overlay = document.createElement('div');
				overlay.className = 'mobile-nav-overlay';
				const panel = document.createElement('nav');
				panel.className = 'mobile-nav';
				// clone nav-list for mobile
				const cloned = nav.querySelector('.nav-list')?.cloneNode(true);
				if (cloned) {
					// make links close menu on click
					cloned.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => closeMobileNav()));
					panel.appendChild(cloned);
				}
				// optional extra actions (browse button)
				const browse = document.querySelector('.Browse');
				if (browse) {
					const b = browse.cloneNode(true);
					b.classList.add('mobile-browse');
					b.style.marginTop = '24px';
					panel.appendChild(b);
				}
				overlay.appendChild(panel);
				document.body.appendChild(overlay);
				document.body.style.overflow = 'hidden';
				btn.setAttribute('aria-expanded', 'true');
				btn.setAttribute('aria-label', 'Close menu');

				overlay.addEventListener('click', (ev) => {
					if (ev.target === overlay) closeMobileNav();
				});
				// escape to close
				document.addEventListener('keydown', onEscClose);
			}

			function closeMobileNav() {
				if (!overlay) return;
				overlay.remove();
				overlay = null;
				document.body.style.overflow = '';
				btn.setAttribute('aria-expanded', 'false');
				btn.setAttribute('aria-label', 'Open menu');
				document.removeEventListener('keydown', onEscClose);
			}

			function onEscClose(e) {
				if (e.key === 'Escape') closeMobileNav();
			}

			btn.addEventListener('click', () => {
				const expanded = btn.getAttribute('aria-expanded') === 'true';
				if (expanded) closeMobileNav(); else openMobileNav();
			});

			// show/hide hamburger based on width
			const updateHamburgerVisibility = () => {
				const w = window.innerWidth;
				if (w <= 768) {
					btn.style.display = 'inline-block';
					// hide original nav to avoid duplicate interactive items
					nav.style.display = 'none';
				} else {
					btn.style.display = 'none';
					nav.style.display = '';
					closeMobileNav();
				}
			};

			updateHamburgerVisibility();
			window.addEventListener('resize', throttle(updateHamburgerVisibility, 200));
		}
	}

	// Highlight active nav link based on scroll position
	function initNavHighlight() {
		const links = Array.from(document.querySelectorAll('.nav-link[href^="#"]'));
		if (!links.length) return;
		const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);

		const io = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				const id = entry.target.id;
				const link = document.querySelector(`.nav-link[href="#${id}"]`);
				if (link) link.classList.toggle('active', entry.isIntersecting);
			});
		}, { threshold: 0.5 });

		sections.forEach((s) => io.observe(s));
	}

	// Basic enhancements: ensure hero pagination dots are keyboard accessible
	function enhancePaginationDots() {
		const dots = Array.from(document.querySelectorAll('.pagination-dot'));
		dots.forEach((d) => {
			d.setAttribute('tabindex', '0');
			d.addEventListener('keydown', (e) => {
				if (e.key === 'Enter' || e.key === ' ') d.click();
			});
		});
	}

	// On DOM ready initialize features
	function init() {
		initSmoothScrolling();
		initRevealOnScroll();
		initLazyImages();
		initMobileMenu();
		initNavHighlight();
		enhancePaginationDots();

		// small accessibility: ensure main landmark exists
		if (!document.querySelector('main')) {
			const m = document.createElement('main');
			m.setAttribute('role', 'main');
			// Not inserting content; prefer that existing HTML provides main element
		}

		// slight UX tweak: shrink header when scrolling
		const header = document.querySelector('.header');
		if (header) {
			let lastY = window.scrollY;
			const onScroll = throttle(() => {
				const y = window.scrollY;
				if (y > 40) {
					header.style.transform = 'translateY(-4px) scale(0.995)';
					header.style.transition = 'transform 220ms ease, box-shadow 220ms ease';
				} else {
					header.style.transform = '';
				}
				lastY = y;
			}, 120);
			window.addEventListener('scroll', onScroll, { passive: true });
		}
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}

})();

