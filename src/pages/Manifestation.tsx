import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  X,
  Gauge,
  Sparkles,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { getLifeArea } from '../constants/lifeAreas';
import { cn } from '../utils/cn';

const SPEED_OPTIONS = [
  { label: '3s', value: 3000 },
  { label: '5s', value: 5000 },
  { label: '10s', value: 10000 },
];

const MOTIVATIONAL_QUOTES = [
  "Your vision is the promise of what you shall one day be.",
  "The future belongs to those who believe in the beauty of their dreams.",
  "You are one decision away from a completely different life.",
  "Everything you want is on the other side of fear.",
  "Believe you can and you're halfway there.",
  "The only limit to our realization of tomorrow is our doubts of today.",
];

export default function Manifestation() {
  const navigate = useNavigate();
  const { visions } = useStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(5000);
  const [visible, setVisible] = useState(true);
  const [showQuote, setShowQuote] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);

  const total = visions.length;
  const currentVision = visions[currentIndex];

  const goNext = useCallback(() => {
    if (total === 0) return;
    setVisible(false);
    setTimeout(() => {
      setCurrentIndex((i) => {
        const next = (i + 1) % total;
        // Show quote between every other card
        if (next % 3 === 0) {
          setShowQuote(true);
          setQuoteIndex((q) => (q + 1) % MOTIVATIONAL_QUOTES.length);
          setTimeout(() => setShowQuote(false), 2000);
        }
        return next;
      });
      setVisible(true);
    }, 500);
  }, [total]);

  const goPrev = useCallback(() => {
    if (total === 0) return;
    setVisible(false);
    setTimeout(() => {
      setCurrentIndex((i) => (i - 1 + total) % total);
      setVisible(true);
    }, 500);
  }, [total]);

  // Auto-play
  useEffect(() => {
    if (!isPlaying || total === 0) return;
    const timer = setInterval(goNext, speed);
    return () => clearInterval(timer);
  }, [isPlaying, speed, goNext, total]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      switch (e.key) {
        case ' ':
          e.preventDefault();
          setIsPlaying((p) => !p);
          break;
        case 'Escape':
          navigate('/');
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          goNext();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          goPrev();
          break;
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [navigate, goNext, goPrev]);

  if (total === 0) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
        <Sparkles size={64} className="text-violet-400/40 mb-6" />
        <h2 className="text-2xl font-bold text-white mb-3">No Visions Yet</h2>
        <p className="text-gray-400 mb-8 text-center max-w-sm">
          Add visions to your vision board first to experience manifestation mode.
        </p>
        <button
          onClick={() => navigate('/vision')}
          className="px-6 py-3 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-500 transition-colors"
        >
          Go to Vision Board
        </button>
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-gray-500 hover:text-gray-300 transition-colors text-sm"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const area = currentVision ? getLifeArea(currentVision.lifeArea) : null;

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden select-none">
      {/* Background */}
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {currentVision?.imageUrl ? (
          <img
            src={currentVision.imageUrl}
            alt={currentVision.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className={cn(
              'w-full h-full bg-gradient-to-br',
              area?.gradient ?? 'from-violet-900 to-purple-900'
            )}
          />
        )}
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent" />
      </div>

      {/* Motivational quote overlay */}
      {showQuote && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/60 backdrop-blur-sm">
          <p className="text-2xl font-light text-white/90 italic text-center max-w-2xl px-8 animate-fade-in">
            "{MOTIVATIONAL_QUOTES[quoteIndex]}"
          </p>
        </div>
      )}

      {/* Main content */}
      <div
        className="relative z-5 flex flex-col items-center justify-center h-full px-8 text-center transition-all duration-500"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)' }}
      >
        {/* Life area badge */}
        {area && (
          <div
            className="rounded-full px-4 py-1.5 text-sm font-semibold mb-6 backdrop-blur-sm"
            style={{ backgroundColor: area.color + '30', color: area.color, border: `1px solid ${area.color}50` }}
          >
            {area.label}
          </div>
        )}

        {/* Vision title */}
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight max-w-4xl">
          {currentVision?.title}
        </h1>

        {/* Affirmation */}
        {currentVision?.affirmation && (
          <p className="text-xl md:text-2xl text-white/85 font-light italic max-w-3xl leading-relaxed mb-4">
            "{currentVision.affirmation}"
          </p>
        )}

        {/* Description */}
        {currentVision?.description && (
          <p className="text-base text-white/60 max-w-2xl mt-2">
            {currentVision.description}
          </p>
        )}

        {/* Progress dots */}
        <div className="flex gap-2 mt-12">
          {visions.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setVisible(false);
                setTimeout(() => { setCurrentIndex(i); setVisible(true); }, 300);
              }}
              className={cn(
                'rounded-full transition-all duration-300',
                i === currentIndex
                  ? 'w-6 h-2 bg-white'
                  : 'w-2 h-2 bg-white/30 hover:bg-white/50'
              )}
            />
          ))}
        </div>
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-6 z-20">
        <div className="text-white/60 text-sm font-medium">
          <span className="gradient-text text-base font-bold">VISION</span>
          <span className="ml-2 text-white/40">Manifestation Mode</span>
        </div>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-2 text-white/80 hover:text-white hover:bg-white/20 transition-all text-sm"
        >
          <X size={16} />
          Exit
        </button>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-4 p-6 z-20">
        <div className="flex items-center gap-3 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/10 px-5 py-3">
          {/* Prev */}
          <button
            onClick={goPrev}
            className="rounded-xl p-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Play/Pause */}
          <button
            onClick={() => setIsPlaying((p) => !p)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-violet-600 text-white hover:bg-violet-500 transition-colors"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>

          {/* Next */}
          <button
            onClick={goNext}
            className="rounded-xl p-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronRight size={20} />
          </button>

          <div className="w-px h-6 bg-white/20 mx-1" />

          {/* Speed control */}
          <div className="flex items-center gap-1">
            <Gauge size={14} className="text-white/40 mr-1" />
            {SPEED_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSpeed(opt.value)}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                  speed === opt.value
                    ? 'bg-violet-600 text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/10'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-white/20 mx-1" />

          {/* Counter */}
          <span className="text-white/50 text-sm">
            {currentIndex + 1} / {total}
          </span>
        </div>
      </div>

      {/* Keyboard hints */}
      <div className="absolute bottom-20 left-0 right-0 flex justify-center z-20">
        <div className="flex gap-4 text-white/30 text-xs">
          <span>Space = Play/Pause</span>
          <span>← → = Navigate</span>
          <span>Esc = Exit</span>
        </div>
      </div>
    </div>
  );
}
