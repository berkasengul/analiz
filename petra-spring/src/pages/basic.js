// yalnızca ortak öğeler (menü, alt bilgi, beliren öğeler)
import '../site.js';

// kurumsal: tesis tanıtım filmi (sesli, tam ekran pencerede)
const film = document.getElementById('film');
if (film) {
  const vid = document.getElementById('filmVid');
  document.getElementById('filmBtn').addEventListener('click', () => { film.showModal(); vid.play().catch(() => {}); });
  const close = () => { vid.pause(); film.close(); };
  document.getElementById('filmClose').addEventListener('click', close);
  film.addEventListener('click', (e) => { if (e.target === film) close(); });
  film.addEventListener('close', () => vid.pause());
}
