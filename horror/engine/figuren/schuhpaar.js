// Requisite: ein Paar Schuhe. Zentrales Bild der Serie ("all that's left are your shoes, side by side").
// Als Figur gebaut, damit die Episode es frei hinstellen und per "sichtbar" ein- und ausblenden kann.
// params: art ('eli' | 'june' | 'dad' | 'owen' | 'tess' | 'grau' | 'nachbar'), ordnung ('nebeneinander' |
//         'schief'), groesse. Ursprung am Boden zwischen den Schuhen, Spitzen zeigen nach +z.
//
// Review Folge 1: Die Schuhe sind das Leitmotiv, lasen sich aber als Seifenstücke oder Brotlaibe.
// Darum hat die Requisite ein eigenes, genaueres Modell (die Figuren behalten ihre Schuhklötze):
// Sohle mit Kante, flache runde Zehenkappe, höhere Ferse, Lasche mit Schnürung, dunkle Öffnung
// mit gepolstertem Rand, Fersenkappe und Seitenstreifen. Farben mit Kontrast zum Untergrund.
import { rundeKiste } from '../src/klotzfigur.js';

const ARTEN = {
  eli: { farbe: '#F2F2EE', sohle: '#E2DFD6', senkel: '#4FA36A', streifen: '#4FA36A', akzent: '#4FA36A', art: 'turnschuh' },
  june: { farbe: '#C23E34', sohle: '#F4F1EA', senkel: '#F7F5EF', streifen: '#F7F5EF', akzent: '#F7F5EF', art: 'turnschuh', schleife: true },
  dad: { farbe: '#B57C44', kappe: '#8A5A30', sohle: '#2E241C', senkel: '#EAD9A2', akzent: '#7A4E28', art: 'stiefel', masse: { b: 0.15, h: 0.125, l: 0.36 } },
  owen: { farbe: '#2A2B30', kappe: '#1F2024', sohle: '#4A4A50', senkel: '#F08A3A', akzent: '#F08A3A', art: 'stiefel', glanz: true, masse: { b: 0.145, h: 0.125, l: 0.35 } },
  tess: { farbe: '#7E5BB5', sohle: '#F2F0EA', senkel: '#F2F0EA', streifen: '#F2F0EA', akzent: '#F2F0EA', art: 'hightop' },
  // „grau“ = die Schuhe der Verschwundenen auf der Straße: hell, damit sie auf dem Asphalt stehen
  grau: { farbe: '#E8E5DE', sohle: '#F6F4EF', senkel: '#F6F4EF', streifen: '#2F4F86', akzent: '#2F4F86', art: 'turnschuh' },
  nachbar: { farbe: '#2E3F66', sohle: '#F2EFE8', senkel: '#F2EFE8', streifen: '#F2EFE8', akzent: '#F2EFE8', art: 'turnschuh' },
};

