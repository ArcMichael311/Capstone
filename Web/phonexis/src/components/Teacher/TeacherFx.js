// Small visual helpers for the teacher workspace: count-up numbers, progress rings,
// per-class colors, time-of-day greeting and a confetti celebration.
import { useEffect, useRef, useState } from 'react';

const prefersReducedMotion = () => typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function CountUp({ value, suffix = '', duration = 900 }) {
  const target = Number(value) || 0;
  const [shown, setShown] = useState(prefersReducedMotion() ? target : 0);
  const fromRef = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setShown(target);
      return undefined;
    }
    const from = fromRef.current;
    const start = performance.now();
    let frame;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      const next = Math.round(from + (target - from) * eased);
      setShown(next);
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return <>{shown}{suffix}</>;
}

export function ProgressRing({ value, size = 64, stroke = 7, label = true, className = '' }) {
  const percent = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <span className={`tw-ring ${className}`} style={{ width: size, height: size }} role="img" aria-label={`${percent}% average progress`}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
        <circle className="tw-ring-track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} />
        <circle
          className="tw-ring-value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
          style={{ '--tw-ring-c': circumference }}
        />
      </svg>
      {label && <b><CountUp value={percent} suffix="%" /></b>}
    </span>
  );
}

// Fixed order so a class keeps its color; cycles only after 6 classes.
export const CLASS_COLORS = ['blue', 'violet', 'teal', 'orange', 'pink', 'indigo'];
export const getClassColor = (index) => CLASS_COLORS[index % CLASS_COLORS.length];

export const getGreeting = (date = new Date()) => {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export const formatToday = (date = new Date()) => date.toLocaleDateString(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

const TIPS = [
  'Short daily practice beats one long session — encourage 10 minutes a day.',
  'Check the Academic Progress page to spot students who have not started yet.',
  'Celebrate small wins! Students who finish a game love a quick shout-out.',
  'Record pretest questions in your own voice so students hear a familiar teacher.',
  'Share a short video or PDF before a new module to warm students up.',
];

export const getDailyTip = (date = new Date()) => TIPS[date.getDate() % TIPS.length];

const CONFETTI_COLORS = ['#2563eb', '#7c3aed', '#14b8a6', '#f59e0b', '#ec4899', '#22c55e'];

// A short confetti burst from the top of the screen. No library, cleans itself up.
export const celebrate = () => {
  if (typeof document === 'undefined' || prefersReducedMotion()) {
    return;
  }
  const layer = document.createElement('div');
  layer.className = 'tw-confetti';
  layer.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 70; i += 1) {
    const piece = document.createElement('i');
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    piece.style.setProperty('--x', `${(Math.random() - 0.5) * 240}px`);
    piece.style.setProperty('--r', `${Math.random() * 720 - 360}deg`);
    piece.style.animationDelay = `${Math.random() * 0.35}s`;
    piece.style.animationDuration = `${1.6 + Math.random() * 1.1}s`;
    if (i % 3 === 0) piece.style.borderRadius = '50%';
    layer.appendChild(piece);
  }
  document.body.appendChild(layer);
  window.setTimeout(() => layer.remove(), 3200);
};
