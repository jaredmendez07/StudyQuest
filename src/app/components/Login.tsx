import { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [modoRegistro, setModoRegistro] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);

  async function iniciarSesion() {
    if (!email.trim() || !password.trim()) {
      setMensaje('Ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    setMensaje('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setLoading(false);

    if (error) {
      setMensaje(error.message);
      return;
    }

    onLogin();
  }

  async function registrarUsuario() {
    if (!nombre.trim() || !email.trim() || !password.trim()) {
      setMensaje('Completa todos los campos.');
      return;
    }

    setLoading(true);
    setMensaje('');

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      setLoading(false);
      setMensaje(error.message);
      return;
    }

    const user = data.user;

    if (user) {
      await supabase.from('perfiles').insert({
        id: user.id,
        nombre: nombre.trim(),
        xp: 0,
        nivel: 1,
        racha: 0
      });
    }

    setLoading(false);
    setMensaje('Cuenta creada. Ahora inicia sesión.');
    setModoRegistro(false);
    setPassword('');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-white to-pink-100 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-purple-700">StudyQuest</h1>
          <p className="text-gray-500 mt-2">
            {modoRegistro ? 'Crea tu cuenta para comenzar' : 'Inicia sesión para continuar'}
          </p>
        </div>

        <div className="space-y-4">
          {modoRegistro && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre
              </label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                placeholder="Tu nombre"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo
            </label>
            <input
              value={email}
              type="email"
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              value={password}
              type="password"
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
              placeholder="********"
            />
          </div>

          {mensaje && (
            <p className="text-sm text-purple-700 font-medium">
              {mensaje}
            </p>
          )}

          <button
            onClick={modoRegistro ? registrarUsuario : iniciarSesion}
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-bold disabled:opacity-50"
          >
            {loading
              ? 'Cargando...'
              : modoRegistro
                ? 'Crear cuenta'
                : 'Iniciar sesión'}
          </button>

          <button
            onClick={() => {
              setModoRegistro(!modoRegistro);
              setMensaje('');
            }}
            className="w-full bg-purple-100 text-purple-700 py-3 rounded-lg hover:bg-purple-200 transition-colors font-bold"
          >
            {modoRegistro
              ? 'Ya tengo cuenta'
              : 'Crear una cuenta'}
          </button>
        </div>
      </div>
    </div>
  );
}