// Ein Schuh, Ursprung unten in der Mitte der Sohle (y = 0 = Boden), Spitze nach +z.
export function baueSchuhDetail(ctx, stil, masse = {}) {
  const T = ctx.THREE;
  const b = masse.b ?? 0.17, h = masse.h ?? 0.12, l = masse.l ?? 0.32;
  const stiefel = stil.art === 'stiefel', hoch = stil.art === 'hightop';
  const kante = { farbe: '#e8eeff', staerke: 0.25, exponent: 2.8 };
  const mOben = ctx.mat(stil.farbe, { rauheit: stil.glanz ? 0.42 : 0.7, kante });
  const mKappe = ctx.mat(stil.kappe ?? stil.farbe, { rauheit: stil.glanz ? 0.38 : 0.65, kante });
  const mSohle = ctx.mat(stil.sohle, { rauheit: 0.85 });
  const mAkzent = ctx.mat(stil.akzent ?? stil.sohle, { rauheit: 0.6 });
  const mInnen = ctx.mat('#17130f', { rauheit: 1 });
  const g = new T.Group();
  const setz = (m, x, y, z, rx = 0) => { m.position.set(x, y, z); m.rotation.x = rx; g.add(m); return m; };

  // Sohle: Stiefel mit dickem Profil und Absatz, Turnschuh mit heller, umlaufender Kante
  const sH = stiefel ? 0.042 : 0.034;
  setz(rundeKiste(b * 1.07, sH, l * 1.02, mSohle, 0.014), 0, sH / 2, 0);
  if (stiefel) setz(rundeKiste(b * 1.02, 0.02, l * 0.3, mSohle, 0.006), 0, sH + 0.004, -l * 0.33);
  // Ferse und Schaft: hinten höher (Stiefel und High-Top deutlich)
  const hR = h * (stiefel ? 1.55 : hoch ? 1.45 : 0.82);
  const lR = l * 0.5;
  setz(rundeKiste(b, hR, lR, mOben, 0.03), 0, sH + hR / 2, -l * 0.23);
  // Zehenkappe: niedrig und stark gerundet, damit die Schuhform von der Seite und von oben lesbar ist
  const hT = h * 0.5;
  setz(rundeKiste(b * 0.98, hT, l * 0.52, mKappe, Math.min(hT, b) * 0.48), 0, sH + hT / 2, l * 0.22);
  // Rist: schräge Fläche von der Kappe zur Öffnung, darauf Lasche und Schnürung
  const ristL = l * 0.36, ristNeig = Math.atan2(hR - hT, ristL) * 0.85;
  const ristY = sH + (hT + hR) / 2 - 0.006, ristZ = l * 0.02;
  setz(rundeKiste(b * 0.94, 0.05, ristL, mOben, 0.02), 0, ristY - 0.02, ristZ, -ristNeig);
  setz(rundeKiste(b * 0.46, 0.022, ristL * 0.95, mAkzent, 0.008), 0, ristY + 0.008, ristZ - 0.005, -ristNeig);
  // Schnürung: Querbalken entlang des Rists, oben eine Schleife
  const mS = ctx.mat(stil.senkel, { rauheit: 0.75 });
  const n = stiefel ? 5 : 4;
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n - 0.5;
    const s = rundeKiste(b * 0.7, 0.014, 0.022, mS, 0.006, false);
    s.position.set(0, ristY + 0.024 - u * ristL * Math.sin(ristNeig), ristZ + u * ristL * Math.cos(ristNeig));
    s.rotation.x = -ristNeig;
    g.add(s);
  }
  for (const sx of [-1, 1]) {
    const sch = rundeKiste(0.05, 0.014, 0.03, mS, 0.008, false);
    sch.position.set(sx * 0.026, ristY + 0.04 + ristL * 0.5 * Math.sin(ristNeig), ristZ - ristL * 0.48);
    sch.rotation.set(-0.3, sx * 0.55, 0);
    g.add(sch);
  }
  // Öffnung: dunkles Inneres mit gepolstertem Rand (von oben sofort als Schuh erkennbar)
  const obenY = sH + hR;
  setz(rundeKiste(b * 0.66, 0.02, lR * 0.56, mInnen, 0.008), 0, obenY - 0.006, -l * 0.27);
  const rand = new T.Mesh(new T.TorusGeometry(0.5, 0.13, 6, 18), stiefel ? mKappe : mAkzent);
  rand.scale.set(b * 0.74, lR * 0.66, 0.06);
  rand.rotation.x = Math.PI / 2;
  rand.position.set(0, obenY, -l * 0.27);
  rand.castShadow = true;
  g.add(rand);
  // Fersenkappe hinten in Akzentfarbe, Zuglasche
  setz(rundeKiste(b * 0.72, hR * 0.55, 0.016, mAkzent, 0.006, false), 0, sH + hR * 0.32, -l * 0.23 - lR / 2 - 0.004);
  setz(rundeKiste(0.04, stiefel ? 0.06 : 0.04, 0.012, mAkzent, 0.004, false), 0, obenY + 0.012, -l * 0.23 - lR / 2 + 0.01);
  // Seitenstreifen (Turnschuh) bzw. Naht über der Sohle (Stiefel)
  for (const sx of [-1, 1]) {
    if (stil.streifen) {
      const st = rundeKiste(0.008, 0.026, l * 0.5, ctx.mat(stil.streifen, { rauheit: 0.6 }), 0.004, false);
      st.position.set(sx * (b / 2 + 0.003), sH + hR * 0.45, -l * 0.08);
      st.rotation.x = -0.32;
      g.add(st);
    } else {
      const st = rundeKiste(0.006, 0.012, l * 0.95, mAkzent, 0.003, false);
      st.position.set(sx * (b * 0.535), sH + 0.008, 0);
      g.add(st);
    }
  }
  // Turnschuh: helle Gummikappe vorn
  if (!stiefel) setz(rundeKiste(b * 0.92, hT * 0.5, l * 0.1, mSohle, 0.02), 0, sH + hT * 0.22, l * 0.47);
  return g;
}

export default async function baue(ctx, params = {}) {
  const T = ctx.THREE;
  const stil = ARTEN[params.art ?? 'grau'];
  if (!stil) throw new Error(`schuhpaar: art "${params.art}" unbekannt (${Object.keys(ARTEN).join(', ')})`);
  // schlanker als die Schuhklötze der Figuren: Breite zu Länge etwa 1 : 2,6 wie ein echter Schuh
  const masse = stil.masse ?? { b: 0.13, h: 0.11, l: 0.34 };
  const gruppe = new T.Group();
  const schief = params.ordnung === 'schief';
  const z = ctx.zufall('schuhe', params.art ?? 'grau');
  for (const sx of [-1, 1]) {
    const schuh = baueSchuhDetail(ctx, stil, masse);
    // Ursprung von baueSchuhDetail liegt unten an der Sohle
    schuh.position.set(sx * (masse.b / 2 + 0.03), 0, 0);
    if (schief) {
      schuh.position.x += sx * 0.06 + (z() - 0.5) * 0.1;
      schuh.position.z += (z() - 0.5) * 0.2;
      schuh.rotation.y = (z() - 0.5) * 1.6;
      if (sx > 0 && z() < 0.5) { schuh.rotation.z = Math.PI / 2 * 0.95; schuh.position.y = masse.b / 2; }
    }
    gruppe.add(schuh);
  }
  const s = params.groesse ?? 1;
  gruppe.scale.setScalar(s);
  const mitte = new T.Object3D();
  mitte.position.set(0, masse.h * 0.8, 0.02);
  gruppe.add(mitte);
  return {
    gruppe, gelenke: {}, grundpose() {}, hoehe: masse.h * s,
    anker: { mitte, fuss: mitte },
  };
}
