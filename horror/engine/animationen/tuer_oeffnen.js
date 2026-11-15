// Tür öffnen (open_door): zur Klinke greifen, dann folgt die Hand der Klinke (Spec 2.1: 0,3–0,6 s).
// Am besten mit der Requisite "tuer" (figuren/tuer.js): Deren Anker "griff_vorn"/"griff_hinten"
// bewegt sich mit dem Türblatt, und die Hand bleibt dran. Die Tür selbst öffnet die Aktion
// { "wer": "<tuer-id>", "was": "oeffnen" } zur gleichen Zeit (bzw. nach dem Greifen).
// params: zu (Klinken-Anker, Pflicht), seite ("r"), greifen (Anteil der Dauer fürs Greifen, Std 0.35),
//         art ("ziehen" | "druecken", Std "ziehen"), loslassen (Std false)
import { zweiGlied, huelle } from '../src/ik.js';

export default {
  dauer: 0.7,
  ease: 'linear',
  anwenden(fig, p, params, ctx) {
    if (params.zu === undefined) throw new Error('tuer_oeffnen braucht params.zu (Klinke, z. B. "haustuer.griff_vorn")');
    const S = (params.seite ?? 'r').toUpperCase();
    const g = params.greifen ?? 0.35;
    const greif = Math.min(1, ctx.roh / g);
    const halten = params.loslassen ? huelle(ctx.roh, g, 0.25) : (greif * greif * (3 - 2 * greif));
    const ziel = ctx.zielPunkt(params.zu);
    zweiGlied(fig, S, ziel, halten);
    if (fig.handForm && halten > 0.5) fig.handForm(S, 'faust');
    // Körper: beim Ziehen zurücklehnen, beim Drücken vor; nur während die Tür aufgeht
    const zug = Math.max(0, Math.min(1, (ctx.roh - g) / (1 - g)));
    const lehne = (params.art === 'druecken' ? 1 : -1) * 0.08 * Math.sin(Math.PI * zug);
    fig.gelenke.rumpf.rotation.x += lehne + 0.05 * halten;
    if (fig.gelenke.kopf) fig.gelenke.kopf.rotation.x += 0.1 * greif;
  },
};
