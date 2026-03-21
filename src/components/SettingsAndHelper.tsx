import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Settings as SettingsIcon, HelpCircle, X, Activity } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useSettings } from '../contexts/SettingsContext';
import { deepgramDefaults, validateDeepgramApiKey } from '../services/deepgram';

export function SettingsAndHelper() {
  const {
    settings,
    setSettings,
    deepgramApiKey,
    setDeepgramApiKey,
    clearDeepgramApiKey,
    showSettings,
    setShowSettings,
    showHelper,
    setShowHelper
  } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [localApiKey, setLocalApiKey] = useState(deepgramApiKey);
  const [apiUsage, setApiUsage] = useState<{ count: number, limit: number } | null>(null);
  const [checkingUsage, setCheckingUsage] = useState(false);
  const [usageError, setUsageError] = useState('');
  const settingsDialogRef = useRef<HTMLDialogElement | null>(null);
  const helperDialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    setLocalSettings(settings);
    setLocalApiKey(deepgramApiKey);
    setUsageError('');
    setApiUsage(null);
  }, [settings, deepgramApiKey, showSettings]);

  useEffect(() => {
    const dialog = settingsDialogRef.current;
    if (!dialog) {
      return;
    }

    if (showSettings) {
      if (!dialog.open) {
        dialog.showModal();
      }
      return;
    }

    if (dialog.open) {
      dialog.close();
    }
  }, [showSettings]);

  useEffect(() => {
    const dialog = helperDialogRef.current;
    if (!dialog) {
      return;
    }

    if (showHelper) {
      if (!dialog.open) {
        dialog.showModal();
      }
      return;
    }

    if (dialog.open) {
      dialog.close();
    }
  }, [showHelper]);

  const handleSaveSettings = () => {
    setSettings(localSettings);
    setDeepgramApiKey(localApiKey.trim());
    setShowSettings(false);
  };

  const checkApiUsage = async () => {
    const apiKey = localApiKey.trim();

    if (!apiKey) {
      setUsageError('Introduce una API Key primero');
      return;
    }

    setCheckingUsage(true);
    setUsageError('');
    setApiUsage(null);

    try {
      const data = await validateDeepgramApiKey(apiKey);
      setApiUsage({ count: data.scopes.length, limit: data.scopes.length });
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

      {renderInPortal(
        <dialog
          ref={settingsDialogRef}
          onClose={() => setShowSettings(false)}
          onCancel={() => setShowSettings(false)}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setShowSettings(false);
            }
          }}
          className="m-0 h-screen max-h-none w-screen max-w-none overflow-y-auto border-0 bg-transparent p-3 backdrop:bg-black/60 sm:p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative mx-auto my-4 w-full max-w-md rounded-xl border-4 border-stone-400 bg-[#fffcf5] p-6 text-left shadow-2xl sm:my-8 max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => setShowSettings(false)}
              className="absolute top-3 right-3 text-stone-500 hover:text-stone-800"
            >
              <X size={24} />
            </button>
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-stone-800">
              <SettingsIcon size={24} /> Ajustes
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-bold text-stone-700">Nombre del nino/a</label>
                <input
                  type="text"
                  value={localSettings.childName}
                  onChange={(e) => setLocalSettings({ ...localSettings, childName: e.target.value })}
                  className="w-full rounded-md border-2 border-stone-300 bg-white p-2 focus:border-stone-500 focus:outline-none"
                  placeholder="Ej: Leo"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-stone-700">Edad</label>
                <input
                  type="number"
                  value={localSettings.childAge}
                  onChange={(e) => setLocalSettings({ ...localSettings, childAge: e.target.value })}
                  className="w-full rounded-md border-2 border-stone-300 bg-white p-2 focus:border-stone-500 focus:outline-none"
                  placeholder="Ej: 8"
                />
              </div>

              <div className="rounded-lg border border-stone-300 bg-stone-100 p-4">
                <label className="mb-1 block text-sm font-bold text-stone-700">API Key de Deepgram (TTS)</label>
                <input
                  type="password"
                  value={localApiKey}
                  onChange={(e) => setLocalApiKey(e.target.value)}
                  className="mb-3 w-full rounded-md border-2 border-stone-300 bg-white p-2 focus:border-stone-500 focus:outline-none"
                  placeholder="dg_..."
                  autoComplete="off"
                />

                <div className="mb-3 rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  La API Key solo se guarda en esta pestana y se borra al cerrar la pestana.
                </div>

                <div className="mb-3 rounded border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
                  Voz por defecto: <strong>{deepgramDefaults.model}</strong><br />
                  Idioma: <strong>{deepgramDefaults.language}</strong><br />
                  Acento: <strong>{deepgramDefaults.accent}</strong>
                </div>

                <div className="mb-3 flex items-center justify-between">
                  <button
                    onClick={checkApiUsage}
                    disabled={checkingUsage}
                    className="flex items-center gap-1 rounded bg-stone-300 px-3 py-1 text-sm text-stone-800 transition hover:bg-stone-400 disabled:opacity-50"
                  >
                    <Activity size={16} /> {checkingUsage ? 'Comprobando...' : 'Validar API Key'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLocalApiKey('');
                      clearDeepgramApiKey();
                      setApiUsage(null);
                      setUsageError('API Key borrada de esta sesion');
                    }}
                    className="rounded border border-stone-300 bg-white px-3 py-1 text-sm text-stone-700 transition hover:bg-stone-100"
                  >
                    Olvidarla
                  </button>
                </div>

                {apiUsage && (
                  <div className="mb-3 rounded border border-green-300 bg-green-100 p-2 text-sm text-green-800">
                    <strong>API Key valida.</strong> Scopes detectados: {apiUsage.count}
                  </div>
                )}
                {usageError && (
                  <div className="mb-3 rounded border border-red-300 bg-red-100 p-2 text-sm text-red-800">
                    {usageError}
                  </div>
                )}

                <div className="space-y-2 text-xs text-stone-600">
                  <p className="flex items-center gap-1 font-semibold text-stone-800">
                    <HelpCircle size={14} /> Como obtener la API Key?
                  </p>
                  <ol className="list-decimal space-y-1 pl-4">
                    <li>Crea una cuenta en Deepgram y entra en la consola.</li>
                    <li>Abre <a href="https://console.deepgram.com/project/api-keys" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">Project API Keys</a>.</li>
                    <li>Crea una API Key con permiso para TTS y copiala aqui.</li>
                    <li>La narracion usa la voz <strong>{deepgramDefaults.model}</strong> en espanol de Espana peninsular.</li>
                    <li>La app la envia por HTTPS al proxy y no la guarda en almacenamiento permanente.</li>
                  </ol>
                </div>
              </div>

              <button
                onClick={handleSaveSettings}
                className="w-full rounded-lg bg-stone-800 py-3 font-bold text-white shadow-md transition hover:bg-stone-900"
              >
                Guardar Ajustes
              </button>
            </div>
          </motion.div>
        </dialog>
      )}

      {renderInPortal(
        <dialog
          ref={helperDialogRef}
          onClose={() => setShowHelper(false)}
          onCancel={() => setShowHelper(false)}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setShowHelper(false);
            }
          }}
          className="m-0 h-screen max-h-none w-screen max-w-none overflow-y-auto border-0 bg-transparent p-3 backdrop:bg-black/60 sm:p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative mx-auto my-4 w-full max-w-sm rounded-xl border-4 border-stone-400 bg-[#fffcf5] p-6 text-left shadow-2xl"
          >
            <button
              onClick={() => setShowHelper(false)}
              className="absolute top-3 right-3 text-stone-500 hover:text-stone-800"
            >
              <X size={24} />
            </button>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-stone-800">
              <HelpCircle size={20} /> Guia del Arqueologo
            </h2>
            <div className="space-y-3 text-sm text-stone-700">
              <p><strong>Como empezar?</strong> Pulsa "Jugar sin cuenta" para iniciar la aventura inmediatamente. Sigue las pistas para encontrar los objetos en el museo.</p>
              <p><strong>Donde se guarda?</strong> Tu progreso se guarda automaticamente en la memoria de este dispositivo (navegador). Puedes salir y volver mas tarde.</p>
              <p><strong>Como borrar?</strong> Si quieres empezar de cero, usa el texto rojo "Borrar datos" que aparece abajo a la izquierda en la pantalla principal.</p>
               <p><strong>Voz misteriosa?</strong> Configura la API Key de Deepgram en los Ajustes (⚙️) para escuchar a nuestro arqueologo narrador con voz en espanol de Espana.</p>
            </div>
          </motion.div>
        </dialog>
      )}
    </>
  );
}
