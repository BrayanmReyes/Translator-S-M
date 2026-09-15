import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json(
        { error: 'No text provided for translation' },
        { status: 400 }
      );
    }

    // Clean text: replace newlines with spaces for better translation context
    const cleanText = text.replace(/\n/g, ' ').trim();

    // We use Lingva API, a free privacy-oriented proxy for Google Translate
    // It doesn't require an API key and supports auto-detection.
    const url = `https://lingva.ml/api/v1/auto/es/${encodeURIComponent(cleanText)}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error('Translation API responded with an error.');
    }

    const data = await response.json();

    const translatedText = data.translation || 'No se pudo traducir.';
    const detectedLanguage = data.info?.detectedSource || 'Desconocido';

    return NextResponse.json({
      translatedText,
      detectedLanguage
    });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Error translating text' },
      { status: 500 }
    );
  }
}
