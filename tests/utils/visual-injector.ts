
export function visualMouseBrowserCode() {
    // Đảm bảo code chạy trong trình duyệt
    if (typeof document === 'undefined') return;

    if ((window as any).hasInjectedPlaywrightMouse) return;
    (window as any).hasInjectedPlaywrightMouse = true;

    // Chờ DOM sẵn sàng để append element
    const initVisuals = () => {
        // 1. Tạo con trỏ chuột ảo (dấu chấm đỏ)
        const mouseObj = document.createElement('div');
        mouseObj.setAttribute('id', 'playwright-visual-mouse');
        mouseObj.style.position = 'fixed';
        mouseObj.style.width = '20px';
        mouseObj.style.height = '20px';
        mouseObj.style.borderRadius = '50%';
        mouseObj.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
        mouseObj.style.pointerEvents = 'none'; // Không cản trở click
        mouseObj.style.zIndex = '999999999';
        mouseObj.style.transition = 'top 0.08s ease-out, left 0.08s ease-out'; // Animation di chuyển mượt
        mouseObj.style.transform = 'translate(-50%, -50%)';
        mouseObj.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.8)';
        mouseObj.style.display = 'none';
        document.body.appendChild(mouseObj);

        // Lắng nghe sự kiện chuột di chuyển để update vị trí chấm đỏ
        document.addEventListener('mousemove', (e) => {
            mouseObj.style.display = 'block';
            mouseObj.style.left = `${e.clientX}px`;
            mouseObj.style.top = `${e.clientY}px`;
        }, true);

        // Lắng nghe sự kiện mousedown để tạo hiệu ứng sóng (ripple) khi Click
        document.addEventListener('mousedown', (e) => {
            const ripple = document.createElement('div');
            ripple.style.position = 'fixed';
            ripple.style.width = '20px';
            ripple.style.height = '20px';
            ripple.style.borderRadius = '50%';
            ripple.style.border = '2px solid rgba(0, 255, 0, 0.9)'; // Màu xanh lá khi click
            ripple.style.pointerEvents = 'none';
            ripple.style.zIndex = '999999998';
            ripple.style.left = `${e.clientX}px`;
            ripple.style.top = `${e.clientY}px`;
            ripple.style.transform = 'translate(-50%, -50%) scale(1)';
            ripple.style.transition = 'transform 0.5s ease-out, opacity 0.5s ease-out';
            document.body.appendChild(ripple);

            // Kích hoạt animation
            requestAnimationFrame(() => {
                ripple.style.transform = 'translate(-50%, -50%) scale(5)';
                ripple.style.opacity = '0';
            });

            // Xóa phần tử sau khi xong animation
            setTimeout(() => {
                ripple.remove();
            }, 500);
        }, true);

        // 3. Highlight mượt mà các input khi focus (Điền dữ liệu)
        document.addEventListener('focusin', (e) => {
            const target = e.target as HTMLElement;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
                target.style.transition = 'box-shadow 0.3s ease, border-color 0.3s ease';
                target.dataset.originalBoxShadow = target.style.boxShadow || '';
                target.dataset.originalBorder = target.style.border || '';
                target.style.boxShadow = '0 0 15px rgba(0, 150, 255, 0.8)'; // Viền xanh biển bắt mắt
                target.style.border = '2px solid rgb(0, 150, 255)';
            }
        });

        document.addEventListener('focusout', (e) => {
            const target = e.target as HTMLElement;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
                target.style.boxShadow = target.dataset.originalBoxShadow || '';
                target.style.border = target.dataset.originalBorder || '';
            }
        });

        // CSS hack cho trang mượt hơn và ÉP TẮT mọi popup quảng cáo (Anti-flaky tuyệt đối)
        const style = document.createElement('style');
        style.innerHTML = `
            * { scroll-behavior: smooth !important; }
            /* Chặn đứng mọi thể loại Popup Banner xuất hiện đè lên elements */
            .popup-banner, .banner-popup, .lc-banner, #popup-address, .common-popup, .js-banner-popup { 
                display: none !important; 
                opacity: 0 !important; 
                visibility: hidden !important; 
                pointer-events: none !important; 
                z-index: -9999 !important; 
            }
        `;
        document.head.appendChild(style);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initVisuals);
    } else {
        initVisuals();
    }
}
