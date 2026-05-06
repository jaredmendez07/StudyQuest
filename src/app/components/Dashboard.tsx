import { useEffect, useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import {
  Trophy,
  Flame,
  Target,
  Clock,
  BookOpen,
  Brain,
  TrendingUp
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import cerebroEstudio from '../../assets/cerebro-estudio.png'
import RecomendacionesIA from './RecomendacionesIA'
import type { DatosEstudiante } from '../../lib/gemini'
import LoadingBrain from './LoadingBrain'

// Calcula racha de días consecutivos desde sesiones_estudio
function calcularRacha(sesiones: any[]): number {
  if (!sesiones.length) return 0
  const diasUnicos = Array.from(new Set(
    sesiones.map((s) => {
      const f = new Date(s.fecha || s.created_at)
      return new Date(f.getFullYear(), f.getMonth(), f.getDate()).getTime()
    }).filter(Boolean)
  )).sort((a, b) => b - a)
  const hoy = new Date()
  const hoyMs = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime()
  const ayerMs = hoyMs - 86400000
  if (diasUnicos[0] < ayerMs) return 0
  let racha = 1
  for (let i = 1; i < diasUnicos.length; i++) {
    if (diasUnicos[i - 1] - diasUnicos[i] === 86400000) racha++
    else break
  }
  return racha
}

export default function Dashboard() {
  const [selectedMateria, setSelectedMateria] = useState('')
  const [selectedDuracion, setSelectedDuracion] = useState(15)
  const [perfil, setPerfil] = useState<any>(null)
  const [sesiones, setSesiones] = useState<any[]>([])
  const [materias, setMaterias] = useState<any[]>([])
  const [flashcards, setFlashcards] = useState<any[]>([])
  const [examenes, setExamenes] = useState<any[]>([])
  const [resultados, setResultados] = useState<any[]>([])
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(true)
  const [fraseIndex, setFraseIndex] = useState(0)
  const [fuegoAnimacion, setFuegoAnimacion] = useState(false)

  const frasesMotivacionales = [
    'Recuerda que puedes solicitar recomendaciones personalizadas en la sección de IA. 🤖',
    'Ponte al tiro que ese cerebro quiere crecer. 🔥',
    'Fundamentos de la investigación < Ecuaciones diferenciales. 🤓',
    '"Cuéntamelo y lo olvidaré.  Enséñamelo y quizás lo recordaré. Hazme partícipe y lo aprenderé." — Benjamin Franklin',
    'Pequeños avances crean grandes resultados. ⭐',
    'Tu cerebro se fortalece con cada sesión. 🧠',
    'Also try Minecraft!!.',
    'Also try Terraria!!.',
    'Quien es Duolingo???.',
    'Cada día más guapo, inteligente y concentrado. Te felicito!!!. 👏',
    'Eres una fiera, maquina, bestia parda, mastodonte, crack, exitoso, leyenda, papu, genio, genia, genie, compañere, camarada, bro, bestie, amigo, amigue....'
  ]

  useEffect(() => {
    cargarDatos()
  }, [])

  useEffect(() => {
    const intervalo = window.setInterval(() => {
      setFraseIndex((actual) => (actual + 1) % frasesMotivacionales.length)
    }, 4500)

    return () => window.clearInterval(intervalo)
  }, [])

  async function cargarDatos() {
    setLoading(true)

    const { data: sessionData } = await supabase.auth.getSession()
    const user = sessionData.session?.user

    if (!user) {
      setLoading(false)
      return
    }

    const { data: perfilData } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const { data: sesionesData } = await supabase
      .from('sesiones_estudio')
      .select('*')
      .eq('usuario_id', user.id)

    const { data: materiasData } = await supabase
      .from('materias')
      .select('*')
      .eq('usuario_id', user.id)
      .order('nombre', { ascending: true })

    const { data: flashcardsData } = await supabase
      .from('flashcards')
      .select('*')
      .eq('usuario_id', user.id)

    const { data: examenesData } = await supabase
      .from('examenes')
      .select('*')
      .eq('usuario_id', user.id)

    const { data: resultadosData } = await supabase
      .from('resultados_examen')
      .select('*')
      .eq('usuario_id', user.id)

    // Calcular racha real y sincronizar con Supabase
    const rachaCalculada = calcularRacha(sesionesData || [])
    if (rachaCalculada !== (perfilData?.racha ?? 0)) {
      await supabase.from('perfiles').update({ racha: rachaCalculada }).eq('id', user.id)
    }
    setPerfil(perfilData ? { ...perfilData, racha: rachaCalculada } : null)
    setSesiones(sesionesData || [])
    setMaterias(materiasData || [])
    setFlashcards(flashcardsData || [])
    setExamenes(examenesData || [])
    setResultados(resultadosData || [])
    setLoading(false)
  }

  async function comenzarSesion() {
    if (!selectedMateria) {
      setMensaje('Selecciona una materia.')
      return
    }

    const { data: sessionData } = await supabase.auth.getSession()
    const user = sessionData.session?.user

    if (!user) return

    const materiaObj = materias.find(m => String(m.id) === String(selectedMateria))
    const xpGanado = selectedDuracion * 2

    const { error } = await supabase.from('sesiones_estudio').insert({
      usuario_id: user.id,
      materia: materiaObj?.nombre || 'Sin materia',
      materia_id: materiaObj?.id || null,
      minutos: selectedDuracion,
      concentracion: 8,
      xp_ganado: xpGanado
    })

    if (error) {
      setMensaje('Error al guardar la sesión.')
      return
    }

    const nuevoXP = (perfil?.xp || 0) + xpGanado
    let nuevoNivel = perfil?.nivel || 1

    while (nuevoXP >= nuevoNivel * 100) {
      nuevoNivel++
    }

    await supabase
      .from('perfiles')
      .update({
        xp: nuevoXP,
        nivel: nuevoNivel
      })
      .eq('id', user.id)

    setMensaje(`Sesión guardada. Ganaste ${xpGanado} XP 🚀`)
    setSelectedMateria('')
    await cargarDatos()
  }

  const fechasEstudiadas = useMemo(() => {
    const fechas = new Set<string>()

    sesiones.forEach((sesion) => {
      const fechaBase = sesion.fecha || sesion.created_at
      if (!fechaBase) return

      const fecha = new Date(fechaBase)
      if (Number.isNaN(fecha.getTime())) return

      fechas.add(fecha.toISOString().slice(0, 10))
    })

    return fechas
  }, [sesiones])

  function fechaLocalISO(fecha: Date) {
    const copia = new Date(fecha)
    copia.setMinutes(copia.getMinutes() - copia.getTimezoneOffset())
    return copia.toISOString().slice(0, 10)
  }

  const rachaCalculada = useMemo(() => {
    if (fechasEstudiadas.size === 0) return 0

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const ayer = new Date(hoy)
    ayer.setDate(ayer.getDate() - 1)

    let cursor = fechasEstudiadas.has(fechaLocalISO(hoy)) ? hoy : ayer
    let racha = 0

    while (fechasEstudiadas.has(fechaLocalISO(cursor))) {
      racha++
      cursor.setDate(cursor.getDate() - 1)
    }

    return racha
  }, [fechasEstudiadas])

  useEffect(() => {
    if (rachaCalculada > 0) {
      setFuegoAnimacion(true)
      const timer = window.setTimeout(() => setFuegoAnimacion(false), 1500)
      return () => window.clearTimeout(timer)
    }
  }, [rachaCalculada])

  const diasCalendario = useMemo(() => {
    const hoy = new Date()
    const year = hoy.getFullYear()
    const month = hoy.getMonth()
    const primerDia = new Date(year, month, 1)
    const ultimoDia = new Date(year, month + 1, 0)
    const espaciosInicio = primerDia.getDay() === 0 ? 6 : primerDia.getDay() - 1
    const dias = []

    for (let i = 0; i < espaciosInicio; i++) {
      dias.push({ dia: '', estudiado: false, hoy: false })
    }

    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const fecha = new Date(year, month, dia)
      const iso = fechaLocalISO(fecha)
      dias.push({
        dia: String(dia),
        estudiado: fechasEstudiadas.has(iso),
        hoy: iso === fechaLocalISO(hoy)
      })
    }

    return dias
  }, [fechasEstudiadas])

  const mesActual = new Intl.DateTimeFormat('es-MX', {
    month: 'long',
    year: 'numeric'
  }).format(new Date())

  if (loading) {
    return <LoadingBrain mensaje="Cargando dashboard..." />
  }

  const xp = perfil?.xp || 0
  const nivel = perfil?.nivel || 1
  const xpNecesario = nivel * 100
  const porcentajeXP = Math.min((xp / xpNecesario) * 100, 100)

  const totalMinutos = sesiones.reduce((total, sesion) => {
    return total + (sesion.minutos || 0)
  }, 0)

  const totalStudyTime = Math.round(totalMinutos / 60)

  const totalAciertos = resultados.reduce((total, r) => total + (r.aciertos || 0), 0)
  const totalPreguntas = resultados.reduce((total, r) => total + (r.total_preguntas || 0), 0)

  const tasaExito = totalPreguntas > 0
    ? Math.round((totalAciertos / totalPreguntas) * 100)
    : 0

  const totalConcentracion = sesiones.reduce((total, sesion) => {
    return total + (sesion.concentracion || 0)
  }, 0)

  const retencion = sesiones.length > 0
    ? Math.round((totalConcentracion / sesiones.length) * 10)
    : 0

  const tiempoPorMateria: Record<string, number> = {}

  sesiones.forEach(sesion => {
    const nombre = sesion.materia || 'Sin materia'
    tiempoPorMateria[nombre] = (tiempoPorMateria[nombre] || 0) + (sesion.minutos || 0)
  })

  const timePerSubject = Object.entries(tiempoPorMateria).map(([name, minutes]) => ({
    name,
    hours: Math.round((minutes / 60) * 10) / 10 || 0.1
  }))

  const sesionesPorSemana = [
    { name: 'Lun', sessions: 0 },
    { name: 'Mar', sessions: 0 },
    { name: 'Mié', sessions: 0 },
    { name: 'Jue', sessions: 0 },
    { name: 'Vie', sessions: 0 },
    { name: 'Sáb', sessions: 0 },
    { name: 'Dom', sessions: 0 }
  ]

  sesiones.forEach(sesion => {
    const fechaBase = sesion.fecha || sesion.created_at
    if (!fechaBase) return

    const fecha = new Date(fechaBase)
    const dia = fecha.getDay()
    const indice = dia === 0 ? 6 : dia - 1

    sesionesPorSemana[indice].sessions++
  })

  const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Bienvenido, ¡sigue así!</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-gradient-to-br from-violet-50 via-white to-orange-50 rounded-2xl p-6 border-2 border-purple-100 shadow-sm">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="relative shrink-0">
              <img
                src={cerebroEstudio}
                alt="Cerebro motivacional"
                className="w-40 h-40 object-contain drop-shadow-lg animate-brain-float"
              />
            </div>

            <div className="flex-1 w-full">
              <div className="relative bg-white rounded-2xl border-2 border-purple-200 p-5 shadow-md">
                <div className="absolute -left-3 top-10 w-6 h-6 bg-white border-l-2 border-b-2 border-purple-200 rotate-45 hidden lg:block" />
                <p className="text-sm font-bold text-purple-600 mb-1">Frases para pensar...</p>
                <p className="text-xl font-bold text-gray-900 min-h-[56px]">
                  {frasesMotivacionales[fraseIndex]}
                </p>
                <p className="text-gray-500 text-sm mt-2">Este es bebote el cerebro familiarizate con el!!!.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border-2 border-orange-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-600 text-sm">Racha de estudio</p>
              <p className="text-3xl font-bold text-gray-900">{rachaCalculada} días</p>
            </div>
            <div className={`text-5xl ${fuegoAnimacion ? 'animate-fire-pop' : 'animate-pulse'}`}>🔥</div>
          </div>

          <p className="text-sm font-semibold text-gray-700 capitalize mb-3">{mesActual}</p>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-gray-500 mb-2">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((dia) => (
              <span key={dia}>{dia}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {diasCalendario.map((item, index) => (
              <div
                key={`${item.dia}-${index}`}
                className={`h-9 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                  item.dia === ''
                    ? 'bg-transparent'
                    : item.estudiado
                      ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-300'
                      : item.hoy
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-500'
                }`}
              >
                {item.estudiado ? '🔥' : item.dia}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Trophy className="w-8 h-8" />
            <span className="text-2xl font-bold">Nivel {nivel}</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>XP Progress</span>
              <span>{xp} / {xpNecesario}</span>
            </div>

            <div className="w-full bg-purple-400 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all"
                style={{ width: `${porcentajeXP}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Racha Actual</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {rachaCalculada} días
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Flame className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Tiempo Total</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {totalStudyTime}h
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Tarjetas Revisadas</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {flashcards.length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Brain className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Tiempo por Materia</h2>

          {timePerSubject.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No hay sesiones registradas todavía.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={timePerSubject}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="hours"
                >
                  {timePerSubject.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Sesiones Esta Semana</h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sesionesPorSemana}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="sessions" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="w-6 h-6 text-purple-600" />
          Sesión Rápida de Estudio
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Materia
            </label>

            <select
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
              value={selectedMateria}
              onChange={(e) => setSelectedMateria(e.target.value)}
            >
              <option value="">Elige una materia</option>

              {materias.map((materia) => (
                <option key={materia.id} value={materia.id}>
                  {materia.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duración
            </label>

            <select
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
              value={selectedDuracion}
              onChange={(e) => setSelectedDuracion(Number(e.target.value))}
            >
              <option value={15}>15 minutos</option>
              <option value={25}>25 minutos</option>
              <option value={45}>45 minutos</option>
              <option value={60}>60 minutos</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={comenzarSesion}
              className="w-full bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Comenzar Sesión
            </button>
          </div>
        </div>

        {mensaje && (
          <p className="mt-4 text-purple-700 font-medium">
            {mensaje}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl p-6 text-white">
          <BookOpen className="w-8 h-8 mb-3" />
          <h3 className="font-bold text-lg">Exámenes Aprobados</h3>
          <p className="text-3xl font-bold mt-2">{examenes.length}</p>
          <p className="text-sm opacity-90 mt-1">¡Sigue mejorando!</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-6 text-white">
          <TrendingUp className="w-8 h-8 mb-3" />
          <h3 className="font-bold text-lg">Tasa de Éxito</h3>
          <p className="text-3xl font-bold mt-2">{tasaExito}%</p>
          <p className="text-sm opacity-90 mt-1">En tus últimos exámenes</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-6 text-white">
          <Brain className="w-8 h-8 mb-3" />
          <h3 className="font-bold text-lg">Retención</h3>
          <p className="text-3xl font-bold mt-2">{retencion}%</p>
          <p className="text-sm opacity-90 mt-1">Con tus sesiones registradas</p>
        </div>
      </div>

      {/* ── Recomendaciones con IA ── */}
      <RecomendacionesIA
        datos={{
          nombre: perfil?.nombre || 'Estudiante',
          nivel: perfil?.nivel || 1,
          xp: perfil?.xp || 0,
          racha: perfil?.racha || 0,
          tipoAprendizaje: perfil?.tipo_aprendizaje || 'no definido',
          totalMinutos,
          tasaExito,
          materias: materias.map((m: any) => m.nombre),
          flashcardsTotal: flashcards.length,
          examenesTotal: examenes.length,
          areasFuertes: timePerSubject
            .sort((a, b) => b.hours - a.hours)
            .slice(0, 2)
            .map(m => m.name),
          areasDebiles: timePerSubject
            .sort((a, b) => a.hours - b.hours)
            .slice(0, 2)
            .map(m => m.name),
        } as DatosEstudiante}
      />
    </div>
  )
}