// Metni harflere (ya da kelimelere) böler; her parça kendi maskesinin
// içinden sırayla kayarak gelir. Ekran okuyucular tam metni okur.
export function SplitChars({ text, className = "", delay = 0, step = 28 }) {
  let i = 0;
  return (
    <span className={`split ${className}`} aria-label={text}>
      {text.split(" ").map((word, w, words) => (
        <span key={w}>
          <span className="split__word" aria-hidden="true">
            {[...word].map((ch) => (
              <span className="split__mask" key={i}>
                <span className="split__char" style={{ "--d": `${delay + i++ * step}ms` }}>
                  {ch}
                </span>
              </span>
            ))}
          </span>
          {w < words.length - 1 && " "}
        </span>
      ))}
    </span>
  );
}

export function SplitWords({ text, className = "", delay = 0, step = 18 }) {
  return (
    <span className={`split ${className}`} aria-label={text}>
      {text.split(" ").map((word, i, words) => (
        <span key={i}>
          <span className="split__mask" aria-hidden="true">
            <span className="split__char" style={{ "--d": `${delay + i * step}ms` }}>
              {word}
            </span>
          </span>
          {i < words.length - 1 && " "}
        </span>
      ))}
    </span>
  );
}
