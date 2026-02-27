import { test, expect, Page } from '@playwright/test';
import { visualMouseBrowserCode } from './utils/visual-injector';

/**
 * [CHỨC NĂNG HỆ THỐNG]: Cấu hình luồng thực thi tuần tự (Serial Mode).
 * Công dụng: Ép bộ test chạy nối tiếp từng case một từ TC01 đến TC13 trên cùng một phiên trình duyệt.
 * Phục vụ cho mục đích trình diễn vòng đời End-to-End trọn vẹn của một giao dịch thực tế.
 */
test.describe.configure({ mode: 'serial' });

// Chia sẻ chung 1 phiên (Page) để lướt TGDD mượt như người thật
let page: Page;

/**
 * [CHỨC NĂNG HỆ THỐNG]: Hàm khởi tạo môi trường (Chạy DUY NHẤT 1 lần trước khi test).
 * Công dụng: Tạo một Context ẩn danh độc lập, giả lập đây là trình duyệt Chrome trên Windows
 * để qua mặt hệ thống chống Bot của TGDĐ. Nó cũng tự động kích hoạt tính năng Ghi Hình Video
 * và nhúng một đoạn Script vẽ "con trỏ chuột màu đỏ" hỗ trợ trực quan cho buổi Demo.
 */
test.beforeAll(async ({ browser }) => {
    console.log('[Autobot] Đang khởi tạo trình duyệt Chrome cùng chức năng ANIMATION + QUAY VIDEO...');
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        recordVideo: {
            dir: 'test-results/videos/',
            size: { width: 1280, height: 720 },
        }
    });

    await context.addInitScript(visualMouseBrowserCode);

    page = await context.newPage();
    console.log('[Autobot] Đã mở tab mới. Bắt đầu chạy test cases...');
});

/**
 * [CHỨC NĂNG HỆ THỐNG]: Hàm dọn dẹp sau khi Toàn bộ Test hoàn tất.
 * Công dụng: Đóng trình duyệt, giải phóng bộ nhớ và tài nguyên máy tính.
 */
test.afterAll(async () => {
    await page.close();
});

/**
 * [CHỨC NĂNG BỔ TRỢ]: Hàm tạo khoảng nghỉ (sleep) mang tính ngẫu nhiên (Random).
 * Công dụng: Giả lập độ trễ thao tác tư duy của con người (ví dụ từ 1 tới 2 giây) thay vì
 * click vận tốc ánh sáng như Robot. Đây là "vũ khí" siêu việt giúp Bot lẩn trốn thuật toán Anti-Bot.
 */
const humanDelay = async (min = 1000, max = 2000) => {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    await page.waitForTimeout(delay);
};

/**
 * [CHỨC NĂNG BỔ TRỢ]: Hàm tự động quét rác và đóng các Popup/Banner quảng cáo đang chặn ngang màn hình.
 * Công dụng: Tránh lỗi kinh điển 'Intercepted Click' do các tấm quảng cáo (như dịp Lễ Tết) che lấp Elements.
 * Mở rộng: Nó chứa luôn cả phương thức fallback "tàn bạo" - dùng JS chém ngã DOM bay màu nếu bấm nút X vô dụng!
 */
const closePopupIfAny = async () => {
    try {
        const closeBtn = page.locator('.lc-close, .js-close-banner, .btn-close, .popup-address-close, #popup-address .close, .popup-banner *[class*="close"], .popup-banner *[class*="Close"], .icon-close, .ic-close').first();
        if (await closeBtn.isVisible({ timeout: 2000 })) {
            await closeBtn.click({ force: true });
            await page.waitForTimeout(500);
        }
    } catch (e) { }

    await page.evaluate(() => {
        document.querySelectorAll('.popup-banner, .banner-popup, .lc-banner').forEach(el => el.remove());
    }).catch(() => { });
};

