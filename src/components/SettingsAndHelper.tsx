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
          className="inline-flex items-center justify-center rounded-full border border-[#f5e6c824] bg-[rgba(245,230,200,0.08)] p-2.5 text-[#f5e6c8] shadow-[0_12px_25px_rgba(0,0,0,0.2)] transition hover:bg-[rgba(245,230,200,0.14)]"
          title="Ajustes"
          aria-label="Abrir ajustes"
        >
          <SettingsIcon size={20} />
        </button>
        <button
          onClick={() => setShowHelper(true)}
          className="inline-flex items-center justify-center rounded-full border border-[#f5e6c824] bg-[rgba(245,230,200,0.08)] p-2.5 text-[#f5e6c8] shadow-[0_12px_25px_rgba(0,0,0,0.2)] transition hover:bg-[rgba(245,230,200,0.14)]"
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
          className="m-0 h-screen max-h-none w-screen max-w-none overflow-y-auto border-0 bg-transparent p-3 backdrop:bg-[rgba(2,8,9,0.72)] backdrop:backdrop-blur-sm sm:p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="expedition-panel relative mx-auto my-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[2rem] border border-[#f0bc5942] p-6 text-left text-[#f5e6c8] shadow-[0_35px_90px_rgba(0,0,0,0.4)] sm:my-8 sm:p-7"
          >
            <button
              onClick={() => setShowSettings(false)}
              className="absolute right-4 top-4 rounded-full border border-[#f5e6c824] bg-[rgba(245,230,200,0.08)] p-2 text-[#f5e6c8] transition hover:bg-[rgba(245,230,200,0.14)]"
            >
              <X size={24} />
            </button>
            <p className="font-mono-expedition mb-2 text-[10px] uppercase tracking-[0.32em] text-[#f0bc59]">Panel de campamento</p>
            <h2 className="font-display mb-5 flex items-center gap-2 text-3xl text-[#f7ecd2]">
              <SettingsIcon size={24} /> Ajustes
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-bold text-[#f5e6c8]">Nombre del nino/a</label>
                <input
                  type="text"
                  value={localSettings.childName}
                  onChange={(e) => setLocalSettings({ ...localSettings, childName: e.target.value })}
                  className="w-full rounded-2xl border border-[#f5e6c824] bg-[rgba(245,230,200,0.08)] p-3 text-[#fff8e8] placeholder:text-[#b8bdae] focus:border-[#f0bc59] focus:outline-none"
                  placeholder="Ej: Leo"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-[#f5e6c8]">Edad</label>
                <input
                  type="number"
                  value={localSettings.childAge}
                  onChange={(e) => setLocalSettings({ ...localSettings, childAge: e.target.value })}
                  className="w-full rounded-2xl border border-[#f5e6c824] bg-[rgba(245,230,200,0.08)] p-3 text-[#fff8e8] placeholder:text-[#b8bdae] focus:border-[#f0bc59] focus:outline-none"
                  placeholder="Ej: 8"
                />
              </div>

              <div className="rounded-[1.5rem] border border-[#f5e6c824] bg-[rgba(245,230,200,0.08)] p-4">
                <label className="mb-1 block text-sm font-bold text-[#f5e6c8]">API Key de Deepgram (TTS)</label>
                <input
                  type="password"
                  value={localApiKey}
                  onChange={(e) => setLocalApiKey(e.target.value)}
                  className="mb-3 w-full rounded-2xl border border-[#f5e6c824] bg-[rgba(8,20,21,0.38)] p-3 text-[#fff8e8] placeholder:text-[#b8bdae] focus:border-[#f0bc59] focus:outline-none"
                  placeholder="dg_..."
                  autoComplete="off"
                />

                <div className="mb-3 rounded-2xl border border-[#f0bc5940] bg-[rgba(240,188,89,0.12)] p-3 text-xs text-[#f5e6c8]">
                  La API Key solo se guarda en esta pestana y se borra al cerrar la pestana.
                </div>

                <div className="mb-3 rounded-2xl border border-[#59b4a552] bg-[rgba(19,111,99,0.18)] p-3 text-xs text-[#d9fff8]">
                  Voz por defecto: <strong>{deepgramDefaults.model}</strong><br />
                  Idioma: <strong>{deepgramDefaults.language}</strong><br />
                  Acento: <strong>{deepgramDefaults.accent}</strong>
                </div>

                <div className="mb-3 flex items-center justify-between">
                  <button
                    onClick={checkApiUsage}
                    disabled={checkingUsage}
                    className="flex items-center gap-1 rounded-full border border-[#f0bc5944] bg-[rgba(240,188,89,0.14)] px-3 py-2 text-sm text-[#f8e8c1] transition hover:bg-[rgba(240,188,89,0.2)] disabled:opacity-50"
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
                    className="rounded-full border border-[#f5e6c824] bg-[rgba(245,230,200,0.08)] px-3 py-2 text-sm text-[#f5e6c8] transition hover:bg-[rgba(245,230,200,0.14)]"
                  >
                    Olvidarla
                  </button>
                </div>

                {apiUsage && (
                  <div className="mb-3 rounded-2xl border border-[#68c27d55] bg-[rgba(98,179,111,0.16)] p-3 text-sm text-[#dbffe0]">
                    <strong>API Key valida.</strong> Scopes detectados: {apiUsage.count}
                  </div>
                )}
                {usageError && (
                  <div className="mb-3 rounded-2xl border border-[#f25c544d] bg-[rgba(78,21,24,0.7)] p-3 text-sm text-[#ffc7c2]">
                    {usageError}
                  </div>
                )}

                <div className="space-y-2 text-xs text-[#d5dacd]">
                  <p className="flex items-center gap-1 font-semibold text-[#f5e6c8]">
                    <HelpCircle size={14} /> Como obtener la API Key?
                  </p>
                  <ol className="list-decimal space-y-1 pl-4">
                    <li>Crea una cuenta en Deepgram y entra en la consola.</li>
                    <li>Abre <a href="https://console.deepgram.com/project/api-keys" target="_blank" rel="noopener noreferrer" className="font-medium text-[#f0bc59] hover:underline">Project API Keys</a>.</li>
                    <li>Crea una API Key con permiso para TTS y copiala aqui.</li>
                    <li>La narracion usa la voz <strong>{deepgramDefaults.model}</strong> en espanol de Espana peninsular.</li>
                    <li>La app la envia por HTTPS al proxy y no la guarda en almacenamiento permanente.</li>
                  </ol>
                </div>
              </div>

              <button
                onClick={handleSaveSettings}
                className="expedition-cta w-full rounded-[1.25rem] py-3 font-black transition hover:-translate-y-0.5"
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
          className="m-0 h-screen max-h-none w-screen max-w-none overflow-y-auto border-0 bg-transparent p-3 backdrop:bg-[rgba(2,8,9,0.72)] backdrop:backdrop-blur-sm sm:p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="expedition-panel relative mx-auto my-4 w-full max-w-md rounded-[2rem] border border-[#f0bc5942] p-6 text-left text-[#f5e6c8] shadow-[0_35px_90px_rgba(0,0,0,0.4)]"
          >
            <button
              onClick={() => setShowHelper(false)}
              className="absolute right-4 top-4 rounded-full border border-[#f5e6c824] bg-[rgba(245,230,200,0.08)] p-2 text-[#f5e6c8] transition hover:bg-[rgba(245,230,200,0.14)]"
            >
              <X size={24} />
            </button>
            <p className="font-mono-expedition mb-2 text-[10px] uppercase tracking-[0.32em] text-[#f0bc59]">Manual de expedicion</p>
            <h2 className="font-display mb-4 flex items-center gap-2 text-3xl text-[#f7ecd2]">
              <HelpCircle size={20} /> Guia del Arqueologo
            </h2>
            <div className="space-y-3 text-sm leading-7 text-[#d6dccf]">
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
