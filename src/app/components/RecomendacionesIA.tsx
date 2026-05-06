import { useState } from 'react'
import { Sparkles, RefreshCw, ChevronRight, AlertCircle } from 'lucide-react'
import { obtenerRecomendaciones, type DatosEstudiante, type Recomendacion } from '../../lib/gemini'

interface Props {
  datos: DatosEstudiante
}

const TIPO_CONFIG = {
  reforzar: {
    label: 'Reforzar',
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-400'
  },
  siguiente: {
    label: 'Siguiente paso',
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
    dot: 'bg-green-400'
  },
  repasar: {
    label: 'Repasar',
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200',
    dot: 'bg-blue-400'
  },
  habito: {
    label: 'Hábito',
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-200',
    dot: 'bg-purple-400'
  }
}

const PRIORIDAD_CONFIG = {
  alta: { label: '● Alta', color: 'text-red-500' },
  media: { label: '● Media', color: 'text-amber-500' },
  baja: { label: '● Baja', color: 'text-green-500' }
}

export default function RecomendacionesIA({ datos }: Props) {
  const [cargando, setCargando] = useState(false)
  const [resumen, setResumen] = useState('')
  const [recomendaciones, setRecomendaciones] = useState<Recomendacion[]>([])
  const [error, setError] = useState('')
  const [generado, setGenerado] = useState(false)

  async function generar() {
    setCargando(true)
    setError('')

    try {
      const resultado = await obtenerRecomendaciones(datos)
      setResumen(resultado.resumen)
      setRecomendaciones(resultado.recomendaciones)
      setGenerado(true)
    } catch (e: any) {
      setError(e.message || 'Ocurrió un error. Verifica tu API Key en el archivo .env')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border-2 border-purple-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-violet-600 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Recomendaciones con IA</h2>
              <p className="text-purple-200 text-sm">Análisis personalizado con Gemini</p>
            </div>
          </div>

          {generado && (
            <button
              onClick={generar}
              disabled={cargando}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          )}
        </div>
      </div>

      <div className="p-5">
        {/* Estado inicial — sin generar */}
        {!generado && !cargando && !error && (
          <div className="text-center py-6">
            <div className="bg-purple-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-gray-600 text-sm mb-1 font-medium">
              Análisis listo para generarse
            </p>
            <p className="text-gray-400 text-sm mb-5">
              Gemini revisará tu progreso, materias y resultados para darte consejos personalizados.
            </p>
            <button
              onClick={generar}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
            >
              <Sparkles className="w-4 h-4" />
              Generar recomendaciones
            </button>
          </div>
        )}

        {/* Cargando */}
        {cargando && (
          <div className="py-8">
            <div className="flex items-center gap-3 mb-4">
              <RefreshCw className="w-5 h-5 text-purple-500 animate-spin" />
              <p className="text-gray-600 text-sm font-medium">Analizando tu progreso...</p>
            </div>
            <div className="space-y-3">
              {[90, 75, 85, 60].map((w, i) => (
                <div key={i} className="flex gap-3 items-start p-3 border border-gray-100 rounded-lg">
                  <div className="w-7 h-7 bg-gray-100 rounded-lg animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className={`h-3 bg-gray-100 rounded animate-pulse`} style={{ width: `${w}%` }} />
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && !cargando && (
          <div className="py-4">
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700 text-sm font-medium">No se pudo generar el análisis</p>
                <p className="text-red-500 text-xs mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={generar}
              className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Intentar de nuevo
            </button>
          </div>
        )}

        {/* Resultados */}
        {generado && !cargando && recomendaciones.length > 0 && (
          <div className="space-y-4">
            {/* Resumen */}
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
              <p className="text-purple-900 text-sm leading-relaxed">{resumen}</p>
            </div>

            {/* Lista de recomendaciones */}
            <div className="space-y-2">
              {recomendaciones.map((rec, i) => {
                const tipo = TIPO_CONFIG[rec.tipo] || TIPO_CONFIG.repasar
                const prioridad = PRIORIDAD_CONFIG[rec.prioridad] || PRIORIDAD_CONFIG.media

                return (
                  <div
                    key={i}
                    className={`flex items-start gap-3 p-3.5 rounded-lg border ${tipo.bg} ${tipo.border}`}
                  >
                    <div className={`w-2 h-2 rounded-full ${tipo.dot} flex-shrink-0 mt-1.5`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className={`font-semibold text-sm ${tipo.text}`}>{rec.titulo}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full bg-white/60 ${tipo.text} font-medium`}>
                          {tipo.label}
                        </span>
                      </div>
                      <p className={`text-xs leading-relaxed ${tipo.text} opacity-80`}>
                        {rec.descripcion}
                      </p>
                      <p className={`text-xs mt-1.5 font-medium ${prioridad.color}`}>
                        {prioridad.label}
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${tipo.text} opacity-50 flex-shrink-0 mt-1`} />
                  </div>
                )
              })}
            </div>

            <p className="text-xs text-gray-400 text-center pt-1">
              Generado por Gemini · Basado en tu actividad real en StudyQuest
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
