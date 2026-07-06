(function () {

  'use strict';



  let DATA = window.MENU_DATA;

  const $ = (sel, ctx = document) => ctx.querySelector(sel);

  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];



  let currentView = 'home';

  let currentCategory = null;

  let toastTimer = null;

  let cart = {};

  let cartOpen = false;



  const VIEWS = {

    home: '#view-home',

    category: '#view-category',

    sets: '#view-sets',

    drinks: '#view-drinks',

    promotions: '#view-promotions',

    about: '#view-about',

    contacts: '#view-contacts',

    fullmenu: '#view-fullmenu'

  };



  function categoryName(catId) {

    return DATA.categories.find(c => c.id === catId)?.name || catId;

  }



  function formatPrice(price) {

    const num = Number(price);

    return Number.isInteger(num) ? `${num} руб` : `${num.toFixed(2)} руб`;

  }



  async function loadSiteData() {
    try {
      const res = await fetch('/api/site');
      if (res.ok) {
        DATA = await res.json();
        window.MENU_DATA = DATA;
        return;
      }
    } catch { /* fallback */ }

    try {
      const res = await fetch('/data/site.json');
      if (res.ok) {
        DATA = await res.json();
        window.MENU_DATA = DATA;
        return;
      }
    } catch { /* fallback */ }

    DATA = window.MENU_DATA;
  }



  function renderSiteContent() {

    if (DATA.meta) {

      document.title = DATA.meta.title || document.title;

      const metaDesc = document.querySelector('meta[name="description"]');

      if (metaDesc && DATA.meta.description) metaDesc.content = DATA.meta.description;

    }



    if (DATA.hero) {

      const h = DATA.hero;

      if ($('#hero-subtitle')) $('#hero-subtitle').textContent = h.subtitle;

      if ($('#hero-title')) $('#hero-title').textContent = h.title;

      if ($('#hero-divider')) $('#hero-divider').textContent = h.divider;

      if ($('#hero-cta-text')) $('#hero-cta-text').textContent = h.cta;

      const heroImg = $('#hero-image');

      if (heroImg) {

        heroImg.src = h.image;

        heroImg.alt = h.imageAlt || heroImg.alt;

      }

    }



    if (DATA.homePromo) {

      const set = DATA.sets.find(s => s.id === DATA.homePromo.setId) || DATA.sets[0];

      if (set) {

        if ($('#home-promo-title')) $('#home-promo-title').textContent = set.name;

        if ($('#home-promo-tagline')) $('#home-promo-tagline').textContent = DATA.homePromo.tagline;

        if ($('#home-promo-price')) $('#home-promo-price').textContent = formatPrice(set.price);

        if ($('#home-promo-weight')) $('#home-promo-weight').textContent = set.weight;

        const promoImg = $('#home-promo-image');

        if (promoImg) {

          promoImg.src = itemImageSrc(set);

          promoImg.alt = set.name;

        }

      }

    }



    if (DATA.about) {

      if ($('#about-text')) $('#about-text').textContent = DATA.about.text;

      const featuresEl = $('#about-features');

      if (featuresEl && DATA.about.features) {

        const icons = featuresEl.querySelectorAll('.about__feature');

        DATA.about.features.forEach((f, i) => {

          const span = icons[i]?.querySelector('span');

          if (span) span.innerHTML = f.label.replace(/\n/g, '<br>');

        });

      }

    }



    if (DATA.gallery) {

      const slides = $('#about-gallery-slides');

      if (slides) {

        slides.innerHTML = DATA.gallery.map((img, i) => `

          <img src="${img.src}" alt="${img.alt}" class="about-gallery__slide${i === 0 ? ' about-gallery__slide--active' : ''}" width="520" height="693" ${i === 0 ? 'decoding="async"' : 'loading="lazy" decoding="async"'}>

        `).join('');

        const gallery = $('#about-gallery');

        if (gallery) delete gallery.dataset.ready;

      }

    }



    if ($('#drinks-footer-text') && DATA.drinksFooter) {

      $('#drinks-footer-text').textContent = DATA.drinksFooter;

    }

  }



  function findMenuItem(id) {

    for (const cat of ['pizza', 'hot', 'fry', 'salads']) {

      const item = DATA[cat]?.find(i => i.id === id);

      if (item) return item;

    }

    const set = DATA.sets?.find(s => s.id === id);

    if (set) return set;

    if (DATA.drinks) {

      for (const key of ['beer', 'kvass', 'soft']) {

        const item = DATA.drinks[key]?.items.find(i => i.id === id);

        if (item) return item;

      }

    }

    return null;

  }



  function addToCart(id) {

    const item = findMenuItem(id);

    if (!item) return;

    if (!cart[id]) {

      cart[id] = { id, name: item.name, price: Number(item.price), qty: 0 };

    }

    cart[id].qty += 1;

    renderCart();

  }



  function changeCartQty(id, delta) {

    if (!cart[id]) return;

    cart[id].qty += delta;

    if (cart[id].qty <= 0) delete cart[id];

    renderCart();

  }



  function renderCart() {

    const list = $('#cart-list');

    const totalEl = $('#cart-total');

    if (!list || !totalEl) return;

    const keys = Object.keys(cart).filter(k => cart[k].qty > 0);

    if (!keys.length) {

      list.innerHTML = '<p class="cart-panel__empty">Корзина пуста</p>';

      totalEl.textContent = formatPrice(0);

      return;

    }

    let total = 0;

    list.innerHTML = keys.map(key => {

      const item = cart[key];

      total += item.price * item.qty;

      return `

        <div class="cart-item" data-cart-id="${item.id}">

          <div class="cart-item__name">${item.name}</div>

          <div class="cart-item__qty">

            <button type="button" data-cart-dec="${item.id}" aria-label="Уменьшить">−</button>

            <span>${item.qty}</span>

            <button type="button" data-cart-inc="${item.id}" aria-label="Увеличить">+</button>

          </div>

          <div class="cart-item__price">${formatPrice(item.price * item.qty)}</div>

        </div>

      `;

    }).join('');

    totalEl.textContent = formatPrice(total);

  }



  function openCart() {

    cartOpen = true;

    renderCart();

    const backdrop = $('#cart-backdrop');

    const panel = $('#cart-panel');

    backdrop?.removeAttribute('hidden');

    panel?.removeAttribute('hidden');

    panel?.classList.add('cart-panel--open');

    backdrop?.classList.add('cart-backdrop--visible');

    panel?.setAttribute('aria-hidden', 'false');

    backdrop?.setAttribute('aria-hidden', 'false');

    updateBottomNavActive();

  }



  function closeCart() {

    cartOpen = false;

    const backdrop = $('#cart-backdrop');

    const panel = $('#cart-panel');

    panel?.classList.remove('cart-panel--open');

    backdrop?.classList.remove('cart-backdrop--visible');

    panel?.setAttribute('aria-hidden', 'true');

    backdrop?.setAttribute('aria-hidden', 'true');

    panel?.setAttribute('hidden', '');

    backdrop?.setAttribute('hidden', '');

    updateBottomNavActive();

  }



  function updateBottomNavActive() {

    $$('.bottom-nav__item').forEach(btn => {

      const nav = btn.dataset.nav;

      const isCart = btn.id === 'cart-toggle';

      if (cartOpen) {

        btn.classList.toggle('bottom-nav__item--active', isCart);

        return;

      }

      const menuViews = currentView === 'home' || currentView === 'category' || currentView === 'sets' || currentView === 'drinks';

      btn.classList.toggle('bottom-nav__item--active',

        menuViews && nav === 'home' ? true :

        currentView === nav

      );

    });

  }



  function showToast(message) {

    const toast = $('#toast');

    toast.textContent = message;

    toast.classList.add('toast--visible');

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => toast.classList.remove('toast--visible'), 2000);

  }



  function navigate(view, category) {

    closeCart();

    currentView = view;

    if (category) currentCategory = category;



    $$('.view').forEach(el => el.classList.remove('view--active'));



    let target;

    if (view === 'category' && category) {

      target = $(VIEWS.category);

      renderCategory(category);

    } else if (view === 'sets') {

      target = $(VIEWS.sets);

    } else if (view === 'drinks') {

      target = $(VIEWS.drinks);

    } else {

      target = $(VIEWS[view] || VIEWS.home);

    }



    if (target) target.classList.add('view--active');



    if (view === 'contacts' && window.DubravenkaMap) {

      window.DubravenkaMap.init(DATA.contacts);

    }



    if (view === 'about' && window.DubravenkaGallery) {

      window.DubravenkaGallery.init();

      window.DubravenkaGallery.start();

    } else if (window.DubravenkaGallery) {

      window.DubravenkaGallery.stop();

    }



    updateBottomNavActive();

    const app = document.getElementById('app');

    if (app) app.scrollTo({ top: 0, behavior: 'smooth' });

    else window.scrollTo({ top: 0, behavior: 'smooth' });

    closeOverlay();

  }



  function closeOverlay() {

    const menu = $('#overlay-menu');

    menu.classList.remove('overlay-menu--open');

    menu.setAttribute('aria-hidden', 'true');

  }



  function openOverlay() {

    const menu = $('#overlay-menu');

    menu.classList.add('overlay-menu--open');

    menu.setAttribute('aria-hidden', 'false');

  }



  function renderCategoryNav() {

    const container = $('#category-nav');

    container.innerHTML = DATA.categories.map((cat, i) => `

      <div class="category-card${i === 0 ? ' category-card--active' : ''}" data-category="${cat.id}" role="button" tabindex="0" aria-label="${cat.name}">

        <div class="category-card__frame">

          <div class="category-card__inner">

            <span class="category-card__icon" style="-webkit-mask-image:url('assets/svg/icons/${cat.icon}.svg');mask-image:url('assets/svg/icons/${cat.icon}.svg');" aria-hidden="true"></span>

            <span class="category-card__label">${cat.name}</span>

          </div>

        </div>

      </div>

    `).join('');

  }



  function itemImageSrc(item) {
    const img = item.image || '';
    if (/\.(png|jpe?g|webp)$/i.test(img) || img.includes('/')) return img;
    if (item.icon) return `assets/svg/icons/${item.icon}.svg`;
    return `assets/svg/food/${img}.svg`;
  }

  function isPhotoImage(item) {
    return /\.(png|jpe?g|webp)$/i.test(item.image || '');
  }

  function renderMenuItem(item) {
    const src = itemImageSrc(item);
    const photo = isPhotoImage(item);
    return `
      <div class="menu-item" data-id="${item.id}">
        <div class="menu-item__image${photo ? ' menu-item__image--photo' : ''}">
          <img src="${src}" alt="${item.name}" width="72" height="72" loading="lazy" decoding="async">
        </div>
        <div class="menu-item__info">
          <div class="menu-item__name">${item.name}</div>
          <div class="menu-item__desc">${item.desc}</div>
        </div>
        <div class="menu-item__actions">
          <div class="menu-item__price">${formatPrice(item.price)}</div>
          <button class="menu-item__add" data-add="${item.id}" data-name="${item.name}" aria-label="Добавить ${item.name}">+</button>
        </div>
      </div>
    `;
  }



  function renderHomePreview() {

    const container = $('#home-preview');

    const items = DATA.pizza.slice(0, 3);

    container.innerHTML = `

      <div class="section-header">

        <h3 class="section-header__title">Пицца</h3>

        <a href="#" class="section-header__link" data-category="pizza">

          Смотреть все

          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>

        </a>

      </div>

      <div class="section-divider"></div>

      ${items.map(renderMenuItem).join('')}

    `;

  }



  function renderCategory(catId) {

    const title = $('#cat-title');

    title.textContent = categoryName(catId);



    const list = $('#category-list');



    if (catId === 'drinks') {

      navigate('drinks');

      return;

    }



    if (catId === 'sets') {

      navigate('sets');

      return;

    }



    const items = DATA[catId];

    if (!items) return;



    list.innerHTML = items.map(renderMenuItem).join('');

  }



  function renderSets() {

    const container = $('#sets-list');

    container.innerHTML = DATA.sets.map(set => {

      const src = itemImageSrc(set);

      return `

      <div class="set-card" data-id="${set.id}">

        <div class="set-card__content">

          <div class="set-card__name">${set.name}</div>

          <div class="set-card__weight">${set.weight}</div>

          <div class="set-card__desc">${set.desc}</div>

          <div class="set-card__footer">

            <span class="set-card__price">${formatPrice(set.price)}</span>

            <button class="menu-item__add" data-add="${set.id}" data-name="${set.name}" aria-label="Добавить ${set.name}">+</button>

          </div>

        </div>

        <div class="set-card__image">

          <img src="${src}" alt="${set.name}" width="140" height="140" loading="lazy" decoding="async">

        </div>

      </div>

    `;

    }).join('');

  }



  function renderDrinks() {

    const container = $('#drinks-sections');

    const sections = DATA.drinks;

    let html = '';



    for (const key of ['beer', 'kvass', 'soft']) {

      const section = sections[key];

      html += `<div class="drinks-section"><h3 class="drinks-section__title">${section.title}</h3>`;

      html += section.items.map(item => {

        const photo = isPhotoImage(item);

        return `

        <div class="drink-card">

          <div class="drink-card__image${photo ? ' drink-card__image--photo' : ''}">

            <img src="${itemImageSrc(item)}" alt="${item.name}" width="48" height="48" loading="lazy" decoding="async">

          </div>

          <div>

            <div class="drink-card__name">${item.name}</div>

            <div class="drink-card__desc">${item.desc}</div>

          </div>

          <div class="drink-card__price">${formatPrice(item.price)}</div>

        </div>

      `;

      }).join('');

      html += '</div>';

    }



    container.innerHTML = html;

  }



  function renderPromotions() {

    const container = $('#promotions-list');

    container.innerHTML = DATA.promotions.map(promo => `

      <div class="promo-banner">

        <div class="promo-banner__image">

          <img src="assets/svg/${promo.image}.svg" alt="${promo.title}" width="360" height="200" loading="lazy">

        </div>

        <div class="promo-banner__content">

          <h3 class="promo-banner__title">${promo.title}</h3>

          <p class="promo-banner__desc">${promo.desc}</p>

          <p class="promo-banner__sub">${promo.sub}</p>

        </div>

      </div>

    `).join('');

  }



  function renderFullMenu() {

    const grid = $('#fullmenu-grid');

    const cats = ['pizza', 'hot', 'fry', 'salads'];



    let html = cats.map(cat => {

      const items = DATA[cat];

      return `

        <div class="fullmenu__section">

          <h3 class="fullmenu__section-title">${categoryName(cat)}</h3>

          ${items.map(item => `

            <div class="fullmenu__item">

              <span class="fullmenu__item-name">${item.name}</span>

              <span class="fullmenu__item-price">${formatPrice(item.price)}</span>

            </div>

          `).join('')}

        </div>

      `;

    }).join('');



    html += `

      <div class="fullmenu__section fullmenu__sets">

        <h3 class="fullmenu__section-title">Сеты</h3>

        ${DATA.sets.map(set => `

          <div class="fullmenu__item">

            <span class="fullmenu__item-name">${set.name} (${set.weight})</span>

            <span class="fullmenu__item-price">${formatPrice(set.price)}</span>

          </div>

          <div class="fullmenu__item-desc">(${set.desc})</div>

        `).join('')}

      </div>

    `;



    grid.innerHTML = html;

  }



  function renderContacts() {

    const c = DATA.contacts;

    $('#contact-phone').textContent = c.phone;

    $('#contact-phone').href = `tel:${c.phone.replace(/[^\d+]/g, '')}`;

    $('#contact-address').textContent = c.address;

    $('#contact-hours').textContent = c.hours;

    $('#contact-route').href = `https://yandex.ru/maps/?rtext=~${c.coords.lat},${c.coords.lng}&rtt=auto`;

  }



  function setActiveCategory(catId) {

    $$('.category-card').forEach(card => {

      card.classList.toggle('category-card--active', card.dataset.category === catId);

    });

  }



  function handleCategoryClick(catId) {

    setActiveCategory(catId);

    if (catId === 'sets') {

      navigate('sets');

    } else if (catId === 'drinks') {

      navigate('drinks');

    } else {

      navigate('category', catId);

    }

  }



  function bindEvents() {

    document.addEventListener('click', (e) => {

      const nav = e.target.closest('[data-nav]');

      if (nav) {

        e.preventDefault();

        const view = nav.dataset.nav;

        if (view === 'sets') navigate('sets');

        else navigate(view);

        return;

      }



      const cat = e.target.closest('[data-category]');

      if (cat) {

        e.preventDefault();

        handleCategoryClick(cat.dataset.category);

        return;

      }



      const add = e.target.closest('[data-add]');

      if (add) {

        addToCart(add.dataset.add);

        showToast(`«${add.dataset.name}» добавлено`);

        return;

      }



      const cartInc = e.target.closest('[data-cart-inc]');

      if (cartInc) {

        changeCartQty(cartInc.dataset.cartInc, 1);

        return;

      }



      const cartDec = e.target.closest('[data-cart-dec]');

      if (cartDec) {

        changeCartQty(cartDec.dataset.cartDec, -1);

        return;

      }



      const scroll = e.target.closest('[data-scroll]');

      if (scroll) {

        e.preventDefault();

        const el = $('#' + scroll.dataset.scroll);

        if (el) el.scrollIntoView({ behavior: 'smooth' });

        return;

      }

    });



    document.addEventListener('keydown', (e) => {

      const card = e.target.closest('.category-card');

      if (card && (e.key === 'Enter' || e.key === ' ')) {

        e.preventDefault();

        handleCategoryClick(card.dataset.category);

      }

    });



    $('#cat-back').addEventListener('click', () => navigate('home'));



    $('#menu-toggle').addEventListener('click', openOverlay);

    $('#menu-close').addEventListener('click', closeOverlay);

    $('#overlay-menu').addEventListener('click', (e) => {

      if (e.target === $('#overlay-menu')) closeOverlay();

    });



    $('#cart-close')?.addEventListener('click', closeCart);

    $('#cart-backdrop')?.addEventListener('click', closeCart);

    $('#cart-toggle')?.addEventListener('click', (e) => {

      e.preventDefault();

      e.stopPropagation();

      if (cartOpen) closeCart();

      else openCart();

    });

  }



  function renderAll() {

    renderSiteContent();

    renderCategoryNav();

    renderHomePreview();

    renderSets();

    renderDrinks();

    renderPromotions();

    renderFullMenu();

    renderContacts();

  }



  async function init() {

    await loadSiteData();

    renderAll();

    bindEvents();

    closeCart();

    navigate('home');

  }



  if (document.readyState === 'loading') {

    document.addEventListener('DOMContentLoaded', init);

  } else {

    init();

  }

})();


