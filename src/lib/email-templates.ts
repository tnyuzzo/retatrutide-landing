/**
 * Professional HTML email templates for Aura Peptides (Retatrutide)
 *
 * Customer-facing emails (5) are translated via locale using getEmailString().
 * Admin/warehouse emails (4) stay in Italian.
 */

import { getEmailString } from './email-translations';

interface ShipmentNotificationParams {
    referenceId: string;
    orderNumber?: string;
    carrier: string;
    trackingNumber: string;
    trackingUrl: string | null;
    locale?: string;
}

interface OrderReceivedAdminParams {
    referenceId: string;
    orderNumber?: string;
    fiatAmount: number;
    cryptoCurrency: string;
    cryptoAmount: number;
    items: { name: string; quantity: number; price: number }[];
    shippingAddress: Record<string, string>;
    email?: string;
}

interface LowStockAlertParams {
    sku: string;
    currentQuantity: number;
    threshold: number;
}

interface WarehouseNewOrderParams {
    orderId: string;
    kitsToShip: number;
    customerName: string;
    customerPhone: string;
    shippingAddress: Record<string, string>;
}

interface RefundConfirmationParams {
    referenceId: string;
    orderNumber?: string;
    fiatAmount: number;
    refundAmount: number;
    isPartial: boolean;
    locale?: string;
}

interface UnderpaidAlertParams {
    referenceId: string;
    orderNumber?: string;
    fiatAmount: number;
    cryptoCurrency: string;
    expectedCryptoAmount: number;
    receivedCryptoAmount: number;
    email?: string | null;
    shippingAddress: Record<string, string>;
}

interface CartRecoveryParams {
    referenceId: string;
    orderNumber?: string;
    fiatAmount: number;
    cryptoCurrency: string;
    cryptoAmount: number;
    paymentUrl: string;
    emailNumber: 1 | 2 | 3 | 4 | 5 | 6;
    locale?: string;
}

interface OrderCreatedParams {
    referenceId: string;
    orderNumber?: string;
    fiatAmount: number;
    cryptoCurrency: string;
    cryptoAmount: number;
    paymentAddress: string;
    quantity: number;
    locale?: string;
}

const BRAND_GOLD = '#D4AF37';
const BRAND_DARK = '#070A0F';

