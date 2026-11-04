import json, os, re, wave, sys
import numpy as np
from piper import PiperVoice
from piper.config import SynthesisConfig
from script import SCRIPT, SAY
V=os.path.dirname(os.path.abspath(__file__))
voice=PiperVoice.load(f"{V}/../voices/tr_TR-fahrettin-medium.onnx")
cfg=SynthesisConfig(length_scale=1.12, noise_scale=0.6, noise_w_scale=0.8)
os.makedirs(f"{V}/tts/s",exist_ok=True)
out=[]; t=0.6; SR=None; chunks=[]
def spoken(s):
    for a,b in SAY.items(): s=s.replace(a,b)
    s=s.replace("3D","üç de").replace("e-posta","e posta")
    return s
for i,e in enumerate(SCRIPT):
    if e[0]=="ch":
        out.append({"ch":e[1],"it":e[2],"t":t}); t+=2.8; continue
    say,cap,vis=e
    p=f"{V}/tts/s/{i:03d}.wav"
    if not os.path.exists(p):
        with wave.open(p,"wb") as wf: voice.synthesize_wav(spoken(say), wf, syn_config=cfg)
    with wave.open(p) as wf: SR=wf.getframerate(); n=wf.getnframes(); a=np.frombuffer(wf.readframes(n),np.int16)
    # baş/son sessizliği kırp
    nz=np.nonzero(np.abs(a)>300)[0]; a=a[max(0,nz[0]-int(.03*SR)):nz[-1]+int(.08*SR)] if len(nz) else a
    d=len(a)/SR
    out.append({"i":i,"say":say,"cap":cap,"vis":list(vis),"t":round(t,3),"d":round(d,3)})
    chunks.append((t,a)); t+=d+0.56
total=t+8.5
mix=np.zeros(int(total*SR),np.int16)
for st,a in chunks: k=int(st*SR); mix[k:k+len(a)]=a
with wave.open(f"{V}/tts/voice.wav","wb") as wf:
    wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(SR); wf.writeframes(mix.tobytes())
json.dump({"sr":SR,"total":total,"items":out},open(f"{V}/tts/timeline.json","w"),ensure_ascii=False,indent=1)
print("toplam",round(total,1),"sn =",round(total/60,2),"dk")
