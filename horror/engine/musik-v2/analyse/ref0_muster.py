# ref0: Klavier-Slots (48 Achtel, 3/4-Takt, 8 Takte) aus der gemittelten Rolle, nur Töne aus dem
# Tonvorrat des Takts (aus der Chroma je Achtel abgelesen). Bis zu 3 Töne je Slot.
import json, numpy as np, librosa
M=np.load("ref0-rolle.npy"); info=json.load(open("ref0-rolle.json")); fps=info["fps"]; m0=info["fmin_midi"]
H=M.reshape(-1,3,M.shape[1]).max(1); H/=H.max()
PC={"C":0,"C#":1,"D":2,"D#":3,"E":4,"F":5,"F#":6,"G":7,"G#":8,"A":9,"A#":10,"B":11}
vorrat=[["F","A","C","E"],["F","A","C","E"],["D","F#","A","C","E"],["D","F#","G","A","E"],
        ["A#","D","F","A","E"],["A#","C","C#","F","A"],["C#","F","A","C"],["C","E","G"]]
ph=0.201; st=60/66.2/2
out=[]
for q in range(48):
    f=int((ph+q*st)*fps)
    vor=H[:,max(0,f-4):max(1,f-1)].mean(1)
    nach=H[:,f:min(H.shape[1],f+int(0.12*fps))].max(1)
    z=np.maximum(nach-vor,0)
    erlaubt={PC[n] for n in vorrat[q//6]}
    kand=sorted([(z[i],m0+i) for i in range(len(z)) if (m0+i)%12 in erlaubt],reverse=True)
    s=set(m for _,m in kand[:6])
    top=[(int(m),round(float(v),2)) for v,m in kand[:4] if v>0.3*kand[0][0] and v>0.04 and not ((m-12 in s and z[m-12-m0]>0.6*v))][:3]
    out.append({"q":q,"noten":top})
    print(f"T{q//6+1}.{q%6+1}  "+"  ".join(f"{librosa.midi_to_note(m,unicode=False)}:{v:.2f}" for m,v in top))
json.dump(out,open("ref0-slots-muster.json","w"))
