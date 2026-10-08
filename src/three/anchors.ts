// three'ye bağımlı olmayan paylaşılan çapalar (HTML katmanı bunları okur; three ayrı chunk'ta kalır)

/** Piramit etiketleri için katmanların ekran konumları (px) */
export const anchors = {
  cap: { x: 0, y: 0 },
  top: { x: 0, y: 0 },
  bottom: { x: 0, y: 0 },
  /** katmanların yarı genişliği (px) — etiketlerin yatay mesafesi */
  halfPx: 120,
  explode: 0,
};

/** Koku bulucu kaidesinin ekran konumu (px), "KOKUN BURAYA İNECEK" yazısı için */
export const finderAnchor = { x: 0, y: 0 };

/** Detayda şişeyi sürükleyerek çevirme (ry ofseti ve hız) */
export const detailDrag = { ry: 0, vel: 0, dragging: false };