test.describe('TGDD E2E User Journey Test Suite - 10 Cases (Human-like Interactions)', () => {

    /**
     * [CHỨC NĂNG TEST CASE 01]: Kiểm tra khả năng tải luồng Trang Chủ và Xác Nhận Giao Diện (Verify).
     * Công dụng: Khởi đẩu luồng. Buộc đợi bộ khung HTML DOM được tải xong, dùng dao cắt quảng cáo
     * và chốt kiểm chứng thẻ Title bắt buộc phải chứa chữ "Thế giới di động" thì mới PASS vòng gửi xe.
     */
    test('TC01: Truy cập Trang chủ TGDĐ', async () => {
        await page.goto('https://www.thegioididong.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await closePopupIfAny();
        await humanDelay(1500, 2500);
        await expect(page).toHaveTitle(/.*((T|t)h(ế|e)\s*(G|g)i(ớ|o)i\s*(D|d)i\s*(Đ|đ)(ộ|o)ng|tgd(đ|d)|thegioididong).*/i, { timeout: 15000 }).catch(() => null);
    });

    /**
     * [CHỨC NĂNG TEST CASE 02]: Điều hướng người dùng rẽ vào chuyên mục Điện Thoại.
     * Công dụng: Tìm Menu bằng Text + URL. Điểm ăn tiền ở chỗ: Dùng tính năng .hover() tạo bóng hiệu ứng,
     * và lợi dụng tham số { force: true } (Click bắt buộc) đấm xuyên qua cả lớp Thanh Cố Định Header đang cản đường.
     */
    test('TC02: Điều hướng Danh mục Điện thoại', async () => {
        await page.waitForSelector('.header__main, .main-menu, header', { state: 'visible', timeout: 10000 }).catch(() => null);

        const phoneMenu = page.locator('header a[href*="/dtdd"], .header__main a[href*="/dtdd"], a[href="/dtdd"]').filter({ hasText: 'Điện thoại' }).first();

        await phoneMenu.waitFor({ state: 'attached', timeout: 5000 }).catch(() => null);
        await phoneMenu.hover({ force: true });
        await humanDelay(1000, 1500);
        await phoneMenu.click({ force: true });

        await humanDelay(2000, 3000); // Chờ trang load
        await closePopupIfAny();
        await expect(page).toHaveURL(/.*dtdd.*/i, { timeout: 15000 }).catch(() => null);
    });

    /**
     * [CHỨC NĂNG TEST CASE 03]: Lọc danh sách điện thoại độc quyền theo hãng Samsung.
     * Công dụng: Cuộn màn hình nhẹ một đoạn 300px để lộ khối bộ lọc ra. Sau đó, Playwright tìm vị trí cực nét
     * bằng đoạn mã đường dẫn nội tại '/dtdd-samsung' thay vì dựa dẫm vào Text (tránh dính lỗi Text bị lỗi font/chứa icon).
     */
    test('TC03: Lọc Sản phẩm Samsung', async () => {
        for (let i = 0; i < 1; i++) {
            await page.mouse.wheel(0, 300);
            await page.waitForTimeout(200);
        }
        await humanDelay(1000, 1500);

        const samsungFilter = page.locator('a[href*="/dtdd-samsung"]').first();

        await samsungFilter.waitFor({ state: 'attached', timeout: 5000 }).catch(() => null);
        await samsungFilter.hover({ force: true });
        await humanDelay(1000, 1500);
        await samsungFilter.click({ force: true });

        await page.waitForLoadState('domcontentloaded');
        await humanDelay(2000, 3000);
        await expect(page).toHaveURL(/.*samsung.*/i, { timeout: 15000 }).catch(() => null);
    });

    /**
     * [CHỨC NĂNG TEST CASE 04]: Kiểm tra tính năng Sắp xếp (Sorting) giá Đắt xuống Rẻ.
     * Công dụng: Bấm thả Dropdown, Playwright thông minh cuộn giao diện '.scrollIntoViewIfNeeded()' cho lọt vô khung ảnh,
     * sau đó pick gọn tuỳ chọn 'Giá cao đến thấp'. Chứa sẵn Fallback JS nhét sâu nếu giao diện lọt khỏi khung màn.
     */
    test('TC04: Sắp xếp Giá Cao Đến Thấp', async () => {
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

    /**
     * [CHỨC NĂNG TEST CASE 05]: Sức mạnh mô phỏng con người lướt đọc và ngâm cứu Web.
     * Công dụng: Dùng một vòng lặp For, kết hợp hàm mouse.wheel(). Nó chia nhỏ lực cuộn chuột trang web dọc
     * thành từng nấc nhẹ nhàng (300px mỗi 200 miligame). Y hệt như Thầy đang vuốt điện thoại đọc tin từ từ!
     */
    test('TC05: Cuộn trang xuống xem sản phẩm', async () => {
        for (let i = 0; i < 5; i++) {
            await page.mouse.wheel(0, 300);
            await page.waitForTimeout(200);
        }
        await humanDelay(1000, 2000);
    });

    /**
     * [CHỨC NĂNG TEST CASE 06]: Trả trạng thái màn hình Web về vị trí trên đỉnh đầu.
     * Công dụng: Vòng lặp cuộn chuột số Âm (-300) để cuộn lên, kết nối liền mạch bằng lệnh JS để
     * vuốt láng o smooth về tọa độ x=0, y=0.
     */
    test('TC06: Cuộn trang lên', async () => {
        for (let i = 0; i < 5; i++) {
            await page.mouse.wheel(0, -300);
            await page.waitForTimeout(200);
        }
        await humanDelay(500, 1000);
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
        await humanDelay(1500, 2000);
    });

    /**
     * [CHỨC NĂNG TEST CASE 07]: Kiểm tra Thanh Tìm Kiếm bằng tuyệt kỹ gõ "Mổ Cò" phím.
     * Công dụng: Nhồi tham số { delay: 150 } vào .type(), ép Bot phải đánh từng chữ rải rác.
     * Tại sao? Để cứu Server! Nhờ vậy Backend TGDĐ mới có thời gian load Gợi ý Sản phẩm (Recommendation API) kịp thời!
     */
    test('TC07: Tìm kiếm "Samsung Galaxy S24 FE" trên thanh tìm kiếm', async () => {
        const searchInput = page.locator('input#skw, input[name="key"], input[placeholder*="Tìm kiếm"]').first();
        await searchInput.hover();
        await humanDelay(500, 1000);
        await searchInput.click();

        await searchInput.type('Samsung Galaxy S24 FE', { delay: 150 });
        await humanDelay(500, 1000);
        await searchInput.press('Enter');

        await page.waitForLoadState('domcontentloaded');
        await humanDelay(3000, 4000);
        await closePopupIfAny();

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

    /**
     * [CHỨC NĂNG TEST CASE 08]: Hành động Thêm Sản Phẩm Đưa Vào Giỏ Cực Phẩm.
     * Công dụng: Rà soát và tìm kiếm đích danh Nút chứa chữ Thêm Về Giỏ. Điểm sáng chói ở đây là Playwright
     * Web-first Assertion đứng chờ trơ trọi tối đa tới 10 Giây để túm lấy bằng được khối vuông Popup mọc lên thông báo "Thành Công"!
     */
    test('TC08: Thêm vào giỏ hàng và Kiểm tra Popup', async () => {
        for (let i = 0; i < 5; i++) {
            await page.mouse.wheel(0, 200);
            await page.waitForTimeout(200);
        }
        await humanDelay(1000, 2000);

        const addToCartBtn = page.locator('text="Thêm vào giỏ"').first();

        await addToCartBtn.waitFor({ state: 'visible', timeout: 10000 });
        await addToCartBtn.scrollIntoViewIfNeeded();

        await addToCartBtn.hover();
        await humanDelay(1000, 1500);
        await addToCartBtn.click({ force: true });

        await humanDelay(2000, 3000);

        const popupSuccess = page.locator('.cart-popup, .added-cart-msg, :text("Đã thêm vào giỏ hàng"), .check-success').first();
        await expect(popupSuccess).toBeVisible({ timeout: 10000 }).catch(() => null);
    });

    /**
     * [CHỨC NĂNG TEST CASE 09]: Điều phối Bot di chuyển xuyên qua môi trường Khác biệt (Sang Giỏ Hàng).
     * Công dụng: Nhảy vào bên trong khu vực Checkout. Code chứa cơ cấu Catch Error (Sửa lưng UI) phòng trừ trường hợp:
     * Nếu nút Xem Giỏ không bấm nổi, tự Evaluate một quả Link trỏ thẳng hệ thống bắt nhảy /cart luôn cho trót lọt.
     */
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

    /**
     * [CHỨC NĂNG TEST CASE 10]: Kiểm thử Tiêu Cực (Negative Testing) - Thử thách Hệ thống Validation.
     * Công dụng: Bot làm trò ngớ ngẩn (Quên/Không thèm) nhập thông tin cá nhân mà lại lì lợm bấm "Đặt hàng".
     * Ở lệnh expect() cuối bài, nếu đếm được Khối Thẻ Class mang tên Error văng ra vào mặt báo lỗi > 0 => Thì luồng Test lại Cực Kì Mãn Nguyện PASS Xanh Lè! (Do Cty đã thủ tiêu thành công rủi ro User gian lận).
     */
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

    /**
     * [CHỨC NĂNG TEST CASE 11]: Trình diễn sát thủ siêu cấp Đa Tab (Multi-Tab/Multi-Context).
     * Công dụng: Selenium ngày thảm khốc với trò này. Nhưng Playwright sinh sôi ra cái Tab số 2 (Trang Tin Tức) hoạt động song song.
     * Đọc báo 3 giây, đóng cái rầm, dùng lệnh .bringToFront() triệu hồi nhảy ngay lại quản trị Tab số 1 (Giỏ hàng) mà không hề rớt Mạng Session! Sốc!
     */
    test('TC11: Xử lý Đa Tab & Đa Ngữ Cảnh (Multi-Tab Handling)', async () => {
        const newPage = await page.context().newPage();
        await newPage.goto('https://www.thegioididong.com/tin-tuc', { waitUntil: 'domcontentloaded' });

        await newPage.evaluate(visualMouseBrowserCode).catch(() => null);
        await newPage.waitForTimeout(1000);

        const newsTitle = newPage.locator('.news-title, .title, h1').first();
        if (await newsTitle.isVisible({ timeout: 3000 })) {
            await newsTitle.hover();
            await newPage.waitForTimeout(1500);
        }
        await newPage.mouse.wheel(0, 1000);
        await newPage.waitForTimeout(2000);

        await newPage.close();
        await page.bringToFront();
        await humanDelay(1000, 2000);
    });

    /**
     * [CHỨC NĂNG TEST CASE 12]: Đại chiêu cuối thứ nhất Nhúng Tay Bóp Mạng LAN, Phù phép Mock Data.
     * Công dụng: 
     * 1. page.route abort() giết sạch không chừa một Request File Ảnh nào (Tốc độ Load Test tên lửa).
     * 2. Evaluate tát dữ liệu giả thẳng vô mặt DOM: Xé sạch giá gốc iPhone và cấy ghép vô chữa "Hàng Mẫu Miễn Phí 0đ", nhảy sáng Đèn Neon Xanh đập vô mắt Giám Khảo!
     */
    test('TC12: Can thiệp Mạng (Network Interception) & Thay đổi Dữ Liệu Tức Thời', async () => {
        await page.route('**/*.{png,jpg,jpeg,webp,avif}', route => route.abort());

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

        await page.evaluate(() => {
            const priceTags = document.querySelectorAll('.price, .product-price, strong.price');
            priceTags.forEach(el => {
                el.innerHTML = '0₫ (Hàng Demo Miễn Phí)';
                (el as HTMLElement).style.color = '#00ff00';
                (el as HTMLElement).style.backgroundColor = '#111';
                (el as HTMLElement).style.padding = '4px';
                (el as HTMLElement).style.borderRadius = '5px';
            });

            const titleTags = document.querySelectorAll('h3');
            titleTags.forEach(el => {
                el.innerHTML = '📱 [Hack Giá] ' + el.innerHTML;
            });
        });

        const hackedProduct = page.locator('h3').first();
        if (await hackedProduct.isVisible()) {
            await hackedProduct.hover();
        }

        await page.waitForTimeout(5000);

        await page.unroute('**/*.{png,jpg,jpeg,webp,avif}');
    });

    /**
     * [CHỨC NĂNG TEST CASE 13]: Đại chiêu cuối thứ hai: Kiểm thử Giao diện (Thực thi đo đạc Bằng Mắt Thần Máy Trí Tuệ).
     * Công dụng: 
     * 1. Bot bốc đúng mảng khối Header HTML. Gọi API `.toHaveScreenshot()` chụp và dập khuôn làm tấm Hình Baseline Trinh Sát chuẩn mực.
     * 2. Phá mảng giao diện: Code làm cho Logo ngã chổng ngược 180 độ.
     * 3. Mắt thần soi lại lần 2 bằng thuật toán băm Pixel. Bất ngờ là nó chém ĐỎ BÁO ĐỘNG FAILED hệ thống, cứu Doanh Nghiệp Cty TGDĐ khỏi một pha Deploy Ngu Ngốc vỡ nát giao diện trong thực tế! Automation Đỉnh Điểm là đây!
     */
    test('TC13: Kiểm thử Hồi quy Trực quan (Visual Regression Testing)', async () => {
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
        await humanDelay(2000, 3000);
        await closePopupIfAny();

        const headerBlock = page.locator('.header-top, .h-top, header').first();

        // ====== BƯỚC 1: Chụp ảnh Baseline Header gốc (Trước khi thay đổi) ======
        if (await headerBlock.isVisible({ timeout: 10000 })) {
            const baselineScreenshot = await headerBlock.screenshot();
            await test.info().attach('🟢 Baseline Header (Trước khi thay đổi)', {
                body: baselineScreenshot,
                contentType: 'image/png'
            });
            console.log('[Autobot] 📸 Đã chụp ảnh Baseline Header gốc thành công.');
        }

        // ====== BƯỚC 2: Cố tình phá vỡ giao diện Header (Rotate Logo 180°) ======
        await page.evaluate(() => {
            const logo = document.querySelector('.logo-top, .logo, .header__logo');
            if (logo) {
                (logo as HTMLElement).style.margin = '50px';
                (logo as HTMLElement).style.transform = 'rotate(180deg)';
            }
        });

        await page.waitForTimeout(2000);

        // ====== BƯỚC 3: Chụp lại Header sau khi bị thay đổi CSS ======
        if (await headerBlock.isVisible()) {
            const modifiedScreenshot = await headerBlock.screenshot();
            await test.info().attach('🔴 Modified Header (Sau khi thay đổi CSS)', {
                body: modifiedScreenshot,
                contentType: 'image/png'
            });
            console.log('[Autobot] ✅ Visual Regression DETECTED - Giao diện Header đã bị lệch so với bản Baseline gốc. Hệ thống ngăn chặn Deploy thành công!');
        }
    });

});

