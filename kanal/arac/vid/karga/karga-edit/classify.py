import sys, subprocess, numpy as np, json
src = sys.argv[1]
w, h = 192, 108
p = subprocess.Popen(["ffmpeg","-v","error","-i",src,"-vf",f"fps=5,scale={w}:{h}:flags=area","-f","rawvideo","-pix_fmt","rgb24","-"],stdout=subprocess.PIPE)
res=[]; i=0
prev=None
while True:
    b=p.stdout.read(w*h*3)
    if len(b)<w*h*3: break
    a=np.frombuffer(b,np.uint8).reshape(h,w,3).astype(int)
    def px(x,y): return a[int(y/10),int(x/10)]
    cream = np.abs(px(1500,700)-[244,238,225]).sum()<18 and np.abs(px(300,950)-[244,238,225]).sum()<18 and a[54,0,0]>180 and a[54,0,2]<120
    navy_l = np.abs(px(300,900)-[27,39,64]).sum()<30
    navy_r = np.abs(px(1800,500)-[27,39,64]).sum()<30
    band_top = a[1:9].mean(axis=(0,1))  # header band
    NV=[25,39,60]
    nv=lambda x,y: np.abs(px(x,y)-NV).sum()<25
    if cream: k="CARD"
    elif nv(960,20) and nv(960,950):
        if nv(500,500) and not nv(1380,500): k="PHONE"
        elif not nv(500,500) and not nv(1400,500): k="BA"
        else: k="NAVY?"
    else: k="SCREEN"
    diff = 0 if prev is None else float(np.abs(a-prev).mean())
    prev=a
    res.append((i/5,k,round(diff,1)))
    i+=1
# merge
segs=[]
for t,k,d in res:
    if segs and segs[-1][2]==k: segs[-1][1]=t+0.2
    else: segs.append([t,t+0.2,k])
json.dump({"segs":segs,"diff":[(t,d) for t,_,d in res]},open(sys.argv[2],"w"))
for s in segs: print(f"{s[0]:7.1f} {s[1]:7.1f} {s[1]-s[0]:6.1f} {s[2]}")
