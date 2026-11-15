# Konsens-Transkription aus r2 und r5 (dasselbe Stück, r5 = 3 Halbtöne tiefer, 1,196x langsamer).
# Je Achtel-Slot: Zuwachs je Halbton in beiden gemittelten Rollen, auf den Grundton der Tonart bezogen
# (r2: E4 = 64, r5: C#4 = 61) und addiert. Nur Akkordtöne des Takts zählen.
import json, numpy as np, librosa
def zmat(name, bpm, phase=None):
    M=np.load(f"{name}-rolle.npy"); info=json.load(open(f"{name}-rolle.json")); fps=info["fps"]; m0=info["fmin_midi"]
    H=M.reshape(-1,3,M.shape[1]).max(1); H/=H.max()
    sl=json.load(open(f"{name}-slots.json")); ph=sl["phase"]; st=sl["schritt"]
    Z=[]
    for q in range(64):
        f=int((ph+q*st)*fps)
        vor=H[:,max(0,f-4):max(1,f-1)].mean(1)
        nach=H[:,f:min(H.shape[1],f+int(0.09*fps))].max(1) if f<H.shape[1] else H[:,-1]*0
        Z.append(np.maximum(nach-vor,0))
    return np.array(Z), m0
Z2,m2=zmat("r2",112.35); Z5,m5=zmat("r5",93.96)
# relativer Bereich -12..+34
rel=range(-12,35)
K=np.zeros((64,len(rel)))
for j,r in enumerate(rel):
    i2=64+r-m2; i5=61+r-m5
    if 0<=i2<Z2.shape[1]: K[:,j]+=Z2[:,i2]/Z2.max()
    if 0<=i5<Z5.shape[1]: K[:,j]+=Z5[:,i5]/Z5.max()
akk={0:[0,4,7],1:[9,0,4,7],2:[9,0,4],3:[8,0,4]}  # I, vi7, vi, bVI+ (relativ zum Grundton)
NAME=["1","b2","2","b3","3","4","b5","5","#5","6","b7","7"]
out=[]
for q in range(64):
    takt=q//8; ak=akk[takt%4]
    kand=[(K[q,j],r) for j,r in enumerate(rel) if r%12 in ak]
    kand.sort(reverse=True)
    top=[(r,round(float(v),2)) for v,r in kand[:3] if v>0.25*kand[0][0]]
    out.append({"q":q,"noten":top})
    print(f"T{takt+1}.{q%8+1}  "+"  ".join(f"{r:+3d}({NAME[r%12]}):{v:.2f}" for r,v in top))
json.dump(out,open("spieluhr-konsens.json","w"))
