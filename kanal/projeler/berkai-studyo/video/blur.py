# tur saniyesi -> gizlenecek bölgeler (işletme adları)
BLUR = [(83.0, 100.0, [(1720, 0, 1920, 1080)])]          # müdür paneli kenarı
DEMO_BLUR = [(0, 0, 280, 70)]                             # demo sitenin üst köşedeki marka adı
DEMO2_BLUR = [(0, 0, 360, 70)]
# kullanıcı kaydı (saniye) -> bölgeler
REC_BLUR = [
    (59.0, 73.0, [(1000, 250, 1920, 420), (1000, 560, 1920, 950)]),   # müşteri paneli: metin + aday kartları
    (40.0, 46.0, [(1000, 380, 1920, 950)]),                           # mail paneli: dosya adları
    (76.5, 90.0, [(1000, 230, 1920, 950)]),                           # müdür kararları
    (8.0, 11.0, [(1000, 250, 1920, 950)]), (15.0, 18.0, [(1000, 250, 1920, 950)]),   # 3D site paneli
]
