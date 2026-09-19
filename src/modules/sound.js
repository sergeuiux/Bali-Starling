// sound.js — кнопка PLAY SONG (голос балийского скворца).
// Клик проигрывает зацикленное пение, повторный клик ставит на паузу.
// Поддержаны обе кнопки: десктопная (в шапке) и мобильная (в бургер-меню) —
// состояние синхронизировано через события audio.

export function initSoundToggle() {
  const btns = [
    document.querySelector('[data-sound-toggle]'),
    document.querySelector('[data-sound-toggle-m]'),
  ].filter(Boolean);
  const audio = document.getElementById('birdSong');
  if (!btns.length || !audio) return;

  audio.volume = 0.85;

  const setOn = (on) => {
    btns.forEach((btn) => {
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.setAttribute('aria-label', on ? 'Pause bird song' : 'Play bird song');
    });
  };

  btns.forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (audio.paused) {
        try { await audio.play(); setOn(true); } catch (_) { setOn(false); }
      } else {
        audio.pause();
        setOn(false);
      }
    });
  });

  audio.addEventListener('pause', () => setOn(false));
  audio.addEventListener('play',  () => setOn(true));
}
