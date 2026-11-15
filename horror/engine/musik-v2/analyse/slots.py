# Je Achtel-Slot der gemittelten Schleife: welche Halbtöne setzen neu ein (Zuwachs gegenüber kurz davor).
# Aufruf: python -I slots.py <name> <bpm> [--teil 2] [--min 0.25] [--lo 0]
import argparse, json, numpy as np, librosa
from scipy.signal import find_peaks
ap=argparse.ArgumentParser(); ap.add_argument("name"); ap.add_argument("bpm",type=float)
ap.add_argument("--teil",type=int,default=2); ap.add_argument("--min",type=float,default=0.25); ap.add_argument("--phase",type=float)
a=ap.parse_args()
M=np.load(f"{a.name}-rolle.npy"); info=json.load(open(f"{a.name}-rolle.json")); fps=info["fps"]; k=info["bpo"]//12; m0=info["fmin_midi"]
H=M.reshape(-1,k,M.shape[1]).max(1); H/=H.max()
d=np.maximum(np.diff(H,axis=1,prepend=H[:,:1]),0).sum(0)
on,_=find_peaks(d,height=np.percentile(d,85),distance=int(0.1*fps))
schritt=60/a.bpm/a.teil
t=on/fps
if a.phase is None:
    ang=np.angle(np.sum(d[on]*np.exp(2j*np.pi*t/schritt))); phase=(ang/(2*np.pi)*schritt)%schritt
else: phase=a.phase
fehler=np.abs(((t-phase)/schritt+0.5)%1-0.5)*schritt*1000
print(f"Phase {phase:.3f} s, Median-Abweichung {np.median(fehler):.1f} ms")
L=M.shape[1]; n=int((L/fps-phase)/schritt+0.5)
NAME=lambda m: librosa.midi_to_note(int(m),unicode=False)
res=[]
for q in range(n):
    f=int((phase+q*schritt)*fps)
    vor=H[:,max(0,f-4):f-1].mean(1) if f>4 else H[:,0]*0
    nach=H[:,f:min(L,f+int(0.09*fps))].max(1)
    z=nach-vor
    idx=[i for i in np.argsort(-z) if z[i]>a.min*z.max() and z[i]>0.06][:5]
    # Obertöne (Oktave, Duodezime) streichen, wenn Grundton auch neu ist
    s=set(idx); idx=[i for i in idx if not ((i-12 in s and z[i-12]>0.5*z[i]) or (i-19 in s and z[i-19]>0.5*z[i]))]
    takt,r=divmod(q,4*a.teil)
    res.append({"q":q,"t":phase+q*schritt,"toene":[(int(m0+i),round(float(z[i]),2)) for i in idx]})
    print(f"T{takt+1}.{r+1:<2d} {phase+q*schritt:6.2f}s  "+"  ".join(f"{NAME(m0+i)}:{z[i]:.2f}" for i in idx))
json.dump({"phase":phase,"schritt":schritt,"slots":res},open(f"{a.name}-slots.json","w"))
