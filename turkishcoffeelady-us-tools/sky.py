import random, math
random.seed(7)
W,H,HZ=2400,1100,800
f=lambda v: f"{v:.1f}"
def rect(x,y,w,h): return f"M{f(x)} {f(y)}h{f(w)}v{f(h)}h{f(-w)}Z"
def dome(cx,by,rx,ry): return f"M{f(cx-rx)} {f(by)}A{f(rx)} {f(ry)} 0 0 1 {f(cx+rx)} {f(by)}Z"
def tri(x1,y1,x2,y2,x3,y3): return f"M{f(x1)} {f(y1)}L{f(x2)} {f(y2)}L{f(x3)} {f(y3)}Z"
def minaret(x,by,h,w):
    p=rect(x-w/2,by-h,w,h)+rect(x-w,by-h*.62,2*w,w*.55)+rect(x-w*.85,by-h*.84,1.7*w,w*.5)
    p+=tri(x-w*.62,by-h,x,by-h-w*5.8,x+w*.62,by-h)+rect(x-.7,by-h-w*5.8-14,1.4,14)
    return p
def mosque(cx,by,s,nmin):
    p=rect(cx-130*s,by-60*s,260*s,60*s)
    p+=dome(cx-72*s,by-60*s,46*s,34*s)+dome(cx+72*s,by-60*s,46*s,34*s)
    for dx in (-118,-100,100,118): p+=dome(cx+dx*s,by-60*s,11*s,10*s)
    p+=rect(cx-62*s,by-96*s,124*s,36*s)+dome(cx,by-96*s,70*s,62*s)
    p+=rect(cx-1.3,by-158*s-24*s,2.6,24*s)
    offs=[150,186,222][:max(1,nmin//2)]
    for i,o in enumerate(offs):
        h=(235-i*30)*s
        p+=minaret(cx-o*s,by,h,9*s)+minaret(cx+o*s,by,h,9*s)
    return p
def galata(cx,by,s):
    p=rect(cx-30*s,by-215*s,60*s,215*s)+rect(cx-37*s,by-236*s,74*s,21*s)+rect(cx-29*s,by-268*s,58*s,32*s)
    p+=tri(cx-35*s,by-268*s,cx,by-380*s,cx+35*s,by-268*s)+rect(cx-1,by-380*s-18,2,18)
    return p
def maiden(cx,by,s):
    p=f"M{f(cx-130*s)} {f(by)}C{f(cx-90*s)} {f(by-20*s)} {f(cx+90*s)} {f(by-20*s)} {f(cx+130*s)} {f(by)}Z"
    p+=rect(cx-86*s,by-50*s,120*s,40*s)+tri(cx-92*s,by-50*s,cx-26*s,by-74*s,cx+40*s,by-50*s)
    p+=rect(cx+8*s,by-128*s,36*s,118*s)+rect(cx+3*s,by-140*s,46*s,12*s)
    p+=tri(cx+3*s,by-140*s,cx+26*s,by-196*s,cx+49*s,by-140*s)+rect(cx+25.3*s,by-210*s,1.4,14*s)
    return p
def house(x,by,w,h): return rect(x,by-h,w,h)+tri(x-3,by-h,x+w/2,by-h-w*.38,x+w+3,by-h)
def cypress(x,by,h,w=7): return f"M{f(x)} {f(by-h)}C{f(x+w)} {f(by-h*.6)} {f(x+w)} {f(by)} {f(x)} {f(by)}C{f(x-w)} {f(by)} {f(x-w)} {f(by-h*.6)} {f(x)} {f(by-h)}Z"
def hill(pts,bottom=HZ+2):
    d=f"M{pts[0][0]} {bottom}L{pts[0][0]} {pts[0][1]}"
    for i in range(1,len(pts)):
        x0,y0=pts[i-1];x1,y1=pts[i];mx=(x0+x1)/2
        d+=f"C{mx} {y0} {mx} {y1} {x1} {y1}"
    return d+f"L{pts[-1][0]} {bottom}Z"
def roofline(x0,x1,base_fn,hmin,hmax,wmin=26,wmax=60,windows=None,dens=.35):
    p="";x=x0
    while x<x1:
        w=random.uniform(wmin,wmax);h=random.uniform(hmin,hmax);by=base_fn(x+w/2)+6
        p+=house(x,by,w,h)
        if windows is not None:
            for _ in range(int(w/14)):
                if random.random()<dens:
                    wx=x+random.uniform(4,w-8);wy=by-random.uniform(6,h-6)
                    windows.append((wx,wy))
        if random.random()<.25: p+=cypress(x+w+4,by,random.uniform(40,80))
        x+=w+random.uniform(-6,4)
    return p
def interp(pts):
    def fn(x):
        for i in range(1,len(pts)):
            if x<=pts[i][0]:
                (x0,y0),(x1,y1)=pts[i-1],pts[i];t=(x-x0)/(x1-x0);t=t*t*(3-2*t);return y0+(y1-y0)*t
        return pts[-1][1]
    return fn
win=[]
# FAR: historic peninsula
farH=[(-20,775),(260,742),(520,722),(760,748),(1000,770),(1400,772),(1640,750),(1900,744),(2160,752),(2420,770)]
ff=interp(farH)
far=hill(farH)+roofline(-20,2420,ff,18,40,windows=win,dens=.18)
far+=mosque(470,ff(470)-8,1.05,4)+mosque(1760,ff(1760)-6,.92,6)+mosque(2170,ff(2170)-4,.82,4)+mosque(1020,ff(1020)-4,.55,2)
for x in (300,640,1560,1980,2300): far+=dome(x,ff(x)-14,22,20)+rect(x-24,ff(x)-14,48,14)
# MID: Galata side + Yeni Cami
midH=[(-20,800),(120,790),(360,796),(700,790),(1300,786),(1440,742),(1560,724),(1700,746),(1880,786),(2420,798)]
mf=interp(midH)
mid=hill(midH)+roofline(1330,1860,mf,22,52,wmin=22,wmax=46,windows=win,dens=.42)
mid+=roofline(-20,420,mf,14,30,windows=win,dens=.3)
mid+=galata(1555,mf(1555)-10,.86)
mid+=mosque(230,mf(230)-4,.7,2)
for x in range(1340,1860,int(random.uniform(90,140))): mid+=cypress(x,mf(x)+4,random.uniform(60,110),9)
# NEAR: Maiden's tower, boats
near=maiden(690,860,1.0)
def boat(x,y,s):
    return f"M{f(x-40*s)} {f(y)}L{f(x+40*s)} {f(y)}L{f(x+28*s)} {f(y+9*s)}L{f(x-30*s)} {f(y+9*s)}Z"+tri(x-4*s,y-2,x-4*s,y-46*s,x+24*s,y-2)+rect(x-5*s,y-50*s,1.6,48*s)
near+=boat(1980,900,1.0)+boat(300,940,.8)+boat(2250,860,.55)
stars="".join(f'<circle cx="{random.uniform(0,W):.0f}" cy="{random.uniform(0,560)**1.08:.0f}" r="{random.choice([.7,.9,1.1,1.4,1.8]):.1f}" class="{ "tw" if random.random()<.3 else ""}" style="animation-delay:-{random.uniform(0,6):.1f}s;opacity:{random.uniform(.25,.9):.2f}"/>' for _ in range(170))
wins="".join(f'<rect x="{x:.0f}" y="{y:.0f}" width="3.2" height="4.6" class="{ "tw" if random.random()<.25 else ""}" style="animation-delay:-{random.uniform(0,6):.1f}s"/>' for x,y in win)
glitter="".join(f'<rect x="{1880+random.gauss(0,40)-random.uniform(10,60)/2:.0f}" y="{HZ+14+i*random.uniform(9,13):.0f}" width="{random.uniform(14,90)*(1+i*.06):.0f}" height="1.6" style="animation-delay:-{random.uniform(0,4):.1f}s"/>' for i in range(22))
svg=f'''<svg class="sky" id="skySvg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <defs>
    <linearGradient id="gSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#03051a"/><stop offset=".4" stop-color="#0a1342"/><stop offset=".78" stop-color="#1c2a6e"/><stop offset="1" stop-color="#34397a"/>
    </linearGradient>
    <radialGradient id="gDusk" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#e9b27f" stop-opacity=".55"/><stop offset=".45" stop-color="#b9707a" stop-opacity=".22"/><stop offset="1" stop-color="#3a3f7c" stop-opacity="0"/></radialGradient>
    <radialGradient id="gMoon" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6e3" stop-opacity=".55"/><stop offset=".25" stop-color="#cfd8ff" stop-opacity=".16"/><stop offset="1" stop-color="#cfd8ff" stop-opacity="0"/></radialGradient>
    <linearGradient id="gWater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#25306a"/><stop offset=".35" stop-color="#121a48"/><stop offset="1" stop-color="#050818"/></linearGradient>
    <linearGradient id="gHaze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8d93c9" stop-opacity="0"/><stop offset=".75" stop-color="#8d93c9" stop-opacity=".22"/><stop offset="1" stop-color="#8d93c9" stop-opacity="0"/></linearGradient>
    <linearGradient id="gRefl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <mask id="mRefl"><rect x="0" y="{HZ}" width="{W}" height="{H-HZ}" fill="url(#gRefl)"/></mask>
    <mask id="mCres"><circle cx="1900" cy="210" r="44" fill="#fff"/><circle cx="1918" cy="200" r="38" fill="#000"/></mask>
    <filter id="fRipple" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.004 0.09" numOctaves="2" seed="3" result="n"><animate attributeName="baseFrequency" dur="14s" values="0.004 0.09;0.006 0.12;0.004 0.09" repeatCount="indefinite"/></feTurbulence>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="18" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="fSoft"><feGaussianBlur stdDeviation="1.4"/></filter>
  </defs>
  <rect width="{W}" height="{HZ+2}" fill="url(#gSky)"/>
  <g class="stars" fill="#f4ecdf">{stars}</g>
  <circle cx="1900" cy="210" r="260" fill="url(#gMoon)"/>
  <rect x="1840" y="150" width="120" height="120" fill="#fbf1dc" mask="url(#mCres)"/>
  <ellipse cx="1200" cy="{HZ}" rx="1500" ry="300" fill="url(#gDusk)"/>
  <g class="l-far"><path d="{far}" fill="#2b3778" filter="url(#fSoft)"/><rect y="{HZ-140}" width="{W}" height="160" fill="url(#gHaze)"/></g>
  <g class="l-mid"><path d="{mid}" fill="#141d52"/><g class="wins" fill="#f2c27a">{wins}</g></g>
  <rect class="water" y="{HZ}" width="{W}" height="{H-HZ}" fill="url(#gWater)"/>
  <g class="refl" mask="url(#mRefl)" filter="url(#fRipple)" opacity=".75">
    <g transform="translate(0 {2*HZ}) scale(1 -1)"><path d="{far}" fill="#3b4790"/><path d="{mid}" fill="#1d2766"/></g>
  </g>
  <g class="glitter" fill="#fff3d6">{glitter}</g>
  <g class="l-near"><path d="{near}" fill="#0a1033"/><circle class="beacon" cx="716" cy="652" r="5" fill="#ffd89a"/></g>
</svg>'''
open('sky.svg','w').write(svg)
# line-art version for journey section (gold outline)
line=f'''<svg class="line-sky" viewBox="0 600 {W} 230" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><path pathLength="1" d="{far}"/><path pathLength="1" d="{mid}"/></svg>'''
open('line.svg','w').write(line)
print(len(svg),len(win))
