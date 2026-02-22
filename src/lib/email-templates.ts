/**
 * Professional HTML email templates for Aura Peptides (Retatrutide)
 */

interface ShipmentNotificationParams {
    referenceId: string;
    carrier: string;
    trackingNumber: string;
    trackingUrl: string | null;
}

interface OrderReceivedAdminParams {
    referenceId: string;
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

const BRAND_GOLD = '#D4AF37';
const BRAND_DARK = '#070A0F';

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

export function shipmentNotificationEmail(params: ShipmentNotificationParams) {
    const { referenceId, carrier, trackingNumber, trackingUrl } = params;
    const trackingLink = trackingUrl
        ? `<a href="${trackingUrl}" style="display:inline-block;background:${BRAND_GOLD};color:${BRAND_DARK};font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;margin-top:16px;">Traccia il Pacco</a>`
        : `<code style="background:rgba(255,255,255,0.1);padding:4px 12px;border-radius:6px;color:${BRAND_GOLD};font-size:14px;">${trackingNumber}</code>`;

    return {
        subject: `📦 Il tuo ordine è stato spedito! — ${referenceId.slice(-8).toUpperCase()}`,
        html: baseWrapper(`
            <h2 style="margin:0 0 8px;font-weight:400;font-size:22px;">Ordine Spedito!</h2>
            <p style="color:rgba(255,255,255,0.6);margin:0 0 24px;font-size:14px;line-height:1.6;">
                Il tuo ordine <strong style="color:white;">${referenceId.slice(-8).toUpperCase()}</strong> è stato affidato al corriere e sta viaggiando verso di te.
            </p>
            <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;margin-bottom:24px;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:${BRAND_GOLD};margin-bottom:8px;">Dettagli Spedizione</div>
                <div style="font-size:14px;color:rgba(255,255,255,0.8);">
                    <strong>Corriere:</strong> ${carrier}<br>
                    <strong>Tracking:</strong> ${trackingNumber}
                </div>
            </div>
            <div style="text-align:center;">${trackingLink}</div>
            <p style="color:rgba(255,255,255,0.4);font-size:12px;margin-top:24px;text-align:center;">
                Per qualsiasi domanda rispondi direttamente a questa email.
            </p>
        `),
    };
}

export function orderConfirmationAdminEmail(params: OrderReceivedAdminParams) {
    const { referenceId, fiatAmount, cryptoCurrency, cryptoAmount, items, shippingAddress, email } = params;

    const itemsHtml = items.map(item =>
        `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
            <span>${item.name} x${item.quantity}</span>
            <span style="color:${BRAND_GOLD};">€${item.price.toFixed(2)}</span>
        </div>`
    ).join('');

    return {
        subject: `🚨 NUOVO ORDINE PAGATO: ${referenceId.slice(-8).toUpperCase()} — €${fiatAmount.toFixed(0)}`,
        html: baseWrapper(`
            <h2 style="margin:0 0 8px;font-weight:400;font-size:22px;color:${BRAND_GOLD};">Nuovo Ordine Da Evadere</h2>
            <p style="color:rgba(255,255,255,0.6);margin:0 0 24px;font-size:14px;">
                L'ordine <strong style="color:white;">${referenceId.slice(-8).toUpperCase()}</strong> è stato confermato sulla blockchain.
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
            ${email ? `<div style="font-size:12px;color:rgba(255,255,255,0.5);margin-bottom:8px;">📧 Cliente: ${email}</div>` : ''}
            ${Object.keys(shippingAddress).length > 0 ? `
            <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;margin-bottom:16px;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:${BRAND_GOLD};margin-bottom:8px;">Spedizione</div>
                <pre style="font-size:12px;color:rgba(255,255,255,0.7);margin:0;white-space:pre-wrap;">${JSON.stringify(shippingAddress, null, 2)}</pre>
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

interface WarehouseNewOrderParams {
    orderId: string;
    kitsToShip: number;
    customerName: string;
    customerPhone: string;
    shippingAddress: Record<string, string>;
}

interface RefundConfirmationParams {
    referenceId: string;
    fiatAmount: number;
    refundAmount: number;
    isPartial: boolean;
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
                    <strong>${customerName}</strong><br>
                    Tel: ${customerPhone}
                </div>
            </div>
            <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;margin-bottom:16px;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:${BRAND_GOLD};margin-bottom:8px;">Indirizzo</div>
                <pre style="font-size:12px;color:rgba(255,255,255,0.7);margin:0;white-space:pre-wrap;">${JSON.stringify(shippingAddress, null, 2)}</pre>
            </div>
            <div style="text-align:center;margin-top:16px;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || ''}/admin" style="display:inline-block;background:${BRAND_GOLD};color:${BRAND_DARK};font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;">Apri Dashboard</a>
            </div>
        `),
    };
}

export function refundConfirmationEmail(params: RefundConfirmationParams) {
    const { referenceId, fiatAmount, refundAmount, isPartial } = params;
    return {
        subject: `💸 Rimborso ${isPartial ? 'Parziale ' : ''}Confermato — Ordine ${referenceId.slice(-8).toUpperCase()}`,
        html: baseWrapper(`
            <h2 style="margin:0 0 8px;font-weight:400;font-size:22px;">Rimborso ${isPartial ? 'Parziale ' : ''}Confermato</h2>
            <p style="color:rgba(255,255,255,0.6);margin:0 0 24px;font-size:14px;line-height:1.6;">
                Il rimborso per il tuo ordine <strong style="color:white;">${referenceId.slice(-8).toUpperCase()}</strong> è stato elaborato.
            </p>
            <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:20px;text-align:center;margin-bottom:16px;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:${BRAND_GOLD};margin-bottom:8px;">Importo Rimborsato</div>
                <div style="font-size:28px;font-weight:600;color:${BRAND_GOLD};">€${refundAmount.toFixed(2)}</div>
                ${isPartial ? `<div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px;">su €${fiatAmount.toFixed(2)} totali</div>` : ''}
            </div>
            <p style="color:rgba(255,255,255,0.4);font-size:12px;text-align:center;">
                Il rimborso crypto verrà inviato al tuo wallet. Per qualsiasi domanda rispondi direttamente a questa email.
            </p>
        `),
    };
}

export function orderConfirmationCustomerEmail(params: { referenceId: string; fiatAmount: number }) {
    return {
        subject: `✅ Pagamento Ricevuto — Ordine ${params.referenceId.slice(-8).toUpperCase()}`,
        html: baseWrapper(`
            <h2 style="margin:0 0 8px;font-weight:400;font-size:22px;">Pagamento Ricevuto!</h2>
            <p style="color:rgba(255,255,255,0.6);margin:0 0 24px;font-size:14px;line-height:1.6;">
                Il tuo pagamento crypto per l'ordine <strong style="color:white;">${params.referenceId.slice(-8).toUpperCase()}</strong> è stato confermato. Il tuo kit è in preparazione logistica.
            </p>
            <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:${BRAND_GOLD};margin-bottom:8px;">Totale Confermato</div>
                <div style="font-size:28px;font-weight:600;color:${BRAND_GOLD};">€${params.fiatAmount.toFixed(2)}</div>
            </div>
            <p style="color:rgba(255,255,255,0.4);font-size:12px;text-align:center;">
                Riceverai un'ulteriore email con il tracking number non appena il pacco verrà affidato al corriere espresso.
            </p>
        `),
    };
}
