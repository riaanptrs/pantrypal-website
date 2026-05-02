(function () {
  const supportedLocales = ['en', 'pt', 'es'];
  const localeDictionaries = {
    en: 'en',
    pt: 'pt-BR',
    es: 'es',
  };
  const languageLabels = {
    en: 'EN',
    pt: 'PT',
    es: 'ES',
  };
  const defaultLocale = 'en';
  const localeStorageKey = 'vivapantry.locale';
  const localizedPages = new Set(['', 'privacy', 'terms', 'support', 'delete-account']);
  const unsupportedLocalePattern = /^[a-z]{2}(?:-[A-Z]{2})?$/;

  function normalizeLocale(value) {
    const raw = String(value || '').trim();
    const lower = raw.toLowerCase();

    if (lower === 'en' || lower === 'en-us' || lower === 'en-gb') return 'en';
    if (lower === 'pt' || lower === 'pt-br' || lower === 'pt-pt') return 'pt';
    if (
      lower === 'es' ||
      lower === 'es-es' ||
      lower === 'es-mx' ||
      lower === 'es-ar' ||
      lower === 'es-cl' ||
      lower === 'es-co'
    ) {
      return 'es';
    }

    return supportedLocales.includes(raw) ? raw : defaultLocale;
  }

  function getCurrentLocaleFromPath(pathname) {
    const firstSegment = pathname.split('/').filter(Boolean)[0];
    const lower = String(firstSegment || '').toLowerCase();
    if (supportedLocales.includes(firstSegment)) return firstSegment;
    if (lower === 'pt-br' || lower === 'pt-pt') return 'pt';
    if (lower === 'en-us' || lower === 'en-gb') return 'en';
    if (lower === 'es-es' || lower === 'es-mx' || lower === 'es-ar' || lower === 'es-cl' || lower === 'es-co') {
      return 'es';
    }
    return null;
  }

  function getPageFromPath(pathname) {
    const segments = pathname.split('/').filter(Boolean);
    const firstSegment = segments[0] || '';
    const pageSegments = supportedLocales.includes(firstSegment)
      ? segments.slice(1)
      : unsupportedLocalePattern.test(firstSegment)
        ? segments.slice(1)
        : segments;
    const page = pageSegments.join('/').replace(/\.html$/, '');
    return localizedPages.has(page) ? page : null;
  }

  function detectLocale() {
    const current = getCurrentLocaleFromPath(window.location.pathname);
    if (current) return current;

    try {
      const saved = window.localStorage.getItem(localeStorageKey);
      if (saved) return normalizeLocale(saved);
    } catch {
      // localStorage can be blocked by privacy settings.
    }

    return normalizeLocale(window.navigator.language);
  }

  function getLocalizedPath(currentPath, targetLocale) {
    const page = getPageFromPath(currentPath) || '';
    return page ? `/${targetLocale}/${page}` : `/${targetLocale}`;
  }

  function redirectTo(path) {
    if (window.location.pathname !== path) {
      window.location.replace(path + window.location.search + window.location.hash);
    }
  }

  function tFactory(dictionary) {
    return function t(key, params) {
      const value = key.split('.').reduce((cursor, part) => {
        return cursor && Object.prototype.hasOwnProperty.call(cursor, part) ? cursor[part] : undefined;
      }, dictionary);

      if (typeof value !== 'string') return key;

      return value.replace(/\{(\w+)\}/g, function (_, name) {
        return params && Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : `{${name}}`;
      });
    };
  }

  function createElement(tag, options) {
    const element = document.createElement(tag);
    const props = options || {};

    if (props.className) element.className = props.className;
    if (props.text) element.textContent = props.text;
    if (props.html) element.innerHTML = props.html;
    if (props.href) element.setAttribute('href', props.href);
    if (props.src) element.setAttribute('src', props.src);
    if (props.alt !== undefined) element.setAttribute('alt', props.alt);
    if (props.loading) element.setAttribute('loading', props.loading);
    if (props.decoding) element.setAttribute('decoding', props.decoding);
    if (props.id) element.id = props.id;
    if (props.ariaLabel) element.setAttribute('aria-label', props.ariaLabel);
    if (props.ariaCurrent) element.setAttribute('aria-current', props.ariaCurrent);
    if (props.type) element.setAttribute('type', props.type);
    if (props.value) element.setAttribute('value', props.value);

    return element;
  }

  function append(parent, children) {
    children.filter(Boolean).forEach((child) => parent.appendChild(child));
    return parent;
  }

  function setMetadata(locale, page, t) {
    const lang = locale === 'pt' ? 'pt-BR' : locale;
    const canonicalPath = getLocalizedPath(`/${locale}/${page}`, locale);
    const canonicalUrl = `https://vivapantry.com${canonicalPath}`;

    document.documentElement.setAttribute('lang', lang);
    document.title = t(`meta.${page || 'home'}.title`);

    let description = document.querySelector('meta[name="description"]');
    if (!description) {
      description = document.createElement('meta');
      description.setAttribute('name', 'description');
      document.head.appendChild(description);
    }
    description.setAttribute('content', t(`meta.${page || 'home'}.description`));

    document.querySelectorAll('link[rel="canonical"], link[rel="alternate"]').forEach((node) => node.remove());

    const canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    canonical.setAttribute('href', canonicalUrl);
    document.head.appendChild(canonical);

    supportedLocales.forEach((supportedLocale) => {
      const alternate = document.createElement('link');
      alternate.setAttribute('rel', 'alternate');
      alternate.setAttribute('hreflang', supportedLocale);
      alternate.setAttribute('href', `https://vivapantry.com${getLocalizedPath(`/${locale}/${page}`, supportedLocale)}`);
      document.head.appendChild(alternate);
    });

    const fallback = document.createElement('link');
    fallback.setAttribute('rel', 'alternate');
    fallback.setAttribute('hreflang', 'x-default');
    fallback.setAttribute('href', 'https://vivapantry.com/en/');
    document.head.appendChild(fallback);
  }

  function renderHeader(locale, page, t) {
    const header = createElement('header', { className: 'site-header' });
    const brand = append(createElement('a', {
      className: 'brand',
      href: `/${locale}/`,
      ariaLabel: t('nav.homeAria'),
    }), [
      createElement('img', {
        className: 'brand-mark',
        src: '/assets/Mainicon.png',
        alt: '',
        decoding: 'async',
      }),
      createElement('span', { text: 'VivaPantry' }),
    ]);

    const toggle = createElement('button', {
      className: 'nav-toggle',
      type: 'button',
      text: t('nav.menu'),
    });
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'site-nav');

    const nav = createElement('nav', { className: 'site-nav', id: 'site-nav', ariaLabel: t('nav.primary') });
    const links = page === ''
      ? [
          ['#features', t('nav.features')],
          ['#how-it-works', t('nav.howItWorks')],
          [`/${locale}/support`, t('nav.support')],
        ]
      : [
          [`/${locale}/`, t('nav.home')],
          [`/${locale}/privacy`, t('nav.privacy')],
          [`/${locale}/terms`, t('nav.terms')],
          [`/${locale}/support`, t('nav.support')],
          [`/${locale}/delete-account`, t('nav.deleteAccount')],
        ];

    links.forEach(([href, label]) => {
      const link = createElement('a', { href, text: label });
      const targetPage = href.split('/').filter(Boolean)[1] || '';
      if (targetPage === page) link.setAttribute('aria-current', 'page');
      nav.appendChild(link);
    });

    const switcher = createElement('nav', { className: 'language-switcher', ariaLabel: t('language.label') });
    supportedLocales.forEach((supportedLocale) => {
      const link = createElement('a', {
        className: 'language-link',
        href: getLocalizedPath(window.location.pathname, supportedLocale),
        text: languageLabels[supportedLocale],
      });
      if (supportedLocale === locale) link.setAttribute('aria-current', 'true');
      link.addEventListener('click', function () {
        try {
          window.localStorage.setItem(localeStorageKey, supportedLocale);
        } catch {
          // Ignore blocked storage.
        }
      });
      switcher.appendChild(link);
    });

    toggle.addEventListener('click', function () {
      const isOpen = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    append(header, [brand, toggle, nav, switcher]);
    return header;
  }

  function renderFooter(locale, t) {
    const footer = createElement('footer', { className: 'site-footer' });
    const copy = append(createElement('div'), [
      createElement('strong', { text: 'VivaPantry' }),
      createElement('p', { text: t('footer.tagline') }),
      createElement('p', {
        html: `${t('footer.contact')} <a href="mailto:support@vivapantry.com">support@vivapantry.com</a>`,
      }),
    ]);
    const nav = createElement('nav', { ariaLabel: t('footer.navigation') });
    [
      ['privacy', t('footer.privacy')],
      ['terms', t('footer.terms')],
      ['support', t('footer.support')],
      ['delete-account', t('footer.deleteAccount')],
    ].forEach(([targetPage, label]) => nav.appendChild(createElement('a', {
      href: `/${locale}/${targetPage}`,
      text: label,
    })));

    append(footer, [
      copy,
      nav,
      createElement('p', {
        className: 'copyright',
        text: t('footer.copyright', { year: new Date().getFullYear() }),
      }),
    ]);
    return footer;
  }

  function renderHome(locale, t) {
    const main = createElement('main');
    const hero = append(createElement('section', { className: 'hero' }), [
      append(createElement('div', { className: 'hero-copy' }), [
        append(createElement('div', { className: 'hero-brand' }), [
          createElement('img', {
            className: 'hero-icon',
            src: '/assets/Mainicon.png',
            alt: t('home.logoAlt'),
            decoding: 'async',
          }),
          createElement('span', { className: 'hero-wordmark', html: '<span>Viva</span>Pantry' }),
        ]),
        createElement('p', { className: 'eyebrow', text: t('home.eyebrow') }),
        createElement('h1', { text: t('home.heroTitle') }),
        createElement('p', { className: 'hero-text', text: t('home.heroText') }),
        append(createElement('div', { className: 'hero-flow-card', ariaLabel: t('home.flowAria') }),
          ['plan', 'shop', 'store', 'cook', 'repeat'].map((key, index, items) => {
            const item = append(createElement('div', { className: 'hero-flow-item' }), [
              createElement('span', { className: 'hero-flow-icon', text: t(`home.flow.${key}.icon`) }),
              createElement('strong', { text: t(`home.flow.${key}.label`) }),
            ]);
            if (index === items.length - 1) return item;
            return append(createElement('div', { className: 'hero-flow-step' }), [
              item,
              createElement('span', { className: 'hero-flow-arrow', text: '->' }),
            ]);
          })
        ),
        append(createElement('div', { className: 'hero-actions', ariaLabel: t('home.primaryActions') }), [
          createElement('span', { className: 'button primary button-static', text: t('home.primaryCta') }),
          createElement('a', { className: 'button secondary', href: `/${locale}/privacy`, text: t('home.secondaryCta') }),
        ]),
        createElement('p', { className: 'trust-note', text: t('home.trustNote') }),
      ]),
      append(createElement('div', { className: 'app-preview', ariaLabel: t('home.previewAria') }), [
        append(createElement('div', { className: 'phone-frame' }), [
          append(createElement('div', { className: 'phone-header' }), [
            createElement('img', {
              src: '/assets/Mainicon.png',
              alt: '',
              decoding: 'async',
            }),
            createElement('strong', { text: t('home.previewThisWeek') }),
            createElement('span'),
          ]),
          append(createElement('div', { className: 'preview-card' }), [
            createElement('small', { text: t('home.previewSuggestedMeal') }),
            createElement('strong', { text: t('home.previewMeal') }),
            createElement('span', { text: t('home.previewMealText') }),
          ]),
          append(createElement('div', { className: 'preview-list' }), [
            previewRow(t('home.previewReceipt'), t('home.previewReceiptValue')),
            previewRow(t('home.previewPantry'), t('home.previewPantryValue')),
            previewRow(t('home.previewShopping'), t('home.previewShoppingValue')),
          ]),
        ]),
      ]),
    ]);

    const how = append(createElement('section', { className: 'section how-section', id: 'how-it-works' }), [
      append(createElement('div', { className: 'section-heading' }), [
        append(createElement('div', { className: 'section-kicker' }), [
          createElement('img', {
            src: '/assets/Mainicon.png',
            alt: '',
            loading: 'lazy',
            decoding: 'async',
          }),
          createElement('p', { className: 'eyebrow', text: t('home.loopEyebrow') }),
        ]),
        createElement('h2', { text: t('home.loopTitle') }),
        createElement('p', { className: 'section-lead', text: t('home.loopText') }),
      ]),
      append(createElement('div', { className: 'flow', ariaLabel: t('home.loopAria') }),
        ['receipts', 'prices', 'pantry', 'mealPlans', 'shoppingLists'].map((key, index) =>
          append(createElement('article'), [
            createElement('span', { text: String(index + 1).padStart(2, '0') }),
            createElement('h3', { text: t(`home.loop.${key}.title`) }),
            createElement('p', { text: t(`home.loop.${key}.text`) }),
          ])
        )
      ),
      append(createElement('div', { className: 'benefit-strip' }), [
        createElement('p', { text: t('home.loopBenefit') }),
      ]),
    ]);

    const features = append(createElement('section', { className: 'section section-soft', id: 'features' }), [
      append(createElement('div', { className: 'section-heading' }), [
        createElement('p', { className: 'eyebrow', text: t('home.featuresEyebrow') }),
        createElement('h2', { text: t('home.featuresTitle') }),
      ]),
      append(createElement('div', { className: 'feature-grid' }),
        ['pantryTracking', 'receiptScanning', 'aiMealPlanning', 'groceryLists', 'recipes', 'householdPreferences'].map((key, index) =>
          append(createElement('article', { className: 'feature-card' }), [
            createElement('span', { className: 'feature-icon', text: String(index + 1).padStart(2, '0') }),
            createElement('h3', { text: t(`home.features.${key}.title`) }),
            createElement('p', { text: t(`home.features.${key}.text`) }),
          ])
        )
      ),
    ]);

    const readiness = append(createElement('section', { className: 'section readiness' }), [
      append(createElement('div', { className: 'readiness-card' }), [
        append(createElement('div'), [
          createElement('p', { className: 'eyebrow', text: t('home.readinessEyebrow') }),
          createElement('h2', { text: t('home.readinessTitle') }),
          createElement('p', { text: t('home.readinessText') }),
        ]),
        append(createElement('ul', { className: 'check-list' }),
          ['weeklyPlanning', 'householdPreferences', 'reduceWaste', 'organizedData', 'policies'].map((key) =>
            createElement('li', { text: t(`home.readiness.${key}`) })
          )
        ),
      ]),
    ]);

    const trust = append(createElement('section', { className: 'trust-section' }), [
      append(createElement('div', { className: 'section-heading compact' }), [
        createElement('p', { className: 'eyebrow', text: t('home.trustEyebrow') }),
        createElement('h2', { text: t('home.trustTitle') }),
        createElement('p', { text: t('home.trustText') }),
      ]),
      append(createElement('div', { className: 'trust-links' }), [
        createElement('a', { href: `/${locale}/privacy`, text: t('footer.privacy') }),
        createElement('a', { href: `/${locale}/terms`, text: t('footer.terms') }),
        createElement('a', { href: `/${locale}/support`, text: t('footer.support') }),
        createElement('a', { href: `/${locale}/delete-account`, text: t('footer.deleteAccount') }),
      ]),
    ]);

    append(main, [hero, how, features, readiness, trust]);
    return main;
  }

  function previewRow(label, value) {
    return append(createElement('div'), [
      createElement('span', { text: label }),
      createElement('strong', { text: value }),
    ]);
  }

  function renderLegalPage(page, t) {
    const main = createElement('main', { className: `content-page content-page-${page}` });
    append(main, [
      append(createElement('section', { className: 'page-hero' }), [
        append(createElement('div', { className: 'page-hero-copy' }), [
          createElement('p', { className: 'eyebrow', text: t(`${page}.eyebrow`) }),
          createElement('h1', { text: t(`${page}.title`) }),
          createElement('p', { className: 'lead', text: t(`${page}.lead`) }),
        ]),
        append(createElement('div', { className: 'page-brand-card' }), [
          createElement('img', {
            src: '/assets/Mainicon.png',
            alt: t('home.logoAlt'),
            loading: 'lazy',
            decoding: 'async',
          }),
          createElement('strong', { html: '<span>Viva</span>Pantry' }),
          createElement('p', { text: t('footer.tagline') }),
        ]),
      ]),
      append(createElement('section', { className: 'legal-section' }),
        t(`${page}.sections`)
          .split('|||')
          .map((block, index) => {
            const [title, body, list] = block.split('||');
            const article = append(createElement('article', { className: 'legal-card' }), [
              createElement('span', { className: 'legal-card-index', text: String(index + 1).padStart(2, '0') }),
              createElement('h2', { text: title }),
              createElement('p', { html: body }),
            ]);
            if (list) {
              article.appendChild(append(createElement('ul'),
                list.split('|').map((item) => createElement('li', { html: item }))
              ));
            }
            return article;
          })
      ),
    ]);
    return main;
  }

  function renderNotFound(locale, t) {
    const main = createElement('main', { className: 'content-page' });
    append(main, [
      append(createElement('section', { className: 'page-hero' }), [
        createElement('p', { className: 'eyebrow', text: t('notFound.eyebrow') }),
        createElement('h1', { text: t('notFound.title') }),
        createElement('p', { className: 'lead', text: t('notFound.lead') }),
        createElement('a', { className: 'button primary', href: `/${locale}/`, text: t('notFound.cta') }),
      ]),
    ]);
    return main;
  }

  async function loadDictionary(locale) {
    const dictionaryLocale = localeDictionaries[locale] || defaultLocale;
    const response = await fetch(`/src/locales/${dictionaryLocale}.json`, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Could not load locale ${locale}`);
    return response.json();
  }

  async function init() {
    const localeFromPath = getCurrentLocaleFromPath(window.location.pathname);
    const page = getPageFromPath(window.location.pathname);
    const firstSegment = window.location.pathname.split('/').filter(Boolean)[0] || '';

    if (window.location.pathname === '/') {
      const dictionary = await loadDictionary(defaultLocale);
      const t = tFactory(dictionary);
      window.VivaPantryI18n.t = t;
      setMetadata(defaultLocale, '', t);

      const app = document.querySelector('#app') || document.body;
      app.innerHTML = '';
      append(app, [
        renderHeader(defaultLocale, '', t),
        renderHome(defaultLocale, t),
        renderFooter(defaultLocale, t),
      ]);
      return;
    }

    if (!localeFromPath) {
      const targetLocale = firstSegment && unsupportedLocalePattern.test(firstSegment)
        ? defaultLocale
        : detectLocale();
      const shouldRenderDetectedNotFound =
        page === null &&
        window.location.pathname !== '/' &&
        !(firstSegment && unsupportedLocalePattern.test(firstSegment));

      if (shouldRenderDetectedNotFound) {
        const dictionary = await loadDictionary(targetLocale);
        const t = tFactory(dictionary);
        window.VivaPantryI18n.t = t;
        setMetadata(targetLocale, '404', t);

        const app = document.querySelector('#app') || document.body;
        app.innerHTML = '';
        append(app, [
          renderHeader(targetLocale, '', t),
          renderNotFound(targetLocale, t),
          renderFooter(targetLocale, t),
        ]);
        return;
      }

      redirectTo(getLocalizedPath(window.location.pathname, targetLocale));
      return;
    }

    const locale = localeFromPath;
    let dictionary;

    try {
      dictionary = await loadDictionary(locale);
    } catch {
      dictionary = await loadDictionary(defaultLocale);
    }

    const t = tFactory(dictionary);
    window.VivaPantryI18n.t = t;
    const safePage = page === null ? '404' : page;
    setMetadata(locale, safePage, t);

    const app = document.querySelector('#app') || document.body;
    app.innerHTML = '';
    append(app, [
      renderHeader(locale, page || '', t),
      page === null
        ? renderNotFound(locale, t)
        : page === ''
          ? renderHome(locale, t)
          : renderLegalPage(page, t),
      renderFooter(locale, t),
    ]);
  }

  window.VivaPantryI18n = {
    supportedLocales,
    defaultLocale,
    detectLocale,
    normalizeLocale,
    getCurrentLocaleFromPath,
    getLocalizedPath,
    t: function (key) {
      return key;
    },
  };

  init().catch(function () {
    document.body.innerHTML = '<main class="content-page"><section class="page-hero"><h1>VivaPantry</h1><p class="lead">Please refresh the page.</p></section></main>';
  });
})();
