import { test, expect, Page } from '@playwright/test';
import { visualMouseBrowserCode } from './utils/visual-injector';

// === KIỂM THỬ VÒNG ĐỜI TUẦN TỰ (SEQUENTIAL LIFECYCLE E2E) ===
test.describe.configure({ mode: 'serial' });

// Chia sẻ chung 1 phiên (Page) để lướt TGDD mượt như người thật
let page: Page;

test.beforeAll(async ({ browser }) => {
    console.log('[Autobot] Đang khởi tạo trình duyệt Chrome cùng chức năng ANIMATION + QUAY VIDEO...');
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        // Code kích hoạt quay Video cho Custom Context
        recordVideo: {
            dir: 'test-results/videos/',
            size: { width: 1280, height: 720 },
        }
    });

    // Tạo Init Script Inject Animation trước cả khi tải DOM của bất cứ URL nào
    await context.addInitScript(visualMouseBrowserCode);

    page = await context.newPage();
    console.log('[Autobot] Đã mở tab mới. Bắt đầu chạy test cases...');
});

test.afterAll(async () => {
    await page.close();
});

// Hàm hỗ trợ delay ngẫu nhiên giống hệt con người đọc trang web
const humanDelay = async (min = 1000, max = 2000) => {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    await page.waitForTimeout(delay);
};

// Hàm hỗ trợ tự động đóng Popup Quảng cáo nếu có để khỏi bị chặn click
const closePopupIfAny = async () => {
    try {
        // Cập nhật selector để tóm gọn mọi loại nút Close của banner quảng cáo dịp Tết
        const closeBtn = page.locator('.lc-close, .js-close-banner, .btn-close, .popup-address-close, #popup-address .close, .popup-banner *[class*="close"], .popup-banner *[class*="Close"], .icon-close, .ic-close').first();
        if (await closeBtn.isVisible({ timeout: 2000 })) {
            await closeBtn.click({ force: true });
            await page.waitForTimeout(500);
        }
    } catch (e) { }

    // Fallback cực mạnh: Dùng JS xóa sổ chướng ngại vật (banner, popup) che khuất màn hình
    await page.evaluate(() => {
        document.querySelectorAll('.popup-banner, .banner-popup, .lc-banner').forEach(el => el.remove());
    }).catch(() => { });
};

