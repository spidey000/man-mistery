import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Pickaxe, Map, Brush } from 'lucide-react';

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
    <div className="min-h-screen bg-[#f4f1ea] flex flex-col items-center justify-center p-6 text-center font-sans relative overflow-hidden">
      {/* Decorative background elements */}
      <div 
        className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(#8a7350 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}
      ></div>

      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-[#fffcf5] rounded-xl shadow-2xl p-8 border-4 border-stone-400 relative z-10"
      >
        <div className="flex justify-center mb-6 space-x-4 text-stone-600">
          <Pickaxe size={48} />
          <Map size={48} />
          <Brush size={48} />
        </div>
        
        <h1 className="text-4xl font-extrabold text-stone-800 mb-4 tracking-tight uppercase">
          Expedición MAN
        </h1>
        
        <p className="text-lg text-stone-600 mb-8 font-medium">
          ¡Bienvenido al campamento base del Museo Arqueológico Nacional! 
          <br/><br/>
          Coge tu pincel y tu lupa. Necesitamos un arqueólogo valiente para desenterrar los secretos del pasado.
        </p>
        
        <div className="space-y-4">
          {hasLocalData ? (
            <button 
              onClick={onGuest}
              className="w-full py-4 bg-green-700 hover:bg-green-800 text-white text-xl font-bold rounded-lg shadow-md transform transition active:scale-95 flex items-center justify-center gap-3 border-b-4 border-green-900"
            >
              <Pickaxe size={24} />
              Continuar investigación
            </button>
          ) : (
            <button 
              onClick={onGuest}
              className="w-full py-4 bg-stone-700 hover:bg-stone-800 text-white text-xl font-bold rounded-lg shadow-md transform transition active:scale-95 flex items-center justify-center gap-3 border-b-4 border-stone-900"
            >
              <Pickaxe size={24} />
              Jugar sin cuenta
            </button>
          )}

          <button 
            disabled
            className="w-full py-3 bg-stone-200 text-stone-400 text-lg font-bold rounded-lg shadow-sm flex items-center justify-center gap-3 border-2 border-stone-300 cursor-not-allowed"
          >
            Guardar en la nube (Próximamente)
          </button>
        </div>
      </motion.div>

      {/* Delete Data Button */}
      {hasLocalData && (
        <button 
          onClick={handleDeleteData}
          className="absolute bottom-4 left-4 z-20 text-red-600 font-bold text-sm hover:underline"
        >
          Borrar datos y reiniciar
        </button>
      )}
    </div>
  );
}
