import './VideoEpisodes.css';

// Episode cards, an unlock banner and a video popup, shared by the module
// "Learning Video Materials" pages. Colours come from --ve-* variables set by
// the page that renders it.
export default function VideoEpisodes({
  videos,
  watchedIds = [],
  currentIndex = null,
  onPlay,
  onClose,
  onPrevious,
  onNext,
  onEnded,
  unlockTitle,
  unlockActionLabel,
  onUnlockAction,
}) {
  const watchedCount = watchedIds.length;
  const allWatched = watchedCount === videos.length;
  const remaining = videos.length - watchedCount;
  const upNextIndex = videos.findIndex((video) => !watchedIds.includes(video.id));
  const current = currentIndex !== null ? videos[currentIndex] : null;

  return (
    <>
      <section className="ve-episodes">
        {videos.map((video, index) => {
          const isWatched = watchedIds.includes(video.id);
          const isUpNext = index === upNextIndex;

          return (
            <article
              key={video.id}
              className={`ve-episode ${isWatched ? 'watched' : ''} ${isUpNext ? 'up-next' : ''}`}
              style={{ '--i': index }}
            >
              {isUpNext ? <span className="ve-up-next" aria-hidden="true">⭐ Up next</span> : null}
              <button
                type="button"
                className="ve-thumb"
                onClick={() => onPlay(index)}
                aria-label={`${isWatched ? 'Rewatch' : 'Play'} ${video.title}`}
              >
                <span className="ve-ep-badge">EP {index + 1}</span>
                <span className="ve-duration">⏱ {video.duration}</span>
                <span className="ve-play-circle" aria-hidden="true">▶</span>
                {isWatched ? <span className="ve-stamp" aria-hidden="true">✓ Watched</span> : null}
              </button>
              <div className="ve-episode-body">
                <h3>{video.title}</h3>
                <p>{video.description}</p>
                <button
                  type="button"
                  className={`ve-btn ${isWatched ? 've-btn-soft' : ''}`}
                  onClick={() => onPlay(index)}
                >
                  {isWatched ? '↻ Rewatch' : '▶ Play'}
                </button>
              </div>
            </article>
          );
        })}
      </section>

      <section className={`ve-unlock ${allWatched ? 'open' : ''}`}>
        <span className="ve-unlock-icon" aria-hidden="true">{allWatched ? '🎁' : '🔒'}</span>
        <div className="ve-unlock-copy">
          <strong>{allWatched ? `${unlockTitle} unlocked!` : unlockTitle}</strong>
          <span>
            {allWatched
              ? 'You watched every episode. Time to explore!'
              : `Watch ${remaining} more video${remaining === 1 ? '' : 's'} to unlock it.`}
          </span>
          <div className="ve-unlock-track">
            {videos.map((video) => (
              <span key={video.id} className={watchedIds.includes(video.id) ? 'on' : ''} />
            ))}
          </div>
        </div>
        {allWatched && onUnlockAction ? (
          <button type="button" className="ve-btn ve-pulse" onClick={onUnlockAction}>
            {unlockActionLabel}
          </button>
        ) : null}
      </section>

      {current ? (
        <div
          className="ve-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              onClose();
            }
          }}
        >
          <div className="ve-modal" role="dialog" aria-modal="true" aria-labelledby="ve-player-title">
            <div className="ve-modal-head">
              <div>
                <span className="ve-kicker">🎬 Episode {currentIndex + 1} of {videos.length}</span>
                <h3 id="ve-player-title">{current.title}</h3>
              </div>
              <button type="button" className="ve-close" onClick={onClose} aria-label="Close video">
                ✕
              </button>
            </div>

            <div className="ve-video-frame">
              <video
                key={`video-${current.id}`}
                width="100%"
                height="100%"
                controls
                autoPlay
                onEnded={() => onEnded(current.id)}
              >
                <source src={current.url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>

            <p className={`ve-watch-note ${watchedIds.includes(current.id) ? 'done' : ''}`}>
              {watchedIds.includes(current.id)
                ? '✓ Watched! Great job finishing this episode.'
                : '⏳ This video is marked as watched once you finish it completely.'}
            </p>

            <div className="ve-player-nav" aria-label="Video navigation">
              <button type="button" className="ve-btn ve-btn-soft" onClick={onPrevious} disabled={currentIndex === 0}>
                ‹ Previous
              </button>
              <div className="ve-player-dots" aria-hidden="true">
                {videos.map((video, index) => (
                  <span
                    key={video.id}
                    className={[
                      index === currentIndex ? 'current' : '',
                      watchedIds.includes(video.id) ? 'watched' : '',
                    ].join(' ')}
                  />
                ))}
              </div>
              <button
                type="button"
                className="ve-btn ve-btn-soft"
                onClick={onNext}
                disabled={currentIndex === videos.length - 1}
              >
                Next ›
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
