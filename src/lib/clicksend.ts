const CLICKSEND_BASE = 'https://rest.clicksend.com/v3';
const RETRY_DELAYS = [2000, 5000, 10000];

function getAuthHeader(): string {
    const username = process.env.CLICKSEND_USERNAME;
    const apiKey = process.env.CLICKSEND_API_KEY;
    if (!username || !apiKey) throw new Error('CLICKSEND_USERNAME or CLICKSEND_API_KEY not configured');
    return `Basic ${Buffer.from(`${username}:${apiKey}`).toString('base64')}`;
}

interface SendSMSParams {
    to: string;
    body: string;
    from?: string;
    source?: string;
}

export async function sendSMS({ to, body, from, source = 'aura-peptides' }: SendSMSParams): Promise<void> {
    if (!process.env.CLICKSEND_USERNAME || !process.env.CLICKSEND_API_KEY) {
        console.warn('ClickSend not configured, skipping SMS');
        return;
    }

    const message: Record<string, string> = { to, body, source };
    if (from) message.from = from;

    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
        try {
            const res = await fetch(`${CLICKSEND_BASE}/sms/send`, {
                method: 'POST',
                headers: {
                    'Authorization': getAuthHeader(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ messages: [message] }),
            });

            const data = await res.json();

            if (!res.ok || data.response_code !== 'SUCCESS') {
                throw new Error(data.response_msg || `ClickSend error: ${res.status}`);
            }

            const msgResult = data.data?.messages?.[0];
            if (attempt > 0) console.log(`SMS sent to ${to} on attempt ${attempt + 1}`);
            console.log(`SMS sent to ${to}, status: ${msgResult?.status}, message_id: ${msgResult?.message_id}`);
            return;
        } catch (err) {
            lastError = err as Error;
            if (attempt < RETRY_DELAYS.length) {
                console.warn(`SMS to ${to} failed (attempt ${attempt + 1}/${RETRY_DELAYS.length + 1}): ${lastError.message}. Retrying in ${RETRY_DELAYS[attempt] / 1000}s...`);
                await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt]));
            }
        }
    }

    console.error(`SMS to ${to} failed after ${RETRY_DELAYS.length + 1} attempts:`, lastError?.message);
    throw lastError;
}
