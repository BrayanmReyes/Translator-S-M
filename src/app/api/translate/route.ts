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

    // We use a free translation API for this demo (MyMemory Translation API)
    // It allows 500 requests/day for free without an API key.
    // For production, consider using Google Cloud Translation, DeepL, or an AI Model (OpenAI/Gemini).

    // Clean text: replace newlines with spaces for better translation context
    const cleanText = text.replace(/\\n/g, ' ').trim();

    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        cleanText
      )}&langpair=autodetect|es`
    );

    if (!response.ok) {
        throw new Error('Translation API responded with an error.');
    }

    const data = await response.json();

    // MyMemory returns translated text in responseData.translatedText
    const translatedText = data.responseData?.translatedText || 'No se pudo traducir.';

    return NextResponse.json({ translatedText });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Error translating text' },
      { status: 500 }
    );
  }
}