/** Escape HTML entities to prevent XSS in email templates */
function escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function baseWrapper(content: string): string {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:${BRAND_DARK};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 12px;">
    <!-- Logo -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;width:36px;height:36px;border:1px solid ${BRAND_GOLD};border-radius:50%;line-height:36px;text-align:center;">
        <span style="display:inline-block;width:14px;height:14px;background:${BRAND_GOLD};border-radius:50%;vertical-align:middle;"></span>
      </div>
      <div style="color:white;font-size:16px;letter-spacing:4px;margin-top:8px;text-transform:uppercase;">Aura Peptides</div>
    </div>
    <!-- Content -->
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:24px 16px;color:white;">
      ${content}
    </div>
    <!-- Footer -->
    <div style="text-align:center;margin-top:24px;color:rgba(255,255,255,0.3);font-size:11px;">
      © ${new Date().getFullYear()} Aura Peptides · Research Use Only
    </div>
  </div>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════
// CUSTOMER-FACING EMAILS (translated via locale)
// ═══════════════════════════════════════════════════

export function shipmentNotificationEmail(params: ShipmentNotificationParams) {
    const { referenceId, orderNumber, carrier, trackingNumber, trackingUrl, locale } = params;
    const t = (key: string, vars?: Record<string, string>) => getEmailString(locale || 'en', key, vars);
    const displayId = orderNumber || referenceId.slice(-8).toUpperCase();
    const trackingLink = trackingUrl
        ? `<a href="${trackingUrl}" style="display:inline-block;background:${BRAND_GOLD};color:${BRAND_DARK};font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;margin-top:16px;">${t('shipment_cta')}</a>`
        : `<code style="background:rgba(255,255,255,0.1);padding:4px 12px;border-radius:6px;color:${BRAND_GOLD};font-size:14px;">${trackingNumber}</code>`;

    return {
        subject: `📦 ${t('shipment_subject', { id: displayId })}`,
        html: baseWrapper(`
            <h2 style="margin:0 0 8px;font-weight:400;font-size:22px;">${t('shipment_heading')}</h2>
            <p style="color:rgba(255,255,255,0.6);margin:0 0 24px;font-size:14px;line-height:1.6;">
                ${t('shipment_body', { id: displayId })}
            </p>
            <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;margin-bottom:24px;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:${BRAND_GOLD};margin-bottom:8px;">${t('shipment_details_label')}</div>
                <div style="font-size:14px;color:rgba(255,255,255,0.8);">
                    <strong>${t('shipment_carrier')}:</strong> ${carrier}<br>
                    <strong>${t('shipment_tracking')}:</strong> ${trackingNumber}
                </div>
            </div>
            <div style="text-align:center;">${trackingLink}</div>
            <p style="color:rgba(255,255,255,0.4);font-size:12px;margin-top:24px;text-align:center;">
                ${t('shipment_contact')}
            </p>
        `),
    };
}

export function refundConfirmationEmail(params: RefundConfirmationParams) {
    const { referenceId, orderNumber, fiatAmount, refundAmount, isPartial, locale } = params;
    const t = (key: string, vars?: Record<string, string>) => getEmailString(locale || 'en', key, vars);
    const displayId = orderNumber || referenceId.slice(-8).toUpperCase();
    const partialText = isPartial ? t('refund_partial') : '';
    return {
        subject: `💸 ${t('refund_subject', { partial: partialText, id: displayId })}`,
        html: baseWrapper(`
            <h2 style="margin:0 0 8px;font-weight:400;font-size:22px;">${t('refund_heading', { partial: partialText })}</h2>
            <p style="color:rgba(255,255,255,0.6);margin:0 0 24px;font-size:14px;line-height:1.6;">
                ${t('refund_body', { id: displayId })}
            </p>
            <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:20px;text-align:center;margin-bottom:16px;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:${BRAND_GOLD};margin-bottom:8px;">${t('refund_amount_label')}</div>
                <div style="font-size:28px;font-weight:600;color:${BRAND_GOLD};">€${refundAmount.toFixed(2)}</div>
                ${isPartial ? `<div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px;">${t('refund_of_total', { total: fiatAmount.toFixed(2) })}</div>` : ''}
            </div>
            <p style="color:rgba(255,255,255,0.4);font-size:12px;text-align:center;">
                ${t('refund_note')}
            </p>
        `),
    };
}

export function cartRecoveryEmail(params: CartRecoveryParams) {
    const { referenceId, orderNumber, fiatAmount, cryptoCurrency, cryptoAmount, paymentUrl, emailNumber, locale } = params;
    const loc = locale || 'en';
    const t = (key: string, vars?: Record<string, string>) => getEmailString(loc, key, vars);
    const displayId = orderNumber || referenceId.slice(-8).toUpperCase();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aurapep.eu';
    const subjectEmojis: Record<number, string> = { 1: '\u23f3', 2: '\ud83d\udd14', 3: '\ud83d\udcac', 4: '\u26a0\ufe0f', 5: '\ud83d\udea8', 6: '\u274c' };
    const calcUrl = `${siteUrl}/${loc === 'en' ? 'en' : loc}/calculator`;

    const CHANGEHERO_URLS: Record<string, string> = {
        en: "https://changehero.io/buy/usdt",
        it: "https://changehero.io/it/buy/usdt",
        fr: "https://changehero.io/fr/buy/usdt",
        de: "https://changehero.io/de/buy/usdt",
        es: "https://changehero.io/es/buy/usdt",
        pt: "https://changehero.io/pt-br/buy/usdt",
        ru: "https://changehero.io/ru/buy/usdt",
        pl: "https://changehero.io/buy/usdt",
        uk: "https://changehero.io/buy/usdt",
        ar: "https://changehero.io/buy/usdt",
    };
    const changeHeroUrl = CHANGEHERO_URLS[loc] || CHANGEHERO_URLS['en'];

    // CTA label: email 4 uses recovery_cta_4, email 5 uses recovery_cta_5, others use recovery_cta
    const ctaLabel = emailNumber === 4 ? t('recovery_cta_4') : emailNumber === 5 ? t('recovery_cta_5') : emailNumber === 6 ? t('recovery_cta_6') : t('recovery_cta');

    // Amount box (shared)
    const amountBox = `
            <div style="background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.3);border-radius:12px;padding:20px;text-align:center;margin-bottom:16px;">
                <div style="font-size:12px;text-transform:uppercase;letter-spacing:2px;color:${BRAND_GOLD};margin-bottom:8px;">${t('recovery_amount_label')}</div>
                <div style="font-size:29px;font-weight:700;color:${BRAND_GOLD};">${cryptoAmount} ${cryptoCurrency}</div>
                <div style="font-size:14px;color:rgba(255,255,255,0.5);margin-top:4px;">\u20ac${fiatAmount.toFixed(2)}</div>
            </div>`;

    // CTA button (shared)
    const ctaButton = `
            <div style="text-align:center;margin-bottom:24px;">
                <a href="${siteUrl}/checkout/${referenceId}" style="display:inline-block;background:${BRAND_GOLD};color:${BRAND_DARK};font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px;">${ctaLabel}</a>
            </div>`;

    // Payment address box (shared, only if paymentUrl exists)
    const addressBox = paymentUrl ? `
            <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;margin-bottom:16px;">
                <div style="font-size:12px;text-transform:uppercase;letter-spacing:2px;color:${BRAND_GOLD};margin-bottom:8px;">${t('recovery_address_label', { crypto: cryptoCurrency })}</div>
                <code style="display:block;word-break:break-all;font-size:13px;color:rgba(255,255,255,0.8);background:rgba(255,255,255,0.05);padding:10px;border-radius:8px;">${escapeHtml(paymentUrl)}</code>
            </div>` : '';

    // ChangeHero card payment section (only for USDT/USDC)
    const isStablecoin = cryptoCurrency === 'USDT' || cryptoCurrency === 'USDC';
    const changeHeroSection = (isStablecoin && paymentUrl) ? `
            <div style="background:rgba(212,175,55,0.05);border:1px dashed rgba(212,175,55,0.4);border-radius:12px;padding:24px 20px;margin-bottom:16px;">
                <h3 style="margin:0 0 12px;font-weight:600;font-size:17px;color:white;">\ud83d\udcb3 ${t('recovery_card_title')}</h3>
                <p style="color:rgba(255,255,255,0.6);font-size:14px;line-height:1.6;margin:0 0 16px;">
                    ${t('recovery_card_intro')}
                </p>
                <div style="color:rgba(255,255,255,0.7);font-size:14px;line-height:1.8;margin-bottom:16px;">
                    <strong style="color:${BRAND_GOLD};">1.</strong> ${t('recovery_card_step1')}<br>
                    <strong style="color:${BRAND_GOLD};">2.</strong> ${t('recovery_card_step2')}<br>
                    <strong style="color:${BRAND_GOLD};">3.</strong> ${t('recovery_card_step3', { amount: String(cryptoAmount) })}<br>
                    <strong style="color:${BRAND_GOLD};">4.</strong> ${t('recovery_card_step4')}<br>
                    <strong style="color:${BRAND_GOLD};">5.</strong> ${t('recovery_card_step5')}
                    <div style="margin:8px 0;">
                        <code style="display:block;word-break:break-all;font-size:12px;color:rgba(255,255,255,0.8);background:rgba(255,255,255,0.08);padding:10px;border-radius:8px;">${escapeHtml(paymentUrl)}</code>
                    </div>
                    <strong style="color:${BRAND_GOLD};">6.</strong> ${t('recovery_card_step6')}
                </div>
                <p style="color:rgba(255,255,255,0.5);font-size:13px;line-height:1.5;margin:0 0 16px;">
                    ${t('recovery_card_done')}
                </p>
                <div style="text-align:center;">
                    <a href="${changeHeroUrl}" style="display:inline-block;background:${BRAND_GOLD};color:${BRAND_DARK};font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:15px;">${t('recovery_card_cta')}</a>
                </div>
            </div>` : '';

    // Build email-specific content
    let emailContent = '';

    if (emailNumber === 1) {
        // Email 1 (1h - Helper): heading, intro, amount, CTA, address, ChangeHero, value_add, footer
        emailContent = `
            <h2 style="margin:0 0 8px;font-weight:400;font-size:23px;">${t('recovery_heading_1')}</h2>
            <p style="color:rgba(255,255,255,0.6);margin:0 0 24px;font-size:15px;line-height:1.6;">
                ${t('recovery_intro_1', { id: displayId })}
            </p>
            ${amountBox}
            ${ctaButton}
            ${addressBox}
            ${changeHeroSection}
            <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0 0 16px;line-height:1.5;">
                ${t('recovery_value_add', { calcUrl })}
            </p>
            <p style="color:rgba(255,255,255,0.4);font-size:13px;text-align:center;">
                ${t('recovery_contact')}
            </p>`;
    } else if (emailNumber === 2) {
        // Email 2 (12h - Motivator): heading, intro+social proof, amount, CTA, address, ChangeHero, trust, footer
        emailContent = `
            <h2 style="margin:0 0 8px;font-weight:400;font-size:23px;">${t('recovery_heading_2')}</h2>
            <p style="color:rgba(255,255,255,0.6);margin:0 0 24px;font-size:15px;line-height:1.6;">
                ${t('recovery_intro_2', { id: displayId })}
            </p>
            ${amountBox}
            ${ctaButton}
            ${addressBox}
            ${changeHeroSection}
            <p style="color:rgba(255,255,255,0.5);font-size:13px;text-align:center;margin:0 0 16px;">
                ${t('recovery_trust')}
            </p>
            <p style="color:rgba(255,255,255,0.4);font-size:13px;text-align:center;">
                ${t('recovery_contact')}
            </p>`;
    } else if (emailNumber === 3) {
        // Email 3 (24h - Helper/Guide): heading, intro, amount, CTA, address, ChangeHero, guide CTA, footer
        const guideUrl = `${siteUrl}/${loc === 'en' ? 'en' : loc}/crypto-guide`;
        emailContent = `
            <h2 style="margin:0 0 8px;font-weight:400;font-size:23px;">${t('recovery_heading_3')}</h2>
            <p style="color:rgba(255,255,255,0.6);margin:0 0 24px;font-size:15px;line-height:1.6;">
                ${t('recovery_intro_3', { id: displayId })}
            </p>
            ${amountBox}
            ${ctaButton}
            ${addressBox}
            ${changeHeroSection}
            <div style="text-align:center;margin-bottom:16px;">
                <a href="${guideUrl}" style="display:inline-block;border:1px solid ${BRAND_GOLD};color:${BRAND_GOLD};font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:15px;background:transparent;">${t('recovery_guide_cta')}</a>
            </div>
            <p style="color:rgba(255,255,255,0.4);font-size:13px;text-align:center;">
                ${t('recovery_contact')}
            </p>`;
    } else if (emailNumber === 4) {
        // Email 4 (48h - Closer): heading, intro+urgency, amount, CTA, address, ChangeHero, closing, footer
        emailContent = `
            <h2 style="margin:0 0 8px;font-weight:400;font-size:23px;">${t('recovery_heading_4')}</h2>
            <p style="color:rgba(255,255,255,0.6);margin:0 0 24px;font-size:15px;line-height:1.6;">
                ${t('recovery_intro_4', { id: displayId })}
            </p>
            ${amountBox}
            ${ctaButton}
            ${addressBox}
            ${changeHeroSection}
            <p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;margin:0 0 16px;">
                ${t('recovery_closing_4')}
            </p>
            <p style="color:rgba(255,255,255,0.4);font-size:13px;text-align:center;">
                ${t('recovery_contact')}
            </p>`;
    } else if (emailNumber === 5) {
        // Email 5 (68h - Last chance): heading, intro, amount, CTA, address, ChangeHero, footer — SHORT, urgent
        emailContent = `
            <h2 style="margin:0 0 8px;font-weight:400;font-size:23px;">${t('recovery_heading_5')}</h2>
            <p style="color:rgba(255,255,255,0.6);margin:0 0 24px;font-size:15px;line-height:1.6;">
                ${t('recovery_intro_5', { id: displayId })}
            </p>
            ${amountBox}
            ${ctaButton}
            ${addressBox}
            ${changeHeroSection}
            <p style="color:rgba(255,255,255,0.4);font-size:13px;text-align:center;">
                ${t('recovery_contact')}
            </p>`;
    } else {
        // Email 6 (72h - Post-expiry): order expired notification + loss aversion + new order CTA
        const orderUrl = `${siteUrl}/${loc}/order`;
        emailContent = `
            <h2 style="margin:0 0 8px;font-weight:400;font-size:23px;">${t('recovery_heading_6')}</h2>
            <p style="color:rgba(255,255,255,0.6);margin:0 0 24px;font-size:15px;line-height:1.6;">
                ${t('recovery_intro_6', { id: displayId })}
            </p>
            <div style="text-align:center;margin-bottom:24px;">
                <a href="${orderUrl}" style="display:inline-block;background:${BRAND_GOLD};color:${BRAND_DARK};font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px;">${t('recovery_cta_6')}</a>
            </div>
            <p style="color:rgba(255,255,255,0.4);font-size:13px;text-align:center;">
                ${t('recovery_contact')}
            </p>`;
    }

    return {
        subject: `${subjectEmojis[emailNumber]} ${t(`recovery_subject_${emailNumber}`, { id: displayId })}`,
        html: baseWrapper(emailContent),
    };
}

export function orderCreatedEmail(params: OrderCreatedParams) {
    const { referenceId, orderNumber, fiatAmount, cryptoCurrency, cryptoAmount, paymentAddress, quantity, locale } = params;
    const t = (key: string, vars?: Record<string, string>) => getEmailString(locale || 'en', key, vars);
    const displayId = orderNumber || referenceId.slice(-8).toUpperCase();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aurapep.eu';
    const checkoutUrl = `${siteUrl}/checkout/${referenceId}`;
    const kitLabel = quantity > 1 ? `${quantity} kit Retatrutide 10mg` : '1 kit Retatrutide 10mg';

    return {
        subject: `🧪 ${t('order_created_subject', { id: displayId })}`,
        html: baseWrapper(`
            <h2 style="margin:0 0 8px;font-weight:400;font-size:22px;">${t('order_created_heading')}</h2>
            <p style="color:rgba(255,255,255,0.6);margin:0 0 24px;font-size:14px;line-height:1.6;">
                ${t('order_created_body', { kits: kitLabel, crypto: cryptoCurrency })}
            </p>
            <div style="background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.3);border-radius:12px;padding:20px;text-align:center;margin-bottom:16px;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:${BRAND_GOLD};margin-bottom:8px;">${t('order_created_amount_label')}</div>
                <div style="font-size:28px;font-weight:700;color:${BRAND_GOLD};">${cryptoAmount} ${cryptoCurrency}</div>
                <div style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:4px;">€${fiatAmount.toFixed(2)} · #${displayId}</div>
            </div>
            <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;margin-bottom:16px;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:${BRAND_GOLD};margin-bottom:8px;">${t('order_created_address_label', { crypto: cryptoCurrency })}</div>
                <code style="display:block;word-break:break-all;font-size:13px;color:rgba(255,255,255,0.9);background:rgba(255,255,255,0.05);padding:12px;border-radius:8px;line-height:1.5;">${escapeHtml(paymentAddress)}</code>
            </div>
            <div style="text-align:center;margin-bottom:24px;">
                <a href="${checkoutUrl}" style="display:inline-block;background:${BRAND_GOLD};color:${BRAND_DARK};font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;">${t('order_created_cta')}</a>
            </div>
            <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:14px;margin-bottom:16px;">
                <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0;line-height:1.6;">
                    <strong style="color:rgba(255,255,255,0.7);">${t('order_created_instructions_title')}</strong><br>
                    1. ${t('order_created_step1', { crypto: cryptoCurrency })}<br>
                    2. ${t('order_created_step2', { amount: String(cryptoAmount), crypto: cryptoCurrency })}<br>
                    3. ${t('order_created_step3')}<br><br>
                    <span style="color:rgba(255,255,255,0.4);">${t('order_created_no_crypto', { crypto: cryptoCurrency })}</span>
                </p>
            </div>
            <p style="color:rgba(255,255,255,0.35);font-size:11px;text-align:center;">
                ${t('order_created_validity')}
            </p>
        `),
    };
}

export function orderConfirmationCustomerEmail(params: { referenceId: string; orderNumber?: string; fiatAmount: number; locale?: string }) {
    const t = (key: string, vars?: Record<string, string>) => getEmailString(params.locale || 'en', key, vars);
    const displayId = params.orderNumber || params.referenceId.slice(-8).toUpperCase();
    return {
        subject: `✅ ${t('payment_received_subject', { id: displayId })}`,
        html: baseWrapper(`
            <h2 style="margin:0 0 8px;font-weight:400;font-size:22px;">${t('payment_received_heading')}</h2>
            <p style="color:rgba(255,255,255,0.6);margin:0 0 24px;font-size:14px;line-height:1.6;">
                ${t('payment_received_body', { id: displayId })}
            </p>
            <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:${BRAND_GOLD};margin-bottom:8px;">${t('payment_received_total_label')}</div>
                <div style="font-size:28px;font-weight:600;color:${BRAND_GOLD};">€${params.fiatAmount.toFixed(2)}</div>
            </div>
            <p style="color:rgba(255,255,255,0.4);font-size:12px;text-align:center;">
                ${t('payment_received_tracking_note')}
            </p>
        `),
    };
}

// ═══════════════════════════════════════════════════
// ADMIN / WAREHOUSE EMAILS (Italian, no locale)
// ═══════════════════════════════════════════════════

export function orderConfirmationAdminEmail(params: OrderReceivedAdminParams) {
    const { referenceId, orderNumber, fiatAmount, cryptoCurrency, cryptoAmount, items, shippingAddress, email } = params;
    const displayId = orderNumber || referenceId.slice(-8).toUpperCase();

    const itemsHtml = items.map(item =>
        `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
            <span>${item.name} x${item.quantity}</span>
            <span style="color:${BRAND_GOLD};">€${item.price.toFixed(2)}</span>
        </div>`
    ).join('');

    return {
        subject: `🚨 NUOVO ORDINE PAGATO: #${displayId} — €${fiatAmount.toFixed(0)}`,
        html: baseWrapper(`
            <h2 style="margin:0 0 8px;font-weight:400;font-size:22px;color:${BRAND_GOLD};">Nuovo Ordine Da Evadere</h2>
            <p style="color:rgba(255,255,255,0.6);margin:0 0 24px;font-size:14px;">
                L'ordine <strong style="color:white;">#${displayId}</strong> è stato confermato sulla blockchain.
            </p>
            <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;margin-bottom:16px;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:${BRAND_GOLD};margin-bottom:8px;">Pagamento</div>
                <div style="font-size:20px;font-weight:600;">€${fiatAmount.toFixed(2)}</div>
                <div style="font-size:12px;color:rgba(255,255,255,0.5);">${cryptoAmount} ${cryptoCurrency}</div>
            </div>
            <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;margin-bottom:16px;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:${BRAND_GOLD};margin-bottom:8px;">Articoli</div>
                ${itemsHtml}
            </div>
            ${email ? `<div style="font-size:12px;color:rgba(255,255,255,0.5);margin-bottom:8px;">📧 Cliente: ${escapeHtml(email)}</div>` : ''}
            ${Object.keys(shippingAddress).length > 0 ? `
            <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;margin-bottom:16px;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:${BRAND_GOLD};margin-bottom:8px;">Spedizione</div>
                <pre style="font-size:12px;color:rgba(255,255,255,0.7);margin:0;white-space:pre-wrap;">${escapeHtml(JSON.stringify(shippingAddress, null, 2))}</pre>
            </div>` : ''}
            <div style="text-align:center;margin-top:16px;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || ''}/admin" style="display:inline-block;background:${BRAND_GOLD};color:${BRAND_DARK};font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;">Apri Dashboard</a>
            </div>
        `),
    };
}

export function lowStockAlertEmail(params: LowStockAlertParams) {
    const { sku, currentQuantity, threshold } = params;
    return {
        subject: `⚠️ SCORTE BASSE: ${sku} — Solo ${currentQuantity} unità rimaste`,
        html: baseWrapper(`
            <h2 style="margin:0 0 8px;font-weight:400;font-size:22px;color:#FF6B6B;">Allarme Scorte Basse</h2>
            <p style="color:rgba(255,255,255,0.6);margin:0 0 24px;font-size:14px;line-height:1.6;">
                Il prodotto <strong style="color:white;">${sku}</strong> ha raggiunto un livello critico di scorte.
            </p>
            <div style="background:rgba(255,100,100,0.1);border:1px solid rgba(255,100,100,0.2);border-radius:12px;padding:20px;text-align:center;">
                <div style="font-size:48px;font-weight:700;color:#FF6B6B;">${currentQuantity}</div>
                <div style="font-size:12px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:2px;">unità rimanenti</div>
                <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:4px;">Soglia minima: ${threshold}</div>
            </div>
        `),
    };
}

export function warehouseNewOrderEmail(params: WarehouseNewOrderParams) {
    const { orderId, kitsToShip, customerName, customerPhone, shippingAddress } = params;
    return {
        subject: `📦 NUOVO ORDINE DA SPEDIRE: #${orderId} — ${kitsToShip} kit`,
        html: baseWrapper(`
            <h2 style="margin:0 0 8px;font-weight:400;font-size:22px;color:${BRAND_GOLD};">Nuovo Ordine da Spedire</h2>
            <div style="background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.3);border-radius:12px;padding:20px;text-align:center;margin-bottom:16px;">
                <div style="font-size:48px;font-weight:700;color:${BRAND_GOLD};">${kitsToShip}</div>
                <div style="font-size:12px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:2px;">kit da spedire</div>
            </div>
            <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;margin-bottom:16px;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:${BRAND_GOLD};margin-bottom:8px;">Destinatario</div>
                <div style="font-size:14px;color:rgba(255,255,255,0.8);">
                    <strong>${escapeHtml(customerName)}</strong><br>
                    Tel: ${escapeHtml(customerPhone)}
                </div>
            </div>
            <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;margin-bottom:16px;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:${BRAND_GOLD};margin-bottom:8px;">Indirizzo</div>
                <pre style="font-size:12px;color:rgba(255,255,255,0.7);margin:0;white-space:pre-wrap;">${escapeHtml(JSON.stringify(shippingAddress, null, 2))}</pre>
            </div>
            <div style="text-align:center;margin-top:16px;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || ''}/admin" style="display:inline-block;background:${BRAND_GOLD};color:${BRAND_DARK};font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;">Apri Dashboard</a>
            </div>
        `),
    };
}

export function underpaidAlertEmail(params: UnderpaidAlertParams) {
    const { referenceId, orderNumber, fiatAmount, cryptoCurrency, expectedCryptoAmount, receivedCryptoAmount, email, shippingAddress } = params;
    const displayId = orderNumber || referenceId.slice(-8).toUpperCase();
    const diffPct = ((expectedCryptoAmount - receivedCryptoAmount) / expectedCryptoAmount * 100).toFixed(1);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
    return {
        subject: `⚠️ PAGAMENTO INCOMPLETO: ${displayId} — mancano ${diffPct}%`,
        html: baseWrapper(`
            <h2 style="margin:0 0 8px;font-weight:400;font-size:22px;color:#F97316;">⚠️ Pagamento Incompleto</h2>
            <p style="color:rgba(255,255,255,0.6);margin:0 0 24px;font-size:14px;">
                L'ordine <strong style="color:white;">${displayId}</strong> ha ricevuto un importo inferiore a quello atteso.
            </p>
            <div style="background:rgba(249,115,22,0.1);border:1px solid rgba(249,115,22,0.3);border-radius:12px;padding:16px;margin-bottom:16px;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#F97316;margin-bottom:12px;">Confronto Importi</div>
                <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                    <span style="font-size:13px;color:rgba(255,255,255,0.6);">Atteso</span>
                    <span style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.9);">${expectedCryptoAmount} ${cryptoCurrency}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                    <span style="font-size:13px;color:rgba(255,255,255,0.6);">Ricevuto</span>
                    <span style="font-size:13px;font-weight:600;color:#F97316;">${receivedCryptoAmount} ${cryptoCurrency}</span>
                </div>
                <div style="text-align:center;padding-top:10px;">
                    <span style="font-size:15px;font-weight:700;color:#F97316;">Deficit: −${diffPct}%</span>
                </div>
            </div>
            <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;margin-bottom:16px;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:${BRAND_GOLD};margin-bottom:8px;">Ordine</div>
                <div style="font-size:13px;color:rgba(255,255,255,0.8);">
                    <strong>Valore:</strong> €${fiatAmount.toFixed(2)}<br>
                    ${email ? `<strong>Cliente:</strong> ${email}<br>` : ''}
                    ${shippingAddress?.full_name ? `<strong>Nome:</strong> ${shippingAddress.full_name}` : ''}
                </div>
            </div>
            <p style="color:rgba(255,255,255,0.5);font-size:12px;text-align:center;margin:0 0 16px;line-height:1.5;">
                L'ordine è in stato <strong>underpaid</strong> — non è stato evaso né è stata inviata la conferma al cliente.<br>
                Puoi accettarlo dalla dashboard se la differenza è trascurabile.
            </p>
            <div style="text-align:center;">
                <a href="${siteUrl}/admin" style="display:inline-block;background:#F97316;color:white;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;">Gestisci in Dashboard</a>
            </div>
        `),
    };
}
