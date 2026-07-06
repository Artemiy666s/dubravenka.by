(function () {
  'use strict';

  let currentSrc = null;

  function buildMapSrc(contacts) {
    const { lat, lng } = contacts.coords;
    const label = encodeURIComponent(contacts.mapLabel || 'DUBRAVENKA');
    return `https://yandex.ru/map-widget/v1/?ll=${lng}%2C${lat}&z=17&pt=${lng}%2C${lat}%2Cpm2rdm&text=${label}&l=map&lang=ru_RU`;
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
    if (currentSrc === src && container.querySelector('iframe')) return;

    currentSrc = src;
    container.innerHTML = '';

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

  function initMap(contacts) {
    const container = document.getElementById('yandex-map');
    if (!container) return;

    waitForContainer(container).then(() => showIframeMap(contacts));
  }

  function destroyMap() {
    currentSrc = null;
    const container = document.getElementById('yandex-map');
    if (container) container.innerHTML = '';
  }

  window.DubravenkaMap = { init: initMap, destroy: destroyMap };
})();
