// ─────────────────────────────────────────────
//  Servicio de Gemini para StudyQuest
//  La API Key se lee desde .env → VITE_GEMINI_API_KEY
// ─────────────────────────────────────────────

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

export interface DatosEstudiante {
  nombre: string
  nivel: number
  xp: number
  racha: number
  tipoAprendizaje: string
  totalMinutos: number
  tasaExito: number
  materias: string[]
  flashcardsTotal: number
  examenesTotal: number
  areasFuertes: string[]
  areasDebiles: string[]
}

export interface Recomendacion {
  titulo: string
  descripcion: string
  tipo: 'reforzar' | 'siguiente' | 'repasar' | 'habito'
  prioridad: 'alta' | 'media' | 'baja'
}

export interface RespuestaGemini {
  resumen: string
  recomendaciones: Recomendacion[]
}

export async function obtenerRecomendaciones(datos: DatosEstudiante): Promise<RespuestaGemini> {
  const prompt = `Eres un tutor de aprendizaje personalizado dentro de una app educativa llamada StudyQuest. 
Analiza los datos de este estudiante y devuelve exactamente 4 recomendaciones concretas y motivadoras en español.

DATOS DEL ESTUDIANTE:
- Nombre: ${datos.nombre}
- Nivel: ${datos.nivel} | XP: ${datos.xp}
- Racha actual: ${datos.racha} días consecutivos
- Tipo de aprendizaje: ${datos.tipoAprendizaje}
- Tiempo total de estudio: ${Math.round(datos.totalMinutos / 60)} horas (${datos.totalMinutos} minutos)
- Tasa de éxito en exámenes: ${datos.tasaExito}%
- Materias registradas: ${datos.materias.join(', ') || 'ninguna aún'}
- Flashcards creadas: ${datos.flashcardsTotal}
- Exámenes completados: ${datos.examenesTotal}
- Áreas fuertes (más tiempo): ${datos.areasFuertes.join(', ') || 'sin datos'}
- Áreas débiles (menos tiempo): ${datos.areasDebiles.join(', ') || 'sin datos'}

INSTRUCCIONES:
- Basa las recomendaciones en el tipo de aprendizaje "${datos.tipoAprendizaje}"
- Si la tasa de éxito es baja (<60%), prioriza reforzar temas
- Si la racha es alta (>5), felicita y sugiere un reto mayor
- Si hay pocas flashcards (<10), sugiere crearlas
- Sé motivador y específico, no genérico

Responde SOLO con este JSON (sin backticks, sin texto extra):
{
  "resumen": "2 oraciones máximo resumiendo el estado y potencial del estudiante.",
  "recomendaciones": [
    {
      "titulo": "Título corto (máx 5 palabras)",
      "descripcion": "Acción concreta y específica que debe hacer (1-2 oraciones)",
      "tipo": "reforzar|siguiente|repasar|habito",
      "prioridad": "alta|media|baja"
    }
  ]
}`

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error?.message || 'Error al contactar Gemini')
  }

  const data = await response.json()
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const clean = rawText.replace(/```json|```/g, '').trim()

  try {
    return JSON.parse(clean) as RespuestaGemini
  } catch {
    throw new Error('No se pudo interpretar la respuesta de Gemini')
  }
}