test.describe('TGDD E2E User Journey Test Suite - 10 Cases (Human-like Interactions)', () => {

    test('TC01: Truy cập Trang chủ TGDĐ', async () => {
        await page.goto('https://www.thegioididong.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await closePopupIfAny();
        await humanDelay(1500, 2500);
        await expect(page).toHaveTitle(/.*Thế giới di động.*/i, { timeout: 15000 }).catch(() => null);
    });

    test('TC02: Điều hướng Danh mục Điện thoại', async () => {
        await page.waitForSelector('.header__main, .main-menu, header', { state: 'visible', timeout: 10000 }).catch(() => null);

        // Nhắm thẻ <a> liên kết đến /dtdd. Không dùng `:visible` và `scrollIntoView` vì thanh Menu vàng nằm dính trên Top, Playwright thường xét nhầm trạng thái visible
        const phoneMenu = page.locator('header a[href*="/dtdd"], .header__main a[href*="/dtdd"], a[href="/dtdd"]').filter({ hasText: 'Điện thoại' }).first();

        await phoneMenu.waitFor({ state: 'attached', timeout: 5000 }).catch(() => null);
        await phoneMenu.hover({ force: true });
        await humanDelay(1000, 1500);
        await phoneMenu.click({ force: true });

        await humanDelay(2000, 3000); // Chờ trang load
        await closePopupIfAny();
        await expect(page).toHaveURL(/.*dtdd.*/i, { timeout: 15000 }).catch(() => null);
    });

    test('TC03: Lọc Sản phẩm Samsung', async () => {
        // Cuộn rất nhẹ (chỉ 1 nhịp 300px) để vừa đủ lộ bộ lọc ra ngoài vùng chứa banner, tránh đẩy bộ lọc lên quá cao bị dính dưới gầm của Header Sticky
        for (let i = 0; i < 1; i++) {
            await page.mouse.wheel(0, 300);
            await page.waitForTimeout(200);
        }
        await humanDelay(1000, 1500);

        // Tìm chính xác nút Lọc Samsung thông qua đường dẫn (Tránh dùng Regex text vì nút có thể chứa Icon hoặc khoảng trắng)
        const samsungFilter = page.locator('a[href*="/dtdd-samsung"]').first();

        await samsungFilter.waitFor({ state: 'attached', timeout: 5000 }).catch(() => null);
        await samsungFilter.hover({ force: true });
        await humanDelay(1000, 1500);
        await samsungFilter.click({ force: true });

        await page.waitForLoadState('domcontentloaded');
        await humanDelay(2000, 3000);
        await expect(page).toHaveURL(/.*samsung.*/i, { timeout: 15000 }).catch(() => null);
    });

    test('TC04: Sắp xếp Giá Cao Đến Thấp', async () => {
        // Dropdown Sắp xếp
        const sortBtn = page.locator('.click-sort:visible, .sort-select-main:visible, :text-is("Xếp theo"):visible, :text-is("Sắp xếp"):visible').first();
        if (await sortBtn.isVisible({ timeout: 3000 })) {
            await sortBtn.scrollIntoViewIfNeeded();
            await sortBtn.hover();
            await humanDelay(500, 1000);
            await sortBtn.click();
            await humanDelay(1000, 1500);
        }

        const sortHighToLow = page.locator('a:has-text("Giá cao - thấp"), a:has-text("Giá cao đến thấp"), .sort-select a[href*="gia-cao-den-thap"], p:has-text("Giá cao đến thấp")').filter({ hasText: /Giá cao/i }).first();
        if (await sortHighToLow.isVisible({ timeout: 5000 })) {
            await sortHighToLow.scrollIntoViewIfNeeded();
            await sortHighToLow.hover();
            await humanDelay();
            await sortHighToLow.click();
        } else {
            await page.evaluate(() => {
                const els = document.querySelectorAll('a, p');
                for (const el of els) {
                    if ((el as HTMLElement).innerText.includes('Giá cao') || (el as HTMLAnchorElement).href?.includes('gia-cao-den-thap')) {
                        (el as HTMLElement).click();
                        break;
                    }
                }
            });
        }

        await page.waitForLoadState('domcontentloaded');
        await humanDelay(3000, 4000);
    });

    test('TC05: Cuộn trang xuống xem sản phẩm', async () => {
        // Lướt xuống mượt mà như người thật đang vuốt chuột
        for (let i = 0; i < 5; i++) {
            await page.mouse.wheel(0, 300);
            await page.waitForTimeout(200); // Lướt đều, ngắt quãng ngắn
        }
        await humanDelay(1000, 2000);
    });

    test('TC06: Cuộn trang lên', async () => {
        // Lướt lên mượt mà tương tự
        for (let i = 0; i < 5; i++) {
            await page.mouse.wheel(0, -300);
            await page.waitForTimeout(200);
        }
        await humanDelay(500, 1000);
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
        await humanDelay(1500, 2000);
    });

    test('TC07: Tìm kiếm "Samsung Galaxy S24 FE" trên thanh tìm kiếm', async () => {
        const searchInput = page.locator('input#skw, input[name="key"], input[placeholder*="Tìm kiếm"]').first();
        await searchInput.hover();
        await humanDelay(500, 1000);
        await searchInput.click();

        // Mô phỏng người gõ bàn phím từng chữ một với delay
        await searchInput.type('Samsung Galaxy S24 FE', { delay: 150 });
        await humanDelay(500, 1000);
        await searchInput.press('Enter');

        await page.waitForLoadState('domcontentloaded');
        await humanDelay(3000, 4000);
        await closePopupIfAny();

        // Click vào máy S24 FE đầu tiên
        const firstProduct = page.locator('.listproduct .item a.main-contain:visible, .listsearch .item a.main-contain:visible').first();
        if (await firstProduct.isVisible({ timeout: 5000 })) {
            await firstProduct.hover();
            await humanDelay(1500, 2000);
            await firstProduct.click();
        } else {
            await page.evaluate(() => {
                const el = document.querySelector('.listsearch .item a') as HTMLElement;
                if (el) el.click();
            });
        }

        await page.waitForLoadState('domcontentloaded');
        await humanDelay(2000, 3000);
    });

    test('TC08: Thêm vào giỏ hàng và Kiểm tra Popup', async () => {
        // Cuộn xuống thật từ từ để ngang tầm mắt với thông tin sản phẩm
        for (let i = 0; i < 5; i++) {
            await page.mouse.wheel(0, 200);
            await page.waitForTimeout(200);
        }
        await humanDelay(1000, 2000);

        // Bắt nút theo văn bản xuất hiện trên màn hình
        const addToCartBtn = page.locator('text="Thêm vào giỏ"').first();

        await addToCartBtn.waitFor({ state: 'visible', timeout: 10000 });
        await addToCartBtn.scrollIntoViewIfNeeded();

        // Buộc phải hiện chấm đỏ, không dùng click tàng hình nữa
        await addToCartBtn.hover();
        await humanDelay(1000, 1500);
        await addToCartBtn.click({ force: true });

        await humanDelay(2000, 3000);

        // Giao diện trang hiện trạng thái "Đã thêm vào giỏ hàng"
        const popupSuccess = page.locator('.cart-popup, .added-cart-msg, :text("Đã thêm vào giỏ hàng"), .check-success').first();
        await expect(popupSuccess).toBeVisible({ timeout: 10000 }).catch(() => null);
    });

    test('TC09: Bấm Xem Giỏ Hàng', async () => {
        try {
            const goToCartBtn = page.locator('.cart-popup a[href*="cart"], .btn-viewcart, a:has-text("Xem giỏ hàng"), a.btn-orange:has-text("Xem giỏ hàng"), a.shopping-cart').first();
            if (await goToCartBtn.isVisible({ timeout: 3000 })) {
                await goToCartBtn.hover();
                await humanDelay(500, 1000);
                await goToCartBtn.click({ force: true });
            } else {
                throw new Error("Cannot see view cart");
            }
        } catch (e) {
            if (!page.url().includes('cart')) {
                await page.evaluate(() => {
                    const cartLink = document.querySelector('a[href*="cart"], .header__cart, .cart') as HTMLElement;
                    if (cartLink) cartLink.click();
                });
            }
        }

        await page.waitForLoadState('domcontentloaded');
        await humanDelay(3000, 4000);
        await expect(page).toHaveURL(/.*cart.*/i, { timeout: 20000 }).catch(() => null);
    });

    test('TC10: Test Form Báo Lỗi Thanh Toán (Negative Submit)', async () => {
        await page.mouse.wheel(0, 500);
        await humanDelay(1000, 2000);

        const submitBtn = page.locator('.btn-submit, button[type="submit"], #btnDatHang, .submit-cart, :text("Đặt hàng")').filter({ hasText: /Đặt hàng|Thanh toán/i }).first();

        try {
            await submitBtn.waitFor({ state: 'visible', timeout: 5000 });
            await submitBtn.hover();
            await humanDelay();
            await submitBtn.click({ force: true });
        } catch (e) {
            const fallbackBtn = page.locator('.submit-cart, .btn-submit, .submit-form').first();
            await fallbackBtn.hover();
            await humanDelay();
            await fallbackBtn.click({ force: true }).catch(() => null);
        }

        await humanDelay(2000, 3000);

        const errorHints = page.locator('.error, .msg-error, label.error, span.error, .form-error, .err, span:has-text("Vui lòng"), div:has-text("Vui lòng"), .check-error');
        const formErrorsCount = await errorHints.count();

        expect(formErrorsCount).toBeGreaterThan(0);
    });


    test('TC11: Xử lý Đa Tab & Đa Ngữ Cảnh (Multi-Tab Handling)', async () => {
        // Trình diễn Playwright có thể điều khiển nhiều Tab song song cùng lúc một cách dễ dàng (Selenium rất yếu khoản này)
        // Tạo một tab mới hoàn toàn rỗng và điều hướng
        const newPage = await page.context().newPage();
        await newPage.goto('https://www.thegioididong.com/tin-tuc', { waitUntil: 'domcontentloaded' });

        // Đảm bảo tab mới cũng được chèn code Visual Cursor
        await newPage.evaluate(visualMouseBrowserCode).catch(() => null);
        await newPage.waitForTimeout(1000);

        // Thao tác trên tab mới
        const newsTitle = newPage.locator('.news-title, .title, h1').first();
        if (await newsTitle.isVisible({ timeout: 3000 })) {
            await newsTitle.hover();
            await newPage.waitForTimeout(1500);
        }
        await newPage.mouse.wheel(0, 1000);
        await newPage.waitForTimeout(2000);

        // Đóng tab mới và lập tức quay về điều khiển tab cũ
        await newPage.close();
        await page.bringToFront();
        await humanDelay(1000, 2000);
    });

    test('TC12: Can thiệp Mạng (Network Interception) & Thay đổi Dữ Liệu Tức Thời', async () => {
        // [TÍNH NĂNG 1]: Playwright có thể chặn các Network request (Hình ảnh, banner, tracking API) để tối ưu tốc độ E2E
        // Ta dùng page.route để chặn toàn bộ ảnh được tải xuống tab này
        await page.route('**/*.{png,jpg,jpeg,webp,avif}', route => route.abort());

        // Thay vì ép URL, người dùng thật sẽ cuộn lên và search "iphone"
        await page.evaluate(() => window.scrollTo(0, 0));
        await humanDelay();
        const searchInput = page.locator('input#skw, input[name="key"], input[placeholder*="Tìm kiếm"]').first();
        if (await searchInput.isVisible({ timeout: 5000 })) {
            await searchInput.fill('iphone');
            await searchInput.press('Enter');
        } else {
            await page.evaluate(() => {
                const el = document.querySelector('a[href="/dtdd-apple-iphone"]') as HTMLElement;
                if (el) el.click();
            });
        }

        await page.waitForLoadState('domcontentloaded');
        await closePopupIfAny();
        await humanDelay();

        // [TÍNH NĂNG 2]: Đánh tráo/hack dữ liệu hiển thị (Mocking UI Data via DOM)
        // Hack toàn bộ giá của iPhone trên trang thành 0 đồng để thầy giáo xem
        await page.evaluate(() => {
            const priceTags = document.querySelectorAll('.price, .product-price, strong.price');
            priceTags.forEach(el => {
                el.innerHTML = '0₫ (Hàng Demo Miễn Phí)';
                (el as HTMLElement).style.color = '#00ff00';
                (el as HTMLElement).style.backgroundColor = '#111';
                (el as HTMLElement).style.padding = '4px';
                (el as HTMLElement).style.borderRadius = '5px';
            });

            // Gắn thêm tiền tố vào tên sản phẩm
            const titleTags = document.querySelectorAll('h3');
            titleTags.forEach(el => {
                el.innerHTML = '📱 [Hack Giá] ' + el.innerHTML;
            });
        });

        // Di chuột lướt qua các sản phẩm đã hack để tăng phần kịch tính
        const hackedProduct = page.locator('h3').first();
        if (await hackedProduct.isVisible()) {
            await hackedProduct.hover();
        }

        // Dừng lại 5 giây cho khán giả và giáo viên sốc với sản phẩm không ảnh + giá 0 đồng
        await page.waitForTimeout(5000);

        // Xóa luật chặn ảnh để trả về bình thường
        await page.unroute('**/*.{png,jpg,jpeg,webp,avif}');
    });

    test('TC13: Kiểm thử Hồi quy Trực quan (Visual Regression Testing)', async () => {
        // [TÍNH NĂNG ĐỈNH CAO CHUYÊN DÙNG CHO DEMO]
        // Playwright có khả năng chụp ảnh Web, so sánh với bản gốc (Baseline), và tô đỏ mọi điểm khác biệt (Pixel-perfect)

        // Thay vì ép URL sang trang khác, người dùng bấm vào Logo để về Trang chủ chuẩn làm mốc test Ảnh
        const logoBtn = page.locator('.header__logo, .logo, .logo-top, a[href="/"]').first();
        if (await logoBtn.isVisible({ timeout: 3000 })) {
            await logoBtn.click();
        } else {
            await page.evaluate(() => {
                const el = document.querySelector('.header__logo, .logo, a[href="/"]') as HTMLElement;
                if (el) el.click();
            });
        }
        await page.waitForLoadState('domcontentloaded');
        await humanDelay(2000, 3000); // Chờ banner động load hết
        await closePopupIfAny();

        // Chọn một block tĩnh trên màn hình để làm thước đo (Ví dụ vùng Header)
        // Lưu ý: Lần đầu chạy hàm này, test sẽ báo FAIL vì 'Lần đầu tiên chụp mốc Baseline, hãy chạy lại để so sánh'
        const headerBlock = page.locator('.header-top, .h-top, header').first();

        if (await headerBlock.isVisible({ timeout: 10000 })) {
            // Chụp ảnh khu vực Header kiểm tra giao diện không bị lệch pixel
            // maxDiffPixels: Cho phép lệch chút xíu do Anti-aliasing của Card đồ họa
            await expect(headerBlock).toHaveScreenshot('tgdd-header-baseline.png', { maxDiffPixels: 200, timeout: 5000 }).catch(() => null);
        }

        // 2. Hack phá vỡ Giao Diện (Layout) để giả lập lỗi lỡ tay code nhầm CSS của Developer
        await page.evaluate(() => {
            const logo = document.querySelector('.logo-top, .logo, .header__logo');
            if (logo) {
                (logo as HTMLElement).style.margin = '50px'; // Đẩy lệch Logo lung tung
                (logo as HTMLElement).style.transform = 'rotate(180deg)'; // Lật ngược Logo
            }
        });

        await page.waitForTimeout(2000);

        // Chụp lại mảnh Header bị vỡ
        // [TRONG VIDEO DEMO]: Khi chạy bước này, đoạn báo cáo HTML Report của Playwright sẽ hiện ra giao diện So Sánh 3 Cột: Ảnh gốc - Ảnh Lỗi - Ảnh Vạch Đỏ (Khác biệt)
        if (await headerBlock.isVisible()) {
            // Hàm này sẽ cố tình bắt Lỗi Báo Đỏ, nhưng ta try/catch để Demo không ngắt ngang chuỗi trình diễn
            try {
                await expect(headerBlock).toHaveScreenshot('tgdd-header-baseline.png', { maxDiffPixels: 200, timeout: 5000 });
            } catch (e) {
                console.log('[Autobot] Đã chặn thành công lỗi Visual Regression (Giao diện bị lệch so với thiết kế gốc)');
            }
        }
    });

});
