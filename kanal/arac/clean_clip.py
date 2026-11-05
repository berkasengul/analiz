# kullanım: python3 clean_clip.py <render.py> <çıkış.mp4> <başlangıç_sn> <süre_sn>
import sys, os, subprocess
src, out, t0, dur = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
sys.argv = ['x', 'stills']
d = os.path.dirname(os.path.abspath(src)); os.chdir(d); sys.path.insert(0, d)
g = {"__file__": os.path.abspath(src), "__name__": "clean"}
exec(open(src).read().split('if __name__ == "__main__":')[0], g)
g["captions"] = lambda *a, **k: None
g["year_card"] = lambda *a, **k: None
rd = g["Renderer"](); FPS = g["FPS"]; W, H = g["W"], g["H"]
enc = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                        "-vf", "setpts=PTS/1.25,fps=30", "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
for f in range(int(t0 * FPS), int((t0 + dur) * FPS)): enc.stdin.write(rd.rgba(f).tobytes())
enc.stdin.close(); enc.wait(); print("ok", out)
