/**
 * Professional HTML email templates for Aura Peptides (Retatrutide)
 */

interface ShipmentNotificationParams {
    referenceId: string;
    orderNumber?: string;
    carrier: string;
    trackingNumber: string;
    trackingUrl: string | null;
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

export function shipmentNotificationEmail(params: ShipmentNotificationParams) {
    const { referenceId, orderNumber, carrier, trackingNumber, trackingUrl } = params;
    const displayId = orderNumber || referenceId.slice(-8).toUpperCase();
    const trackingLink = trackingUrl
        ? `<a href="${trackingUrl}" style="display:inline-block;background:${BRAND_GOLD};color:${BRAND_DARK};font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;margin-top:16px;">Traccia il Pacco</a>`
        : `<code style="background:rgba(255,255,255,0.1);padding:4px 12px;border-radius:6px;color:${BRAND_GOLD};font-size:14px;">${trackingNumber}</code>`;

    return {
        subject: `📦 Il tuo ordine è stato spedito! — #${displayId}`,
        html: baseWrapper(`
            <h2 style="margin:0 0 8px;font-weight:400;font-size:22px;">Ordine Spedito!</h2>
            <p style="color:rgba(255,255,255,0.6);margin:0 0 24px;font-size:14px;line-height:1.6;">
                Il tuo ordine <strong style="color:white;">#${displayId}</strong> è stato affidato al corriere e sta viaggiando verso di te.
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

export function refundConfirmationEmail(params: RefundConfirmationParams) {
    const { referenceId, orderNumber, fiatAmount, refundAmount, isPartial } = params;
    const displayId = orderNumber || referenceId.slice(-8).toUpperCase();
    return {
        subject: `💸 Rimborso ${isPartial ? 'Parziale ' : ''}Confermato — Ordine #${displayId}`,
        html: baseWrapper(`
            <h2 style="margin:0 0 8px;font-weight:400;font-size:22px;">Rimborso ${isPartial ? 'Parziale ' : ''}Confermato</h2>
            <p style="color:rgba(255,255,255,0.6);margin:0 0 24px;font-size:14px;line-height:1.6;">
                Il rimborso per il tuo ordine <strong style="color:white;">#${displayId}</strong> è stato elaborato.
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

interface CartRecoveryParams {
    referenceId: string;
    orderNumber?: string;
    fiatAmount: number;
    cryptoCurrency: string;
    cryptoAmount: number;
    paymentUrl: string;
    emailNumber: 1 | 2 | 3;  // 1h, 12h, 48h
}

export function cartRecoveryEmail(params: CartRecoveryParams) {
    const { referenceId, orderNumber, fiatAmount, cryptoCurrency, cryptoAmount, paymentUrl, emailNumber } = params;
    const displayId = orderNumber || referenceId.slice(-8).toUpperCase();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aurapep.eu';

    const subjects: Record<number, string> = {
        1: `⏳ Il tuo ordine ${displayId} è in attesa di pagamento`,
        2: `🔔 Non dimenticare il tuo ordine ${displayId} — completa il pagamento`,
        3: `⚠️ Ultima possibilità: il tuo ordine ${displayId} scade tra poche ore`,
    };

    const headings: Record<number, string> = {
        1: 'Il tuo ordine è pronto!',
        2: 'Completa il tuo acquisto',
        3: 'Ultima occasione!',
    };

    const intros: Record<number, string> = {
        1: `Hai creato l'ordine <strong style="color:white;">${displayId}</strong> ma non abbiamo ancora ricevuto il pagamento. L'indirizzo crypto è ancora attivo — puoi completare il pagamento quando vuoi.`,
        2: `Il tuo ordine <strong style="color:white;">${displayId}</strong> è ancora in attesa. Hai già tutti i dati per completare il pagamento — ti basta inviare l'importo esatto all'indirizzo qui sotto.`,
        3: `Il tuo ordine <strong style="color:white;">${displayId}</strong> scadrà tra poche ore. Dopo la scadenza dovrai crearne uno nuovo con un nuovo tasso di cambio. Completa il pagamento adesso per bloccare il prezzo attuale.`,
    };

    return {
        subject: subjects[emailNumber],
        html: baseWrapper(`
            <h2 style="margin:0 0 8px;font-weight:400;font-size:22px;">${headings[emailNumber]}</h2>
            <p style="color:rgba(255,255,255,0.6);margin:0 0 24px;font-size:14px;line-height:1.6;">
                ${intros[emailNumber]}
            </p>
            <div style="background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.3);border-radius:12px;padding:20px;text-align:center;margin-bottom:16px;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:${BRAND_GOLD};margin-bottom:8px;">Importo da Inviare</div>
                <div style="font-size:28px;font-weight:700;color:${BRAND_GOLD};">${cryptoAmount} ${cryptoCurrency}</div>
                <div style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:4px;">€${fiatAmount.toFixed(2)}</div>
            </div>
            <div style="text-align:center;margin-bottom:24px;">
                <a href="${siteUrl}/checkout/${referenceId}" style="display:inline-block;background:${BRAND_GOLD};color:${BRAND_DARK};font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;">Completa il Pagamento</a>
            </div>
            ${paymentUrl ? `
            <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;margin-bottom:16px;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:${BRAND_GOLD};margin-bottom:8px;">Indirizzo ${cryptoCurrency}</div>
                <code style="display:block;word-break:break-all;font-size:12px;color:rgba(255,255,255,0.8);background:rgba(255,255,255,0.05);padding:10px;border-radius:8px;">${escapeHtml(paymentUrl)}</code>
            </div>` : ''}
            <p style="color:rgba(255,255,255,0.4);font-size:12px;text-align:center;">
                Per qualsiasi domanda rispondi direttamente a questa email.
            </p>
        `),
    };
}

interface OrderCreatedParams {
    referenceId: string;
    orderNumber?: string;
    fiatAmount: number;
    cryptoCurrency: string;
    cryptoAmount: number;
    paymentAddress: string;
    quantity: number;
}

export function orderCreatedEmail(params: OrderCreatedParams) {
    const { referenceId, orderNumber, fiatAmount, cryptoCurrency, cryptoAmount, paymentAddress, quantity } = params;
    const displayId = orderNumber || referenceId.slice(-8).toUpperCase();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aurapep.eu';
    const checkoutUrl = `${siteUrl}/checkout/${referenceId}`;
    const kitLabel = quantity > 1 ? `${quantity} kit` : '1 kit';

    return {
        subject: `🧪 Ordine ${displayId} creato — completa il pagamento`,
        html: baseWrapper(`
            <h2 style="margin:0 0 8px;font-weight:400;font-size:22px;">Il tuo ordine è pronto!</h2>
            <p style="color:rgba(255,255,255,0.6);margin:0 0 24px;font-size:14px;line-height:1.6;">
                Hai ordinato <strong style="color:white;">${kitLabel} Retatrutide 10mg</strong>. Per completare l'acquisto, invia l'importo esatto in ${cryptoCurrency} all'indirizzo qui sotto.
            </p>
            <div style="background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.3);border-radius:12px;padding:20px;text-align:center;margin-bottom:16px;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:${BRAND_GOLD};margin-bottom:8px;">Importo da Inviare</div>
                <div style="font-size:28px;font-weight:700;color:${BRAND_GOLD};">${cryptoAmount} ${cryptoCurrency}</div>
                <div style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:4px;">€${fiatAmount.toFixed(2)} · Ordine #${displayId}</div>
            </div>
            <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;margin-bottom:16px;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:${BRAND_GOLD};margin-bottom:8px;">Indirizzo ${cryptoCurrency}</div>
                <code style="display:block;word-break:break-all;font-size:13px;color:rgba(255,255,255,0.9);background:rgba(255,255,255,0.05);padding:12px;border-radius:8px;line-height:1.5;">${escapeHtml(paymentAddress)}</code>
            </div>
            <div style="text-align:center;margin-bottom:24px;">
                <a href="${checkoutUrl}" style="display:inline-block;background:${BRAND_GOLD};color:${BRAND_DARK};font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;">Apri Pagina di Pagamento</a>
            </div>
            <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:14px;margin-bottom:16px;">
                <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0;line-height:1.6;">
                    <strong style="color:rgba(255,255,255,0.7);">Come completare il pagamento:</strong><br>
                    1. Copia l'indirizzo ${cryptoCurrency} qui sopra<br>
                    2. Apri il tuo wallet e invia esattamente <strong style="color:white;">${cryptoAmount} ${cryptoCurrency}</strong><br>
                    3. Il pagamento viene confermato automaticamente in pochi minuti<br><br>
                    <span style="color:rgba(255,255,255,0.4);">Non hai crypto? Puoi acquistare ${cryptoCurrency} con carta su <a href="https://changehero.io" style="color:${BRAND_GOLD};text-decoration:none;">ChangeHero</a> e inviarli direttamente all'indirizzo qui sopra.</span>
                </p>
            </div>
            <p style="color:rgba(255,255,255,0.35);font-size:11px;text-align:center;">
                L'ordine è valido 72 ore. Per qualsiasi domanda rispondi a questa email.
            </p>
        `),
    };
}

export function orderConfirmationCustomerEmail(params: { referenceId: string; orderNumber?: string; fiatAmount: number }) {
    const displayId = params.orderNumber || params.referenceId.slice(-8).toUpperCase();
    return {
        subject: `✅ Pagamento Ricevuto — Ordine #${displayId}`,
        html: baseWrapper(`
            <h2 style="margin:0 0 8px;font-weight:400;font-size:22px;">Pagamento Ricevuto!</h2>
            <p style="color:rgba(255,255,255,0.6);margin:0 0 24px;font-size:14px;line-height:1.6;">
                Il tuo pagamento crypto per l'ordine <strong style="color:white;">#${displayId}</strong> è stato confermato. Il tuo kit è in preparazione logistica.
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
