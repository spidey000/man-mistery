import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Pickaxe, Map, Brush, Compass, Sparkles, TentTree, ArrowRight } from 'lucide-react';
import { SettingsAndHelper } from '../components/SettingsAndHelper';

interface Props {
  onGuest: () => void;
}

export function Welcome({ onGuest }: Props) {
  const [hasLocalData, setHasLocalData] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('man_quest_progress');
    if (saved) {
      setHasLocalData(true);
    }
  }, []);

  const handleDeleteData = () => {
    if (window.confirm("¿Estás seguro de que quieres borrar tu progreso y empezar de cero?")) {
      localStorage.removeItem('man_quest_progress');
      setHasLocalData(false);
    }
  };

  return (
    <div className="expedition-shell min-h-screen overflow-hidden px-4 py-5 sm:px-6 lg:px-10">
      <div className="topo-overlay" />

      <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between gap-4 rounded-full border border-[#f0bc5936] bg-[rgba(7,18,19,0.7)] px-4 py-3 shadow-[0_18px_45px_rgba(0,0,0,0.28)] backdrop-blur md:px-6">
        <div className="flex items-center gap-3 text-[#f5e6c8]">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#f0bc5942] bg-[rgba(240,188,89,0.12)]">
            <Compass size={18} />
          </div>
          <div>
            <p className="font-mono-expedition text-[10px] uppercase tracking-[0.35em] text-[#f0bc59]">Campamento Base</p>
            <span className="font-display text-lg tracking-[0.08em] text-[#f7ecd2] sm:text-xl">Expedicion MAN</span>
          </div>
        </div>
        <SettingsAndHelper />
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-6.5rem)] w-full max-w-7xl items-center py-8 sm:py-10">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
          <motion.section
            initial={{ opacity: 0, x: -30, rotate: -2 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            className="relative overflow-hidden rounded-[2rem] border border-[#f0bc5936] bg-[linear-gradient(180deg,rgba(8,24,26,0.72),rgba(9,19,20,0.9))] p-6 shadow-[0_35px_90px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:p-8 lg:p-10"
          >
            <div className="absolute -left-14 top-10 h-40 w-40 rounded-full bg-[rgba(240,188,89,0.14)] blur-3xl" />
            <div className="absolute bottom-0 right-0 h-52 w-52 rounded-full bg-[rgba(19,111,99,0.22)] blur-3xl" />

            <div className="relative flex flex-wrap items-center gap-3">
              <span className="expedition-badge inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em]">
                <Sparkles size={14} /> Modo exploracion
              </span>
              <span className="expedition-badge inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em]">
                <Map size={14} /> Museo Arqueologico Nacional
              </span>
            </div>

            <div className="relative mt-8 max-w-2xl">
              <p className="font-mono-expedition text-xs uppercase tracking-[0.45em] text-[#f0bc59] sm:text-sm">Bitacora 01 · Caida del sol</p>
              <h1 className="font-display mt-4 text-5xl leading-none text-[#f7ecd2] sm:text-6xl lg:text-7xl">
                La aventura empieza cuando el museo guarda silencio.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-[#d8ddcf] sm:text-lg">
                Entra en el campamento de investigacion, sigue las notas del profesor Ardanza y descubre reliquias escondidas entre galerias, mapas y pistas antiguas.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { icon: Pickaxe, title: 'Excava pistas', text: 'Cada sala es una ruta nueva con objetos y enigmas reales del MAN.' },
                { icon: Brush, title: 'Limpia reliquias', text: 'Las ayudas aparecen como notas de campo para no romper la inmersion.' },
                { icon: TentTree, title: 'Vuelve al campamento', text: 'Tu progreso local queda listo para retomar la expedicion cuando quieras.' }
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-[1.4rem] border border-[#f5e6c824] bg-[rgba(245,230,200,0.08)] p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <Icon size={20} className="text-[#f0bc59]" />
                  <h2 className="mt-3 text-sm font-black uppercase tracking-[0.2em] text-[#f7ecd2]">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#d4d8cb]">{text}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-[#d8ddcf]">
              <span className="font-mono-expedition rounded-full border border-[#f5e6c822] px-3 py-2 uppercase tracking-[0.25em]">Pistas narradas</span>
              <span className="font-mono-expedition rounded-full border border-[#f5e6c822] px-3 py-2 uppercase tracking-[0.25em]">Reto familiar</span>
              <span className="font-mono-expedition rounded-full border border-[#f5e6c822] px-3 py-2 uppercase tracking-[0.25em]">Objetos autenticos</span>
            </div>
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, x: 34, rotate: 2 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ duration: 0.65, delay: 0.08, ease: 'easeOut' }}
            className="relative"
          >
            <div className="absolute -top-6 right-6 rounded-full border border-[#f0bc5942] bg-[rgba(240,188,89,0.12)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#f5e6c8] shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
              Noche de exploracion
            </div>
            <div className="parchment-card relative rounded-[2rem] p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4 border-b border-[rgba(122,88,43,0.22)] pb-4">
                <div>
                  <p className="font-mono-expedition text-xs uppercase tracking-[0.28em] text-[#8a6330]">Orden de mision</p>
                  <h2 className="font-display mt-2 text-3xl text-[#1d2828]">Prepara tu equipo</h2>
                </div>
                <div className="flex items-center gap-3 text-[#7b613b]">
                  <Pickaxe size={26} />
                  <Map size={26} />
                  <Brush size={26} />
                </div>
              </div>

              <p className="mt-5 text-base leading-7 text-[#354342]">
                Bienvenido al campamento base. Necesitamos un explorador valiente para leer mapas, seguir diarios perdidos y revelar los secretos del pasado pieza a pieza.
              </p>

              <div className="mt-6 space-y-4">
          {hasLocalData ? (
                <button
              onClick={onGuest}
                  className="expedition-cta flex w-full items-center justify-between rounded-[1.25rem] px-5 py-4 text-left text-lg font-black shadow-[0_22px_40px_rgba(217,142,4,0.2)] transition hover:-translate-y-0.5"
            >
                  <span className="flex items-center gap-3">
                    <Pickaxe size={22} />
                    Continuar investigacion
                  </span>
                  <ArrowRight size={20} />
            </button>
          ) : (
                <button
              onClick={onGuest}
                  className="expedition-cta flex w-full items-center justify-between rounded-[1.25rem] px-5 py-4 text-left text-lg font-black shadow-[0_22px_40px_rgba(217,142,4,0.2)] transition hover:-translate-y-0.5"
            >
                  <span className="flex items-center gap-3">
                    <Compass size={22} />
                    Comenzar la travesia
                  </span>
                  <ArrowRight size={20} />
            </button>
          )}

                <button
            disabled
                  className="flex w-full items-center justify-center gap-3 rounded-[1.25rem] border border-[#9b7d4b55] bg-[rgba(148,112,52,0.1)] px-5 py-4 text-base font-bold text-[#7d6846] shadow-inner opacity-80"
          >
                  Guardado en la nube (proximamente)
          </button>
              </div>

              <div className="mt-6 rounded-[1.25rem] border border-[rgba(122,88,43,0.18)] bg-[rgba(255,255,255,0.35)] p-4 text-sm leading-6 text-[#4b4943]">
                <div className="flex items-center gap-2 font-mono-expedition text-[11px] uppercase tracking-[0.28em] text-[#8a6330]">
                  <Sparkles size={14} /> Consejo del profesor
                </div>
                <p className="mt-2">Activa la narracion en ajustes para escuchar las pistas como si fueran un diario de expedicion en plena noche.</p>
              </div>
            </div>
          </motion.aside>
        </div>
      </main>

      {hasLocalData && (
        <button
          onClick={handleDeleteData}
          className="fixed bottom-4 left-4 z-20 rounded-full border border-[#f25c5440] bg-[rgba(33,9,11,0.75)] px-4 py-2 text-sm font-bold text-[#f4a59f] shadow-[0_12px_25px_rgba(0,0,0,0.28)] backdrop-blur transition hover:border-[#f25c5480] hover:text-[#ffd7d3]"
        >
          Borrar progreso y reiniciar
        </button>
      )}
    </div>
  );
}
