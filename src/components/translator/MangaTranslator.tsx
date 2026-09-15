'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, Play, Square, Loader2, RotateCw } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface MangaTranslatorProps {
  onProcessImage: (imageDataUrl: string) => Promise<void>;
  isProcessing: boolean;
  translatedText: string;
  detectedLanguage?: string;
}

export default function MangaTranslator({
  onProcessImage,
  isProcessing,
  translatedText,
  detectedLanguage,
}: MangaTranslatorProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isAutoTranslating, setIsAutoTranslating] = useState(false);
  const [rotation, setRotation] = useState(0);

  // File Upload Handling
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result && typeof e.target.result === 'string') {
            onProcessImage(e.target.result);
          }
        };
        reader.readAsDataURL(file);
      }
    },
    [onProcessImage]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
  });

  // Screen Capture Handling
  const startCapture = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCapturing(true);

      // Listen for stream stop (e.g., user clicks "Stop sharing" in browser UI)
      mediaStream.getVideoTracks()[0].onended = () => {
        stopCapture();
      };

      // Set up automatic interval capture
      // Note: we can't directly use captureFrame here easily due to closures over state,
      // but we can set up an interval that triggers a custom event or a ref to a function.
      // A simple approach is to have a button to "Auto Translate" but we will just do an interval.
    } catch (err) {
      console.error('Error sharing screen:', err);
      alert('Error sharing screen. Please grant permissions.');
    }
  };

  const rotateVideo = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const stopCapture = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
    stopAutoTranslate();
  };

  // Usar useRef para mantener el estado actual de isProcessing dentro del setInterval
  const isProcessingRef = useRef(isProcessing);
  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  const toggleAutoTranslate = () => {
    if (isAutoTranslating) {
      stopAutoTranslate();
    } else {
      setIsAutoTranslating(true);
      // Capture immediately
      if (!isProcessingRef.current) {
         captureFrame();
      }

      // Then set interval
      captureIntervalRef.current = setInterval(() => {
        // Solo capturar si NO está procesando actualmente una imagen anterior
        if (!isProcessingRef.current) {
            captureFrame();
        }
      }, 5000); // Capture every 5 seconds
    }
  };

  const stopAutoTranslate = () => {
    setIsAutoTranslating(false);
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.videoWidth === 0 || video.videoHeight === 0) return;

      // Configurar dimensiones del canvas según la rotación
      if (rotation % 180 === 90) {
        canvas.width = video.videoHeight;
        canvas.height = video.videoWidth;
      } else {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.save();

        // Mover el punto de origen al centro del canvas
        ctx.translate(canvas.width / 2, canvas.height / 2);

        // Rotar el contexto
        ctx.rotate((rotation * Math.PI) / 180);

        // Dibujar el video centrado (compensando el punto de origen)
        ctx.drawImage(
          video,
          -video.videoWidth / 2,
          -video.videoHeight / 2,
          video.videoWidth,
          video.videoHeight
        );

        ctx.restore();

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        onProcessImage(dataUrl);
      }
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Left Column: Input Methods */}
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Camera className="w-6 h-6 text-blue-400" />
              Captura en Tiempo Real
            </h2>

            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden border border-gray-700 relative mb-4 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className={`max-w-full max-h-full object-contain transition-transform duration-300 ${isCapturing ? 'block' : 'hidden'}`}
                style={{ transform: `rotate(${rotation}deg)` }}
              />
              {!isCapturing && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                  La vista previa aparecerá aquí
                </div>
              )}
            </div>

            {/* Hidden canvas for capturing frames */}
            <canvas ref={canvasRef} className="hidden" />

            <div className="flex gap-4">
              {!isCapturing ? (
                <button
                  onClick={startCapture}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-colors"
                >
                  <Play className="w-5 h-5" />
                  Compartir Pantalla
                </button>
              ) : (
                <>
                  <button
                    onClick={rotateVideo}
                    className="flex-none flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-xl font-medium transition-colors"
                    title="Rotar pantalla 90°"
                  >
                    <RotateCw className="w-5 h-5" />
                  </button>
                  <button
                    onClick={stopCapture}
                    className="flex-none flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl font-medium transition-colors"
                    title="Detener captura"
                  >
                    <Square className="w-5 h-5" />
                  </button>

                  <button
                    onClick={captureFrame}
                    disabled={isProcessing || isAutoTranslating}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:text-gray-400 text-white py-3 px-4 rounded-xl font-medium transition-colors"
                  >
                    <Camera className="w-5 h-5" />
                    Capturar
                  </button>

                  <button
                    onClick={toggleAutoTranslate}
                    className={`flex-1 flex items-center justify-center gap-2 text-white py-3 px-4 rounded-xl font-medium transition-colors ${
                      isAutoTranslating
                        ? 'bg-purple-600 hover:bg-purple-700 ring-2 ring-purple-400 ring-offset-2 ring-offset-gray-800'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {isAutoTranslating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Auto (Activado)
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        Auto (5s)
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          <div
            {...getRootProps()}
            className={`bg-gray-800 p-8 rounded-2xl shadow-xl border-2 border-dashed transition-colors cursor-pointer text-center
              ${
                isDragActive
                  ? 'border-blue-500 bg-gray-800/80'
                  : 'border-gray-700 hover:border-gray-500'
              }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              Sube una imagen
            </h3>
            <p className="text-gray-400 text-sm">
              Arrastra y suelta un manga aquí, o haz clic para seleccionar
            </p>
          </div>
        </div>

        {/* Right Column: Output */}
        <div className="bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700 flex flex-col h-full min-h-[400px]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Traducción</h2>
            {detectedLanguage && detectedLanguage !== 'Desconocido' && (
              <span className="text-xs font-medium px-2.5 py-1 bg-blue-900/50 text-blue-300 rounded-full border border-blue-800">
                Detectado: {detectedLanguage.toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1 bg-gray-900 rounded-xl p-4 overflow-y-auto border border-gray-700 relative">
             {isProcessing && (
              <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center z-10 rounded-xl backdrop-blur-sm">
                 <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            )}
            {translatedText ? (
              <p className="text-gray-200 whitespace-pre-wrap">{translatedText}</p>
            ) : (
              <p className="text-gray-500 text-center mt-10">
                La traducción aparecerá aquí...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
