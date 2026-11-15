// Zeichenhilfen für Kleidungs-Aufkleber (Rumpf vorne/hinten, Becken).
// Alle Funktionen zeichnen in eine Canvas-Fläche (g, w, h). "rand(y)" liefert die halbe Breite
// des Trapez-Rumpfs bei der Höhe y (0 = oben, 1 = unten) als Anteil der Gesamtbreite, damit
// nichts über die schmalere Unterkante hinausgemalt wird.

export const naht = (g, w, x0, y0, x1, y1, farbe = 'rgba(0,0,0,0.28)') => {
  g.strokeStyle = farbe; g.lineWidth = Math.max(1.5, w * 0.008);
  g.setLineDash([w * 0.018, w * 0.014]);
  g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
  g.setLineDash([]);
};

// Reißverschluss mittig mit Zipper-Griff oben
export function reissverschluss(g, w, h, { farbe = '#c9c9c4', von = 0.04, bis = 0.96 } = {}) {
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.fillRect(w * 0.5 - w * 0.012, h * von, w * 0.024, h * (bis - von));
  g.fillStyle = farbe;
  for (let y = h * von; y < h * bis; y += h * 0.022) g.fillRect(w * 0.5 - w * 0.009, y, w * 0.018, h * 0.011);
  g.fillRect(w * 0.5 - w * 0.022, h * (von + 0.05), w * 0.044, h * 0.07);
}

// Bauchtasche (Kängurutasche) oder aufgesetzte Tasche
export function tasche(g, w, h, x, y, bw, bh, { farbe = 'rgba(0,0,0,0.16)', schraeg = false } = {}) {
  g.fillStyle = farbe;
  g.beginPath();
  if (schraeg) {
    g.moveTo(x, y + bh); g.lineTo(x + bw * 0.2, y); g.lineTo(x + bw * 0.8, y); g.lineTo(x + bw, y + bh);
  } else {
    g.rect(x, y, bw, bh);
  }
  g.closePath(); g.fill();
  naht(g, w, x + bw * 0.06, y + bh * 0.12, x + bw * 0.94, y + bh * 0.12);
}

// Rippbündchen am Saum (dunklerer Streifen mit senkrechten Rippen)
export function saum(g, w, h, rand, { farbe = 'rgba(0,0,0,0.22)', hoehe = 0.09 } = {}) {
  const y0 = h * (1 - hoehe);
  const halb = rand(1) * w;
  g.fillStyle = farbe;
  g.fillRect(w / 2 - halb, y0, halb * 2, h - y0);
  g.fillStyle = 'rgba(0,0,0,0.12)';
  for (let x = w / 2 - halb; x < w / 2 + halb; x += w * 0.025) g.fillRect(x, y0, w * 0.008, h - y0);
}

// Kragen: V-Ausschnitt in Farbe des Unterhemds
export function vAusschnitt(g, w, h, farbe, tiefe = 0.32) {
  g.fillStyle = farbe;
  g.beginPath(); g.moveTo(w * 0.36, 0); g.lineTo(w * 0.5, h * tiefe); g.lineTo(w * 0.64, 0); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = w * 0.012;
  g.beginPath(); g.moveTo(w * 0.36, 0); g.lineTo(w * 0.5, h * tiefe); g.lineTo(w * 0.64, 0); g.stroke();
}

// Kordeln der Kapuze
export function kordeln(g, w, h, farbe = '#e8e4da') {
  g.strokeStyle = farbe; g.lineWidth = w * 0.016; g.lineCap = 'round';
  for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(w * (0.5 + sx * 0.08), h * 0.02); g.lineTo(w * (0.5 + sx * 0.09), h * 0.3); g.stroke(); }
  g.fillStyle = farbe;
  for (const sx of [-1, 1]) g.fillRect(w * (0.5 + sx * 0.09) - w * 0.013, h * 0.3, w * 0.026, h * 0.035);
}

// Querstreifen (Reflexstreifen der Arbeitsjacke)
export function querstreifen(g, w, h, rand, y, dicke, farbe) {
  const halb = rand(y) * w;
  g.fillStyle = farbe;
  g.fillRect(w / 2 - halb, h * y, halb * 2, h * dicke);
}

// Gürtel und Taschennähte am Becken
export function guertel(g, w, h, { farbe = '#3a2a20', schnalle = '#c8b27a' } = {}) {
  g.fillStyle = farbe; g.fillRect(0, h * 0.02, w, h * 0.3);
  g.fillStyle = schnalle; g.fillRect(w * 0.45, h * 0.0, w * 0.1, h * 0.34);
  g.fillStyle = farbe; g.fillRect(w * 0.47, h * 0.07, w * 0.06, h * 0.2);
  naht(g, w, w * 0.12, h * 0.45, w * 0.3, h * 0.95);
  naht(g, w, w * 0.88, h * 0.45, w * 0.7, h * 0.95);
}

// Knopfleiste (Mantel, Hemd)
export function knopfleiste(g, w, h, { farbe = '#2b2018', anzahl = 4, von = 0.15, bis = 0.85, x = 0.5 } = {}) {
  naht(g, w, w * (x + 0.04), h * 0.02, w * (x + 0.04), h * 0.98);
  g.fillStyle = farbe;
  for (let i = 0; i < anzahl; i++) {
    const y = h * (von + ((bis - von) * i) / Math.max(1, anzahl - 1));
    g.beginPath(); g.arc(w * x, y, w * 0.022, 0, 2 * Math.PI); g.fill();
  }
}
