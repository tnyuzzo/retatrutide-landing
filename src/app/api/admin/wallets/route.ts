import { NextResponse, NextRequest } from 'next/server';
import { verifyAuth, requireRole, AuthError } from '@/lib/auth';

// Wallet addresses from env vars
const WALLETS: { ticker: string; label: string; network: string; envKey: string }[] = [
    { ticker: 'btc', label: 'BTC', network: 'Bitcoin', envKey: 'CRYPTAPI_BTC_WALLET' },
    { ticker: 'eth', label: 'ETH', network: 'ERC-20', envKey: 'CRYPTAPI_ETH_WALLET' },
    { ticker: 'sol', label: 'SOL', network: 'Solana', envKey: 'CRYPTAPI_SOL_WALLET' },
    { ticker: 'trc20/usdt', label: 'USDT', network: 'TRC-20', envKey: 'CRYPTAPI_USDT_TRC20_WALLET' },
    { ticker: 'erc20/usdc', label: 'USDC', network: 'ERC-20', envKey: 'CRYPTAPI_USDC_WALLET' },
    { ticker: 'xmr', label: 'XMR', network: 'Monero', envKey: 'CRYPTAPI_XMR_WALLET' },
];

type WalletBalance = {
    ticker: string;
    label: string;
    network: string;
    address: string;
    balance: number | null;
    balanceUsd: number | null;
    error?: string;
};

// Fetch BTC balance from Blockstream API
async function fetchBtcBalance(address: string): Promise<{ balance: number; balanceUsd: number | null }> {
    const res = await fetch(`https://blockstream.info/api/address/${address}`);
    if (!res.ok) throw new Error(`Blockstream API ${res.status}`);
    const data = await res.json();
    const funded = data.chain_stats?.funded_txo_sum || 0;
    const spent = data.chain_stats?.spent_txo_sum || 0;
    const balanceSats = funded - spent;
    const balance = balanceSats / 1e8;

    // Fetch BTC price in USD
    let balanceUsd: number | null = null;
    try {
        const priceRes = await fetch('https://api.cryptapi.io/btc/info/');
        if (priceRes.ok) {
            const priceData = await priceRes.json();
            const usdPrice = priceData.prices?.USD || priceData.price_usd;
            if (usdPrice) balanceUsd = Math.round(balance * usdPrice * 100) / 100;
        }
    } catch { /* price fetch optional */ }

    return { balance, balanceUsd };
}

// Fetch ETH balance from public RPC
async function fetchEthBalance(address: string): Promise<{ balance: number; balanceUsd: number | null }> {
    const res = await fetch('https://cloudflare-eth.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_getBalance', params: [address, 'latest'], id: 1 }),
    });
    if (!res.ok) throw new Error(`ETH RPC ${res.status}`);
    const data = await res.json();
    const balanceWei = BigInt(data.result || '0');
    const balance = Number(balanceWei) / 1e18;

    let balanceUsd: number | null = null;
    try {
        const priceRes = await fetch('https://api.cryptapi.io/eth/info/');
        if (priceRes.ok) {
            const priceData = await priceRes.json();
            const usdPrice = priceData.prices?.USD || priceData.price_usd;
            if (usdPrice) balanceUsd = Math.round(balance * usdPrice * 100) / 100;
        }
    } catch { /* price fetch optional */ }

    return { balance, balanceUsd };
}

// Fetch SOL balance from public RPC
async function fetchSolBalance(address: string): Promise<{ balance: number; balanceUsd: number | null }> {
    const res = await fetch('https://api.mainnet-beta.solana.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getBalance', params: [address] }),
    });
    if (!res.ok) throw new Error(`SOL RPC ${res.status}`);
    const data = await res.json();
    const balance = (data.result?.value || 0) / 1e9;

    let balanceUsd: number | null = null;
    try {
        const priceRes = await fetch('https://api.cryptapi.io/sol/info/');
        if (priceRes.ok) {
            const priceData = await priceRes.json();
            const usdPrice = priceData.prices?.USD || priceData.price_usd;
            if (usdPrice) balanceUsd = Math.round(balance * usdPrice * 100) / 100;
        }
    } catch { /* price fetch optional */ }

    return { balance, balanceUsd };
}

