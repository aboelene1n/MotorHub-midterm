import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
export default function HeroVideo() {
  const video = useRef(),
    [enabled, setEnabled] = useState(false),
    [playing, setPlaying] = useState(false);
  useEffect(() => {
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => {
      const allow = !motion.matches && !navigator.connection?.saveData;
      setEnabled(allow);
      setPlaying(allow);
    };
    change();
    motion.addEventListener('change', change);
    return () => motion.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    if (!video.current) return;
    if (enabled && playing) video.current.play().catch(() => setPlaying(false));
    else video.current.pause();
  }, [enabled, playing]);
  return (
    <>
      <video
        ref={video}
        className="hero-video"
        src={enabled ? '/media/motorhub-drive.mp4' : undefined}
        poster="/media/motorhub-drive-poster.jpg"
        muted
        loop
        playsInline
        autoPlay={enabled}
        preload="metadata"
        aria-hidden="true"
        onError={() => setEnabled(false)}
      />
      {enabled && (
        <button
          type="button"
          className="hero-video-toggle"
          aria-label={playing ? 'Pause background video' : 'Play background video'}
          onClick={() => setPlaying((v) => !v)}
        >
          {playing ? <Pause size={13} /> : <Play size={13} />}
          <span>{playing ? 'Pause video' : 'Play video'}</span>
        </button>
      )}
    </>
  );
}
