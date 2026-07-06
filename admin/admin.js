(function () {
  'use strict';

  const MENU_CATS = ['pizza', 'hot', 'fry', 'salads'];
  const DRINK_KEYS = ['beer', 'kvass', 'soft'];
  const TOKEN_KEY = 'dubravenka_admin_token';
  const SECTION_TITLES = {
    hero: 'Главная',
    menu: 'Меню',
    sets: 'Сеты',
    drinks: 'Напитки',
    promotions: 'Акции',
    about: 'О нас',
    contacts: 'Контакты',
    meta: 'Настройки',
  };

  let site = null;
  let currentSection = 'hero';
  let menuTab = 'pizza';

  const $ = id => document.getElementById(id);

  function getStoredToken() {
    try {
      return sessionStorage.getItem(TOKEN_KEY) || '';
    } catch {
      return '';
    }
  }

  function setStoredToken(token) {
    try {
      if (token) sessionStorage.setItem(TOKEN_KEY, token);
      else sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  }

  function authHeaders(extra = {}) {
    const token = getStoredToken();
    return {
      ...(token ? { 'X-Admin-Token': token } : {}),
      ...extra,
    };
  }

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function field(label, html) {
    return `<label class="field"><span>${esc(label)}</span>${html}</label>`;
  }

  function input(name, value, type = 'text') {
    return `<input type="${type}" data-field="${esc(name)}" value="${esc(value)}">`;
  }

  function textarea(name, value) {
    return `<textarea data-field="${esc(name)}">${esc(value)}</textarea>`;
  }

  function imagePreviewSrc(src) {
    if (!src) return '';
    if (/^https?:\/\//i.test(src)) return src;
    if (src.startsWith('/')) return src;
    return `/${src}`;
  }

  function isPhotoPath(src) {
    return /\.(png|jpe?g|webp)$/i.test(src || '') || /^https?:\/\//i.test(src || '');
  }

  function isDeletableImage(src) {
    if (!src) return false;
    if (/^https?:\/\//i.test(src)) return true;
    return src.startsWith('assets/images/uploads/');
  }

  function renderPhotoControls(src, deleteAttr) {
    if (!isPhotoPath(src)) return '';
    return `
      <div class="photo-admin">
        <img src="${imagePreviewSrc(src)}" alt="" class="photo-admin__thumb">
        <button type="button" class="btn btn--sm btn--danger" ${deleteAttr}>Удалить фото</button>
      </div>`;
  }

  async function deleteImageFile(src) {
    if (!isDeletableImage(src)) return;
    await api('/api/admin/delete-image', { method: 'POST', body: JSON.stringify({ path: src }) });
  }

  async function confirmPhotoDelete(src, message) {
    const text = isDeletableImage(src)
      ? (message || 'Удалить фото с сайта? Файл будет удалён с сервера.')
      : (message || 'Убрать фото со страницы?');
    return window.confirm(text);
  }

  function setStatus(msg, type = '') {
    const el = $('save-status');
    el.textContent = msg;
    el.className = 'admin__status' + (type ? ` admin__status--${type}` : '');
  }

  async function api(path, options = {}) {
    const res = await fetch(path, {
      credentials: 'same-origin',
      headers: authHeaders({ 'Content-Type': 'application/json', ...(options.headers || {}) }),
      ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Ошибка запроса');
    return data;
  }

  async function checkSession() {
    const { authed } = await api('/api/admin/session');
    return authed;
  }

  function showAdmin() {
    $('login-screen').hidden = true;
    $('admin-app').hidden = false;
  }

  function showLogin() {
    $('login-screen').hidden = false;
    $('admin-app').hidden = true;
  }

  function readFields(root) {
    const out = {};
    root.querySelectorAll('[data-field]').forEach(el => {
      const key = el.dataset.field;
      const parts = key.split('.');
      let obj = out;
      for (let i = 0; i < parts.length - 1; i++) {
        obj[parts[i]] = obj[parts[i]] || {};
        obj = obj[parts[i]];
      }
      const last = parts[parts.length - 1];
      let val = el.value;
      if (el.type === 'number') val = val === '' ? 0 : Number(val);
      obj[last] = val;
    });
    return out;
  }

  function mergeDeep(target, source) {
    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        target[key] = mergeDeep(target[key] || {}, source[key]);
      } else {
        target[key] = source[key];
      }
    });
    return target;
  }

  function renderHero() {
    const h = site.hero;
    const p = site.homePromo;
    return `
      <div class="card">
        <h3 class="card__title">Блок «Меню» на главной</h3>
        ${field('Подзаголовок', input('hero.subtitle', h.subtitle))}
        ${field('Заголовок', input('hero.title', h.title))}
        ${field('Текст под линией', input('hero.divider', h.divider))}
        ${field('Кнопка', input('hero.cta', h.cta))}
        <div class="field--row">
          ${field('Фото (путь)', input('hero.image', h.image))}
          ${field('Alt фото', input('hero.imageAlt', h.imageAlt))}
        </div>
        <div class="upload-row">
          <input type="file" accept="image/*" id="hero-upload">
          <button type="button" class="btn btn--sm btn--ghost" id="hero-upload-btn">Загрузить фото</button>
        </div>
        ${(isDeletableImage(h.image) || (h.image && h.image !== 'assets/images/hero-drinks.png'))
          ? renderPhotoControls(h.image, 'id="hero-delete-photo"') : ''}
      </div>
      <div class="card">
        <h3 class="card__title">Промо «Пивной сет»</h3>
        ${field('Подпись', input('homePromo.tagline', p.tagline))}
        ${field('Сет (ID из раздела Сеты)', input('homePromo.setId', p.setId))}
        <p style="font-size:12px;color:var(--accent-dim)">Название, цена и фото берутся из выбранного сета.</p>
      </div>
    `;
  }

  function renderMenuItemCard(item, cat, index) {
    return `
      <div class="item-card" data-cat="${cat}" data-index="${index}">
        <div class="item-card__head">
          <strong>${esc(item.name || 'Новое блюдо')}</strong>
          <button type="button" class="btn btn--sm btn--danger" data-delete-item="${cat}:${index}">Удалить</button>
        </div>
        <div class="field--row">
          ${field('Название', `<input data-item-field="name" value="${esc(item.name)}">`)}
          ${field('ID', `<input data-item-field="id" value="${esc(item.id)}">`)}
        </div>
        ${field('Описание', `<textarea data-item-field="desc">${esc(item.desc)}</textarea>`)}
        <div class="field--row">
          ${field('Цена', `<input type="number" step="0.01" data-item-field="price" value="${item.price}">`)}
          ${field('Картинка (SVG имя или путь к фото)', `<input data-item-field="image" value="${esc(item.image)}">`)}
        </div>
        ${renderPhotoControls(item.image, `data-delete-item-photo="${cat}:${index}"`)}
      </div>
    `;
  }

  function renderMenu() {
    const tabs = MENU_CATS.map(cat => {
      const name = site.categories.find(c => c.id === cat)?.name || cat;
      return `<button type="button" class="tab${menuTab === cat ? ' tab--active' : ''}" data-menu-tab="${cat}">${esc(name)}</button>`;
    }).join('');

    const items = (site[menuTab] || []).map((item, i) => renderMenuItemCard(item, menuTab, i)).join('');

    return `
      <div class="card">
        <h3 class="card__title">Блюда по категориям</h3>
        <div class="tabs">${tabs}</div>
        <div class="items-list" id="menu-items">${items}</div>
        <button type="button" class="btn btn--sm btn--ghost" id="add-menu-item" style="margin-top:12px">+ Добавить блюдо</button>
      </div>
      <div class="card">
        <h3 class="card__title">Категории навигации</h3>
        <div class="items-list">
          ${site.categories.map((cat, i) => `
            <div class="item-card" data-cat-meta="${i}">
              <div class="field--row">
                ${field('Название', `<input data-cat-field="name" value="${esc(cat.name)}">`)}
                ${field('ID', `<input data-cat-field="id" value="${esc(cat.id)}">`)}
              </div>
              ${field('Иконка (файл в assets/svg/icons/)', `<input data-cat-field="icon" value="${esc(cat.icon)}">`)}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderSets() {
    return `
      <div class="card">
        <h3 class="card__title">Сеты</h3>
        <div class="items-list">
          ${site.sets.map((set, i) => `
            <div class="item-card" data-set="${i}">
              <div class="item-card__head">
                <strong>${esc(set.name)}</strong>
                <button type="button" class="btn btn--sm btn--danger" data-delete-set="${i}">Удалить</button>
              </div>
              <div class="field--row">
                ${field('Название', `<input data-set-field="name" value="${esc(set.name)}">`)}
                ${field('ID', `<input data-set-field="id" value="${esc(set.id)}">`)}
              </div>
              <div class="field--row">
                ${field('Вес', `<input data-set-field="weight" value="${esc(set.weight)}">`)}
                ${field('Цена', `<input type="number" step="0.01" data-set-field="price" value="${set.price}">`)}
              </div>
              ${field('Состав', `<textarea data-set-field="desc">${esc(set.desc)}</textarea>`)}
              ${field('Картинка', `<input data-set-field="image" value="${esc(set.image)}">`)}
              ${renderPhotoControls(set.image, `data-delete-set-photo="${i}"`)}
            </div>
          `).join('')}
        </div>
        <button type="button" class="btn btn--sm btn--ghost" id="add-set" style="margin-top:12px">+ Добавить сет</button>
      </div>
    `;
  }

  function renderDrinks() {
    return DRINK_KEYS.map(key => {
      const section = site.drinks[key];
      return `
        <div class="card" data-drink-section="${key}">
          <h3 class="card__title">${esc(section.title)}</h3>
          ${field('Заголовок раздела', `<input data-drink-title="${key}" value="${esc(section.title)}">`)}
          <div class="items-list">
            ${section.items.map((item, i) => `
              <div class="item-card" data-drink="${key}:${i}">
                <div class="item-card__head">
                  <strong>${esc(item.name)}</strong>
                  <button type="button" class="btn btn--sm btn--danger" data-delete-drink="${key}:${i}">Удалить</button>
                </div>
                <div class="field--row">
                  ${field('Название', `<input data-drink-field="name" value="${esc(item.name)}">`)}
                  ${field('ID', `<input data-drink-field="id" value="${esc(item.id)}">`)}
                </div>
                <div class="field--row">
                  ${field('Объём', `<input data-drink-field="desc" value="${esc(item.desc)}">`)}
                  ${field('Цена', `<input type="number" step="0.01" data-drink-field="price" value="${item.price}">`)}
                </div>
                ${field('Иконка (запасная)', `<input data-drink-field="icon" value="${esc(item.icon || '')}">`)}
                ${field('Фото (путь)', `<input data-drink-field="image" value="${esc(item.image || '')}">`)}
                ${renderPhotoControls(item.image, `data-delete-drink-photo="${key}:${i}"`)}
              </div>
            `).join('')}
          </div>
          <button type="button" class="btn btn--sm btn--ghost" data-add-drink="${key}" style="margin-top:12px">+ Напиток</button>
        </div>
      `;
    }).join('') + `
      <div class="card">
        ${field('Текст внизу страницы напитков', input('drinksFooter', site.drinksFooter))}
      </div>
    `;
  }

  function renderPromotions() {
    return `
      <div class="card">
        <h3 class="card__title">Акции</h3>
        <div class="items-list">
          ${site.promotions.map((promo, i) => `
            <div class="item-card" data-promo="${i}">
              <div class="item-card__head">
                <strong>${esc(promo.title)}</strong>
                <button type="button" class="btn btn--sm btn--danger" data-delete-promo="${i}">Удалить</button>
              </div>
              <div class="field--row">
                ${field('Заголовок', `<input data-promo-field="title" value="${esc(promo.title)}">`)}
                ${field('ID', `<input data-promo-field="id" value="${esc(promo.id)}">`)}
              </div>
              ${field('Описание', `<textarea data-promo-field="desc">${esc(promo.desc)}</textarea>`)}
              <div class="field--row">
                ${field('Подпись', `<input data-promo-field="sub" value="${esc(promo.sub)}">`)}
                ${field('Картинка', `<input data-promo-field="image" value="${esc(promo.image)}">`)}
              </div>
              ${renderPhotoControls(promo.image, `data-delete-promo-photo="${i}"`)}
            </div>
          `).join('')}
        </div>
        <button type="button" class="btn btn--sm btn--ghost" id="add-promo" style="margin-top:12px">+ Акция</button>
      </div>
    `;
  }

  function renderAbout() {
    return `
      <div class="card">
        <h3 class="card__title">Текст о кафе</h3>
        ${field('Описание', textarea('about.text', site.about.text))}
      </div>
      <div class="card">
        <h3 class="card__title">Преимущества</h3>
        <div class="items-list">
          ${site.about.features.map((f, i) => `
            <div class="item-card" data-feature="${i}">
              ${field('Текст (\\n для переноса)', `<textarea data-feature-field="label">${esc(f.label)}</textarea>`)}
            </div>
          `).join('')}
        </div>
      </div>
      <div class="card">
        <h3 class="card__title">Галерея</h3>
        <div class="gallery-admin" id="gallery-admin">
          ${site.gallery.length ? site.gallery.map((img, i) => `
            <div class="gallery-admin__item" data-gallery="${i}">
              <img src="${imagePreviewSrc(img.src)}" alt="" class="gallery-admin__thumb">
              <div>
                ${field('Путь', `<input data-gallery-field="src" value="${esc(img.src)}">`)}
                ${field('Alt', `<input data-gallery-field="alt" value="${esc(img.alt)}">`)}
              </div>
              <button type="button" class="btn btn--sm btn--danger" data-delete-gallery="${i}">Удалить</button>
            </div>
          `).join('') : '<p class="gallery-admin__empty">Пока нет фото. Загрузите или добавьте слайд.</p>'}
        </div>
        <div class="upload-row" style="margin-top:12px">
          <input type="file" accept="image/*" id="gallery-upload">
          <button type="button" class="btn btn--sm btn--ghost" id="gallery-upload-btn">Загрузить фото</button>
          <button type="button" class="btn btn--sm btn--ghost" id="add-gallery">+ Добавить слайд</button>
        </div>
      </div>
    `;
  }

  function renderContacts() {
    const c = site.contacts;
    return `
      <div class="card">
        <h3 class="card__title">Контакты и карта</h3>
        ${field('Телефон', input('contacts.phone', c.phone))}
        ${field('Адрес', input('contacts.address', c.address))}
        ${field('Часы работы', input('contacts.hours', c.hours))}
        ${field('Запрос геокодера', input('contacts.geocodeQuery', c.geocodeQuery))}
        ${field('Подпись на карте', input('contacts.mapLabel', c.mapLabel))}
        <div class="field--row">
          ${field('Широта', `<input type="number" step="any" data-field="contacts.coords.lat" value="${c.coords.lat}">`)}
          ${field('Долгота', `<input type="number" step="any" data-field="contacts.coords.lng" value="${c.coords.lng}">`)}
        </div>
        ${field('Ключ Yandex Maps API', input('contacts.yandexApiKey', c.yandexApiKey))}
      </div>
    `;
  }

  function renderMeta() {
    return `
      <div class="card">
        <h3 class="card__title">SEO и заголовок вкладки</h3>
        ${field('Title', input('meta.title', site.meta.title))}
        ${field('Description', textarea('meta.description', site.meta.description))}
      </div>
    `;
  }

  function collectFromDom() {
    const root = $('admin-content');
    const patch = readFields(root);
    mergeDeep(site, patch);

    root.querySelectorAll('[data-cat-meta]').forEach(el => {
      const i = Number(el.dataset.catMeta);
      el.querySelectorAll('[data-cat-field]').forEach(inp => {
        site.categories[i][inp.dataset.catField] = inp.value;
      });
    });

    if (currentSection === 'menu') {
      site[menuTab] = [];
      root.querySelectorAll(`[data-cat="${menuTab}"]`).forEach(el => {
        const item = {};
        el.querySelectorAll('[data-item-field]').forEach(inp => {
          let v = inp.value;
          if (inp.dataset.itemField === 'price') v = Number(v);
          item[inp.dataset.itemField] = v;
        });
        site[menuTab].push(item);
      });
    }

    root.querySelectorAll('[data-set]').forEach(el => {
      const i = Number(el.dataset.set);
      el.querySelectorAll('[data-set-field]').forEach(inp => {
        let v = inp.value;
        if (inp.dataset.setField === 'price') v = Number(v);
        site.sets[i][inp.dataset.setField] = v;
      });
    });

    DRINK_KEYS.forEach(key => {
      const titleInp = root.querySelector(`[data-drink-title="${key}"]`);
      if (titleInp) site.drinks[key].title = titleInp.value;
      site.drinks[key].items = [];
      root.querySelectorAll(`[data-drink^="${key}:"]`).forEach(el => {
        const parts = el.dataset.drink.split(':');
        const item = {};
        el.querySelectorAll('[data-drink-field]').forEach(inp => {
          let v = inp.value;
          if (inp.dataset.drinkField === 'price') v = Number(v);
          item[inp.dataset.drinkField] = v;
        });
        site.drinks[key].items.push(item);
      });
    });

    root.querySelectorAll('[data-promo]').forEach(el => {
      const i = Number(el.dataset.promo);
      el.querySelectorAll('[data-promo-field]').forEach(inp => {
        site.promotions[i][inp.dataset.promoField] = inp.value;
      });
    });

    root.querySelectorAll('[data-feature]').forEach(el => {
      const i = Number(el.dataset.feature);
      const inp = el.querySelector('[data-feature-field]');
      if (inp) site.about.features[i].label = inp.value;
    });

    site.gallery = [];
    root.querySelectorAll('[data-gallery]').forEach(el => {
      const img = {};
      el.querySelectorAll('[data-gallery-field]').forEach(inp => {
        img[inp.dataset.galleryField] = inp.value;
      });
      site.gallery.push(img);
    });
  }

  function render() {
    $('section-title').textContent = SECTION_TITLES[currentSection];
    const renderers = {
      hero: renderHero,
      menu: renderMenu,
      sets: renderSets,
      drinks: renderDrinks,
      promotions: renderPromotions,
      about: renderAbout,
      contacts: renderContacts,
      meta: renderMeta,
    };
    $('admin-content').innerHTML = renderers[currentSection]();
    bindSectionEvents();
  }

  async function uploadFile(fileInput) {
    const file = fileInput.files?.[0];
    if (!file) throw new Error('Выберите файл');
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      credentials: 'same-origin',
      headers: authHeaders(),
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка загрузки');
    return data.path;
  }

  function bindSectionEvents() {
    const root = $('admin-content');

    root.querySelectorAll('[data-menu-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        collectFromDom();
        menuTab = btn.dataset.menuTab;
        render();
      });
    });

    $('add-menu-item')?.addEventListener('click', () => {
      collectFromDom();
      site[menuTab].push({ id: `new-${Date.now()}`, name: 'Новое блюдо', desc: '', price: 0, image: 'pizza-pepperoni' });
      render();
    });

    root.querySelectorAll('[data-delete-item]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [cat, idx] = btn.dataset.deleteItem.split(':');
        collectFromDom();
        site[cat].splice(Number(idx), 1);
        render();
      });
    });

    $('add-set')?.addEventListener('click', () => {
      collectFromDom();
      site.sets.push({ id: `set-${Date.now()}`, name: 'Новый сет', weight: '500 г', desc: '', price: 0, image: 'beer-set' });
      render();
    });

    root.querySelectorAll('[data-delete-set]').forEach(btn => {
      btn.addEventListener('click', () => {
        collectFromDom();
        site.sets.splice(Number(btn.dataset.deleteSet), 1);
        render();
      });
    });

    root.querySelectorAll('[data-add-drink]').forEach(btn => {
      btn.addEventListener('click', () => {
        collectFromDom();
        const key = btn.dataset.addDrink;
        site.drinks[key].items.push({ id: `drink-${Date.now()}`, name: 'Напиток', desc: '0.5 л', price: 0, icon: 'glass' });
        render();
      });
    });

    root.querySelectorAll('[data-delete-drink]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [key, idx] = btn.dataset.deleteDrink.split(':');
        collectFromDom();
        site.drinks[key].items.splice(Number(idx), 1);
        render();
      });
    });

    $('add-promo')?.addEventListener('click', () => {
      collectFromDom();
      site.promotions.push({ id: `promo-${Date.now()}`, title: 'Акция', desc: '', sub: '', image: 'promo-beer' });
      render();
    });

    root.querySelectorAll('[data-delete-promo]').forEach(btn => {
      btn.addEventListener('click', () => {
        collectFromDom();
        site.promotions.splice(Number(btn.dataset.deletePromo), 1);
        render();
      });
    });

    $('add-gallery')?.addEventListener('click', () => {
      collectFromDom();
      site.gallery.push({ src: 'assets/images/gallery/gallery-01.png', alt: 'Фото кафе' });
      render();
    });

    root.querySelectorAll('[data-delete-gallery]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const i = Number(btn.dataset.deleteGallery);
        collectFromDom();
        const img = site.gallery[i];
        if (!img) return;
        if (!(await confirmPhotoDelete(img.src, 'Удалить это фото из галереи?'))) return;
        try {
          if (isDeletableImage(img.src)) await deleteImageFile(img.src);
          site.gallery.splice(i, 1);
          render();
          setStatus('Фото удалено', 'ok');
        } catch (e) {
          setStatus(e.message, 'err');
        }
      });
    });

    $('hero-delete-photo')?.addEventListener('click', async () => {
      collectFromDom();
      const src = site.hero.image;
      if (!(await confirmPhotoDelete(src))) return;
      try {
        if (isDeletableImage(src)) await deleteImageFile(src);
        site.hero.image = 'assets/images/hero-drinks.png';
        render();
        setStatus('Фото удалено', 'ok');
      } catch (e) {
        setStatus(e.message, 'err');
      }
    });

    root.querySelectorAll('[data-delete-item-photo]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const [cat, idx] = btn.dataset.deleteItemPhoto.split(':');
        collectFromDom();
        const item = site[cat][Number(idx)];
        if (!item) return;
        const src = item.image;
        if (!(await confirmPhotoDelete(src))) return;
        try {
          if (isDeletableImage(src)) await deleteImageFile(src);
          item.image = 'pizza-pepperoni';
          render();
          setStatus('Фото удалено', 'ok');
        } catch (e) {
          setStatus(e.message, 'err');
        }
      });
    });

    root.querySelectorAll('[data-delete-set-photo]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const i = Number(btn.dataset.deleteSetPhoto);
        collectFromDom();
        const set = site.sets[i];
        if (!set) return;
        const src = set.image;
        if (!(await confirmPhotoDelete(src))) return;
        try {
          if (isDeletableImage(src)) await deleteImageFile(src);
          set.image = 'beer-set';
          render();
          setStatus('Фото удалено', 'ok');
        } catch (e) {
          setStatus(e.message, 'err');
        }
      });
    });

    root.querySelectorAll('[data-delete-drink-photo]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const [key, idx] = btn.dataset.deleteDrinkPhoto.split(':');
        collectFromDom();
        const item = site.drinks[key].items[Number(idx)];
        if (!item) return;
        const src = item.image;
        if (!(await confirmPhotoDelete(src))) return;
        try {
          if (isDeletableImage(src)) await deleteImageFile(src);
          item.image = '';
          render();
          setStatus('Фото удалено', 'ok');
        } catch (e) {
          setStatus(e.message, 'err');
        }
      });
    });

    root.querySelectorAll('[data-delete-promo-photo]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const i = Number(btn.dataset.deletePromoPhoto);
        collectFromDom();
        const promo = site.promotions[i];
        if (!promo) return;
        const src = promo.image;
        if (!(await confirmPhotoDelete(src))) return;
        try {
          if (isDeletableImage(src)) await deleteImageFile(src);
          promo.image = 'promo-beer';
          render();
          setStatus('Фото удалено', 'ok');
        } catch (e) {
          setStatus(e.message, 'err');
        }
      });
    });

    $('hero-upload-btn')?.addEventListener('click', async () => {
      try {
        const path = await uploadFile($('hero-upload'));
        collectFromDom();
        site.hero.image = path;
        render();
        setStatus('Фото загружено', 'ok');
      } catch (e) {
        setStatus(e.message, 'err');
      }
    });

    $('gallery-upload-btn')?.addEventListener('click', async () => {
      try {
        const path = await uploadFile($('gallery-upload'));
        collectFromDom();
        site.gallery.push({ src: path, alt: 'Фото кафе DUBRAVENKA' });
        render();
        setStatus('Фото добавлено в галерею', 'ok');
      } catch (e) {
        setStatus(e.message, 'err');
      }
    });
  }

  async function save() {
    try {
      collectFromDom();
      await api('/api/admin/site', { method: 'PUT', body: JSON.stringify(site) });
      setStatus('Сохранено', 'ok');
    } catch (e) {
      setStatus(e.message, 'err');
    }
  }

  async function initAdmin() {
    site = await api('/api/admin/site');
    if (!Array.isArray(site.gallery)) site.gallery = [];
    render();

    document.querySelectorAll('.admin__nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        collectFromDom();
        currentSection = btn.dataset.section;
        document.querySelectorAll('.admin__nav-item').forEach(b => b.classList.toggle('admin__nav-item--active', b === btn));
        render();
      });
    });

    $('save-btn').addEventListener('click', save);
    $('logout-btn').addEventListener('click', async () => {
      await api('/api/admin/logout', { method: 'POST' });
      setStoredToken('');
      showLogin();
    });
  }

  $('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const err = $('login-error');
    const btn = e.target.querySelector('button[type="submit"]');
    err.hidden = true;
    if (btn) btn.disabled = true;
    try {
      const data = await api('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ password: $('login-password').value }),
      });
      if (data.token) setStoredToken(data.token);
      await initAdmin();
      showAdmin();
    } catch (e) {
      setStoredToken('');
      err.textContent = e.message === 'Неверный пароль' || e.message === 'Bad request'
        ? 'Неверный пароль'
        : (e.message || 'Ошибка входа');
      err.hidden = false;
    } finally {
      if (btn) btn.disabled = false;
    }
  });

  checkSession().then(authed => {
    if (authed) {
      initAdmin().then(showAdmin).catch(() => {
        setStoredToken('');
        showLogin();
      });
    } else {
      setStoredToken('');
    }
  }).catch(() => {
    setStoredToken('');
  });
})();
