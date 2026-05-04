import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain, Settings } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function Pomodoro() {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [sessions, setSessions] = useState(0);

  const [settings, setSettings] = useState({
    workDuration: 25,
    shortBreak: 5,
    longBreak: 15,
    sessionsUntilLongBreak: 4
  });

  useEffect(() => {
    let interval: number | undefined;

    if (isActive) {
      interval = window.setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            handleTimerComplete();
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, minutes, seconds]);

  async function guardarSesionPomodoro(minutos: number) {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) return;

    const xpGanado = minutos * 2;

    const { error } = await supabase.from('sesiones_estudio').insert({
      usuario_id: user.id,
      materia: 'Pomodoro',
      materia_id: null,
      minutos,
      concentracion: 8,
      xp_ganado: xpGanado,
      origen: 'pomodoro'
    });

    if (error) {
      console.log(error);
      return;
    }

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!perfil) return;

    const nuevoXP = (perfil.xp || 0) + xpGanado;
    let nuevoNivel = perfil.nivel || 1;

    while (nuevoXP >= nuevoNivel * 100) {
      nuevoNivel++;
    }

    await supabase
      .from('perfiles')
      .update({
        xp: nuevoXP,
        nivel: nuevoNivel
      })
      .eq('id', user.id);
  }

  const handleTimerComplete = async () => {
    setIsActive(false);

    if (mode === 'work') {
      const newSessions = sessions + 1;
      setSessions(newSessions);

      await guardarSesionPomodoro(settings.workDuration);

      const isLongBreak = newSessions % settings.sessionsUntilLongBreak === 0;
      setMode('break');
      setMinutes(isLongBreak ? settings.longBreak : settings.shortBreak);
      setSeconds(0);
    } else {
      setMode('work');
      setMinutes(settings.workDuration);
      setSeconds(0);
    }
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setMinutes(mode === 'work' ? settings.workDuration : settings.shortBreak);
    setSeconds(0);
  };

  const switchMode = (newMode: 'work' | 'break') => {
    setIsActive(false);
    setMode(newMode);
    setMinutes(newMode === 'work' ? settings.workDuration : settings.shortBreak);
    setSeconds(0);
  };

  const progress = mode === 'work'
    ? ((settings.workDuration * 60 - (minutes * 60 + seconds)) / (settings.workDuration * 60)) * 100
    : ((settings.shortBreak * 60 - (minutes * 60 + seconds)) / (settings.shortBreak * 60)) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pomodoro Timer</h1>
        <p className="text-gray-600 mt-1">Mantén tu enfoque y productividad</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className={`rounded-xl p-8 ${
            mode === 'work'
              ? 'bg-gradient-to-br from-red-500 to-orange-500'
              : 'bg-gradient-to-br from-green-500 to-teal-500'
          }`}>
            <div className="text-center text-white">
              <div className="flex items-center justify-center gap-3 mb-6">
                {mode === 'work' ? (
                  <Brain className="w-8 h-8" />
                ) : (
                  <Coffee className="w-8 h-8" />
                )}
                <h2 className="text-2xl font-bold">
                  {mode === 'work' ? 'Tiempo de Trabajo' : 'Descanso'}
                </h2>
              </div>

              <div className="text-8xl font-bold mb-8">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>

              <div className="w-full bg-white/30 rounded-full h-3 mb-8">
                <div
                  className="bg-white rounded-full h-3 transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={toggleTimer}
                  className="bg-white text-gray-900 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 font-bold text-lg"
                >
                  {isActive ? (
                    <>
                      <Pause className="w-6 h-6" />
                      Pausar
                    </>
                  ) : (
                    <>
                      <Play className="w-6 h-6" />
                      Iniciar
                    </>
                  )}
                </button>

                <button
                  onClick={resetTimer}
                  className="bg-white/20 text-white px-8 py-4 rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2 font-bold text-lg"
                >
                  <RotateCcw className="w-6 h-6" />
                  Reiniciar
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <button
              onClick={() => switchMode('work')}
              className={`p-4 rounded-lg font-medium transition-all ${
                mode === 'work'
                  ? 'bg-red-500 text-white'
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-red-500'
              }`}
            >
              Modo Trabajo
            </button>

            <button
              onClick={() => switchMode('break')}
              className={`p-4 rounded-lg font-medium transition-all ${
                mode === 'break'
                  ? 'bg-green-500 text-white'
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-green-500'
              }`}
            >
              Modo Descanso
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
            <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configuración
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duración trabajo (min)
                </label>
                <input
                  type="number"
                  value={settings.workDuration}
                  onChange={(e) => setSettings({
                    ...settings,
                    workDuration: parseInt(e.target.value) || 1
                  })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descanso corto (min)
                </label>
                <input
                  type="number"
                  value={settings.shortBreak}
                  onChange={(e) => setSettings({
                    ...settings,
                    shortBreak: parseInt(e.target.value) || 1
                  })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descanso largo (min)
                </label>
                <input
                  type="number"
                  value={settings.longBreak}
                  onChange={(e) => setSettings({
                    ...settings,
                    longBreak: parseInt(e.target.value) || 1
                  })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Estadísticas de Hoy</h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Sesiones completadas</span>
                <span className="font-bold text-2xl text-purple-600">{sessions}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tiempo enfocado</span>
                <span className="font-bold text-2xl text-purple-600">
                  {sessions * settings.workDuration}m
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Siguiente descanso largo</span>
                <span className="font-bold text-2xl text-purple-600">
                  {settings.sessionsUntilLongBreak - (sessions % settings.sessionsUntilLongBreak)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <h3 className="font-bold text-lg mb-2">¡Sigue así!</h3>
            <p className="text-sm opacity-90">
              Cada sesión completada guarda tu progreso y suma XP automáticamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}