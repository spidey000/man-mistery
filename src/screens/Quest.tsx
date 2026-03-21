import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Key, Star, LogOut, HelpCircle, CheckCircle, XCircle, Volume2, Pickaxe, Brush, Search, Gem, Map as MapIcon, BookOpen, Loader2 } from 'lucide-react';
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
  const { settings } = useSettings();

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

    if (!settings.deepgramApiKey) {
      setAudioError('Configura la API Key en Ajustes (⚙️)');
      setTimeout(() => setAudioError(''), 3000);
      return;
    }

    setIsPlayingAudio(true);
    setAudioError('');

    try {
      const greeting = settings.childName ? `¡Atención, ${settings.childName}! ` : '¡Atención, explorador! ';
      
      const promptText = `${greeting} Escucha con atención el diario del profesor Ardanza...
"${currentObject.lore_text}"
... Ahora, tu misión es la siguiente: ${currentObject.action_prompt}`;
      
      const audioUrl = await generateTTS(promptText, settings.deepgramApiKey);
      
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
    return <div className="min-h-screen flex items-center justify-center bg-[#f4f1ea] text-stone-700 font-bold text-xl">Desenterrando pistas...</div>;
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-[#f4f1ea] flex flex-col items-center justify-center p-6 text-center">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#8a7350 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-[#fffcf5] rounded-xl shadow-2xl p-8 border-4 border-stone-400 relative z-10"
        >
          <Gem size={64} className="text-stone-700 mx-auto mb-6" />
          <h1 className="text-4xl font-extrabold text-stone-800 mb-4 uppercase">¡Excavación Completada!</h1>
          <p className="text-lg text-stone-600 mb-8 font-medium">
            ¡Has encontrado todos los artefactos y revelado los secretos del pasado! Eres un verdadero Arqueólogo Experto.
          </p>
          <div className="grid grid-cols-4 gap-3 mb-8">
            {unlockedBadges.map((id, i) => (
              <div key={i} className="bg-stone-200 rounded-lg p-2 flex items-center justify-center border-2 border-stone-300">
                <Gem className="text-stone-600" size={24} />
              </div>
            ))}
          </div>
          <button 
            onClick={handleExit}
            className="w-full py-4 bg-stone-700 hover:bg-stone-800 text-white text-xl font-bold rounded-lg shadow-md border-b-4 border-stone-900"
          >
            Volver al campamento
          </button>
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
    <div className="min-h-screen bg-[#f4f1ea] flex flex-col font-sans relative">
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#8a7350 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>
      
      {/* Header */}
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b-4 border-stone-900 bg-stone-800 p-4 text-stone-100 shadow-md">
        <div className="flex items-center gap-2">
          <Pickaxe size={24} />
          <span className="font-bold text-lg">Arqueólogo: Invitado</span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <SettingsAndHelper />
          <span className="rounded-md border border-stone-600 bg-stone-700 px-3 py-1 text-sm font-bold">
            {currentStep + 1} / {objects.length}
          </span>
          <button onClick={handleExit} className="rounded-md p-2 transition hover:bg-stone-700" aria-label="Salir de la expedicion">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 flex flex-col items-center justify-center max-w-lg mx-auto w-full relative z-10">
        
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div 
              key="success"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="bg-[#e8f0e1] border-4 border-green-600 rounded-xl p-6 text-center w-full shadow-xl flex flex-col items-center"
            >
              <CheckCircle size={64} className="text-green-600 mx-auto mb-2" />
              <h2 className="text-2xl font-extrabold text-green-800 mb-4 uppercase">¡Hallazgo Correcto!</h2>
              
              <div className="bg-white rounded-lg p-4 shadow-inner mb-6 w-full border-2 border-green-200">
                <h3 className="text-xl font-bold text-stone-800 mb-3">{currentObject.name}</h3>
                {currentObject.image_url && (
                  <img 
                    src={currentObject.image_url} 
                    alt={currentObject.name} 
                    className="w-full h-48 object-cover rounded-md mb-4 border border-stone-200"
                    referrerPolicy="no-referrer"
                  />
                )}
                <p className="text-stone-700 text-md font-medium leading-relaxed">
                  {currentObject.success_description}
                </p>
              </div>

              <button 
                onClick={handleNextStep}
                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white text-xl font-bold rounded-lg shadow-md transition active:scale-95 border-b-4 border-green-800"
              >
                Siguiente Misterio
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="quest"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              className="bg-[#fffcf5] rounded-xl shadow-xl w-full overflow-hidden border-4 border-stone-400"
            >
              <div className="bg-stone-200 p-6 text-center relative border-b-2 border-stone-300">
                <h2 className="text-sm font-bold text-stone-600 uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
                  <MapIcon size={16} /> {currentObject.room}
                </h2>
                <h1 className="text-2xl font-extrabold text-stone-800">
                  Misterio {currentStep + 1}
                </h1>
                <div className="absolute top-4 right-4 flex flex-col items-end">
                  <button 
                    onClick={playAudioHint}
                    disabled={isPlayingAudio && !audioRef.current}
                    className={`p-3 rounded-md transition shadow-sm flex items-center justify-center ${isPlayingAudio ? 'bg-stone-800 text-stone-100 hover:bg-stone-900' : 'bg-stone-300 text-stone-700 hover:bg-stone-400'}`}
                    title={isPlayingAudio ? "Detener narración" : "Escuchar narración"}
                  >
                    {isPlayingAudio && !audioRef.current ? (
                      <Loader2 size={24} className="animate-spin" />
                    ) : (
                      <Volume2 size={24} className={isPlayingAudio ? 'animate-pulse' : ''} />
                    )}
                  </button>
                  {audioError && (
                    <span className="text-xs text-red-600 font-bold mt-1 max-w-[120px] text-right bg-red-100 p-1 rounded">
                      {audioError}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6">
                <div className="bg-[#f0eade] border-l-4 border-stone-600 p-5 rounded-r-lg mb-6 shadow-inner space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                      <BookOpen size={16} /> El Diario de Ardanza
                    </h3>
                    <p className="text-stone-800 text-md italic leading-relaxed">
                      "{currentObject.lore_text}"
                    </p>
                  </div>
                  <div className="bg-white/60 p-4 rounded-md border border-stone-300">
                    <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Search size={16} /> Tu Misión
                    </h3>
                    <p className="text-stone-900 font-medium text-lg leading-relaxed">
                      {currentObject.action_prompt}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-stone-800 font-bold mb-2 text-lg">
                      Respuesta esperada: <span className="text-stone-500 font-normal text-base">{currentObject.expected_format}</span>
                    </label>
                    <input 
                      type="text" 
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      className={`w-full text-xl p-4 border-4 rounded-lg outline-none transition ${isError ? 'border-red-400 bg-red-50' : 'border-stone-300 focus:border-stone-600 bg-white'}`}
                      placeholder="Escribe aquí..."
                      autoComplete="off"
                    />
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={!answer.trim()}
                    className="w-full py-4 bg-stone-700 hover:bg-stone-800 disabled:bg-stone-300 disabled:text-stone-500 text-white text-xl font-bold rounded-lg shadow-md transition active:scale-95 border-b-4 border-stone-900 disabled:border-stone-400"
                  >
                    Examinar
                  </button>
                </form>

                {hintLevel > 0 && currentHint && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 bg-[#fdfbf7] p-4 rounded-lg border-2 border-stone-300 flex gap-3 items-start"
                  >
                    <Brush className="text-stone-600 shrink-0 mt-1" size={24} />
                    <div className="flex-1">
                      <h4 className="font-bold text-stone-700 text-sm uppercase">Pista {hintLevel}/5</h4>
                      <p className="text-stone-800 font-medium">{currentHint}</p>
                    </div>
                  </motion.div>
                )}

                <div className="mt-4 text-center">
                  <button 
                    type="button"
                    onClick={() => setHintLevel(prev => Math.min(prev + 1, 5))}
                    disabled={hintLevel >= 5}
                    className="text-stone-600 font-bold underline text-sm hover:text-stone-800 disabled:opacity-50 disabled:no-underline"
                  >
                    {hintLevel === 0 ? "Pedir una pista" : hintLevel < 5 ? "Pedir otra pista" : "No hay más pistas"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
