[1mdiff --git a/.env .example b/.env .example[m
[1mdeleted file mode 100644[m
[1mindex 5100c0e..0000000[m
[1m--- a/.env .example[m	
[1m+++ /dev/null[m
[36m@@ -1,3 +0,0 @@[m
[31m-VITE_SUPABASE_URL=[m
[31m-VITE_SUPABASE_ANON_KEY=[m
[31m-VITE_GEMINI_API_KEY=[m
\ No newline at end of file[m
[1mdiff --git a/package-lock.json b/package-lock.json[m
[1mindex abf3e8e..b584c4b 100644[m
[1m--- a/package-lock.json[m
[1m+++ b/package-lock.json[m
[36m@@ -5716,22 +5716,6 @@[m
       "integrity": "sha512-a4UGQaWPH59mOXUYnAG2ewncQS4i4F43Tv3JoAM+s2VDAmS9NsK8GpDMLrCHPksFT7h3K6TOoUNn2pb7RoXx4g==",[m
       "dev": true,[m
       "license": "ISC"[m
[31m-    },[m
[31m-    "node_modules/yaml": {[m
[31m-      "version": "2.8.3",[m
[31m-      "resolved": "https://registry.npmjs.org/yaml/-/yaml-2.8.3.tgz",[m
[31m-      "integrity": "sha512-AvbaCLOO2Otw/lW5bmh9d/WEdcDFdQp2Z2ZUH3pX9U2ihyUY0nvLv7J6TrWowklRGPYbB/IuIMfYgxaCPg5Bpg==",[m
[31m-      "extraneous": true,[m
[31m-      "license": "ISC",[m
[31m-      "bin": {[m
[31m-        "yaml": "bin.mjs"[m
[31m-      },[m
[31m-      "engines": {[m
[31m-        "node": ">= 14.6"[m
[31m-      },[m
[31m-      "funding": {[m
[31m-        "url": "https://github.com/sponsors/eemeli"[m
[31m-      }[m
     }[m
   }[m
 }[m
[1mdiff --git a/src/app/components/Dashboard.tsx b/src/app/components/Dashboard.tsx[m
[1mindex ad8bf7a..74e26a7 100644[m
[1m--- a/src/app/components/Dashboard.tsx[m
[1m+++ b/src/app/components/Dashboard.tsx[m
[36m@@ -21,8 +21,6 @@[m [mimport {[m
   TrendingUp[m
 } from 'lucide-react'[m
 import { supabase } from '../../lib/supabase'[m
[31m-import RecomendacionesIA from './RecomendacionesIA'[m
[31m-import type { DatosEstudiante } from '../../lib/gemini'[m
 [m
 export default function Dashboard() {[m
   const [selectedMateria, setSelectedMateria] = useState('')[m
[36m@@ -408,30 +406,6 @@[m [mexport default function Dashboard() {[m
           <p className="text-sm opacity-90 mt-1">Con tus sesiones registradas</p>[m
         </div>[m
       </div>[m
[31m-[m
[31m-      {/* ── Recomendaciones con IA ── */}[m
[31m-      <RecomendacionesIA[m
[31m-        datos={{[m
[31m-          nombre: perfil?.nombre || 'Estudiante',[m
[31m-          nivel: perfil?.nivel || 1,[m
[31m-          xp: perfil?.xp || 0,[m
[31m-          racha: perfil?.racha || 0,[m
[31m-          tipoAprendizaje: perfil?.tipo_aprendizaje || 'no definido',[m
[31m-          totalMinutos,[m
[31m-          tasaExito,[m
[31m-          materias: materias.map((m: any) => m.nombre),[m
[31m-          flashcardsTotal: flashcards.length,[m
[31m-          examenesTotal: examenes.length,[m
[31m-          areasFuertes: timePerSubject[m
[31m-            .sort((a, b) => b.hours - a.hours)[m
[31m-            .slice(0, 2)[m
[31m-            .map(m => m.name),[m
[31m-          areasDebiles: timePerSubject[m
[31m-            .sort((a, b) => a.hours - b.hours)[m
[31m-            .slice(0, 2)[m
[31m-            .map(m => m.name),[m
[31m-        } as DatosEstudiante}[m
[31m-      />[m
     </div>[m
   )[m
 }[m
\ No newline at end of file[m
[1mdiff --git a/src/app/components/RecomendacionesIA.tsx b/src/app/components/RecomendacionesIA.tsx[m
[1mdeleted file mode 100644[m
[1mindex 65769fd..0000000[m
[1m--- a/src/app/components/RecomendacionesIA.tsx[m
[1m+++ /dev/null[m
[36m@@ -1,208 +0,0 @@[m
[31m-import { useState } from 'react'[m
[31m-import { Sparkles, RefreshCw, ChevronRight, AlertCircle } from 'lucide-react'[m
[31m-import { obtenerRecomendaciones, type DatosEstudiante, type Recomendacion } from '../../lib/gemini'[m
[31m-[m
[31m-interface Props {[m
[31m-  datos: DatosEstudiante[m
[31m-}[m
[31m-[m
[31m-const TIPO_CONFIG = {[m
[31m-  reforzar: {[m
[31m-    label: 'Reforzar',[m
[31m-    bg: 'bg-amber-100',[m
[31m-    text: 'text-amber-800',[m
[31m-    border: 'border-amber-200',[m
[31m-    dot: 'bg-amber-400'[m
[31m-  },[m
[31m-  siguiente: {[m
[31m-    label: 'Siguiente paso',[m
[31m-    bg: 'bg-green-100',[m
[31m-    text: 'text-green-800',[m
[31m-    border: 'border-green-200',[m
[31m-    dot: 'bg-green-400'[m
[31m-  },[m
[31m-  repasar: {[m
[31m-    label: 'Repasar',[m
[31m-    bg: 'bg-blue-100',[m
[31m-    text: 'text-blue-800',[m
[31m-    border: 'border-blue-200',[m
[31m-    dot: 'bg-blue-400'[m
[31m-  },[m
[31m-  habito: {[m
[31m-    label: 'Hábito',[m
[31m-    bg: 'bg-purple-100',[m
[31m-    text: 'text-purple-800',[m
[31m-    border: 'border-purple-200',[m
[31m-    dot: 'bg-purple-400'[m
[31m-  }[m
[31m-}[m
[31m-[m
[31m-const PRIORIDAD_CONFIG = {[m
[31m-  alta: { label: '● Alta', color: 'text-red-500' },[m
[31m-  media: { label: '● Media', color: 'text-amber-500' },[m
[31m-  baja: { label: '● Baja', color: 'text-green-500' }[m
[31m-}[m
[31m-[m
[31m-export default function RecomendacionesIA({ datos }: Props) {[m
[31m-  const [cargando, setCargando] = useState(false)[m
[31m-  const [resumen, setResumen] = useState('')[m
[31m-  const [recomendaciones, setRecomendaciones] = useState<Recomendacion[]>([])[m
[31m-  const [error, setError] = useState('')[m
[31m-  const [generado, setGenerado] = useState(false)[m
[31m-[m
[31m-  async function generar() {[m
[31m-    setCargando(true)[m
[31m-    setError('')[m
[31m-[m
[31m-    try {[m
[31m-      const resultado = await obtenerRecomendaciones(datos)[m
[31m-      setResumen(resultado.resumen)[m
[31m-      setRecomendaciones(resultado.recomendaciones)[m
[31m-      setGenerado(true)[m
[31m-    } catch (e: any) {[m
[31m-      setError(e.message || 'Ocurrió un error. Verifica tu API Key en el archivo .env')[m
[31m-    } finally {[m
[31m-      setCargando(false)[m
[31m-    }[m
[31m-  }[m
[31m-[m
[31m-  return ([m
[31m-    <div className="bg-white rounded-xl border-2 border-purple-100 overflow-hidden">[m
[31m-      {/* Header */}[m
[31m-      <div className="bg-gradient-to-r from-purple-600 to-violet-600 p-5">[m
[31m-        <div className="flex items-center justify-between">[m
[31m-          <div className="flex items-center gap-3">[m
[31m-            <div className="bg-white/20 p-2 rounded-lg">[m
[31m-              <Sparkles className="w-5 h-5 text-white" />[m
[31m-            </div>[m
[31m-            <div>[m
[31m-              <h2 className="text-white font-bold text-lg">Recomendaciones con IA</h2>[m
[31m-              <p className="text-purple-200 text-sm">Análisis personalizado con Gemini</p>[m
[31m-            </div>[m
[31m-          </div>[m
[31m-[m
[31m-          {generado && ([m
[31m-            <button[m
[31m-              onClick={generar}[m
[31m-              disabled={cargando}[m
[31m-              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-2 rounded-lg transition-colors disabled:opacity-50"[m
[31m-            >[m
[31m-              <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />[m
[31m-              Actualizar[m
[31m-            </button>[m
[31m-          )}[m
[31m-        </div>[m
[31m-      </div>[m
[31m-[m
[31m-      <div className="p-5">[m
[31m-        {/* Estado inicial — sin generar */}[m
[31m-        {!generado && !cargando && !error && ([m
[31m-          <div className="text-center py-6">[m
[31m-            <div className="bg-purple-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">[m
[31m-              <Sparkles className="w-8 h-8 text-purple-400" />[m
[31m-            </div>[m
[31m-            <p className="text-gray-600 text-sm mb-1 font-medium">[m
[31m-              Análisis listo para generarse[m
[31m-            </p>[m
[31m-            <p className="text-gray-400 text-sm mb-5">[m
[31m-              Gemini revisará tu progreso, materias y resultados para darte consejos personalizados.[m
[31m-            </p>[m
[31m-            <button[m
[31m-              onClick={generar}[m
[31m-              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"[m
[31m-            >[m
[31m-              <Sparkles className="w-4 h-4" />[m
[31m-              Generar recomendaciones[m
[31m-            </button>[m
[31m-          </div>[m
[31m-        )}[m
[31m-[m
[31m-        {/* Cargando */}[m
[31m-        {cargando && ([m
[31m-          <div className="py-8">[m
[31m-            <div className="flex items-center gap-3 mb-4">[m
[31m-              <RefreshCw className="w-5 h-5 text-purple-500 animate-spin" />[m
[31m-              <p className="text-gray-600 text-sm font-medium">Analizando tu progreso...</p>[m
[31m-            </div>[m
[31m-            <div className="space-y-3">[m
[31m-              {[90, 75, 85, 60].map((w, i) => ([m
[31m-                <div key={i} className="flex gap-3 items-start p-3 border border-gray-100 rounded-lg">[m
[31m-                  <div className="w-7 h-7 bg-gray-100 rounded-lg animate-pulse flex-shrink-0" />[m
[31m-                  <div className="flex-1 space-y-2">[m
[31m-                    <div className={`h-3 bg-gray-100 rounded animate-pulse`} style={{ width: `${w}%` }} />[m
[31m-                    <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />[m
[31m-                  </div>[m
[31m-                </div>[m
[31m-              ))}[m
[31m-            </div>[m
[31m-          </div>[m
[31m-        )}[m
[31m-[m
[31m-        {/* Error */}[m
[31m-        {error && !cargando && ([m
[31m-          <div className="py-4">[m
[31m-            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4 mb-4">[m
[31m-              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />[m
[31m-              <div>[m
[31m-                <p className="text-red-700 text-sm font-medium">No se pudo generar el análisis</p>[m
[31m-                <p className="text-red-500 text-xs mt-1">{error}</p>[m
[31m-              </div>[m
[31m-            </div>[m
[31m-            <button[m
[31m-              onClick={generar}[m
[31m-              className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"[m
[31m-            >[m
[31m-              Intentar de nuevo[m
[31m-            </button>[m
[31m-          </div>[m
[31m-        )}[m
[31m-[m
[31m-        {/* Resultados */}[m
[31m-        {generado && !cargando && recomendaciones.length > 0 && ([m
[31m-          <div className="space-y-4">[m
[31m-            {/* Resumen */}[m
[31m-            <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">[m
[31m-              <p className="text-purple-900 text-sm leading-relaxed">{resumen}</p>[m
[31m-            </div>[m
[31m-[m
[31m-            {/* Lista de recomendaciones */}[m
[31m-            <div className="space-y-2">[m
[31m-              {recomendaciones.map((rec, i) => {[m
[31m-                const tipo = TIPO_CONFIG[rec.tipo] || TIPO_CONFIG.repasar[m
[31m-                const prioridad = PRIORIDAD_CONFIG[rec.prioridad] || PRIORIDAD_CONFIG.media[m
[31m-[m
[31m-                return ([m
[31m-                  <div[m
[31m-                    key={i}[m
[31m-                    className={`flex items-start gap-3 p-3.5 rounded-lg border ${tipo.bg} ${tipo.border}`}[m
[31m-                  >[m
[31m-                    <div className={`w-2 h-2 rounded-full ${tipo.dot} flex-shrink-0 mt-1.5`} />[m
[31m-                    <div className="flex-1 min-w-0">[m
[31m-                      <div className="flex items-center gap-2 flex-wrap mb-1">[m
[31m-                        <p className={`font-semibold text-sm ${tipo.text}`}>{rec.titulo}</p>[m
[31m-                        <span className={`text-xs px-2 py-0.5 rounded-full bg-white/60 ${tipo.text} font-medium`}>[m
[31m-                          {tipo.label}[m
[31m-                        </span>[m
[31m-                      </div>[m
[31m-                      <p className={`text-xs leading-relaxed ${tipo.text} opacity-80`}>[m
[31m-                        {rec.descripcion}[m
[31m-                      </p>[m
[31m-                      <p className={`text-xs mt-1.5 font-medium ${prioridad.color}`}>[m
[31m-                        {prioridad.label}[m
[31m-                      </p>[m
[31m-                    </div>[m
[31m-                    <ChevronRight className={`w-4 h-4 ${tipo.text} opacity-50 flex-shrink-0 mt-1`} />[m
[31m-                  </div>[m
[31m-                )[m
[31m-              })}[m
[31m-            </div>[m
[31m-[m
[31m-            <p className="text-xs text-gray-400 text-center pt-1">[m
[31m-              Generado por Gemini · Basado en tu actividad real en StudyQuest[m
[31m-            </p>[m
[31m-          </div>[m
[31m-        )}[m
[31m-      </div>[m
[31m-    </div>[m
[31m-  )[m
[31m-}[m
[1mdiff --git a/src/lib/gemini.ts b/src/lib/gemini.ts[m
[1mdeleted file mode 100644[m
[1mindex 7cc486a..0000000[m
[1m--- a/src/lib/gemini.ts[m
[1m+++ /dev/null[m
[36m@@ -1,95 +0,0 @@[m
[31m-// ─────────────────────────────────────────────[m
[31m-//  Servicio de Gemini para StudyQuest[m
[31m-//  La API Key se lee desde .env → VITE_GEMINI_API_KEY[m
[31m-// ─────────────────────────────────────────────[m
[31m-[m
[31m-const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY[m
[31m-const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`[m
[31m-[m
[31m-export interface DatosEstudiante {[m
[31m-  nombre: string[m
[31m-  nivel: number[m
[31m-  xp: number[m
[31m-  racha: number[m
[31m-  tipoAprendizaje: string[m
[31m-  totalMinutos: number[m
[31m-  tasaExito: number[m
[31m-  materias: string[][m
[31m-  flashcardsTotal: number[m
[31m-  examenesTotal: number[m
[31m-  areasFuertes: string[][m
[31m-  areasDebiles: string[][m
[31m-}[m
[31m-[m
[31m-export interface Recomendacion {[m
[31m-  titulo: string[m
[31m-  descripcion: string[m
[31m-  tipo: 'reforzar' | 'siguiente' | 'repasar' | 'habito'[m
[31m-  prioridad: 'alta' | 'media' | 'baja'[m
[31m-}[m
[31m-[m
[31m-export interface RespuestaGemini {[m
[31m-  resumen: string[m
[31m-  recomendaciones: Recomendacion[][m
[31m-}[m
[31m-[m
[31m-export async function obtenerRecomendaciones(datos: DatosEstudiante): Promise<RespuestaGemini> {[m
[31m-  const prompt = `Eres un tutor de aprendizaje personalizado dentro de una app educativa llamada StudyQuest. [m
[31m-Analiza los datos de este estudiante y devuelve exactamente 4 recomendaciones concretas y motivadoras en español.[m
[31m-[m
[31m-DATOS DEL ESTUDIANTE:[m
[31m-- Nombre: ${datos.nombre}[m
[31m-- Nivel: ${datos.nivel} | XP: ${datos.xp}[m
[31m-- Racha actual: ${datos.racha} días consecutivos[m
[31m-- Tipo de aprendizaje: ${datos.tipoAprendizaje}[m
[31m-- Tiempo total de estudio: ${Math.round(datos.totalMinutos / 60)} horas (${datos.totalMinutos} minutos)[m
[31m-- Tasa de éxito en exámenes: ${datos.tasaExito}%[m
[31m-- Materias registradas: ${datos.materias.join(', ') || 'ninguna aún'}[m
[31m-- Flashcards creadas: ${datos.flashcardsTotal}[m
[31m-- Exámenes completados: ${datos.examenesTotal}[m
[31m-- Áreas fuertes (más tiempo): ${datos.areasFuertes.join(', ') || 'sin datos'}[m
[31m-- Áreas débiles (menos tiempo): ${datos.areasDebiles.join(', ') || 'sin datos'}[m
[31m-[m
[31m-INSTRUCCIONES:[m
[31m-- Basa las recomendaciones en el tipo de aprendizaje "${datos.tipoAprendizaje}"[m
[31m-- Si la tasa de éxito es baja (<60%), prioriza reforzar temas[m
[31m-- Si la racha es alta (>5), felicita y sugiere un reto mayor[m
[31m-- Si hay pocas flashcards (<10), sugiere crearlas[m
[31m-- Sé motivador y específico, no genérico[m
[31m-[m
[31m-Responde SOLO con este JSON (sin backticks, sin texto extra):[m
[31m-{[m
[31m-  "resumen": "2 oraciones máximo resumiendo el estado y potencial del estudiante.",[m
[31m-  "recomendaciones": [[m
[31m-    {[m
[31m-      "titulo": "Título corto (máx 5 palabras)",[m
[31m-      "descripcion": "Acción concreta y específica que debe hacer (1-2 oraciones)",[m
[31m-      "tipo": "reforzar|siguiente|repasar|habito",[m
[31m-      "prioridad": "alta|media|baja"[m
[31m-    }[m
[31m-  ][m
[31m-}`[m
[31m-[m
[31m-  const response = await fetch(GEMINI_URL, {[m
[31m-    method: 'POST',[m
[31m-    headers: { 'Content-Type': 'application/json' },[m
[31m-    body: JSON.stringify({[m
[31m-      contents: [{ parts: [{ text: prompt }] }][m
[31m-    })[m
[31m-  })[m
[31m-[m
[31m-  if (!response.ok) {[m
[31m-    const err = await response.json()[m
[31m-    throw new Error(err.error?.message || 'Error al contactar Gemini')[m
[31m-  }[m
[31m-[m
[31m-  const data = await response.json()[m
[31m-  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''[m
[31m-  const clean = rawText.replace(/```json|```/g, '').trim()[m
[31m-[m
[31m-  try {[m
[31m-    return JSON.parse(clean) as RespuestaGemini[m
[31m-  } catch {[m
[31m-    throw new Error('No se pudo interpretar la respuesta de Gemini')[m
[31m-  }[m
[31m-}[m
