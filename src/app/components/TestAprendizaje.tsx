import { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface TestAprendizajeProps {
  user: any;
  onFinish: () => void;
}

const preguntas = [
  {
    texto: 'Cuando estudias algo nuevo, prefieres...',
    opciones: [
      { texto: 'Ver diagramas, colores o mapas mentales', tipo: 'visual' },
      { texto: 'Escuchar una explicación o repetirlo en voz alta', tipo: 'auditivo' },
      { texto: 'Leer apuntes y escribir resúmenes', tipo: 'lectura' },
      { texto: 'Practicar con ejercicios o ejemplos reales', tipo: 'kinestesico' }
    ]
  },
  {
    texto: 'Para recordar mejor un tema, normalmente...',
    opciones: [
      { texto: 'Haces esquemas o dibujos', tipo: 'visual' },
      { texto: 'Lo explicas hablando', tipo: 'auditivo' },
      { texto: 'Lo escribes varias veces', tipo: 'lectura' },
      { texto: 'Lo aplicas en una actividad', tipo: 'kinestesico' }
    ]
  },
  {
    texto: 'En clase te ayuda más...',
    opciones: [
      { texto: 'Que el maestro use presentaciones o pizarrón', tipo: 'visual' },
      { texto: 'Escuchar una explicación clara', tipo: 'auditivo' },
      { texto: 'Tener apuntes o material escrito', tipo: 'lectura' },
      { texto: 'Resolver ejercicios durante la clase', tipo: 'kinestesico' }
    ]
  },
  {
    texto: 'Cuando preparas un examen, sueles...',
    opciones: [
      { texto: 'Usar colores, tablas o mapas conceptuales', tipo: 'visual' },
      { texto: 'Escuchar videos o explicaciones', tipo: 'auditivo' },
      { texto: 'Leer y subrayar tus apuntes', tipo: 'lectura' },
      { texto: 'Hacer ejercicios o simulacros', tipo: 'kinestesico' }
    ]
  }
];

export default function TestAprendizaje({ user, onFinish }: TestAprendizajeProps) {
  const [respuestas, setRespuestas] = useState<Record<number, string>>({});
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);

  function seleccionarRespuesta(indexPregunta: number, tipo: string) {
    setRespuestas({
      ...respuestas,
      [indexPregunta]: tipo
    });
  }

  async function finalizarTest() {
    if (Object.keys(respuestas).length < preguntas.length) {
      setMensaje('Responde todas las preguntas para continuar.');
      return;
    }

    setLoading(true);
    setMensaje('');

    const puntajes = {
      visual: 0,
      auditivo: 0,
      lectura: 0,
      kinestesico: 0
    };

    Object.values(respuestas).forEach((tipo) => {
      puntajes[tipo as keyof typeof puntajes]++;
    });

    const resultado = Object.entries(puntajes).sort((a, b) => b[1] - a[1])[0][0];

    await supabase.from('test_aprendizaje').insert({
      usuario_id: user.id,
      visual: puntajes.visual,
      auditivo: puntajes.auditivo,
      lectura: puntajes.lectura,
      kinestesico: puntajes.kinestesico,
      resultado
    });

    const { error } = await supabase
      .from('perfiles')
      .update({
        tipo_aprendizaje: resultado
      })
      .eq('id', user.id);

    setLoading(false);

    if (error) {
      setMensaje(error.message);
      return;
    }

    onFinish();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-4xl w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Test de aprendizaje</h1>
          <p className="text-gray-600 mt-2">
            Responde estas preguntas para personalizar tus recomendaciones.
          </p>
        </div>

        <div className="space-y-6">
          {preguntas.map((pregunta, indexPregunta) => (
            <div
              key={indexPregunta}
              className="border-2 border-gray-200 rounded-xl p-5"
            >
              <h2 className="font-bold text-lg text-gray-900 mb-4">
                {indexPregunta + 1}. {pregunta.texto}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pregunta.opciones.map((opcion, indexOpcion) => (
                  <button
                    key={indexOpcion}
                    onClick={() => seleccionarRespuesta(indexPregunta, opcion.tipo)}
                    className={`text-left p-4 rounded-lg border-2 transition-all ${
                      respuestas[indexPregunta] === opcion.tipo
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-400'
                    }`}
                  >
                    {opcion.texto}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {mensaje && (
          <p className="text-purple-700 font-medium mt-4">
            {mensaje}
          </p>
        )}

        <button
          onClick={finalizarTest}
          disabled={loading}
          className="w-full mt-8 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-bold disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Finalizar test'}
        </button>
      </div>
    </div>
  );
}