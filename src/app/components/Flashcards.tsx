import { useEffect, useState } from 'react';
import { Layers, Plus, Play, Edit, Trash2, RotateCw, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Deck {
  id: string;
  name: string;
  materia: string;
  materiaId: string | null;
  cardCount: number;
  reviewed: number;
  color: string;
}

interface Card {
  id: string;
  front: string;
  back: string;
  deckId: string;
}

interface Materia {
  id: string;
  nombre: string;
  color: string;
}

export default function Flashcards() {
  const [view, setView] = useState<'decks' | 'study'>('decks');
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const [materias, setMaterias] = useState<Materia[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Card[]>([]);

  const [showNewDeck, setShowNewDeck] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckMateria, setNewDeckMateria] = useState('');

  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [editDeckName, setEditDeckName] = useState('');
  const [editDeckMateria, setEditDeckMateria] = useState('');

  const [showNewCard, setShowNewCard] = useState(false);
  const [newCardFront, setNewCardFront] = useState('');
  const [newCardBack, setNewCardBack] = useState('');

  const [studySeconds, setStudySeconds] = useState(0);
  const [xpMessage, setXpMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    let interval: any = null;

    if (view === 'study' && selectedDeck) {
      interval = setInterval(() => {
        setStudySeconds((prev) => {
          const next = prev + 1;

          if (next >= 25 * 60) {
            guardarXPFlashcards();
            return 0;
          }

          return next;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [view, selectedDeck]);

  async function getUser() {
    const { data } = await supabase.auth.getSession();
    return data.session?.user;
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

    const { data: mazosData } = await supabase
      .from('mazos_flashcards')
      .select(`
        id,
        nombre,
        materia_id,
        materias (
          id,
          nombre,
          color
        ),
        flashcards (
          id
        )
      `)
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false });

    const { data: tarjetasData } = await supabase
      .from('flashcards')
      .select('*')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: true });

    const mappedMaterias: Materia[] = (materiasData || []).map((m: any) => ({
      id: String(m.id),
      nombre: m.nombre,
      color: m.color || '#8b5cf6'
    }));

    const mappedDecks: Deck[] = (mazosData || []).map((deck: any) => ({
      id: String(deck.id),
      name: deck.nombre,
      materia: deck.materias?.nombre || 'Sin materia',
      materiaId: deck.materia_id ? String(deck.materia_id) : null,
      cardCount: deck.flashcards?.length || 0,
      reviewed: 0,
      color: deck.materias?.color || '#8b5cf6'
    }));

    const mappedCards: Card[] = (tarjetasData || []).map((card: any) => ({
      id: String(card.id),
      front: card.pregunta,
      back: card.respuesta,
      deckId: String(card.mazo_id)
    }));

    setMaterias(mappedMaterias);
    setDecks(mappedDecks);
    setCards(mappedCards);
    setLoading(false);
  }

  async function guardarXPFlashcards() {
    const user = await getUser();
    if (!user || !selectedDeck) return;

    const currentDeck = decks.find(d => d.id === selectedDeck);
    const xpGanado = 50;

    await supabase.from('sesiones_estudio').insert({
      usuario_id: user.id,
      materia: currentDeck?.materia || 'Flashcards',
      materia_id: currentDeck?.materiaId ? Number(currentDeck.materiaId) : null,
      minutos: 25,
      concentracion: 8,
      xp_ganado: xpGanado,
      origen: 'flashcards'
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

    setXpMessage('Ganaste 50 XP por estudiar 25 minutos 🚀');

    setTimeout(() => {
      setXpMessage('');
    }, 4000);
  }

  async function crearMazo() {
    if (!newDeckName.trim() || !newDeckMateria) return;

    const user = await getUser();
    if (!user) return;

    const { error } = await supabase.from('mazos_flashcards').insert({
      usuario_id: user.id,
      materia_id: Number(newDeckMateria),
      nombre: newDeckName.trim()
    });

    if (error) {
      console.log(error);
      return;
    }

    setNewDeckName('');
    setNewDeckMateria('');
    setShowNewDeck(false);
    cargarDatos();
  }

  function abrirEdicionMazo(deck: Deck) {
    setEditingDeckId(deck.id);
    setEditDeckName(deck.name);
    setEditDeckMateria(deck.materiaId || '');
    setShowNewDeck(false);
  }

  async function guardarEdicionMazo() {
    if (!editingDeckId || !editDeckName.trim() || !editDeckMateria) return;

    const { error } = await supabase
      .from('mazos_flashcards')
      .update({
        nombre: editDeckName.trim(),
        materia_id: Number(editDeckMateria)
      })
      .eq('id', Number(editingDeckId));

    if (error) {
      console.log(error);
      return;
    }

    setEditingDeckId(null);
    setEditDeckName('');
    setEditDeckMateria('');
    cargarDatos();
  }

  async function crearTarjeta() {
    if (!selectedDeck || !newCardFront.trim() || !newCardBack.trim()) return;

    const user = await getUser();
    if (!user) return;

    const currentDeck = decks.find(d => d.id === selectedDeck);

    const { error } = await supabase.from('flashcards').insert({
      usuario_id: user.id,
      mazo_id: Number(selectedDeck),
      materia: currentDeck?.materia || 'Sin materia',
      pregunta: newCardFront.trim(),
      respuesta: newCardBack.trim()
    });

    if (error) {
      console.log(error);
      return;
    }

    setNewCardFront('');
    setNewCardBack('');
    setShowNewCard(false);
    await cargarDatos();
  }

  async function eliminarMazo(deckId: string) {
    const { error } = await supabase
      .from('mazos_flashcards')
      .delete()
      .eq('id', Number(deckId));

    if (error) {
      console.log(error);
      return;
    }

    if (selectedDeck === deckId) {
      setSelectedDeck(null);
      setView('decks');
    }

    cargarDatos();
  }

  async function eliminarTarjeta(cardId: string) {
    const { error } = await supabase
      .from('flashcards')
      .delete()
      .eq('id', Number(cardId));

    if (error) {
      console.log(error);
      return;
    }

    await cargarDatos();
    setCurrentCardIndex(0);
    setIsFlipped(false);
  }

  const startStudy = (deckId: string) => {
    setSelectedDeck(deckId);
    setView('study');
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setShowNewCard(false);
    setStudySeconds(0);
    setXpMessage('');
  };

  const currentDeck = decks.find(d => d.id === selectedDeck);
  const deckCards = cards.filter(c => c.deckId === selectedDeck);
  const currentCard = deckCards[currentCardIndex];

  const nextCard = () => {
    if (currentCardIndex < deckCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    }
  };

  const previousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  };

  function formatTime(seconds: number) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  const progress25 = (studySeconds / (25 * 60)) * 100;

  if (loading) {
    return <p>Cargando flashcards...</p>;
  }

  if (view === 'study' && currentDeck) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => {
                setView('decks');
                setSelectedDeck(null);
                setStudySeconds(0);
              }}
              className="text-purple-600 hover:text-purple-700 font-medium mb-2"
            >
              ← Volver a Mazos
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{currentDeck.name}</h1>
            <p className="text-gray-600 mt-1">
              {deckCards.length > 0
                ? `Tarjeta ${currentCardIndex + 1} de ${deckCards.length}`
                : 'Este mazo todavía no tiene tarjetas'}
            </p>
          </div>

          <button
            onClick={() => setShowNewCard(!showNewCard)}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            Nueva Tarjeta
          </button>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="w-5 h-5 text-purple-600" />
              <span className="font-medium">Tiempo estudiando</span>
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

        {showNewCard && (
          <div className="bg-white rounded-xl p-6 border-2 border-purple-500 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Agregar Tarjeta</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <textarea
                value={newCardFront}
                onChange={(e) => setNewCardFront(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                placeholder="Pregunta"
              />

              <textarea
                value={newCardBack}
                onChange={(e) => setNewCardBack(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                placeholder="Respuesta"
              />
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={crearTarjeta}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Guardar Tarjeta
              </button>

              <button
                onClick={() => {
                  setShowNewCard(false);
                  setNewCardFront('');
                  setNewCardBack('');
                }}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {currentCard ? (
          <div className="max-w-2xl mx-auto">
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="relative h-96 cursor-pointer perspective"
            >
              <div
                className={`absolute w-full h-full transition-transform duration-500 transform-style-3d ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}
              >
                <div className="absolute w-full h-full backface-hidden">
                  <div className="bg-white rounded-xl p-8 border-2 border-gray-200 h-full flex flex-col items-center justify-center shadow-lg">
                    <p className="text-gray-500 text-sm mb-4">PREGUNTA</p>
                    <p className="text-2xl text-center text-gray-900">{currentCard.front}</p>
                    <p className="text-gray-400 text-sm mt-8">Click para voltear</p>
                  </div>
                </div>

                <div
                  className="absolute w-full h-full backface-hidden rotate-y-180 rounded-xl"
                  style={{ backgroundColor: currentDeck.color }}
                >
                  <div className="rounded-xl p-8 h-full flex flex-col items-center justify-center shadow-lg">
                    <p className="text-white/80 text-sm mb-4">RESPUESTA</p>
                    <p className="text-2xl text-center text-white">{currentCard.back}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={previousCard}
                disabled={currentCardIndex === 0}
                className="flex-1 py-3 rounded-lg border-2 border-gray-300 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>

              <button
                onClick={() => setIsFlipped(!isFlipped)}
                className="flex-1 py-3 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCw className="w-5 h-5" />
                Voltear
              </button>

              <button
                onClick={nextCard}
                disabled={currentCardIndex === deckCards.length - 1}
                className="flex-1 py-3 rounded-lg border-2 border-gray-300 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <button
                onClick={nextCard}
                className="py-3 rounded-lg bg-green-500 text-white font-medium hover:bg-green-600 transition-colors"
              >
                ✓ Fácil
              </button>

              <button
                onClick={nextCard}
                className="py-3 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
              >
                ✗ Difícil
              </button>

              <button
                onClick={() => eliminarTarjeta(currentCard.id)}
                className="py-3 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 border-2 border-gray-200 text-center">
            <p className="text-gray-600 mb-4">Este mazo no tiene tarjetas todavía.</p>
            <button
              onClick={() => setShowNewCard(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Crear primera tarjeta
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Flashcards</h1>
          <p className="text-gray-600 mt-1">Estudia con tarjetas de memoria</p>
        </div>

        <button
          onClick={() => {
            setShowNewDeck(!showNewDeck);
            setEditingDeckId(null);
          }}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          Nuevo Mazo
        </button>
      </div>

      {showNewDeck && (
        <div className="bg-white rounded-xl p-6 border-2 border-purple-500 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Crear Nuevo Mazo</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              value={newDeckName}
              onChange={(e) => setNewDeckName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
              placeholder="Nombre del mazo"
            />

            <select
              value={newDeckMateria}
              onChange={(e) => setNewDeckMateria(e.target.value)}
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
              onClick={crearMazo}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Crear Mazo
            </button>

            <button
              onClick={() => {
                setShowNewDeck(false);
                setNewDeckName('');
                setNewDeckMateria('');
              }}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {editingDeckId && (
        <div className="bg-white rounded-xl p-6 border-2 border-purple-500 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Editar Mazo</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              value={editDeckName}
              onChange={(e) => setEditDeckName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
              placeholder="Nombre del mazo"
            />

            <select
              value={editDeckMateria}
              onChange={(e) => setEditDeckMateria(e.target.value)}
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
              onClick={guardarEdicionMazo}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Guardar cambios
            </button>

            <button
              onClick={() => {
                setEditingDeckId(null);
                setEditDeckName('');
                setEditDeckMateria('');
              }}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {decks.length === 0 ? (
        <div className="bg-white rounded-xl p-8 border-2 border-gray-200 text-center">
          <p className="text-gray-600">Todavía no tienes mazos creados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map((deck) => (
            <div
              key={deck.id}
              className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="h-3" style={{ backgroundColor: deck.color }} />
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: `${deck.color}20` }}
                    >
                      <Layers className="w-6 h-6" style={{ color: deck.color }} />
                    </div>

                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{deck.name}</h3>
                      <p className="text-sm text-gray-600">{deck.materia}</p>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => abrirEdicionMazo(deck)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>

                    <button
                      onClick={() => eliminarMazo(deck.id)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progreso</span>
                    <span className="text-gray-900 font-medium">
                      {deck.reviewed}/{deck.cardCount}
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${deck.cardCount > 0 ? (deck.reviewed / deck.cardCount) * 100 : 0}%`,
                        backgroundColor: deck.color
                      }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => startStudy(deck.id)}
                  className="w-full py-2 rounded-lg text-white font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  style={{ backgroundColor: deck.color }}
                >
                  <Play className="w-4 h-4" />
                  Estudiar Ahora
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}