import { useEffect, useState } from 'react';
import { Book, Plus, Trash2, Edit2, BarChart3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LoadingBrain from './LoadingBrain';

interface Materia {
  id: string;
  name: string;
  color: string;
  cardsCount: number;
  examsCount: number;
  studyTime: number;
}

export default function Materias() {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newMateria, setNewMateria] = useState({ name: '', color: '#8b5cf6' });
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [materiaEditada, setMateriaEditada] = useState({ name: '', color: '#8b5cf6' });
  const [estadisticaAbierta, setEstadisticaAbierta] = useState<Materia | null>(null);
  const [loading, setLoading] = useState(true);

  const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#84cc16'];

  useEffect(() => {
    cargarMaterias();
  }, []);

  async function cargarMaterias() {
    setLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: materiasData, error } = await supabase
      .from('materias')
      .select(`
        id,
        nombre,
        color,
        mazos_flashcards (
          id,
          flashcards (
            id
          )
        ),
        examenes (
          id
        ),
        sesiones_estudio (
          minutos
        )
      `)
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.log(error);
      setLoading(false);
      return;
    }

    const materiasMapeadas: Materia[] = (materiasData || []).map((materia: any) => {
      const cardsCount = (materia.mazos_flashcards || []).reduce((total: number, mazo: any) => {
        return total + (mazo.flashcards?.length || 0);
      }, 0);

      const examsCount = materia.examenes?.length || 0;

      const totalMinutos = (materia.sesiones_estudio || []).reduce((total: number, sesion: any) => {
        return total + (sesion.minutos || 0);
      }, 0);

      return {
        id: String(materia.id),
        name: materia.nombre,
        color: materia.color || '#8b5cf6',
        cardsCount,
        examsCount,
        studyTime: Math.round(totalMinutos / 60)
      };
    });

    setMaterias(materiasMapeadas);
    setLoading(false);
  }

  async function handleAddMateria() {
    if (!newMateria.name.trim()) return;

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) return;

    const { error } = await supabase.from('materias').insert({
      usuario_id: user.id,
      nombre: newMateria.name.trim(),
      color: newMateria.color
    });

    if (error) {
      console.log(error);
      return;
    }

    setNewMateria({ name: '', color: '#8b5cf6' });
    setIsAdding(false);
    cargarMaterias();
  }

  function abrirEdicion(materia: Materia) {
    setEditandoId(materia.id);
    setMateriaEditada({
      name: materia.name,
      color: materia.color
    });
  }

  async function guardarEdicion() {
    if (!editandoId || !materiaEditada.name.trim()) return;

    const { error } = await supabase
      .from('materias')
      .update({
        nombre: materiaEditada.name.trim(),
        color: materiaEditada.color
      })
      .eq('id', Number(editandoId));

    if (error) {
      console.log(error);
      return;
    }

    setEditandoId(null);
    setMateriaEditada({ name: '', color: '#8b5cf6' });
    cargarMaterias();
  }

  async function handleDeleteMateria(id: string) {
    const { error } = await supabase
      .from('materias')
      .delete()
      .eq('id', Number(id));

    if (error) {
      console.log(error);
      return;
    }

    if (estadisticaAbierta?.id === id) {
      setEstadisticaAbierta(null);
    }

    cargarMaterias();
  }

  if (loading) {
    return <LoadingBrain mensaje="Cargando materias..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Materias</h1>
          <p className="text-gray-600 mt-1">Organiza tus áreas de estudio</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          Nueva Materia
        </button>
      </div>

      {isAdding && (
        <div className="bg-white rounded-xl p-6 border-2 border-purple-500 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Agregar Nueva Materia</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Materia
              </label>
              <input
                type="text"
                value={newMateria.name}
                onChange={(e) => setNewMateria({ ...newMateria, name: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                placeholder="Ej: Biología"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <div className="flex gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewMateria({ ...newMateria, color })}
                    className={`w-10 h-10 rounded-lg border-2 transition-all ${
                      newMateria.color === color ? 'border-gray-900 scale-110' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleAddMateria}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Agregar
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewMateria({ name: '', color: '#8b5cf6' });
              }}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {editandoId && (
        <div className="bg-white rounded-xl p-6 border-2 border-purple-500 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Editar Materia</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Materia
              </label>
              <input
                type="text"
                value={materiaEditada.name}
                onChange={(e) => setMateriaEditada({ ...materiaEditada, name: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <div className="flex gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setMateriaEditada({ ...materiaEditada, color })}
                    className={`w-10 h-10 rounded-lg border-2 transition-all ${
                      materiaEditada.color === color ? 'border-gray-900 scale-110' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={guardarEdicion}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Guardar cambios
            </button>

            <button
              onClick={() => {
                setEditandoId(null);
                setMateriaEditada({ name: '', color: '#8b5cf6' });
              }}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materias.map((materia) => (
          <div
            key={materia.id}
            className="bg-white rounded-xl overflow-hidden border-2 border-gray-200 hover:shadow-lg transition-all"
          >
            <div
              className="h-3"
              style={{ backgroundColor: materia.color }}
            />
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: `${materia.color}20` }}
                  >
                    <Book className="w-6 h-6" style={{ color: materia.color }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-gray-900">{materia.name}</h3>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => abrirEdicion(materia)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDeleteMateria(materia.id)}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Flashcards</span>
                  <span className="font-bold text-gray-900">{materia.cardsCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Exámenes</span>
                  <span className="font-bold text-gray-900">{materia.examsCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tiempo de Estudio</span>
                  <span className="font-bold text-gray-900">{materia.studyTime}h</span>
                </div>
              </div>

              <button
                onClick={() => setEstadisticaAbierta(materia)}
                className="w-full mt-4 py-2 rounded-lg border-2 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 font-medium"
                style={{ borderColor: materia.color, color: materia.color }}
              >
                <BarChart3 className="w-4 h-4" />
                Ver Estadísticas
              </button>
            </div>
          </div>
        ))}
      </div>

      {estadisticaAbierta && (
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              Estadísticas de {estadisticaAbierta.name}
            </h3>

            <button
              onClick={() => setEstadisticaAbierta(null)}
              className="text-gray-500 hover:text-gray-800 text-xl"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-purple-50 rounded-xl p-4">
              <p className="text-gray-600">Flashcards</p>
              <h4 className="text-2xl font-bold text-gray-900">
                {estadisticaAbierta.cardsCount}
              </h4>
            </div>

            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-gray-600">Exámenes</p>
              <h4 className="text-2xl font-bold text-gray-900">
                {estadisticaAbierta.examsCount}
              </h4>
            </div>

            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-gray-600">Tiempo de Estudio</p>
              <h4 className="text-2xl font-bold text-gray-900">
                {estadisticaAbierta.studyTime}h
              </h4>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}