import { test, expect } from '@playwright/test';

test.describe('DUBRAVENKA Menu Site', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('home page loads with hero and logo', async ({ page }) => {
    await expect(page).toHaveTitle(/DUBRAVENKA/);
    await expect(page.locator('.header__logo')).toHaveText('DUBRAVENKA');
    await expect(page.locator('.hero__title')).toHaveText('Меню');
    await expect(page.locator('.hero__subtitle')).toHaveText('Вкусно и прохладно');
    await expect(page.locator('link[rel="stylesheet"][href="css/styles.css"]')).toHaveCount(1);
  });

  test('hero opens full menu page', async ({ page }) => {
    await page.locator('#hero-cta').click();
    await expect(page.locator('#view-fullmenu')).toHaveClass(/view--active/);
    await page.locator('#fullmenu-back').click();
    await expect(page.locator('#view-home')).toHaveClass(/view--active/);
    await page.locator('#hero-title').click();
    await expect(page.locator('#view-fullmenu')).toHaveClass(/view--active/);
    await expect(page.locator('#fullmenu-grid .section-header__title').first()).toHaveText('Пицца');
    await expect(page.locator('#fullmenu-grid .section-header__title').nth(1)).toHaveText('Напитки');
    await expect(page.locator('#fullmenu-grid .menu-item')).toHaveCount(31);
    await page.locator('#fullmenu-back').click();
    await expect(page.locator('#view-home')).toHaveClass(/view--active/);
  });

  test('category navigation renders all categories', async ({ page }) => {
    const cards = page.locator('.category-card');
    await expect(cards).toHaveCount(6);
    await expect(cards.nth(0)).toContainText('Пицца');
    await expect(cards.nth(1)).toContainText('Напитки');
    await expect(cards.nth(5)).toContainText('Сеты');
    await expect(cards.nth(0).locator('.category-card__frame')).toBeVisible();
  });

  test('pizza preview shows items on home', async ({ page }) => {
    const items = page.locator('#home-preview .menu-item');
    await expect(items).toHaveCount(3);
    await expect(items.first().locator('.menu-item__name')).toHaveText('Пепперони');
    await expect(items.first().locator('.menu-item__price')).toHaveText('24.90 руб');
  });

  test('clicking category opens category view', async ({ page }) => {
    await page.locator('[data-category="hot"]').click();
    await expect(page.locator('#view-category')).toHaveClass(/view--active/);
    await expect(page.locator('#cat-title')).toHaveText('Горячее');
    const items = page.locator('#category-list .menu-item');
    await expect(items).toHaveCount(5);
  });

  test('back button returns to home', async ({ page }) => {
    await page.locator('[data-category="salads"]').click();
    await expect(page.locator('#view-category')).toHaveClass(/view--active/);
    await page.locator('#cat-back').click();
    await expect(page.locator('#view-home')).toHaveClass(/view--active/);
  });

  test('sets view shows all sets', async ({ page }) => {
    await page.locator('[data-category="sets"]').click();
    await expect(page.locator('#view-sets')).toHaveClass(/view--active/);
    const sets = page.locator('.set-card');
    await expect(sets).toHaveCount(4);
    await expect(sets.first().locator('.set-card__name')).toHaveText('Пивной сет');
  });

  test('drinks view shows drink sections', async ({ page }) => {
    await page.locator('[data-category="drinks"]').click();
    await expect(page.locator('#view-drinks')).toHaveClass(/view--active/);
    await expect(page.locator('.drinks-hero__title')).toHaveText('Напитки');
    const sections = page.locator('.drinks-section');
    await expect(sections).toHaveCount(3);
    const cards = page.locator('.drink-card');
    await expect(cards).toHaveCount(7);
  });

  test('bottom nav switches to promotions', async ({ page }) => {
    await page.locator('.bottom-nav [data-nav="promotions"]').click();
    await expect(page.locator('#view-promotions')).toHaveClass(/view--active/);
    const promos = page.locator('.promo-banner');
    await expect(promos).toHaveCount(3);
  });

  test('bottom nav switches to about', async ({ page }) => {
    await page.locator('.bottom-nav [data-nav="about"]').click();
    await expect(page.locator('#view-about')).toHaveClass(/view--active/);
    await expect(page.locator('.about__text')).toBeVisible();
    await expect(page.locator('.about-gallery__slide')).toHaveCount(8);
    await expect(page.locator('.about-gallery__slide--active')).toHaveCount(1);
    const features = page.locator('.about__feature');
    await expect(features).toHaveCount(3);
  });

  test('bottom nav switches to contacts', async ({ page }) => {
    await page.locator('.bottom-nav [data-nav="contacts"]').click({ force: true });
    await expect(page.locator('#view-contacts')).toHaveClass(/view--active/);
    await expect(page.locator('#contact-address')).toHaveText('г. Могилев, наб. реки Дубровенка, 2');
    await expect(page.locator('#contact-phone')).toHaveText('+375 (29) 541-04-24');
    await expect(page.locator('#yandex-map')).toBeVisible();
    await expect(page.locator('#contact-hours')).toHaveText('11:00 — 23:00');
  });

  test('add button shows toast', async ({ page }) => {
    await page.locator('#home-preview .menu-item__add').first().click();
    const toast = page.locator('#toast');
    await expect(toast).toHaveClass(/toast--visible/);
    await expect(toast).toContainText('Пепперони');
  });

  test('grill opens cart with added items', async ({ page }) => {
    await page.locator('#home-preview .menu-item__add').first().click();
    await page.locator('#cart-toggle').click();
    await expect(page.locator('#cart-panel')).toHaveClass(/cart-panel--open/);
    await expect(page.locator('.cart-item__name').first()).toHaveText('Пепперони');
    await expect(page.locator('#cart-total')).toHaveText('24.90 руб');
  });

  test('beer promo card is visible on home', async ({ page }) => {
    await expect(page.locator('.promo-card__title')).toHaveText('Пивной сет');
    await expect(page.locator('.promo-card__badge .promo-card__price')).toHaveText('30 руб');
  });

  test('overlay menu opens and closes', async ({ page }) => {
    await page.locator('#menu-toggle').click();
    await expect(page.locator('#overlay-menu')).toHaveClass(/overlay-menu--open/);
    await page.locator('#menu-close').click();
    await expect(page.locator('#overlay-menu')).not.toHaveClass(/overlay-menu--open/);
  });

  test('see all pizza link opens full pizza category', async ({ page }) => {
    await page.locator('#home-preview [data-category="pizza"]').click();
    await expect(page.locator('#cat-title')).toHaveText('Пицца');
    const items = page.locator('#category-list .menu-item');
    await expect(items).toHaveCount(4);
  });

  test('page is responsive at mobile width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(page.locator('.hero__title')).toBeVisible();
    await expect(page.locator('.bottom-nav')).toBeVisible();
    await expect(page.locator('.categories__scroll')).toBeVisible();
  });

  test('critical assets load without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
    const heroImg = page.locator('.hero__image img');
    await expect(heroImg).toHaveAttribute('src', /hero-drinks\.png/);
    const naturalWidth = await heroImg.evaluate((img: HTMLImageElement) => img.naturalWidth);
    expect(naturalWidth).toBeGreaterThan(0);
  });
});
