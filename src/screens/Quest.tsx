import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, CheckCircle, Volume2, Pickaxe, Brush, Search, Gem, Map as MapIcon, Loader2, Compass, Sparkles, ScrollText, ArrowRight, Headphones, NotebookPen } from 'lucide-react';
import objectsData from '../data/man_exposicion_permanente_objetos.json';
import { useSettings } from '../contexts/SettingsContext';
import { generateTTS } from '../services/deepgram';
import { SettingsAndHelper } from '../components/SettingsAndHelper';

interface Props {
  onExit: () => void;
}

export function Quest({ onExit }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState('');
  const [hintLevel, setHintLevel] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioError, setAudioError] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { settings, deepgramApiKey } = useSettings();

  const objects = objectsData.objects;

  useEffect(() => {
    const saved = localStorage.getItem('man_quest_progress');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setCurrentStep(data.currentStep || 0);
        setCompleted(data.completed || false);
        setUnlockedBadges(data.unlockedBadges || []);
      } catch (e) {
        console.error("Error parsing local progress", e);
      }
    }
    setLoading(false);
  }, []);

  const normalizeAnswer = (text: string) => {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  };

  const currentObject = objects[currentStep];
  const progressPercent = objects.length > 0 ? ((currentStep + 1) / objects.length) * 100 : 0;

  const buildPromptText = (object: typeof currentObject) => {
    if (!object) {
      return '';
    }

    const greeting = settings.childName ? `¡Atención, ${settings.childName}! ` : '¡Atención, explorador! ';

    return `${greeting} Escucha con atención el diario del profesor Ardanza...
"${object.lore_text}"
... Ahora, tu misión es la siguiente: ${object.action_prompt}`;
  };

  const preloadNarration = (object: typeof currentObject) => {
    if (!deepgramApiKey || !object) {
      return;
    }

    generateTTS(buildPromptText(object), deepgramApiKey).catch((error) => {
      console.warn('No se pudo precargar una narracion', error);
    });
  };

  useEffect(() => {
    preloadNarration(currentObject);
    preloadNarration(objects[currentStep + 1]);
  }, [currentStep, deepgramApiKey, objects, settings.childName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentObject) return;

    const normalizedInput = normalizeAnswer(answer);
    const isCorrect = currentObject.possible_answers.some(
      (ans) => normalizeAnswer(ans.value) === normalizedInput
    );

    if (isCorrect) {
      setIsSuccess(true);
      setIsError(false);
      setHintLevel(0);
      
      // Play success sound
      const audio = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=success-1-6297.mp3');
      audio.play().catch(() => {});
    } else {
      setIsError(true);
      setHintLevel(prev => Math.min(prev + 1, 5));
      setTimeout(() => setIsError(false), 1500);
    }
  };

  const handleNextStep = async () => {
    if (!currentObject) return;
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlayingAudio(false);
    setAudioError('');

    const nextStep = currentStep + 1;
    const isFinished = nextStep >= objects.length;
    const newBadges = [...unlockedBadges, currentObject.id];
    
    localStorage.setItem('man_quest_progress', JSON.stringify({
      currentStep: nextStep,
      completed: isFinished,
      unlockedBadges: newBadges
    }));
    setCurrentStep(nextStep);
    setCompleted(isFinished);
    setUnlockedBadges(newBadges);
    
    setAnswer('');
    setIsSuccess(false);
  };

  const playAudioHint = async () => {
    if (!currentObject) return;
    
    if (isPlayingAudio) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlayingAudio(false);
      return;
    }

    if (!deepgramApiKey) {
      setAudioError('Configura la API Key en Ajustes para esta sesion (⚙️)');
      setTimeout(() => setAudioError(''), 3000);
      return;
    }

    setIsPlayingAudio(true);
    setAudioError('');

    try {
      const promptText = buildPromptText(currentObject);
      const audioUrl = await generateTTS(promptText, deepgramApiKey);
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPlayingAudio(false);
        audioRef.current = null;
      };
      
      await audio.play();
    } catch (error: any) {
      console.error("Error playing audio:", error);
      setAudioError(error.message || 'Error al generar el audio');
      setIsPlayingAudio(false);
      setTimeout(() => setAudioError(''), 3000);
    }
  };

  const handleExit = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    onExit();
  };

  if (loading) {
    return <div className="expedition-shell flex min-h-screen items-center justify-center px-6 text-center text-[#f7ecd2]"><div className="topo-overlay" /><div className="expedition-panel rounded-[1.8rem] px-8 py-6 text-xl font-bold shadow-[0_28px_60px_rgba(0,0,0,0.35)]">Desenterrando pistas...</div></div>;
  }

  if (completed) {
    return (
      <div className="expedition-shell flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 text-center sm:px-6">
        <div className="topo-overlay" />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="expedition-panel relative z-10 w-full max-w-2xl overflow-hidden rounded-[2.2rem] border border-[#f0bc5942] p-8 text-[#f7ecd2] shadow-[0_40px_120px_rgba(0,0,0,0.42)] sm:p-10"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(240,188,89,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(19,111,99,0.18),transparent_30%)]" />
          <div className="relative">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-[#f0bc5957] bg-[rgba(240,188,89,0.14)] shadow-[0_0_40px_rgba(217,142,4,0.22)]">
              <Gem size={44} className="text-[#f0bc59]" />
            </div>
            <p className="font-mono-expedition mt-6 text-xs uppercase tracking-[0.38em] text-[#f0bc59]">Expedicion completada</p>
            <h1 className="font-display mt-3 text-5xl text-[#f7ecd2]">Camara final revelada</h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-[#dbe2d3]">
              Has encontrado todos los artefactos y unido las notas del pasado. El museo ya te reconoce como arqueologo experto de esta expedicion.
          </p>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {unlockedBadges.map((id, i) => (
                <div key={id} className="rounded-[1.2rem] border border-[#f5e6c824] bg-[rgba(245,230,200,0.08)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <Gem className="mx-auto text-[#f0bc59]" size={24} />
                  <p className="mt-2 font-mono-expedition text-[10px] uppercase tracking-[0.22em] text-[#d7d9cd]">Reliquia {i + 1}</p>
                </div>
              ))}
            </div>

            <button
              onClick={handleExit}
              className="expedition-cta mt-8 inline-flex w-full items-center justify-center gap-3 rounded-[1.25rem] px-5 py-4 text-lg font-black transition hover:-translate-y-0.5"
            >
              <Compass size={20} /> Volver al campamento
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!currentObject) return null;

  let currentHint = "";
  if (hintLevel === 1) currentHint = currentObject.hint_ladder_template.hint_1;
  else if (hintLevel === 2) currentHint = currentObject.hint_ladder_template.hint_2;
  else if (hintLevel === 3) currentHint = currentObject.hint_ladder_template.hint_3;
  else if (hintLevel === 4) currentHint = currentObject.hint_ladder_template.hint_4;
  else if (hintLevel >= 5) currentHint = currentObject.hint_ladder_template.hint_5;

  return (
    <div className="expedition-shell min-h-screen overflow-hidden">
      <div className="topo-overlay" />

      <header className="relative z-10 mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 text-[#f5e6c8]">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#f0bc5940] bg-[rgba(240,188,89,0.12)]">
            <Pickaxe size={20} />
          </div>
          <div>
            <p className="font-mono-expedition text-[10px] uppercase tracking-[0.35em] text-[#f0bc59]">Explorador activo</p>
            <p className="font-display text-2xl text-[#f7ecd2]">Arqueologo invitado</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="rounded-full border border-[#f5e6c824] bg-[rgba(245,230,200,0.08)] px-4 py-2 text-right shadow-[0_12px_30px_rgba(0,0,0,0.2)]">
            <p className="font-mono-expedition text-[10px] uppercase tracking-[0.28em] text-[#f0bc59]">Ruta</p>
            <p className="text-sm font-semibold text-[#f3eddc]">{currentStep + 1} / {objects.length}</p>
          </div>
          <SettingsAndHelper />
          <button onClick={handleExit} className="expedition-ghost inline-flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-[rgba(245,230,200,0.14)]" aria-label="Salir de la expedicion">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-7xl gap-6 px-4 pb-8 sm:px-6 lg:grid-cols-[290px_minmax(0,1fr)] lg:px-8">
        <aside className="expedition-panel h-fit rounded-[2rem] p-5 text-[#f5e6c8] shadow-[0_28px_70px_rgba(0,0,0,0.34)] lg:sticky lg:top-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono-expedition text-[10px] uppercase tracking-[0.32em] text-[#f0bc59]">Mapa nocturno</p>
              <h2 className="font-display mt-2 text-3xl">Ruta de sala</h2>
            </div>
            <MapIcon className="text-[#f0bc59]" size={24} />
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-[rgba(245,230,200,0.12)]">
            <div className="h-full rounded-full bg-[linear-gradient(90deg,#f0bc59,#d98e04)]" style={{ width: `${progressPercent}%` }} />
          </div>

          <div className="mt-6 space-y-3">
            {objects.map((object, index) => {
              const state = index < currentStep ? 'done' : index === currentStep ? 'current' : 'next';
              return (
                <div
                  key={object.id}
                  className={`rounded-[1.2rem] border px-4 py-3 transition ${state === 'done' ? 'border-[#f0bc5957] bg-[rgba(240,188,89,0.14)] text-[#f5e6c8]' : state === 'current' ? 'border-[#59b4a5] bg-[rgba(19,111,99,0.2)] text-white shadow-[0_0_30px_rgba(19,111,99,0.18)]' : 'border-[#f5e6c81c] bg-[rgba(245,230,200,0.06)] text-[#d8ddcf]'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-black ${state === 'done' ? 'border-[#f0bc59] bg-[rgba(240,188,89,0.2)] text-[#f0bc59]' : state === 'current' ? 'border-[#7be0cf] bg-[rgba(9,33,31,0.45)] text-[#d9fff7]' : 'border-[#f5e6c82a] bg-[rgba(255,255,255,0.03)] text-[#d8ddcf]'}`}>
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono-expedition text-[10px] uppercase tracking-[0.22em] text-inherit/80">{state === 'done' ? 'Resuelta' : state === 'current' ? 'En curso' : 'Pendiente'}</p>
                      <p className="mt-1 text-sm font-semibold leading-5">{object.room}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-[1.4rem] border border-[#f5e6c824] bg-[rgba(245,230,200,0.08)] p-4 text-sm leading-6 text-[#d8ddcf]">
            <div className="flex items-center gap-2 text-[#f0bc59]"><Sparkles size={16} /><span className="font-mono-expedition text-[10px] uppercase tracking-[0.28em]">Consejo</span></div>
            <p className="mt-2">Usa las pistas poco a poco. La mejor exploracion combina observacion, lectura y un poco de intuicion.</p>
          </div>
        </aside>

        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.section
              key="success"
              initial={{ scale: 0.85, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: -16 }}
              className="expedition-panel relative overflow-hidden rounded-[2.2rem] border border-[#68c27d66] p-6 shadow-[0_35px_90px_rgba(0,0,0,0.36)] sm:p-8"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(98,179,111,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(240,188,89,0.18),transparent_30%)]" />
              <div className="relative flex flex-col items-center text-center text-[#eef7ee]">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#91de9e66] bg-[rgba(98,179,111,0.16)] shadow-[0_0_40px_rgba(98,179,111,0.18)]">
                  <CheckCircle size={40} className="text-[#9ee8ab]" />
                </div>
                <p className="font-mono-expedition mt-5 text-xs uppercase tracking-[0.32em] text-[#bce7c4]">Hallazgo confirmado</p>
                <h1 className="font-display mt-3 text-4xl text-white sm:text-5xl">{currentObject.name}</h1>
                <p className="mt-4 max-w-2xl text-base leading-8 text-[#deecdf] sm:text-lg">{currentObject.success_description}</p>

                <div className="parchment-card relative mt-8 w-full max-w-2xl rounded-[1.8rem] p-5 text-left sm:p-6">
                  <div className="flex items-center gap-3 text-[#8a6330]">
                    <NotebookPen size={18} />
                    <p className="font-mono-expedition text-[10px] uppercase tracking-[0.28em]">Registro de reliquia</p>
                  </div>
                  {currentObject.image_url && (
                    <img
                      src={currentObject.image_url}
                      alt={currentObject.name}
                      className="mt-4 h-56 w-full rounded-[1.25rem] border border-[rgba(122,88,43,0.18)] object-cover shadow-[0_18px_30px_rgba(0,0,0,0.18)]"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <p className="mt-4 text-sm leading-7 text-[#364241]">La expedicion anota el descubrimiento y abre una nueva camara para seguir investigando.</p>
                </div>

                <button
                  onClick={handleNextStep}
                  className="expedition-cta mt-8 inline-flex w-full max-w-md items-center justify-center gap-3 rounded-[1.25rem] px-5 py-4 text-lg font-black transition hover:-translate-y-0.5"
                >
                  <ArrowRight size={20} /> Siguiente misterio
                </button>
              </div>
            </motion.section>
          ) : (
            <motion.section
              key="quest"
              initial={{ opacity: 0, x: 36 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -36 }}
              className="grid gap-6"
            >
              <section className="expedition-panel overflow-hidden rounded-[2.2rem] border border-[#f0bc5940] shadow-[0_35px_90px_rgba(0,0,0,0.36)]">
                <div className="border-b border-[#f5e6c818] bg-[linear-gradient(135deg,rgba(240,188,89,0.08),rgba(19,111,99,0.08))] px-6 py-6 sm:px-8">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-[#f5e6c824] bg-[rgba(245,230,200,0.08)] px-3 py-1.5 text-[#f0bc59]">
                        <Compass size={14} />
                        <span className="font-mono-expedition text-[10px] uppercase tracking-[0.28em]">{currentObject.room}</span>
                      </div>
                      <h1 className="font-display mt-4 text-4xl text-[#f7ecd2] sm:text-5xl">Misterio {currentStep + 1}</h1>
                      <p className="mt-3 max-w-2xl text-base leading-8 text-[#d8ddcf]">Sigue el rastro del diario de Ardanza y examina el entorno antes de responder.</p>
                    </div>

                    <div className="flex flex-col items-start gap-2 lg:items-end">
                      <button
                        onClick={playAudioHint}
                        disabled={isPlayingAudio && !audioRef.current}
                        className={`inline-flex items-center gap-3 rounded-full border px-4 py-3 text-sm font-semibold transition ${isPlayingAudio ? 'border-[#f0bc5966] bg-[rgba(240,188,89,0.16)] text-[#f7ecd2]' : 'border-[#f5e6c824] bg-[rgba(245,230,200,0.08)] text-[#f5e6c8] hover:bg-[rgba(245,230,200,0.14)]'}`}
                        title={isPlayingAudio ? 'Detener narracion' : 'Escuchar narracion'}
                      >
                        {isPlayingAudio && !audioRef.current ? <Loader2 size={18} className="animate-spin" /> : <Headphones size={18} className={isPlayingAudio ? 'animate-pulse' : ''} />}
                        {isPlayingAudio ? 'Detener narracion' : 'Escuchar pista narrada'}
                      </button>
                      {audioError && <span className="rounded-full border border-[#f25c5448] bg-[rgba(68,16,18,0.82)] px-3 py-1 text-xs font-semibold text-[#ffc4bf]">{audioError}</span>}
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 p-6 sm:p-8 xl:grid-cols-[1.05fr_0.95fr]">
                  <div className="parchment-card relative rounded-[1.8rem] p-5 sm:p-6">
                    <div className="flex items-center gap-2 text-[#8a6330]">
                      <ScrollText size={18} />
                      <p className="font-mono-expedition text-[10px] uppercase tracking-[0.3em]">Diario de Ardanza</p>
                    </div>
                    <p className="mt-4 text-base leading-8 text-[#2d3a39] sm:text-lg">
                      "{currentObject.lore_text}"
                    </p>
                  </div>

                  <div className="rounded-[1.8rem] border border-[#f5e6c824] bg-[rgba(245,230,200,0.08)] p-5 text-[#f5e6c8] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-6">
                    <div className="flex items-center gap-2 text-[#f0bc59]">
                      <Search size={18} />
                      <p className="font-mono-expedition text-[10px] uppercase tracking-[0.3em]">Tu mision</p>
                    </div>
                    <p className="mt-4 text-lg font-semibold leading-8 text-[#f4efdd]">{currentObject.action_prompt}</p>
                    <div className="mt-6 rounded-[1.25rem] border border-[#f5e6c81f] bg-[rgba(8,20,21,0.3)] p-4">
                      <div className="flex items-center gap-2 text-[#f0bc59]">
                        <Brush size={16} />
                        <span className="font-mono-expedition text-[10px] uppercase tracking-[0.28em]">Formato esperado</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[#dce1d5]">{currentObject.expected_format}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="expedition-panel rounded-[2.2rem] border border-[#f5e6c822] p-6 shadow-[0_35px_90px_rgba(0,0,0,0.36)] sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="mb-3 block font-mono-expedition text-xs uppercase tracking-[0.3em] text-[#f0bc59]">
                      Registro de respuesta
                    </label>
                    <div className={`flex items-center gap-3 rounded-[1.5rem] border px-4 py-4 transition sm:px-5 ${isError ? 'border-[#f25c5466] bg-[rgba(72,18,20,0.72)]' : 'border-[#f5e6c826] bg-[rgba(245,230,200,0.08)] focus-within:border-[#f0bc5966] focus-within:bg-[rgba(245,230,200,0.12)]'}`}>
                      <Volume2 size={20} className={isError ? 'text-[#ffb3ad]' : 'text-[#f0bc59]'} />
                      <input
                        type="text"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        className="w-full bg-transparent text-lg text-[#f8f2e3] outline-none placeholder:text-[#bfc7b9]"
                        placeholder="Escribe tu hallazgo aqui..."
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="submit"
                      disabled={!answer.trim()}
                      className="expedition-cta inline-flex w-full items-center justify-center gap-3 rounded-[1.25rem] px-5 py-4 text-lg font-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
                    >
                      <Search size={20} /> Examinar reliquia
                    </button>
                    <button
                      type="button"
                      onClick={() => setHintLevel(prev => Math.min(prev + 1, 5))}
                      disabled={hintLevel >= 5}
                      className="expedition-ghost inline-flex w-full items-center justify-center gap-3 rounded-[1.25rem] px-5 py-4 text-base font-bold transition hover:bg-[rgba(245,230,200,0.14)] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <Brush size={18} /> {hintLevel === 0 ? 'Pedir una pista' : hintLevel < 5 ? 'Pedir otra pista' : 'Sin mas pistas'}
                    </button>
                  </div>
                </form>

                {hintLevel > 0 && currentHint && (
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="parchment-card relative mt-6 rounded-[1.8rem] p-5 sm:p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[rgba(122,88,43,0.2)] bg-[rgba(217,142,4,0.08)] text-[#8a6330]">
                        <Brush size={18} />
                      </div>
                      <div>
                        <p className="font-mono-expedition text-[10px] uppercase tracking-[0.3em] text-[#8a6330]">Pista {hintLevel}/5</p>
                        <p className="mt-2 text-base leading-7 text-[#31403f]">{currentHint}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </section>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
