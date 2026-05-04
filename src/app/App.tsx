import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

import Login from './components/Login';
import TestAprendizaje from './components/TestAprendizaje';

import Dashboard from './components/Dashboard';
import Materias from './components/Materias';
import Flashcards from './components/Flashcards';
import Examenes from './components/Examenes';
import Pomodoro from './components/Pomodoro';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [perfil, setPerfil] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pantalla, setPantalla] = useState('dashboard');

  useEffect(() => {
    iniciar();
  }, []);

  async function iniciar() {
    setLoading(true);

    const { data } = await supabase.auth.getSession();

    if (!data.session) {
      setUser(null);
      setPerfil(null);
      setLoading(false);
      return;
    }

    const usuario = data.session.user;
    setUser(usuario);

    let { data: perfilData } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', usuario.id)
      .single();

    if (!perfilData) {
      await supabase.from('perfiles').insert({
        id: usuario.id,
        nombre: usuario.email,
        xp: 0,
        nivel: 1,
        racha: 0
      });

      const { data: nuevoPerfil } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', usuario.id)
        .single();

      perfilData = nuevoPerfil;
    }

    setPerfil(perfilData);
    setLoading(false);
  }

  async function recargarPerfil() {
    if (!user) return;

    const { data: perfilData } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setPerfil(perfilData);
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    setUser(null);
    setPerfil(null);
    setPantalla('dashboard');
  }

  function mostrarTipoAprendizaje(tipo: string) {
    if (tipo === 'visual') return '👁️ Visual';
    if (tipo === 'auditivo') return '🎧 Auditivo';
    if (tipo === 'lectura') return '📖 Lectura / Escritura';
    if (tipo === 'kinestesico') return '🧩 Kinestésico';
    return 'Sin definir';
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={iniciar} />;
  }

  if (!perfil?.tipo_aprendizaje) {
    return <TestAprendizaje user={user} onFinish={recargarPerfil} />;
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-purple-900 text-white p-6 flex flex-col gap-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">StudyQuest</h1>
          <p className="text-purple-200 text-sm">Aprende jugando</p>
        </div>

        <button
          className={`text-left rounded-lg px-4 py-3 ${
            pantalla === 'dashboard'
              ? 'bg-white text-purple-900'
              : 'hover:bg-purple-800'
          }`}
          onClick={() => setPantalla('dashboard')}
        >
          📊 Dashboard
        </button>

        <button
          className={`text-left rounded-lg px-4 py-3 ${
            pantalla === 'materias'
              ? 'bg-white text-purple-900'
              : 'hover:bg-purple-800'
          }`}
          onClick={() => setPantalla('materias')}
        >
          📚 Materias
        </button>

        <button
          className={`text-left rounded-lg px-4 py-3 ${
            pantalla === 'flashcards'
              ? 'bg-white text-purple-900'
              : 'hover:bg-purple-800'
          }`}
          onClick={() => setPantalla('flashcards')}
        >
          🧠 Flashcards
        </button>

        <button
          className={`text-left rounded-lg px-4 py-3 ${
            pantalla === 'examenes'
              ? 'bg-white text-purple-900'
              : 'hover:bg-purple-800'
          }`}
          onClick={() => setPantalla('examenes')}
        >
          📝 Exámenes
        </button>

        <button
          className={`text-left rounded-lg px-4 py-3 ${
            pantalla === 'pomodoro'
              ? 'bg-white text-purple-900'
              : 'hover:bg-purple-800'
          }`}
          onClick={() => setPantalla('pomodoro')}
        >
          ⏱️ Pomodoro
        </button>

        <div className="mt-auto bg-purple-800 rounded-xl p-4">
          <p className="text-sm text-purple-200">Usuario</p>
          <p className="font-bold truncate">{perfil?.nombre || user.email}</p>

          <div className="mt-3 pt-3 border-t border-purple-700">
            <p className="text-sm text-purple-200">Tipo de aprendizaje</p>
            <p className="font-bold">
              {mostrarTipoAprendizaje(perfil?.tipo_aprendizaje)}
            </p>
          </div>
        </div>

        <button
          className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-4 py-3 font-bold"
          onClick={cerrarSesion}
        >
          Cerrar sesión
        </button>
      </aside>

      <main className="flex-1 p-6 overflow-y-auto">
        {pantalla === 'dashboard' && <Dashboard />}
        {pantalla === 'materias' && <Materias />}
        {pantalla === 'flashcards' && <Flashcards />}
        {pantalla === 'examenes' && <Examenes />}
        {pantalla === 'pomodoro' && <Pomodoro />}
      </main>
    </div>
  );
}