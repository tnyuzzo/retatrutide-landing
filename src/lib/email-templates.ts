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
    emailNumber: 1 | 2 | 3;
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
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <!-- Logo -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;width:36px;height:36px;border:1px solid ${BRAND_GOLD};border-radius:50%;line-height:36px;text-align:center;">
        <span style="display:inline-block;width:14px;height:14px;background:${BRAND_GOLD};border-radius:50%;vertical-align:middle;"></span>
      </div>
      <div style="color:white;font-size:16px;letter-spacing:4px;margin-top:8px;text-transform:uppercase;">Aura Peptides</div>
    </div>
    <!-- Content -->
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px 24px;color:white;">
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
    const t = (key: string, vars?: Record<string, string>) => getEmailString(locale || 'en', key, vars);
    const displayId = orderNumber || referenceId.slice(-8).toUpperCase();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aurapep.eu';
    const subjectEmojis: Record<number, string> = { 1: '⏳', 2: '🔔', 3: '⚠️' };

    return {
        subject: `${subjectEmojis[emailNumber]} ${t(`recovery_subject_${emailNumber}`, { id: displayId })}`,
        html: baseWrapper(`
            <h2 style="margin:0 0 8px;font-weight:400;font-size:22px;">${t(`recovery_heading_${emailNumber}`)}</h2>
            <p style="color:rgba(255,255,255,0.6);margin:0 0 24px;font-size:14px;line-height:1.6;">
                ${t(`recovery_intro_${emailNumber}`, { id: displayId })}
            </p>
            <div style="background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.3);border-radius:12px;padding:20px;text-align:center;margin-bottom:16px;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:${BRAND_GOLD};margin-bottom:8px;">${t('recovery_amount_label')}</div>
                <div style="font-size:28px;font-weight:700;color:${BRAND_GOLD};">${cryptoAmount} ${cryptoCurrency}</div>
                <div style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:4px;">€${fiatAmount.toFixed(2)}</div>
            </div>
            <div style="text-align:center;margin-bottom:24px;">
                <a href="${siteUrl}/checkout/${referenceId}" style="display:inline-block;background:${BRAND_GOLD};color:${BRAND_DARK};font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;">${t('recovery_cta')}</a>
            </div>
            ${paymentUrl ? `
            <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;margin-bottom:16px;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:${BRAND_GOLD};margin-bottom:8px;">${t('recovery_address_label', { crypto: cryptoCurrency })}</div>
                <code style="display:block;word-break:break-all;font-size:12px;color:rgba(255,255,255,0.8);background:rgba(255,255,255,0.05);padding:10px;border-radius:8px;">${escapeHtml(paymentUrl)}</code>
            </div>` : ''}
            <p style="color:rgba(255,255,255,0.4);font-size:12px;text-align:center;">
                ${t('recovery_contact')}
            </p>
        `),
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
