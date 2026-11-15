// Requisite: ein Paar Schuhe. Zentrales Bild der Serie ("all that's left are your shoes, side by side").
// Als Figur gebaut, damit die Episode es frei hinstellen und per "sichtbar" ein- und ausblenden kann.
// params: art ('eli' | 'june' | 'dad' | 'owen' | 'tess' | 'grau' | 'nachbar'), ordnung ('nebeneinander' |
//         'schief'), groesse. Ursprung am Boden zwischen den Schuhen, Spitzen zeigen nach +z.
import { baueSchuh } from '../src/klotzfigur.js';

const ARTEN = {
  eli: { farbe: '#F2F2EE', sohle: '#E2DFD6', senkel: '#4FA36A', streifen: '#4FA36A', art: 'turnschuh' },
  june: { farbe: '#B83A32', sohle: '#F0EDE6', senkel: '#F4F2EC', art: 'turnschuh', schleife: true },
  dad: { farbe: '#6B4A2B', sohle: '#3A2A1C', senkel: '#C9A46A', art: 'stiefel', kante: '#5A3D22', masse: { b: 0.19, h: 0.13, l: 0.34 } },
  owen: { farbe: '#1E1F22', sohle: '#2b2b2e', senkel: '#E07A2E', art: 'stiefel', kante: '#2a2a2e', masse: { b: 0.185, h: 0.13, l: 0.33 } },
  tess: { farbe: '#7E5BB5', sohle: '#F2F0EA', senkel: '#F2F0EA', art: 'hightop' },
  grau: { farbe: '#8E9196', sohle: '#E6E4DE', senkel: '#D8D6D0', art: 'turnschuh', streifen: '#C9CBCF' },
  nachbar: { farbe: '#3a2e26', sohle: '#2a221c', art: 'halbschuh' },
};

export default async function baue(ctx, params = {}) {
  const T = ctx.THREE;
  const stil = ARTEN[params.art ?? 'grau'];
  if (!stil) throw new Error(`schuhpaar: art "${params.art}" unbekannt (${Object.keys(ARTEN).join(', ')})`);
  const masse = stil.masse ?? { b: 0.17, h: 0.12, l: 0.32 };
  const gruppe = new T.Group();
  const schief = params.ordnung === 'schief';
  const z = ctx.zufall('schuhe', params.art ?? 'grau');
  for (const sx of [-1, 1]) {
    const schuh = baueSchuh(ctx, stil, masse);
    // Ursprung von baueSchuh liegt am Knöchel: hochsetzen, damit die Sohle auf y = 0 steht
    schuh.position.set(sx * (masse.b / 2 + 0.025), masse.h, -masse.l * 0.17);
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
  mitte.position.set(0, masse.h, 0.05);
  gruppe.add(mitte);
  return {
    gruppe, gelenke: {}, grundpose() {}, hoehe: masse.h * s,
    anker: { mitte, fuss: mitte },
  };
}
