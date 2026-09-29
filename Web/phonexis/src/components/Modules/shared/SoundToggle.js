import { useEffect, useState } from 'react';
import { isSoundMuted, onSoundMutedChange, playSound, setSoundMuted } from './gameSounds';
import './SoundToggle.css';

// 🔊/🔇 button shared by the games. Pass className to match the game's button style.
export default function SoundToggle({ className = '' }) {
  const [muted, setMuted] = useState(isSoundMuted);

  useEffect(() => onSoundMutedChange(setMuted), []);

  const toggle = () => {
    const nextMuted = !muted;
    setSoundMuted(nextMuted);
    if (!nextMuted) {
      playSound('click');
    }
  };

  return (
    <button
      type="button"
      className={`sound-toggle ${muted ? 'is-muted' : ''} ${className}`}
      onClick={toggle}
      aria-pressed={muted}
      aria-label={muted ? 'Turn sound effects on' : 'Turn sound effects off'}
      title={muted ? 'Sound effects off' : 'Sound effects on'}
    >
      <span aria-hidden="true">{muted ? '🔇' : '🔊'}</span>
    </button>
  );
}
