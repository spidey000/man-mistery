import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings as SettingsIcon, HelpCircle, X, Activity } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useSettings } from '../contexts/SettingsContext';

export function SettingsAndHelper() {
  const {
    settings,
    setSettings,
    showSettings,
    setShowSettings,
    showHelper,
    setShowHelper,
    offlineState,
    downloadOfflineContent,
  } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [apiUsage, setApiUsage] = useState<{ count: number, limit: number } | null>(null);
  const [checkingUsage, setCheckingUsage] = useState(false);
  const [usageError, setUsageError] = useState('');
  const [downloadError, setDownloadError] = useState('');

  // Sync local state when context changes
  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings, showSettings]);

  const handleSaveSettings = () => {
    setSettings(localSettings);
    setShowSettings(false);
  };

  const handleDownloadOffline = async () => {
    setDownloadError('');
    try {
      await downloadOfflineContent({
        apiKey: localSettings.elevenLabsApiKey,
        childName: localSettings.childName,
      });
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'No se pudo descargar el contenido offline');
    }
  };

  const checkApiUsage = async () => {
    if (!localSettings.elevenLabsApiKey) {
      setUsageError('Introduce una API Key primero');
      return;
    }
    setCheckingUsage(true);
    setUsageError('');
    try {
      const res = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
        headers: {
          'xi-api-key': localSettings.elevenLabsApiKey
        }
      });
      if (!res.ok) throw new Error('API Key inválida o error de conexión');
      const data = await res.json();
      setApiUsage({ count: data.character_count, limit: data.character_limit });
    } catch (e: any) {
      setUsageError(e.message);
    } finally {
      setCheckingUsage(false);
    }
  };

  const renderInPortal = (content: React.ReactNode) => {
    if (typeof document === 'undefined') {
      return null;
    }

    return createPortal(content, document.body);
  };

  return (
    <>
      <div className="flex items-center gap-2 sm:gap-3">
        <button 
          onClick={() => setShowSettings(true)}
          className="inline-flex items-center justify-center rounded-md border border-stone-500 bg-stone-200 p-2 text-stone-700 shadow-sm transition hover:bg-stone-300"
          title="Ajustes"
          aria-label="Abrir ajustes"
        >
          <SettingsIcon size={20} />
        </button>
        <button 
          onClick={() => setShowHelper(true)}
          className="inline-flex items-center justify-center rounded-md border border-stone-500 bg-stone-200 p-2 text-stone-700 shadow-sm transition hover:bg-stone-300"
          title="Ayuda"
          aria-label="Abrir ayuda"
        >
          <HelpCircle size={20} />
        </button>
      </div>

      {/* Settings Dialog */}
      {renderInPortal(
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[2147483647] overflow-y-auto bg-black/60 p-3 sm:p-4"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="relative mx-auto my-4 w-full max-w-md rounded-xl border-4 border-stone-400 bg-[#fffcf5] p-4 text-left shadow-2xl sm:my-8 sm:p-6 max-h-[calc(100vh-2rem)] overflow-y-auto"
              >
                <button
                  onClick={() => setShowSettings(false)}
                  className="sticky top-0 float-right ml-3 rounded-md bg-[#fffcf5] text-stone-500 hover:text-stone-800"
                >
                  <X size={24} />
                </button>
                <h2 className="text-2xl font-bold text-stone-800 mb-4 flex items-center gap-2">
                  <SettingsIcon size={24} /> Ajustes
                </h2>

                <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Nombre del niño/a</label>
                  <input 
                    type="text" 
                    value={localSettings.childName}
                    onChange={(e) => setLocalSettings({...localSettings, childName: e.target.value})}
                    className="w-full p-2 border-2 border-stone-300 rounded-md bg-white focus:border-stone-500 focus:outline-none"
                    placeholder="Ej: Leo"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Edad</label>
                  <input 
                    type="number" 
                    value={localSettings.childAge}
                    onChange={(e) => setLocalSettings({...localSettings, childAge: e.target.value})}
                    className="w-full p-2 border-2 border-stone-300 rounded-md bg-white focus:border-stone-500 focus:outline-none"
                    placeholder="Ej: 8"
                  />
                </div>

                <div className="bg-stone-100 p-4 rounded-lg border border-stone-300">
                  <label className="block text-sm font-bold text-stone-700 mb-1">API Key de ElevenLabs (TTS)</label>
                  <input 
                    type="password" 
                    value={localSettings.elevenLabsApiKey}
                    onChange={(e) => setLocalSettings({...localSettings, elevenLabsApiKey: e.target.value})}
                    className="w-full p-2 border-2 border-stone-300 rounded-md bg-white focus:border-stone-500 focus:outline-none mb-3"
                    placeholder="sk_..."
                  />
                  
                  <div className="flex items-center justify-between mb-3">
                    <button 
                      onClick={checkApiUsage}
                      disabled={checkingUsage}
                      className="text-sm bg-stone-300 hover:bg-stone-400 text-stone-800 py-1 px-3 rounded flex items-center gap-1 transition disabled:opacity-50"
                    >
                      <Activity size={16} /> {checkingUsage ? 'Comprobando...' : 'Ver uso de API'}
                    </button>
                  </div>
                  
                  {apiUsage && (
                    <div className="mb-3 p-2 bg-green-100 border border-green-300 rounded text-sm text-green-800">
                      <strong>Uso:</strong> {apiUsage.count} / {apiUsage.limit} caracteres
                    </div>
                  )}
                  {usageError && (
                    <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded text-sm text-red-800">
                      {usageError}
                    </div>
                  )}

                  <div className="text-xs text-stone-600 space-y-2">
                    <p className="font-semibold text-stone-800 flex items-center gap-1">
                      <HelpCircle size={14} /> ¿Cómo obtener la API Key?
                    </p>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Crea una cuenta gratuita en ElevenLabs (límite de 10.000 caracteres/mes).</li>
                      <li>Accede a <a href="https://elevenlabs.io/app/developers/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">este enlace</a>.</li>
                      <li>Crea una nueva API Key y cópiala aquí.</li>
                    </ol>
                  </div>
                </div>

                <div className="bg-[#f3efe6] p-4 rounded-lg border border-stone-300 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-stone-800">Modo offline</p>
                      <p className="text-xs text-stone-600">
                        Descarga imagenes, textos, sonidos y narraciones para usar el juego sin internet.
                      </p>
                    </div>
                    <button
                      onClick={handleDownloadOffline}
                      disabled={offlineState.status === 'downloading'}
                      className="rounded-lg bg-stone-800 px-3 py-2 text-sm font-bold text-white transition hover:bg-stone-900 disabled:opacity-50"
                    >
                      {offlineState.status === 'downloading' ? 'Descargando...' : 'Descargar todo'}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="h-3 overflow-hidden rounded-full bg-stone-200">
                      <div
                        className="h-full bg-stone-700 transition-all"
                        style={{ width: `${offlineState.progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-stone-600">
                      <span>{offlineState.label}</span>
                      <span>{offlineState.progress}%</span>
                    </div>
                    <div className="text-xs text-stone-600">
                      <p>Datos base: {offlineState.coreReady ? 'listos' : 'pendientes'}</p>
                      <p>Narraciones descargadas: {offlineState.missionAudioCount} / {offlineState.totalMissionAudio}</p>
                      {offlineState.lastDownloadedAt && (
                        <p>Ultima descarga: {new Date(offlineState.lastDownloadedAt).toLocaleString()}</p>
                      )}
                    </div>
                    {downloadError && (
                      <div className="rounded border border-red-300 bg-red-100 p-2 text-xs text-red-800">
                        {downloadError}
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  onClick={handleSaveSettings}
                  className="w-full py-3 bg-stone-800 hover:bg-stone-900 text-white font-bold rounded-lg shadow-md transition"
                >
                  Guardar Ajustes
                </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Helper Dialog */}
      {renderInPortal(
        <AnimatePresence>
          {showHelper && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[2147483647] overflow-y-auto bg-black/60 p-3 sm:p-4"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="relative mx-auto my-4 w-full max-w-sm rounded-xl border-4 border-stone-400 bg-[#fffcf5] p-4 text-left shadow-2xl sm:my-8 sm:p-6 max-h-[calc(100vh-2rem)] overflow-y-auto"
              >
                <button
                  onClick={() => setShowHelper(false)}
                  className="sticky top-0 float-right ml-3 rounded-md bg-[#fffcf5] text-stone-500 hover:text-stone-800"
                >
                  <X size={24} />
                </button>
                <h2 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
                  <HelpCircle size={20} /> Guía del Arqueólogo
                </h2>
                <div className="space-y-3 text-stone-700 text-sm">
                  <p><strong>¿Cómo empezar?</strong> Pulsa "Jugar sin cuenta" para iniciar la aventura inmediatamente. Sigue las pistas para encontrar los objetos en el museo.</p>
                  <p><strong>¿Dónde se guarda?</strong> Tu progreso se guarda automáticamente en la memoria de este dispositivo (navegador). Puedes salir y volver más tarde.</p>
                  <p><strong>¿Cómo borrar?</strong> Si quieres empezar de cero, usa el texto rojo "Borrar datos" que aparece abajo a la izquierda en la pantalla principal.</p>
                  <p><strong>¿Voz misteriosa?</strong> Configura la API Key de ElevenLabs en los Ajustes (⚙️) para escuchar a nuestro arqueólogo narrador.</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  );
}
