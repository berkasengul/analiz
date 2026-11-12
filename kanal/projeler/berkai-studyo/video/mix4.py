import json,subprocess,wave,numpy as np,glob
V4="/tmp/claude-0/-home-user-analiz/15f5e81a-2f5a-535e-8b53-dec004b93200/scratchpad/v4"
seg=json.load(open(f"{V4}/segler.json")); TOTAL=seg["son"][1]
sr=48000;n=int(TOTAL*sr);voice=np.zeros(n);rng=np.random.default_rng(3)
for k,(s,e) in seg.items():
    if k in("8x","son"):continue
    raw=subprocess.check_output(["ffmpeg","-v","error","-i",f"{V4}/av/{k}.mp4","-af","highpass=f=70,loudnorm=I=-15:TP=-1.5:LRA=9","-ac","1","-ar",str(sr),"-f","s16le","-"])
    v=np.frombuffer(raw,np.int16).astype(np.float64)/32768;i0=int(s*sr);voice[i0:i0+len(v)]+=v[:n-i0]
sfx=np.zeros(n);ev=set()
for f in glob.glob(f"{V4}/sfx_*.json"):
    for t,kind in json.load(open(f)): ev.add((round(t,2),kind))
def whoosh():
    L=int(.38*sr);x=rng.normal(0,1,L);tt=np.arange(L)/sr;env=np.sin(np.pi*tt/.38)**2
    lp=np.convolve(x,np.ones(18)/18,"same");return (lp*env)*.12
def tik():
    L=int(.05*sr);tt=np.arange(L)/sr;return np.sin(2*np.pi*1800*tt)*np.exp(-tt*90)*.06
W_=whoosh();T_=tik()
for t,kind in ev:
    s_=W_ if kind=="whoosh" else T_; i0=int(max(0,t-(.19 if kind=="whoosh" else 0))*sr)
    if i0+len(s_)<n: sfx[i0:i0+len(s_)]+=s_
mix=voice+sfx; mix=mix/max(1,np.abs(mix).max()/.95)
st=(np.stack([mix,mix],1)*32767).astype(np.int16)
with wave.open(f"{V4}/ses4.wav","wb") as wf: wf.setnchannels(2);wf.setsampwidth(2);wf.setframerate(sr);wf.writeframes(st.tobytes())
open(f"{V4}/parts.txt","w").write("".join(f"file '{V4}/part_{i}.mp4'\n" for i in range(4)))
OUT="/home/user/analiz/video_teslim/BerkAI_Yapay_Zeka_Ofisi_v4.mp4"
subprocess.run(f"ffmpeg -v error -y -f concat -safe 0 -i {V4}/parts.txt -i {V4}/ses4.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart {OUT}",shell=True,check=True)
print("ok",OUT,len(ev))
