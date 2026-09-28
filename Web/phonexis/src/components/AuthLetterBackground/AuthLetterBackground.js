import './AuthLetterBackground.css';

const letterField = [
  ['A', 6, 4, 22, 0], ['Z', 13, 8, 30, -8], ['M', 21, 5, 18, -14],
  ['E', 29, 12, 26, -4], ['R', 37, 3, 34, -19], ['T', 45, 10, 20, -11],
  ['B', 54, 6, 29, -2], ['L', 62, 15, 24, -16], ['O', 71, 4, 38, -7],
  ['P', 79, 11, 21, -18], ['H', 88, 6, 31, -5], ['X', 96, 14, 25, -13],
  ['C', 9, 24, 27, -21], ['U', 18, 34, 35, -3], ['N', 31, 29, 23, -12],
  ['S', 43, 40, 32, -17], ['I', 57, 26, 19, -9], ['V', 68, 36, 28, -1],
  ['D', 83, 31, 37, -15], ['G', 93, 23, 22, -6], ['F', 3, 54, 33, -10],
  ['Y', 14, 68, 25, -20], ['Q', 26, 58, 39, -4], ['W', 40, 76, 21, -14],
  ['J', 52, 63, 30, -8], ['K', 65, 70, 24, -18], ['A', 77, 55, 35, -2],
  ['R', 90, 67, 27, -16], ['M', 98, 52, 20, -7],
];

export default function AuthLetterBackground() {
  return (
    <div className="auth-letter-background" aria-hidden="true">
      <div className="auth-letter-glow" />
      {letterField.map(([letter, left, size, duration, delay], index) => (
        <span
          className="auth-letter"
          key={`${letter}-${index}`}
          style={{
            '--letter-left': `${left}%`,
            '--letter-size': `${size / 10 + 1}rem`,
            '--letter-duration': `${duration}s`,
            '--letter-delay': `${delay}s`,
            '--letter-tilt': `${(index % 2 ? 1 : -1) * (8 + (index % 4) * 5)}deg`,
          }}
        >
          {letter}
        </span>
      ))}
    </div>
  );
}