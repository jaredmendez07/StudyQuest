import { useEffect, useState } from 'react';
import {
  FileText,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Award,
  Edit2,
  Trash2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LoadingBrain from './LoadingBrain';

interface Exam {
  id: string;
  title: string;
  materia: string;
  materiaId: string | null;
  questions: number;
  duration: number;
  score?: number;
  completed: boolean;
  color: string;
}

interface Question {
  id: string;
  examId: string;
  question: string;
  options: string[];
  correct: number;
}

interface Materia {
  id: string;
  nombre: string;
  color: string;
}

export default function Examenes() {
  const [view, setView] = useState<'list' | 'take' | 'results' | 'editor'>('list');
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  const [exams, setExams] = useState<Exam[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateExam, setShowCreateExam] = useState(false);
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamMateria, setNewExamMateria] = useState('');

  const [editTitle, setEditTitle] = useState('');
  const [editMateria, setEditMateria] = useState('');

  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(['', '', '', '']);
  const [newCorrect, setNewCorrect] = useState(0);

  const [studySeconds, setStudySeconds] = useState(0);
  const [xpMessage, setXpMessage] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    let interval: any = null;

    if (view === 'take' && selectedExam) {
      interval = setInterval(() => {
        setStudySeconds((prev) => {
          const next = prev + 1;

          if (next >= 25 * 60) {
            guardarXPExamen();
            return 0;
          }

          return next;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [view, selectedExam, exams]);

  async function getUser() {
    const { data } = await supabase.auth.getSession();
    return data.session?.user;
  }

  async function guardarXPExamen() {
    const user = await getUser();

    if (!user || !selectedExam) return;

    const examActual = exams.find(e => e.id === selectedExam);
    const xpGanado = 50;

    await supabase.from('sesiones_estudio').insert({
      usuario_id: user.id,
      materia: examActual?.materia || 'Examen',
      materia_id: examActual?.materiaId ? Number(examActual.materiaId) : null,
      minutos: 25,
      concentracion: 8,
      xp_ganado: xpGanado,
      origen: 'examen'
    });

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (perfil) {
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

    setXpMessage('Ganaste 50 XP por practicar exámenes 25 minutos 🚀');

    setTimeout(() => {
      setXpMessage('');
    }, 4000);
  }

  function formatTime(seconds: number) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;

    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  async function cargarDatos() {
    setLoading(true);

    const user = await getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: materiasData } = await supabase
      .from('materias')
      .select('*')
      .eq('usuario_id', user.id)
      .order('nombre', { ascending: true });

    const { data: examenesData } = await supabase
      .from('examenes')
      .select('*')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false });

    const examIds = (examenesData || []).map((e: any) => e.id);

    let preguntasData: any[] = [];

    if (examIds.length > 0) {
      const { data } = await supabase
        .from('preguntas_examen')
        .select('*')
        .in('examen_id', examIds);

      preguntasData = data || [];
    }

    const { data: resultadosData } = await supabase
      .from('resultados_examen')
      .select('*')
      .eq('usuario_id', user.id)
      .order('fecha', { ascending: false });

    const mappedMaterias: Materia[] = (materiasData || []).map((m: any) => ({
      id: String(m.id),
      nombre: m.nombre,
      color: m.color || '#8b5cf6'
    }));

    const mappedQuestions: Question[] = preguntasData.map((q: any) => {
      const options = [q.opcion_1, q.opcion_2, q.opcion_3, q.opcion_4];
      const correctIndex = options.findIndex(op => op === q.respuesta_correcta);

      return {
        id: String(q.id),
        examId: String(q.examen_id),
        question: q.pregunta,
        options,
        correct: correctIndex >= 0 ? correctIndex : 0
      };
    });

    const mappedExams: Exam[] = (examenesData || []).map((exam: any) => {
      const materia = mappedMaterias.find(m => String(m.id) === String(exam.materia_id));
      const preguntasExam = mappedQuestions.filter(q => q.examId === String(exam.id));
      const resultado = (resultadosData || []).find((r: any) => String(r.examen_id) === String(exam.id));

      const score = resultado && resultado.total_preguntas > 0
        ? Math.round((resultado.aciertos / resultado.total_preguntas) * 100)
        : undefined;

      return {
        id: String(exam.id),
        title: exam.titulo,
        materia: materia?.nombre || exam.materia || 'Sin materia',
        materiaId: exam.materia_id ? String(exam.materia_id) : null,
        questions: preguntasExam.length,
        duration: Math.max(10, preguntasExam.length * 3),
        completed: !!resultado,
        score,
        color: materia?.color || '#8b5cf6'
      };
    });

    setMaterias(mappedMaterias);
    setQuestions(mappedQuestions);
    setExams(mappedExams);
    setLoading(false);
  }

  async function crearExamen() {
    if (!newExamTitle.trim() || !newExamMateria) return;

    const user = await getUser();
    if (!user) return;

    const materia = materias.find(m => String(m.id) === String(newExamMateria));

    const { data, error } = await supabase
      .from('examenes')
      .insert({
        usuario_id: user.id,
        titulo: newExamTitle.trim(),
        materia: materia?.nombre || 'Sin materia',
        materia_id: Number(newExamMateria)
      })
      .select()
      .single();

    if (error) {
      console.log(error);
      return;
    }

    setNewExamTitle('');
    setNewExamMateria('');
    setShowCreateExam(false);

    await cargarDatos();

    setSelectedExam(String(data.id));
    setEditTitle(data.titulo);
    setEditMateria(String(data.materia_id));
    setView('editor');
  }

  function abrirEditor(examId: string) {
    const exam = exams.find(e => e.id === examId);

    if (!exam) return;

    setSelectedExam(examId);
    setEditTitle(exam.title);
    setEditMateria(exam.materiaId || '');
    setNewQuestion('');
    setNewOptions(['', '', '', '']);
    setNewCorrect(0);
    setView('editor');
  }

  async function guardarEdicionExamen() {
    if (!selectedExam || !editTitle.trim() || !editMateria) return;

    const materia = materias.find(m => String(m.id) === String(editMateria));

    const { error } = await supabase
      .from('examenes')
      .update({
        titulo: editTitle.trim(),
        materia: materia?.nombre || 'Sin materia',
        materia_id: Number(editMateria)
      })
      .eq('id', Number(selectedExam));

    if (error) {
      console.log(error);
      return;
    }

    await cargarDatos();
  }

  async function eliminarExamen(examId: string) {
    const { error } = await supabase
      .from('examenes')
      .delete()
      .eq('id', Number(examId));

    if (error) {
      console.log(error);
      return;
    }

    if (selectedExam === examId) {
      setSelectedExam(null);
      setView('list');
    }

    await cargarDatos();
  }

  async function agregarPregunta() {
    if (!selectedExam) return;
    if (!newQuestion.trim()) return;
    if (newOptions.some(op => !op.trim())) return;

    const { error } = await supabase
      .from('preguntas_examen')
      .insert({
        examen_id: Number(selectedExam),
        pregunta: newQuestion.trim(),
        opcion_1: newOptions[0].trim(),
        opcion_2: newOptions[1].trim(),
        opcion_3: newOptions[2].trim(),
        opcion_4: newOptions[3].trim(),
        respuesta_correcta: newOptions[newCorrect].trim()
      });

    if (error) {
      console.log(error);
      return;
    }

    setNewQuestion('');
    setNewOptions(['', '', '', '']);
    setNewCorrect(0);
    await cargarDatos();
  }

  async function eliminarPregunta(questionId: string) {
    const { error } = await supabase
      .from('preguntas_examen')
      .delete()
      .eq('id', Number(questionId));

    if (error) {
      console.log(error);
      return;
    }

    await cargarDatos();
  }

  const startExam = (examId: string) => {
    const examQuestions = questions.filter(q => q.examId === examId);

    if (examQuestions.length === 0) {
      abrirEditor(examId);
      return;
    }

    setSelectedExam(examId);
    setView('take');
    setCurrentQuestion(0);
    setAnswers([]);
    setStudySeconds(0);
    setXpMessage('');
  };

  const selectAnswer = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const nextQuestion = () => {
    const examQuestions = questions.filter(q => q.examId === selectedExam);

    if (currentQuestion < examQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  async function submitExam() {
    const user = await getUser();

    if (!user || !selectedExam) return;

    const examQuestions = questions.filter(q => q.examId === selectedExam);
    const correctAnswers = answers.filter((answer, index) => {
      return answer === examQuestions[index].correct;
    }).length;

    const { error } = await supabase
      .from('resultados_examen')
      .insert({
        usuario_id: user.id,
        examen_id: Number(selectedExam),
        aciertos: correctAnswers,
        total_preguntas: examQuestions.length
      });

    if (error) {
      console.log(error);
      return;
    }

    await cargarDatos();
    setStudySeconds(0);
    setView('results');
  }

  const exam = exams.find(e => e.id === selectedExam);
  const examQuestions = questions.filter(q => q.examId === selectedExam);
  const progress25 = (studySeconds / (25 * 60)) * 100;

  if (loading) {
    return <LoadingBrain mensaje="Cargando exámenes..." />;
  }

  if (view === 'editor' && exam) {
    return (
      <div className="space-y-6">
        <div>
          <button
            onClick={() => setView('list')}
            className="text-purple-600 hover:text-purple-700 font-medium mb-2"
          >
            ← Volver a Exámenes
          </button>

          <h1 className="text-3xl font-bold text-gray-900">Editar Examen</h1>
          <p className="text-gray-600 mt-1">Configura el examen y sus preguntas</p>
        </div>

        <div className="bg-white rounded-xl p-6 border-2 border-purple-500 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Datos del examen</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
              placeholder="Título del examen"
            />

            <select
              value={editMateria}
              onChange={(e) => setEditMateria(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
            >
              <option value="">Selecciona una materia</option>

              {materias.map((materia) => (
                <option key={materia.id} value={materia.id}>
                  {materia.nombre}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={guardarEdicionExamen}
            className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Guardar cambios
          </button>
        </div>

        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Agregar pregunta</h3>

          <input
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 mb-4"
            placeholder="Escribe la pregunta"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {newOptions.map((option, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input
                  type="radio"
                  checked={newCorrect === index}
                  onChange={() => setNewCorrect(index)}
                />

                <input
                  value={option}
                  onChange={(e) => {
                    const updated = [...newOptions];
                    updated[index] = e.target.value;
                    setNewOptions(updated);
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                  placeholder={`Opción ${index + 1}`}
                />
              </div>
            ))}
          </div>

          <button
            onClick={agregarPregunta}
            className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Agregar pregunta
          </button>
        </div>

        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Preguntas del examen ({examQuestions.length})
          </h3>

          <div className="space-y-4">
            {examQuestions.length === 0 && (
              <p className="text-gray-500">Este examen todavía no tiene preguntas.</p>
            )}

            {examQuestions.map((question, index) => (
              <div key={question.id} className="border-2 border-gray-200 rounded-lg p-4">
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="font-bold text-gray-900">
                      {index + 1}. {question.question}
                    </p>

                    <div className="mt-2 space-y-1">
                      {question.options.map((option, optionIndex) => (
                        <p
                          key={optionIndex}
                          className={optionIndex === question.correct ? 'text-green-600 font-medium' : 'text-gray-600'}
                        >
                          {optionIndex === question.correct ? '✓ ' : ''}
                          {option}
                        </p>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => eliminarPregunta(question.id)}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors h-fit"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => startExam(exam.id)}
          disabled={examQuestions.length === 0}
          className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Probar Examen
        </button>
      </div>
    );
  }

  if (view === 'take' && exam) {
    const question = examQuestions[currentQuestion];

    if (!question) {
      return (
        <div className="space-y-6">
          <button
            onClick={() => setView('list')}
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            ← Volver a Exámenes
          </button>

          <div className="bg-white rounded-xl p-8 border-2 border-gray-200 text-center">
            <p className="text-gray-600 mb-4">Este examen no tiene preguntas todavía.</p>
            <button
              onClick={() => abrirEditor(exam.id)}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Agregar preguntas
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="w-5 h-5 text-purple-600" />
              <span className="font-medium">Tiempo practicando</span>
            </div>
            <span className="font-bold text-purple-600">
              {formatTime(studySeconds)} / 25:00
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${progress25}%` }}
            />
          </div>

          {xpMessage && (
            <p className="text-purple-700 font-bold mt-3">
              {xpMessage}
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <button
                onClick={() => {
                  setView('list');
                  setStudySeconds(0);
                }}
                className="text-purple-600 hover:text-purple-700 font-medium mb-2"
              >
                ← Salir del examen
              </button>

              <h2 className="text-2xl font-bold text-gray-900">{exam.title}</h2>
              <p className="text-gray-600">{exam.materia}</p>
            </div>

            <div className="flex items-center gap-2 bg-purple-100 px-4 py-2 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
              <span className="font-bold text-purple-600">{exam.duration}:00</span>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Pregunta {currentQuestion + 1} de {examQuestions.length}</span>
              <span>{Math.round(((currentQuestion + 1) / examQuestions.length) * 100)}% completado</span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${((currentQuestion + 1) / examQuestions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 border-2 border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-6">{question.question}</h3>

          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => selectAnswer(index)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  answers[currentQuestion] === index
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-300 hover:border-purple-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      answers[currentQuestion] === index
                        ? 'border-purple-600 bg-purple-600'
                        : 'border-gray-400'
                    }`}
                  >
                    {answers[currentQuestion] === index && (
                      <div className="w-3 h-3 bg-white rounded-full" />
                    )}
                  </div>

                  <span className="font-medium text-gray-900">{option}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-4 mt-8">
            <button
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              className="px-6 py-3 rounded-lg border-2 border-gray-300 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>

            {currentQuestion < examQuestions.length - 1 ? (
              <button
                onClick={nextQuestion}
                disabled={answers[currentQuestion] === undefined}
                className="flex-1 px-6 py-3 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
            ) : (
              <button
                onClick={submitExam}
                disabled={answers[currentQuestion] === undefined}
                className="flex-1 px-6 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Finalizar Examen
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'results' && exam) {
    const correctAnswers = answers.filter((answer, index) => {
      return answer === examQuestions[index].correct;
    }).length;

    const score = examQuestions.length > 0
      ? Math.round((correctAnswers / examQuestions.length) * 100)
      : 0;

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-8 text-white text-center">
          <Award className="w-16 h-16 mx-auto mb-4" />

          <h2 className="text-3xl font-bold mb-2">¡Examen Completado!</h2>
          <p className="text-xl mb-4">{exam.title}</p>

          <div className="text-6xl font-bold mb-2">{score}%</div>

          <p className="text-lg">
            {correctAnswers} de {examQuestions.length} respuestas correctas
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Revisión de Respuestas</h3>

          <div className="space-y-4">
            {examQuestions.map((question, index) => {
              const isCorrect = answers[index] === question.correct;
              const selectedAnswer = answers[index];

              return (
                <div key={question.id} className="border-2 border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    {isCorrect ? (
                      <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                    )}

                    <div className="flex-1">
                      <p className="font-medium text-gray-900 mb-2">{question.question}</p>

                      <p className="text-sm text-gray-600">
                        Tu respuesta:{' '}
                        <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                          {selectedAnswer !== undefined ? question.options[selectedAnswer] : 'Sin responder'}
                        </span>
                      </p>

                      {!isCorrect && (
                        <p className="text-sm text-gray-600">
                          Correcta:{' '}
                          <span className="text-green-600">
                            {question.options[question.correct]}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => {
            setView('list');
            setSelectedExam(null);
            setCurrentQuestion(0);
            setAnswers([]);
            setStudySeconds(0);
          }}
          className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          Volver a Exámenes
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exámenes</h1>
          <p className="text-gray-600 mt-1">Evalúa tu conocimiento</p>
        </div>

        <button
          onClick={() => setShowCreateExam(!showCreateExam)}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          Crear Examen
        </button>
      </div>

      {showCreateExam && (
        <div className="bg-white rounded-xl p-6 border-2 border-purple-500 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Crear Nuevo Examen</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              value={newExamTitle}
              onChange={(e) => setNewExamTitle(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
              placeholder="Título del examen"
            />

            <select
              value={newExamMateria}
              onChange={(e) => setNewExamMateria(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
            >
              <option value="">Selecciona una materia</option>

              {materias.map((materia) => (
                <option key={materia.id} value={materia.id}>
                  {materia.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={crearExamen}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Crear y agregar preguntas
            </button>

            <button
              onClick={() => {
                setShowCreateExam(false);
                setNewExamTitle('');
                setNewExamMateria('');
              }}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {exams.length === 0 ? (
        <div className="bg-white rounded-xl p-8 border-2 border-gray-200 text-center">
          <p className="text-gray-600">Todavía no tienes exámenes creados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="h-3" style={{ backgroundColor: exam.color }} />

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: `${exam.color}20` }}
                    >
                      <FileText className="w-6 h-6" style={{ color: exam.color }} />
                    </div>

                    <div>
                      <h3 className="font-bold text-xl text-gray-900">{exam.title}</h3>
                      <p className="text-sm text-gray-600">{exam.materia}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {exam.completed && exam.score !== undefined && (
                      <div className="bg-green-100 px-3 py-1 rounded-full">
                        <span className="text-green-700 font-bold text-sm">{exam.score}%</span>
                      </div>
                    )}

                    <button
                      onClick={() => abrirEditor(exam.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-gray-600" />
                    </button>

                    <button
                      onClick={() => eliminarExamen(exam.id)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">{exam.questions} preguntas</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{exam.duration} minutos</span>
                  </div>
                </div>

                <button
                  onClick={() => startExam(exam.id)}
                  className="w-full py-2 rounded-lg text-white font-medium hover:opacity-90 transition-all"
                  style={{ backgroundColor: exam.color }}
                >
                  {exam.questions === 0
                    ? 'Agregar Preguntas'
                    : exam.completed
                      ? 'Reintentar'
                      : 'Comenzar Examen'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}