import { NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';

const INDEXNOW_KEY = 'c85e4148388549f29fc03c90eb88fbb9';
const BASE_URL = 'https://aurapep.eu';

function getAllUrls(): string[] {
  const pages = ['', '/calculator', '/order', '/crypto-guide', '/portal'];
  const urls: string[] = [];

  for (const page of pages) {
    for (const locale of routing.locales) {
      urls.push(`${BASE_URL}/${locale}${page}`);
    }
  }

  return urls;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const urls = getAllUrls();

  const body = {
    host: 'aurapep.eu',
    key: INDEXNOW_KEY,
    keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: urls,
  };

  // IndexNow: un singolo ping a api.indexnow.org propaga a tutti i motori partecipanti
  // (Bing, Yandex, Seznam, Naver)
  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });

  const status = response.status;
  let responseText = '';
  try {
    responseText = await response.text();
  } catch {
    // ignore
  }

  return NextResponse.json({
    success: status >= 200 && status < 300,
    indexnowStatus: status,
    indexnowResponse: responseText,
    urlCount: urls.length,
    urls,
  });
}
