import { createWorker, Worker } from 'tesseract.js';

let workerPromise: Promise<Worker> | null = null;

async function getWorker(language: string): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = createWorker(language);
  }
  return workerPromise;
}

export async function extractTextFromImage(imageDataUrl: string, language: string = 'jpn+eng+chi_sim') {
  try {
    const worker = await getWorker(language);
    const ret = await worker.recognize(imageDataUrl);
    return ret.data.text;
  } catch (error) {
    console.error("Error during OCR:", error);
    throw new Error("Failed to extract text from image.");
  }
}
