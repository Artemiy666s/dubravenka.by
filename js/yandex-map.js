(function () {
  'use strict';

  let mapInstance = null;
  let scriptLoading = null;
  let currentMode = null;

  function loadYandexScript(apiKey) {
    if (window.ymaps) return Promise.resolve(window.ymaps);
    if (scriptLoading) return scriptLoading;

    scriptLoading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU`;
      script.async = true;
      script.onload = () => {
        if (window.ymaps) {
          window.ymaps.ready(() => resolve(window.ymaps));
        } else {
          reject(new Error('Yandex Maps API failed to load'));
        }
      };
      script.onerror = () => reject(new Error('Yandex Maps API failed to load'));
      document.head.appendChild(script);
    });

    return scriptLoading;
  }

  function buildMapSrc(contacts) {
    const { lat, lng } = contacts.coords;
    return `https://yandex.ru/map-widget/v1/?ll=${lng}%2C${lat}&z=17&pt=${lng}%2C${lat}%2Cpm2rdm&l=map&lang=ru_RU`;
  }

  function waitForContainer(container) {
    return new Promise((resolve) => {
      const check = () => {
        if (container.offsetWidth > 0 && container.offsetHeight > 0) {
          resolve();
          return;
        }
        requestAnimationFrame(check);
      };
      requestAnimationFrame(() => requestAnimationFrame(check));
    });
  }

  function showIframeMap(contacts) {
    const container = document.getElementById('yandex-map');
    if (!container) return;

    const src = buildMapSrc(contacts);
    if (currentMode === 'iframe' && container.querySelector('iframe')?.src === src) return;

    destroyMap();
    currentMode = 'iframe';

    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.title = `Карта — ${contacts.address}`;
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.loading = 'lazy';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowfullscreen', '');
    iframe.style.cssText = 'display:block;border:0;width:100%;height:100%;background:#e5e3df';
    container.appendChild(iframe);
  }

  function showApiMap(contacts, ymaps) {
    const container = document.getElementById('yandex-map');
    if (!container) return;

    destroyMap();
    currentMode = 'api';

    const { lat, lng } = contacts.coords;
    mapInstance = new ymaps.Map(container, {
      center: [lat, lng],
      zoom: 17,
      controls: ['zoomControl'],
    }, {
      suppressMapOpenBlock: true,
      yandexMapDisablePoiInteractivity: true,
    });

    mapInstance.geoObjects.add(new ymaps.Placemark([lat, lng], {
      balloonContent: contacts.mapLabel || 'DUBRAVENKA',
      hintContent: contacts.mapLabel || 'DUBRAVENKA',
    }, {
      preset: 'islands#redFoodIcon',
    }));

    mapInstance.container.fitToViewport();
  }

  function tilesLoaded() {
    if (!mapInstance) return Promise.resolve(false);

    return new Promise((resolve) => {
      let settled = false;
      const finish = (ok) => {
        if (settled) return;
        settled = true;
        resolve(ok);
      };

      const timeout = window.setTimeout(() => finish(false), 4000);

      try {
        mapInstance.events.add('tilesload', () => {
          window.clearTimeout(timeout);
          finish(true);
        });
      } catch {
        window.clearTimeout(timeout);
        finish(false);
      }
    });
  }

  async function initMap(contacts) {
    const container = document.getElementById('yandex-map');
    if (!container) return;

    await waitForContainer(container);

    const apiKey = contacts.yandexApiKey;
    if (apiKey) {
      try {
        const ymaps = await loadYandexScript(apiKey);
        showApiMap(contacts, ymaps);
        const loaded = await tilesLoaded();
        if (!loaded) {
          showIframeMap(contacts);
        }
        return;
      } catch {
        /* fallback below */
      }
    }

    showIframeMap(contacts);
  }

  function destroyMap() {
    if (mapInstance) {
      mapInstance.destroy();
      mapInstance = null;
    }

    currentMode = null;
    const container = document.getElementById('yandex-map');
    if (container) container.innerHTML = '';
  }

  window.DubravenkaMap = { init: initMap, destroy: destroyMap };
})();
