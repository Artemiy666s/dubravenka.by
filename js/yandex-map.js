(function () {
  'use strict';

  let mapInstance = null;
  let scriptLoading = null;
  let resizeHandler = null;
  let mapMode = null;

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
      script.onerror = () => reject(new Error('Yandex Maps script error'));
      document.head.appendChild(script);
    });

    return scriptLoading;
  }

  function whenLayoutReady(callback) {
    requestAnimationFrame(() => requestAnimationFrame(callback));
  }

  function scheduleResize() {
    [0, 150, 400, 800].forEach((delay) => {
      setTimeout(() => {
        if (mapInstance) mapInstance.container.fitToViewport();
      }, delay);
    });
  }

  function bindResize() {
    if (resizeHandler) return;
    resizeHandler = () => {
      if (mapInstance) mapInstance.container.fitToViewport();
    };
    window.addEventListener('resize', resizeHandler);
  }

  function destroyInteractiveMap() {
    if (mapInstance) {
      mapInstance.destroy();
      mapInstance = null;
    }
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler);
      resizeHandler = null;
    }
  }

  function showIframeMap(contacts) {
    const container = document.getElementById('yandex-map');
    if (!container) return;

    destroyInteractiveMap();
    mapMode = 'iframe';

    const { lat, lng, address } = contacts;
    const src = `https://yandex.ru/map-widget/v1/?ll=${lng},${lat}&z=17&pt=${lng},${lat},pm2orgm&text=${encodeURIComponent(contacts.mapLabel || 'DUBRAVENKA')}&l=map&lang=ru_RU`;

    container.innerHTML =
      `<iframe src="${src}" title="Карта — ${address}" width="100%" height="100%" frameborder="0" allowfullscreen loading="lazy" style="display:block;border:0"></iframe>`;
  }

  function resolveCoords(ymaps, contacts) {
    const query = contacts.geocodeQuery || contacts.address;
    const fallback = [contacts.coords.lat, contacts.coords.lng];

    return ymaps.geocode(query, { results: 1 }).then((res) => {
      const geo = res.geoObjects.get(0);
      return geo ? geo.geometry.getCoordinates() : fallback;
    }).catch(() => fallback);
  }

  function tilesLoaded() {
    const container = document.getElementById('yandex-map');
    if (!container) return false;
    return container.querySelectorAll('img[src*="maps.yandex"], img[src*="yandex.net"], img[src*="yastatic"]').length > 0;
  }

  function watchTilesOrFallback(contacts) {
    setTimeout(() => {
      if (mapMode !== 'interactive') return;
      if (!tilesLoaded()) showIframeMap(contacts);
    }, 2500);
  }

  function createInteractiveMap(ymaps, contacts, coords) {
    const container = document.getElementById('yandex-map');
    if (!container) return;

    if (mapInstance) {
      mapInstance.setCenter(coords, 17);
      scheduleResize();
      return;
    }

    container.innerHTML = '';
    mapMode = 'interactive';

    mapInstance = new ymaps.Map('yandex-map', {
      center: coords,
      zoom: 17,
      controls: ['zoomControl', 'fullscreenControl']
    }, {
      suppressMapOpenBlock: true,
      yandexMapDisablePoiInteractivity: false
    });

    const placemark = new ymaps.Placemark(coords, {
      balloonContentHeader: contacts.mapLabel || 'DUBRAVENKA',
      balloonContentBody: `${contacts.address}<br><a href="tel:${contacts.phone.replace(/[^\d+]/g, '')}">${contacts.phone}</a>`,
      hintContent: contacts.mapLabel || 'DUBRAVENKA'
    }, {
      preset: 'islands#orangeFoodIcon',
      iconCaption: 'DUBRAVENKA'
    });

    mapInstance.geoObjects.add(placemark);
    bindResize();
    scheduleResize();
    watchTilesOrFallback(contacts);
  }

  function initMap(contacts) {
    const container = document.getElementById('yandex-map');
    if (!container) return;

    if (mapMode === 'iframe' && container.querySelector('iframe')) return;

    whenLayoutReady(() => {
      loadYandexScript(contacts.yandexApiKey)
        .then((ymaps) => resolveCoords(ymaps, contacts))
        .then((coords) => loadYandexScript(contacts.yandexApiKey).then((ymaps) => {
          createInteractiveMap(ymaps, contacts, coords);
        }))
        .catch(() => showIframeMap(contacts));
    });
  }

  function destroyMap() {
    destroyInteractiveMap();
    mapMode = null;
    const container = document.getElementById('yandex-map');
    if (container) container.innerHTML = '';
  }

  window.DubravenkaMap = { init: initMap, destroy: destroyMap };
})();