// Fetch USDT TRC20 balance from Tronscan
async function fetchTrc20UsdtBalance(address: string): Promise<{ balance: number; balanceUsd: number | null }> {
    const res = await fetch(`https://apilist.tronscanapi.com/api/accountv2?address=${address}`, {
        headers: { 'TRON-PRO-API-KEY': 'no-key' },
    });
    if (!res.ok) throw new Error(`Tronscan API ${res.status}`);
    const data = await res.json();

    // Find USDT in token balances (contract: TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t)
    const USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
    let balance = 0;

    if (data.withPriceTokens && Array.isArray(data.withPriceTokens)) {
        const usdt = data.withPriceTokens.find((t: { tokenId: string }) => t.tokenId === USDT_CONTRACT);
        if (usdt) {
            balance = (usdt.balance || 0) / Math.pow(10, usdt.tokenDecimal || 6);
        }
    }

    // Also check trc20token_balances
    if (balance === 0 && data.trc20token_balances && Array.isArray(data.trc20token_balances)) {
        const usdt = data.trc20token_balances.find((t: { tokenId: string }) => t.tokenId === USDT_CONTRACT);
        if (usdt) {
            balance = parseFloat(usdt.balance || '0') / 1e6;
        }
    }

    return { balance, balanceUsd: Math.round(balance * 100) / 100 }; // USDT ≈ 1 USD
}

// Fetch ERC20 USDC balance
async function fetchErc20UsdcBalance(address: string): Promise<{ balance: number; balanceUsd: number | null }> {
    const USDC_CONTRACT = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    // eth_call to balanceOf(address)
    const data = '0x70a08231' + address.slice(2).padStart(64, '0');

    const res = await fetch('https://cloudflare-eth.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0', method: 'eth_call',
            params: [{ to: USDC_CONTRACT, data }, 'latest'], id: 1,
        }),
    });
    if (!res.ok) throw new Error(`ETH RPC ${res.status}`);
    const result = await res.json();
    const balanceRaw = BigInt(result.result || '0');
    const balance = Number(balanceRaw) / 1e6; // USDC has 6 decimals

    return { balance, balanceUsd: Math.round(balance * 100) / 100 }; // USDC ≈ 1 USD
}

// Dispatcher per ticker
async function fetchBalance(ticker: string, address: string): Promise<{ balance: number; balanceUsd: number | null }> {
    switch (ticker) {
        case 'btc': return fetchBtcBalance(address);
        case 'eth': return fetchEthBalance(address);
        case 'sol': return fetchSolBalance(address);
        case 'trc20/usdt': return fetchTrc20UsdtBalance(address);
        case 'erc20/usdc': return fetchErc20UsdcBalance(address);
        default: throw new Error(`Unsupported ticker: ${ticker}`);
    }
}

export async function GET(req: NextRequest) {
    try {
        const { role } = await verifyAuth(req);
        requireRole(role, ['super_admin']);

        const results: WalletBalance[] = await Promise.all(
            WALLETS.map(async (w) => {
                const address = process.env[w.envKey] || '';
                if (!address) {
                    return { ticker: w.ticker, label: w.label, network: w.network, address: '', balance: null, balanceUsd: null, error: 'Non configurato' };
                }

                // XMR can't be checked publicly (privacy coin)
                if (w.ticker === 'xmr') {
                    return { ticker: w.ticker, label: w.label, network: w.network, address: address.slice(0, 8) + '...' + address.slice(-8), balance: null, balanceUsd: null, error: 'Privacy coin — saldo non verificabile' };
                }

                try {
                    const { balance, balanceUsd } = await fetchBalance(w.ticker, address);
                    return { ticker: w.ticker, label: w.label, network: w.network, address, balance, balanceUsd };
                } catch (e) {
                    return { ticker: w.ticker, label: w.label, network: w.network, address, balance: null, balanceUsd: null, error: e instanceof Error ? e.message : 'Errore' };
                }
            })
        );

        return NextResponse.json({ wallets: results });
    } catch (err) {
        if (err instanceof AuthError) {
            return NextResponse.json({ error: err.message }, { status: err.statusCode });
        }
        console.error('Wallets API error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
