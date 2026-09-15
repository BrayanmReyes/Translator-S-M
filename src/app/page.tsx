'use client';

import MangaTranslator from '@/components/translator/MangaTranslator';
import { useState } from 'react';
import { extractTextFromImage } from '@/lib/ocr';

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState('');

  const handleProcessImage = async (imageDataUrl: string) => {
    setIsProcessing(true);
    setTranslatedText('1/2. Extrayendo texto de la imagen (OCR local)...');

    try {
      // 1. Extraer texto con Tesseract.js (Local)
      const extractedText = await extractTextFromImage(imageDataUrl, 'jpn+eng+chi_sim');

      if (!extractedText || extractedText.trim() === '') {
        setTranslatedText('No se encontró texto en la imagen.');
        setIsProcessing(false);
        return;
      }

      setTranslatedText(`2/2. Texto extraído:\n${extractedText}\n\nTraduciendo...`);

      // 2. Enviar texto a la API de traducción
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: extractedText }),
      });

      if (!response.ok) {
        throw new Error('Error en la traducción');
      }

      const data = await response.json();

      setTranslatedText(`Texto original:\n${extractedText}\n\nTraducción al español:\n${data.translatedText}`);
      setDetectedLanguage(data.detectedLanguage);
      setIsProcessing(false);

    } catch (error) {
      console.error(error);
      setTranslatedText('Ocurrió un error al procesar la imagen.');
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
            Manga Translator AI
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Traduce mangas, doujins y cómics en tiempo real desde tu pantalla o subiendo imágenes. 100% privado y sin censura visual.
          </p>
        </div>

        <MangaTranslator
          onProcessImage={handleProcessImage}
          isProcessing={isProcessing}
          translatedText={translatedText}
          detectedLanguage={detectedLanguage}
        />
      </div>
    </main>
  );
}
