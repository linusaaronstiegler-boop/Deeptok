#!/usr/bin/env python3
"""Trend-Radar für den Horror-Kanal: Was läuft gerade bei Horror-Storys auf TikTok und YouTube Shorts?

Das Skript sammelt für eine feste Liste von Hashtags und Konkurrenzkonten (``quellen.json``) die neuesten
und meistgesehenen Videos mit Titel/Beschreibung, Aufrufen, Likes, Shares, Länge, Datum und, wo öffentlich
sichtbar, dem Sound-Namen. Es schreibt eine JSON-Datei mit allen Rohwerten und einen Markdown-Wochenbericht.

Woher die Daten kommen (und warum so):
- **TikTok:** Das Skript ruft TikTok **nicht selbst** ab. TikToks Nutzungsbedingungen verbieten das
  automatische Auslesen („scrape, crawl … using any automated system“, Fassungen März und Juli 2026), und
  tiktok.com/robots.txt sperrt KI-Agenten wie ``Claude-User`` ganz sowie ``/embed/@`` für alle Bots.
  Stattdessen öffnet Linus die öffentlichen Seiten im eigenen Browser und speichert sie (Strg+S,
  „Webseite, vollständig“) in einen Eingangsordner. Das Skript liest diese Dateien nur aus.
  Es versteht Videoseiten, Profilseiten, Hashtag-Seiten und Embed-Seiten (siehe README).
- **YouTube:** über die offizielle YouTube Data API v3 mit eigenem Schlüssel (``YOUTUBE_API_KEY``),
  langsam, mit Pausen und Kontingent-Schätzung. Ohne Schlüssel wird YouTube übersprungen.

Aufruf:
    python radar.py --eingang EINGANGSORDNER [--eingang WEITERER] [--youtube] [--aus ../../docs/trends]
    python radar.py --youtube-trocken      # zeigt nur, welche API-Aufrufe es machen würde
    python radar.py --selbsttest           # prüft die Parser an eingebauten Mini-Beispielen

Nur Standardbibliothek, Python ≥ 3.10.
"""
from __future__ import annotations

import argparse
import datetime as dt
import glob
import json
import os
import re
import statistics
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

HIER = Path(__file__).resolve().parent
UTC = dt.timezone.utc
UA = "DeepTok-Trendradar/1.0 (+offizielle YouTube Data API; TikTok nur aus lokal gespeicherten Seiten)"
YT_API = "https://www.googleapis.com/youtube/v3/"
YT_PAUSE_S = 1.5  # Pause zwischen zwei API-Aufrufen: sparsam, auch wenn das Kontingent mehr erlaubt

# ---------------------------------------------------------------------------------------------
# Kleine Helfer
# ---------------------------------------------------------------------------------------------


def datum_aus_tiktok_id(vid: str) -> dt.datetime | None:
    """TikTok-Video-IDs tragen ihren Zeitstempel: Die oberen 32 Bit sind Sekunden seit 1970 (UTC)."""
    try:
        return dt.datetime.fromtimestamp(int(vid) >> 32, UTC)
    except (ValueError, OverflowError, OSError):
        return None


def zahl_aus_text(text: str | int | float | None) -> int | None:
    """Liest Anzeige-Zahlen wie „1.2M“, „345,6K“, „12,3 Mio.“ oder „1.234“ als ganze Zahl."""
    if text is None:
        return None
    if isinstance(text, (int, float)):
        return int(text)
    t = str(text).strip().replace(" ", "").replace("\xa0", " ")
    m = re.match(r"^([\d.,]+)\s*(k|tsd\.?|m|mio\.?|b|mrd\.?)?$", t, re.I)
    if not m:
        return None
    zahl, einheit = m.group(1), (m.group(2) or "").lower().rstrip(".")
    faktor = {"": 1, "k": 1e3, "tsd": 1e3, "m": 1e6, "mio": 1e6, "b": 1e9, "mrd": 1e9}[einheit]
    if faktor == 1:
        # Ohne Einheit sind Punkt und Komma Tausendertrenner („1.234“ bzw. „1,234“).
        return int(re.sub(r"[.,]", "", zahl))
    zahl = zahl.replace(",", ".")
    try:
        return int(round(float(zahl) * faktor))
    except ValueError:
        return None


def iso(t: dt.datetime | None) -> str | None:
    return t.astimezone(UTC).strftime("%Y-%m-%dT%H:%MZ") if t else None


def tz(n: float | int | None, nachkomma: int = 0) -> str:
    """Zahl mit deutschem Tausenderpunkt und Dezimalkomma."""
    if n is None:
        return "–"
    s = f"{n:,.{nachkomma}f}"
    return s.replace(",", "X").replace(".", ",").replace("X", ".")


def median(werte):
    w = [x for x in werte if x is not None]
    return statistics.median(w) if w else None


def kurz(text: str | None, n: int = 70) -> str:
    t = re.sub(r"\s+", " ", text or "").strip()
    t = t.replace("|", "/")  # Markdown-Tabellen nicht zerbrechen
    return t if len(t) <= n else t[: n - 1] + "…"


# ---------------------------------------------------------------------------------------------
# Inhalte erkennen: Serie, Hook-Muster, Motive, Genre, Länge
# ---------------------------------------------------------------------------------------------

# Hook-Muster werden am Beschreibungstext erkannt (ohne Hashtags). Viele Horror-Konten posten ohne Text;
# dann bleibt nur „ohne Text“, und das Muster muss im Video selbst nachgesehen werden.
HOOK_MUSTER = [
    ("„In this town/world …“", r"^\W*in (this|my|our|the) (town|world|city|village|school|family|house|country)\b"),
    ("Altersschwelle („when you turn 18“)", r"\b(when|once|after) you turn (\d{1,2}|eighteen|sixteen|twenty)\b|\bturn(s|ed)? 18\b"),
    ("Wiederkehr („every night/at midnight“)", r"\bevery (night|year|day|morning|week|full moon|halloween|birthday)\b|\bat (midnight|3 ?am)\b"),
    ("Verbot („never …“, „don't …“)", r"^\W*(never|don'?t|do not)\b|\bnever (look|open|answer|say|let|go|leave|turn|count|wave|swim|whistle)\b"),
    ("Titel „The … who/that …“", r"^\W*the [\w' ]{2,30}? (who|that|whose)\b"),
    ("Kurztitel (1–3 Wörter)", None),  # Sonderfall, siehe hook_muster()
    ("nur Gattungswort („story“, „In this town“)", None),  # Sonderfall
    ("Frage", r"\?\s*$"),
    ("POV", r"^\W*pov\b"),
    ("Spielname („Game: …“)", r"^\W*game( name)?\s*[:\-]"),
]

MOTIVE = [
    ("Doppelgänger/falsche Eltern", r"doppel|mimic|not my (mom|dad|mother|father|sister|brother)|wasn'?t my|two moms|skinwalker|imposter|fake (mom|dad)"),
    ("Riese/übergroß", r"\bgiant\b|\btall\b|siren head|stilt|long arms?|\bhuge\b"),
    ("Geist/Schatten", r"ghost|shadow|spirit|haunt|phantom"),
    ("Blick/Gesicht/Lächeln", r"blink|smil|\bstare|\beyes?\b|face|watch(es|ing)?\b"),
    ("Stimme/Geräusch/Radio", r"voice|whisper|radio|knock|siren goes|scream|sound\b|names?\b.*read"),
    ("Tür/Haus/Einlass", r"\bdoor\b|let (them|her|him|it) in|extra chair|basement|the room|the hotel|lights?\b"),
    ("Spiel wird tödlich", r"\bgame of\b|\btag\b|hide and seek|hide-and-seek|\bdeadly\b"),
    ("Nachtritual/Auslosung", r"midnight|every night|sunrise|before sunrise|names|lottery|chosen"),
    ("Kreatur/Monster", r"monster|creature|scarecrow|thing\b|entity|scp|demon|wendigo|stilt men"),
    ("KI/Technik", r"\bai\b|assistant|robot|phone|screen|camera"),
    ("Superkraft/Fantasy", r"power|magic|magical|\bfly\b|aura|cracked|soulmate|token|wish|dream|ocean is in the sky|clock"),
    ("Schule/Alltag/Komik", r"high school|class\b|rizz|gone wrong|party|showers? cost|\$1\b|tung tung"),
]

GENRE = {
    "Horror": r"horror|scary|creep|monster|creature|kill|dead|death|\bdie[sd]?\b|blood|ghost|haunt|demon|curse|midnight|3 ?am|scream|hunt|shadow|mimic|skinwalker|doppel|not my mom|blink|whisp|disappear|vanish|stalk|knock|scarecrow|stilt|scp|sunrise|siren|never (look|open|answer)|let (them|her|him|it) in|extra chair|the hotel|the room|watch",
    "Fantasy": r"superpower|power|magic|magical|\bfly\b|aura|cracked|soulmate|token|\bwish|dream|ocean is in the sky|giant clock|one rule|opposite powers|clothes",
    "Komik": r"🤣|funny|\blol\b|rizz|gone wrong|high school|meme|ragebait|hilarious|partying|showers cost|tung tung",
}

LAENGEN = [(0, 60, "unter 60 s"), (60, 90, "60–89 s"), (90, 120, "90–119 s"), (120, 150, "120–149 s"), (150, 181, "150–180 s"), (181, 10**6, "über 180 s")]


def text_ohne_tags(text: str | None) -> str:
    t = re.sub(r"[#@][^\s#@]+", " ", text or "")
    return re.sub(r"\s+", " ", t).strip(" \"'“”")


def teil_erkennen(text: str | None) -> dict:
    """Erkennt Serienteile in der Beschreibung.

    Ergebnis: art = 'teil_1' (Teil 1 oder Köder „Part 2?“/„follow for part 2“), 'teil_2plus' oder 'einzel'.
    „Who wants a part 2?“ zählt als Teil 1 mit Köder, nicht als Teil 2.
    """
    t = (text or "").lower()
    koeder = re.search(r"(part|teil|pt\.?)\s*2\s*\?|follow (for|me for) (part|pt)\.?\s*\d*|folge für (part|teil)\s*\d*|part 2 (on|in) my", t)
    if koeder:
        # „Folge für Part 2“ verspricht Teil 2, ist also selbst Teil 1: die Köder-Phrase nicht als Teilnummer lesen
        t = t.replace(koeder.group(0), " ")
    m = re.search(r"\b(?:part|pt\.?|teil|chapter \d+ part|episode|ep\.?)\s*#?\s*(\d{1,2})\b(?!\s*\?)", t)
    m2 = re.search(r"\((\d)\s*/\s*(\d)\)|\b(\d) of (\d)\b", t)
    nr = None
    if m:
        nr = int(m.group(1))
    elif m2:
        nr = int(m2.group(1) or m2.group(3))
    if nr is not None and nr >= 2:
        return {"art": "teil_2plus", "nr": nr, "koeder": bool(koeder)}
    if nr == 1 or koeder:
        return {"art": "teil_1", "nr": 1, "koeder": bool(koeder)}
    if re.search(r"full (version|story|vid)|compilation|complation", t):
        return {"art": "zusammenschnitt", "nr": None, "koeder": False}
    return {"art": "einzel", "nr": None, "koeder": False}


def hook_muster(text: str | None) -> list[str]:
    roh = text_ohne_tags(text)
    if not roh:
        return ["ohne Text"]
    erste = re.split(r"(?<=[.!?…])\s", roh, maxsplit=1)[0].lower()
    treffer = []
    for name, muster in HOOK_MUSTER:
        if muster and re.search(muster, erste if name != "Frage" else roh.lower()):
            treffer.append(name)
    worte = re.findall(r"[a-zA-ZäöüÄÖÜß']+", roh)
    # „story“ oder nur „In this town“ ist kein Hook, sondern ein Etikett ohne Inhalt
    if re.fullmatch(r"\W*(story|stories|roblox story|in (this|my) (town|world)|part \d+|pt\.? ?\d+)\W*", roh.lower()):
        return ["nur Gattungswort („story“, „In this town“)"]
    if not treffer and 1 <= len(worte) <= 3:
        treffer.append("Kurztitel (1–3 Wörter)")
    return treffer or ["sonstiger Satz"]


def motive(text: str | None) -> list[str]:
    t = text_ohne_tags(text).lower()
    return [name for name, muster in MOTIVE if re.search(muster, t)] if t else []


def genre(text: str | None, konto_genre: str | None = None) -> str:
    """Genre aus dem Beschreibungstext ohne Hashtags. Rückfall: Genre des Kontos (quellen.json), dann Hashtags."""
    t = text_ohne_tags(text).lower()
    for name in ("Horror", "Komik", "Fantasy"):  # Horror zuerst: „deadly game“ ist Horror, nicht Fantasy
        if t and re.search(GENRE[name], t):
            return name
    if konto_genre:
        return f"{konto_genre} (laut Konto)"
    if re.search(r"#(horror|scary|creepy)", (text or "").lower()):
        return "Horror (nur Hashtag)"
    return "unklar" if t else "unklar (ohne Text)"


FORMATE = [
    ("Zusammenschnitt/Edit", r"compilation|complation|full version|stories edit|edit|favou?rite videos|i love those videos|so good"),
    ("Spiel-Werbung", r"out now|link in bio|coming soon|showcase|release|what if you were actually in one|free,? |how to get paid"),
    ("Gameplay", r"^\W*game( name)?\s*[:\-]|\bgame name\b|\bgame:"),
]


def format_erkennen(text: str | None) -> str:
    """Story oder etwas anderes? Zusammenschnitte, Spiel-Werbung und Gameplay verzerren sonst jede Story-Statistik."""
    t = (text or "").lower()
    for name, muster in FORMATE:
        if re.search(muster, t):
            return name
    return "Story"


def laenge_klasse(sek: int | None) -> str | None:
    if sek is None:
        return None
    for lo, hi, name in LAENGEN:
        if lo <= sek < hi:
            return name
    return None


# ---------------------------------------------------------------------------------------------
# TikTok-Seiten aus dem Eingangsordner lesen (kein Netz!)
# ---------------------------------------------------------------------------------------------


def _script_json(html: str, sid: str):
    m = re.search(r'<script[^>]+id="%s"[^>]*>(.*?)</script>' % re.escape(sid), html, re.S)
    if not m:
        return None
    try:
        return json.loads(m.group(1))
    except json.JSONDecodeError:
        return None


def _video_aus_itemstruct(it: dict) -> dict:
    st = it.get("statsV2") or it.get("stats") or {}
    mu = it.get("music") or {}
    au = it.get("author") or {}
    tags = [x.get("hashtagName") for x in (it.get("textExtra") or []) if x.get("hashtagName")]
    tags += [c.get("title") for c in (it.get("challenges") or []) if c.get("title")]
    return {
        "id": str(it.get("id")),
        "konto": (au.get("uniqueId") if isinstance(au, dict) else au) or None,
        "text": it.get("desc") or "",
        "aufrufe": zahl_aus_text(st.get("playCount")),
        "likes": zahl_aus_text(st.get("diggCount")),
        "kommentare": zahl_aus_text(st.get("commentCount")),
        "shares": zahl_aus_text(st.get("shareCount")),
        "gespeichert": zahl_aus_text(st.get("collectCount")),
        "dauer_s": (it.get("video") or {}).get("duration") or None,
        "sound": {"titel": mu.get("title"), "autor": mu.get("authorName"), "original": bool(mu.get("original")),
                  "id": str(mu.get("id")) if mu.get("id") else None} if mu.get("title") else None,
        "hashtags": sorted({t.lower() for t in tags if t}),
        "ki_label": bool(it.get("IsAigc")),
    }


def _dom_raster(html: str, stand: dt.datetime, datei: str):
    """Videoraster einer im Browser gespeicherten Profil- oder Hashtag-Seite („Webseite, vollständig“).

    TikTok zeigt im Raster je Video einen Link …/@konto/video/ID und die Aufrufe in einem Element mit
    data-e2e="video-views". Likes, Shares und Sound stehen dort nicht, die stehen nur auf der Videoseite.
    """
    for m in re.finditer(r'href="(?:https://www\.tiktok\.com)?/@([\w.]+)/video/(\d{15,22})"', html):
        konto, vid = m.group(1), m.group(2)
        fenster = html[m.end(): m.end() + 2500]
        v = re.search(r'data-e2e="video-views"[^>]*>\s*([^<]+?)\s*<', fenster)
        alt = re.search(r'\balt="([^"]{3,300})"', fenster)
        yield "video", {"id": vid, "konto": konto, "aufrufe": zahl_aus_text(v.group(1)) if v else None,
                        "text": alt.group(1) if alt else None}, {"art": "raster", "datei": datei, "stand": stand}


def lies_seite(pfad: str):
    """Liefert Beobachtungen (art, daten, herkunft) aus einer gespeicherten Seite."""
    html = open(pfad, encoding="utf-8", errors="replace").read()
    stand = dt.datetime.fromtimestamp(os.path.getmtime(pfad), UTC)
    datei = os.path.basename(pfad)

    uni = _script_json(html, "__UNIVERSAL_DATA_FOR_REHYDRATION__")
    if uni:
        sc = uni.get("__DEFAULT_SCOPE__", {})
        vd = sc.get("webapp.video-detail") or {}
        it = (vd.get("itemInfo") or {}).get("itemStruct")
        if it:
            yield "video", _video_aus_itemstruct(it), {"art": "videoseite", "datei": datei, "stand": stand}
        ud = sc.get("webapp.user-detail") or {}
        ui = ud.get("userInfo") or {}
        if ui.get("user"):
            u, s = ui["user"], ui.get("statsV2") or ui.get("stats") or {}
            yield "konto", {"name": u.get("uniqueId"), "follower": zahl_aus_text(s.get("followerCount")),
                            "likes": zahl_aus_text(s.get("heartCount")), "videos": zahl_aus_text(s.get("videoCount")),
                            "erstellt": iso(dt.datetime.fromtimestamp(u["createTime"], UTC)) if u.get("createTime") else None}, \
                {"art": "profilseite", "datei": datei, "stand": stand}

    fro = _script_json(html, "__FRONTITY_CONNECT_STATE__")
    if fro:
        for _, seite in ((fro.get("source") or {}).get("data") or {}).items():
            if not isinstance(seite, dict) or "videoList" not in seite:
                continue
            route = seite.get("route") or seite.get("link") or ""
            liste = seite.get("videoList") or []
            ei = seite.get("embedInfo") or {}
            ui = seite.get("userInfo") or {}
            herkunft = {"datei": datei, "stand": stand}
            if "/embed/tag/" in route:
                tag = route.split("/embed/tag/")[1].strip("/").lower()
                yield "hashtag", {"name": tag, "aufrufe": zahl_aus_text(ei.get("viewCount")),
                                  "videos": zahl_aus_text(ei.get("videoCount")),
                                  "top": [str(x["id"]) for x in liste]}, dict(herkunft, art="tag-embed")
                art = f"tag:{tag}"
            elif "/embed/music/" in route:
                art = "sound-embed"
            elif ui.get("uniqueId"):
                yield "konto", {"name": ui["uniqueId"], "follower": zahl_aus_text(ui.get("followerCount")),
                                "likes": zahl_aus_text(ui.get("heartCount")),
                                "neueste": [str(x["id"]) for x in liste]}, dict(herkunft, art="konto-embed")
                art = f"konto:{ui['uniqueId']}"
            else:
                art = "embed"
            for x in liste:
                yield "video", {"id": str(x["id"]), "konto": x.get("authorUniqueId") or ui.get("uniqueId"),
                                "text": x.get("desc") or "", "aufrufe": zahl_aus_text(x.get("playCount"))}, dict(herkunft, art=art)

    # Nur echte TikTok-Raster lesen (erkennbar an data-e2e), keine Suchmaschinen-Seiten mit TikTok-Links
    if 'data-e2e="video-views"' in html:
        yield from _dom_raster(html, stand, datei)


# ---------------------------------------------------------------------------------------------
# Sammlung: Beobachtungen zusammenführen
# ---------------------------------------------------------------------------------------------

FELDER_ZAHL = ("aufrufe", "likes", "kommentare", "shares", "gespeichert")


class Sammlung:
    def __init__(self):
        self.videos: dict[str, dict] = {}
        self.konten: dict[str, dict] = {}
        self.hashtags: dict[str, dict] = {}
        self.dateien = 0

    def video(self, d: dict, herkunft: dict, plattform: str = "tiktok"):
        key = f"{plattform}:{d['id']}"
        v = self.videos.setdefault(key, {"id": d["id"], "plattform": plattform, "quellen": [], "beobachtungen": []})
        quelle = herkunft["art"]
        if quelle not in v["quellen"]:
            v["quellen"].append(quelle)
        for k in ("konto", "text", "dauer_s", "sound", "hashtags", "ki_label", "datum", "titel_url"):
            if d.get(k) not in (None, "", []) and (not v.get(k) or k in ("sound", "dauer_s")):
                v[k] = d[k]
        # Längere Beschreibung gewinnt (Embeds kürzen manchmal)
        if d.get("text") and len(d["text"]) > len(v.get("text") or ""):
            v["text"] = d["text"]
        beob = {k: d.get(k) for k in FELDER_ZAHL if d.get(k) is not None}
        if beob:
            beob.update(stand=iso(herkunft["stand"]), quelle=quelle)
            v["beobachtungen"].append(beob)

    def konto(self, d: dict, herkunft: dict):
        k = self.konten.setdefault(d["name"].lower(), {"name": d["name"], "neueste": []})
        for f in ("follower", "likes", "videos", "erstellt"):
            if d.get(f) is not None:
                k[f] = d[f]
        if d.get("neueste"):
            k["neueste"] = d["neueste"]
        k["stand"] = iso(herkunft["stand"])

    def hashtag(self, d: dict, herkunft: dict):
        h = self.hashtags.setdefault(d["name"], {"name": d["name"]})
        h.update({k: d[k] for k in ("aufrufe", "videos", "top") if d.get(k) is not None})
        h["stand"] = iso(herkunft["stand"])

    def aus_ordnern(self, ordner: list[str]):
        for o in ordner:
            for pfad in sorted(glob.glob(os.path.join(o, "**", "*.htm*"), recursive=True)):
                self.dateien += 1
                for art, daten, herkunft in lies_seite(pfad):
                    getattr(self, art)(daten, herkunft)

    def abschliessen(self, stand: dt.datetime, konto_genre: dict | None = None):
        """Aktuellste Zahlen je Video wählen und abgeleitete Felder berechnen."""
        for v in self.videos.values():
            beob = sorted(v["beobachtungen"], key=lambda b: (b["stand"], b["quelle"] == "videoseite"))
            for f in FELDER_ZAHL:
                werte = [b[f] for b in beob if f in b]
                v[f] = werte[-1] if werte else None
            v["stand"] = beob[-1]["stand"] if beob else None
            if v["plattform"] == "tiktok":
                t = datum_aus_tiktok_id(v["id"])
                v["datum"] = iso(t)
                v.setdefault("url", f"https://www.tiktok.com/@{v.get('konto') or '_'}/video/{v['id']}")
            t = dt.datetime.strptime(v["datum"], "%Y-%m-%dT%H:%MZ").replace(tzinfo=UTC) if v.get("datum") else None
            ref = dt.datetime.strptime(v["stand"], "%Y-%m-%dT%H:%MZ").replace(tzinfo=UTC) if v.get("stand") else stand
            v["alter_tage"] = round((ref - t).total_seconds() / 86400, 2) if t else None
            # Aufrufe pro Tag: mindestens 1 Tag Alter, sonst blähen frische Videos den Wert auf
            v["aufrufe_pro_tag"] = round(v["aufrufe"] / max(v["alter_tage"], 1.0)) if v.get("aufrufe") and v["alter_tage"] is not None else None
            v["teil"] = teil_erkennen(v.get("text"))
            v["hook_muster"] = hook_muster(v.get("text"))
            v["motive"] = motive(v.get("text"))
            v["genre"] = genre(v.get("text"), (konto_genre or {}).get((v.get("konto") or "").lower()))
            v["format"] = format_erkennen(v.get("text"))
            v["laenge"] = laenge_klasse(v.get("dauer_s"))
            if v.get("aufrufe"):
                a = v["aufrufe"]
                v["likes_je_100"] = round(100 * v["likes"] / a, 2) if v.get("likes") is not None else None
                v["shares_je_1000"] = round(1000 * v["shares"] / a, 2) if v.get("shares") is not None else None
            if v.get("text"):
                v["text"] = v["text"][:300]


# ---------------------------------------------------------------------------------------------
# YouTube Data API v3 (offiziell, mit Schlüssel)
# ---------------------------------------------------------------------------------------------


def _yt(endpunkt: str, params: dict, key: str) -> dict:
    # Schlüssel im Header X-Goog-Api-Key statt in der URL: So landet er nicht in Logs, und in der Cloud kann
    # der Netzwerk-Proxy ihn als „Network Secret“ einsetzen (dann reicht YOUTUBE_API_KEY=platzhalter).
    url = YT_API + endpunkt + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA, "X-Goog-Api-Key": key})
    with urllib.request.urlopen(req, timeout=30) as r:
        daten = json.load(r)
    time.sleep(YT_PAUSE_S)
    return daten


def _iso_dauer(s: str | None) -> int | None:
    m = re.match(r"P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", s or "")
    if not m:
        return None
    d, h, mi, se = (int(x) if x else 0 for x in m.groups())
    return d * 86400 + h * 3600 + mi * 60 + se


def youtube_holen(cfg: dict, sammlung: Sammlung, stand: dt.datetime, fenster: int, trocken: bool) -> dict:
    """Sucht je Suchbegriff die meistgesehenen Videos der letzten N Tage und liest die Uploads der Kanäle.

    Kontingent (YouTube-Doku „Quota costs“, abgerufen 15.11.2026): search.list hat einen eigenen Topf mit
    100 Aufrufen pro Tag; channels, playlistItems und videos.list kosten je 1 Einheit von 10.000 pro Tag.
    """
    yc = cfg.get("youtube") or {}
    such, kan = yc.get("suchbegriffe") or [], yc.get("kanaele") or []
    max_treffer = yc.get("max_treffer_je_suche", 25)
    videos_max = len(such) * max_treffer + len(kan) * 25
    plan = {"suchbegriffe": such, "kanaele": kan,
            "search_aufrufe": len(such), "search_topf_pro_tag": 100,
            "weitere_einheiten_hoechstens": 2 * len(kan) + -(-videos_max // 50), "einheiten_topf_pro_tag": 10000}
    key = os.environ.get("YOUTUBE_API_KEY")
    if trocken or not key:
        plan["status"] = "trocken" if trocken else "übersprungen: kein YOUTUBE_API_KEY gesetzt"
        return plan
    seit = (stand - dt.timedelta(days=fenster)).strftime("%Y-%m-%dT%H:%M:%SZ")
    gefunden: dict[str, str] = {}
    for q in such:
        r = _yt("search", {"part": "snippet", "q": q, "type": "video", "order": "viewCount", "publishedAfter": seit,
                           "maxResults": yc.get("max_treffer_je_suche", 25), "videoDuration": "short",
                           "relevanceLanguage": "en", "regionCode": "US"}, key)
        for it in r.get("items", []):
            gefunden.setdefault(it["id"]["videoId"], f"yt-suche:{q}")
    for h in kan:
        r = _yt("channels", {"part": "contentDetails,statistics,snippet", "forHandle": h}, key)
        for c in r.get("items", []):
            st = c.get("statistics", {})
            sammlung.konto({"name": "yt" + h, "follower": zahl_aus_text(st.get("subscriberCount")),
                            "videos": zahl_aus_text(st.get("videoCount"))}, {"stand": stand})
            up = c["contentDetails"]["relatedPlaylists"]["uploads"]
            pl = _yt("playlistItems", {"part": "contentDetails", "playlistId": up, "maxResults": 25}, key)
            for it in pl.get("items", []):
                gefunden.setdefault(it["contentDetails"]["videoId"], f"yt-kanal:{h}")
    ids = list(gefunden)
    for i in range(0, len(ids), 50):
        r = _yt("videos", {"part": "snippet,contentDetails,statistics", "id": ",".join(ids[i:i + 50])}, key)
        for it in r.get("items", []):
            sn, st = it["snippet"], it.get("statistics", {})
            dauer = _iso_dauer(it["contentDetails"].get("duration"))
            vid = it["id"]
            sammlung.video({"id": vid, "konto": sn.get("channelTitle"), "text": sn.get("title", ""),
                            "datum": sn.get("publishedAt", "")[:16] + "Z" if sn.get("publishedAt") else None,
                            "aufrufe": zahl_aus_text(st.get("viewCount")), "likes": zahl_aus_text(st.get("likeCount")),
                            "kommentare": zahl_aus_text(st.get("commentCount")), "dauer_s": dauer},
                           {"art": gefunden[vid], "stand": stand}, plattform="youtube")
            sammlung.videos[f"youtube:{vid}"]["url"] = (f"https://www.youtube.com/shorts/{vid}" if dauer and dauer <= 180
                                                       else f"https://www.youtube.com/watch?v={vid}")
    plan["status"] = f"geholt: {len(ids)} Videos"
    return plan


# ---------------------------------------------------------------------------------------------
# Auswertung
# ---------------------------------------------------------------------------------------------


def gehoert_dazu(v: dict, cfg: dict) -> bool:
    konten = {k.lower() for k in cfg.get("konten", [])}
    tags = {t.lower() for t in cfg.get("hashtags", [])}
    if v["plattform"] == "youtube":
        return True
    if (v.get("konto") or "").lower() in konten:
        return True
    if any(q.startswith("tag:") and q[4:] in tags for q in v["quellen"]):
        return True
    return bool(tags & set(v.get("hashtags") or []))


def gruppe(videos: list[dict], schluessel) -> list[dict]:
    """Median-Aufrufe und Median-Aufrufe/Tag je Gruppe; ein Video kann in mehreren Gruppen stehen."""
    g: dict[str, list[dict]] = {}
    for v in videos:
        keys = schluessel(v)
        for k in (keys if isinstance(keys, list) else [keys]):
            if k:
                g.setdefault(k, []).append(v)
    zeilen = []
    for k, vs in g.items():
        zeilen.append({"gruppe": k, "n": len(vs), "median_aufrufe": median(x.get("aufrufe") for x in vs),
                       "median_pro_tag": median(x.get("aufrufe_pro_tag") for x in vs),
                       "max_aufrufe": max((x.get("aufrufe") or 0) for x in vs),
                       "bestes": max(vs, key=lambda x: x.get("aufrufe") or 0)["url"]})
    return sorted(zeilen, key=lambda z: -(z["median_pro_tag"] or 0))


def serien_paare(videos: list[dict]) -> list[dict]:
    """Teil N gegen den letzten früheren Teil N−1 (bzw. Teil 1/Köder) desselben Kontos."""
    paare = []
    nach_konto: dict[str, list[dict]] = {}
    for v in videos:
        nach_konto.setdefault(v.get("konto") or "", []).append(v)
    for konto, vs in nach_konto.items():
        vs = sorted(vs, key=lambda x: x.get("datum") or "")
        for i, v in enumerate(vs):
            if v["teil"]["art"] != "teil_2plus" or not v.get("aufrufe"):
                continue
            ziel = v["teil"]["nr"] - 1
            frueher = [w for w in vs[:i] if w.get("aufrufe") and (w["teil"].get("nr") == ziel or (ziel == 1 and w["teil"]["art"] == "teil_1"))]
            sicher = bool(frueher)
            if not frueher:
                # Kein beschrifteter Vorteil: das letzte frühere Video desselben Kontos, als „unsicher“ markiert
                frueher = [w for w in vs[:i] if w.get("aufrufe")]
            if frueher:
                w = frueher[-1]
                paare.append({"konto": konto, "teil": v["teil"]["nr"], "vorher_url": w["url"], "vorher_aufrufe": w["aufrufe"],
                              "nachher_url": v["url"], "nachher_aufrufe": v["aufrufe"], "sicher": sicher,
                              "quote": round(v["aufrufe"] / w["aufrufe"], 3), "datum": (v.get("datum") or "")[:10]})
    return paare


def vergleich_vorher(jetzt: dict, vorher: dict | None) -> dict:
    """Was steigt, was fällt: Veränderung seit dem letzten Lauf (Aufrufe/Tag je Video, Hashtag, Konto)."""
    if not vorher:
        return {}
    def tage(a, b):
        ta = dt.datetime.strptime(a, "%Y-%m-%dT%H:%MZ")
        tb = dt.datetime.strptime(b, "%Y-%m-%dT%H:%MZ")
        return max((ta - tb).total_seconds() / 86400, 0.01)
    alt_v = {f"{v['plattform']}:{v['id']}": v for v in vorher.get("videos", [])}
    vids = []
    for v in jetzt["videos"]:
        a = alt_v.get(f"{v['plattform']}:{v['id']}")
        if a and a.get("aufrufe") and v.get("aufrufe") and a.get("stand") and v.get("stand") and v["stand"] > a["stand"]:
            d = tage(v["stand"], a["stand"])
            vids.append({"url": v["url"], "text": kurz(v.get("text"), 60), "zuwachs_pro_tag": round((v["aufrufe"] - a["aufrufe"]) / d),
                         "zuwachs_prozent": round(100 * (v["aufrufe"] - a["aufrufe"]) / a["aufrufe"], 1)})
    tags = []
    alt_h = {h["name"]: h for h in vorher.get("hashtags", [])}
    for h in jetzt["hashtags"]:
        a = alt_h.get(h["name"])
        if a and a.get("aufrufe") and h.get("aufrufe") and a.get("stand") and h.get("stand") and h["stand"] > a["stand"]:
            d = tage(h["stand"], a["stand"])
            tags.append({"hashtag": h["name"], "zuwachs_pro_tag": round((h["aufrufe"] - a["aufrufe"]) / d),
                         "prozent_pro_tag": round(100 * (h["aufrufe"] - a["aufrufe"]) / a["aufrufe"] / d, 3)})
    return {"videos": sorted(vids, key=lambda x: -x["zuwachs_pro_tag"]), "hashtags": sorted(tags, key=lambda x: -x["prozent_pro_tag"])}


def auswerten(s: Sammlung, cfg: dict, stand: dt.datetime, alle: bool) -> dict:
    fenster = cfg.get("fenster_tage", 14)
    grenze = stand - dt.timedelta(days=fenster)
    videos = [v for v in s.videos.values() if alle or gehoert_dazu(v, cfg)]
    for v in videos:
        v.pop("beobachtungen", None)
    im_fenster = [v for v in videos if v.get("datum") and v["datum"] >= iso(grenze) and v.get("aufrufe")]
    # Für Muster, Länge, Serie und Genre zählen nur Storys (keine Zusammenschnitte, Werbung, Gameplay)
    storys = [v for v in im_fenster if v["format"] == "Story"]

    # Konten: neueste 10 aus dem Embed bzw. Raster, Takt pro Woche, junge gegen ältere Videos
    konten = []
    for k in s.konten.values():
        if not alle and k["name"].lower() not in {x.lower() for x in cfg.get("konten", [])} and not k["name"].startswith("yt@"):
            continue
        vs = [s.videos.get(f"tiktok:{i}") for i in k.get("neueste", [])]
        vs = sorted([v for v in vs if v and v.get("aufrufe") is not None], key=lambda v: v["datum"], reverse=True)[:10]
        z = {"name": k["name"], "follower": k.get("follower"), "stand": k.get("stand"), "n": len(vs)}
        if vs:
            a = [v["aufrufe"] for v in vs]
            t0 = dt.datetime.strptime(vs[-1]["datum"], "%Y-%m-%dT%H:%MZ")
            t1 = dt.datetime.strptime(vs[0]["datum"], "%Y-%m-%dT%H:%MZ")
            spanne = max((t1 - t0).total_seconds() / 86400, 1)
            jung = [v["aufrufe"] for v in vs if 2 <= (v["alter_tage"] or 0) < 7]
            alt = [v["aufrufe"] for v in vs if 7 <= (v["alter_tage"] or 0) <= fenster]
            z.update(median_neueste=median(a), max_neueste=max(a), takt_pro_woche=round((len(vs) - 1) / spanne * 7, 1),
                     median_2_6_tage=median(jung), median_7_14_tage=median(alt), bestes=max(vs, key=lambda v: v["aufrufe"])["url"])
        konten.append(z)

    hashtags = []
    for h in s.hashtags.values():
        if not alle and h["name"] not in {t.lower() for t in cfg.get("hashtags", [])}:
            continue
        top = [s.videos.get(f"tiktok:{i}") for i in h.get("top", [])]
        top = [v for v in top if v]
        daten = sorted((v["datum"] or "")[:10] for v in top)
        hashtags.append({"name": h["name"], "aufrufe": h.get("aufrufe"), "videos": h.get("videos"), "stand": h.get("stand"),
                         "top_n": len(top), "top_im_fenster": sum(1 for v in top if v.get("datum") and v["datum"] >= iso(grenze)),
                         "top_median_datum": daten[len(daten) // 2] if daten else None,
                         "top_median_aufrufe": median(v.get("aufrufe") for v in top),
                         "top_genre": {g: sum(1 for v in top if v["genre"] == g) for g in sorted({v["genre"] for v in top})}})

    sounds: dict[tuple, dict] = {}
    for v in videos:
        if v.get("sound"):
            so = v["sound"]
            key = (so["titel"], so.get("autor"))
            e = sounds.setdefault(key, {"titel": so["titel"], "autor": so.get("autor"), "original": so.get("original"), "n": 0,
                                        "aufrufe_summe": 0, "videos": []})
            e["n"] += 1
            e["aufrufe_summe"] += v.get("aufrufe") or 0
            e["videos"].append(v["url"])
    mit_dauer = [v for v in storys if v.get("dauer_s")]
    fehlend = {"konten": [k for k in cfg.get("konten", []) if k.lower() not in s.konten and not any((v.get("konto") or "").lower() == k.lower() for v in videos)],
               "hashtags": [h for h in cfg.get("hashtags", []) if h.lower() not in s.hashtags]}

    return {
        "fenster_tage": fenster,
        "fenster_ab": iso(grenze),
        "zahlen": {"videos": len(videos), "im_fenster": len(im_fenster), "mit_vollstatistik": sum(1 for v in videos if v.get("likes") is not None),
                   "mit_sound": sum(1 for v in videos if v.get("sound")), "ohne_text_im_fenster": sum(1 for v in im_fenster if v["hook_muster"] == ["ohne Text"]),
                   "storys_im_fenster": len(storys), "sound_original": sum(1 for v in videos if v.get("sound") and v["sound"].get("original"))},
        "top_aufrufe": [v["url"] for v in sorted(im_fenster, key=lambda v: -v["aufrufe"])[:20]],
        "top_pro_tag": [v["url"] for v in sorted(im_fenster, key=lambda v: -(v.get("aufrufe_pro_tag") or 0))[:20]],
        "konten": sorted(konten, key=lambda z: -(z.get("median_neueste") or 0)),
        "hashtags": sorted(hashtags, key=lambda z: -(z.get("aufrufe") or 0)),
        "formate": gruppe(im_fenster, lambda v: v["format"]),
        "laengen": gruppe(mit_dauer, lambda v: v["laenge"]),
        "serien": gruppe(storys, lambda v: v["teil"]["art"]),
        "serien_paare_alle_daten": serien_paare([v for v in videos if v.get("aufrufe")]),
        "hook_muster": gruppe(storys, lambda v: v["hook_muster"]),
        "motive": gruppe(storys, lambda v: v["motive"] or ["kein Motiv erkannt"]),
        "genre": gruppe(storys, lambda v: v["genre"]),
        "fehlende_quellen": fehlend,
        "sounds": sorted(sounds.values(), key=lambda e: -e["aufrufe_summe"]),
        "videos": sorted(videos, key=lambda v: -(v.get("aufrufe") or 0)),
    }


# ---------------------------------------------------------------------------------------------
# Ausgabe
# ---------------------------------------------------------------------------------------------


def _tabelle(kopf: list[str], zeilen: list[list]) -> str:
    out = ["| " + " | ".join(kopf) + " |", "|" + "|".join("---" for _ in kopf) + "|"]
    out += ["| " + " | ".join(str(x) for x in z) + " |" for z in zeilen]
    return "\n".join(out)


def markdown(erg: dict, meta: dict) -> str:
    v_nach_url = {v["url"]: v for v in erg["videos"]}
    def vzeile(url):
        v = v_nach_url[url]
        return [f"[{(v.get('datum') or '')[:10]}]({url})", v.get("konto") or "–", tz(v.get("aufrufe")), tz(v.get("aufrufe_pro_tag")),
                tz(v.get("likes")), tz(v.get("shares")), f"{v['dauer_s']} s" if v.get("dauer_s") else "–", v["format"], v["genre"], kurz(v.get("text"), 60)]
    vk = ["Datum", "Konto", "Aufrufe", "pro Tag", "Likes", "Shares", "Länge", "Format", "Genre", "Beschreibung"]
    gk = ["Gruppe", "n", "Median Aufrufe", "Median pro Tag", "Max", "bestes Video"]
    def gzeilen(liste):
        return [[z["gruppe"], z["n"], tz(z["median_aufrufe"]), tz(z["median_pro_tag"]), tz(z["max_aufrufe"]), f"[Link]({z['bestes']})"] for z in liste]

    t = [f"# Trend-Radar Wochenbericht {meta['datum']}", "",
         f"Automatisch erzeugt von `horror/tools/trends/radar.py`. Lauf: {meta['lauf']}. **Datenstand: {meta['datenstand']}** "
         f"(Abrufzeit der gespeicherten Seiten). Fenster: die letzten {erg['fenster_tage']} Tage vor dem Datenstand (ab {erg['fenster_ab'][:10]}).",
         "", f"Quellen: {meta['dateien']} gespeicherte Seiten aus {', '.join(meta['eingang']) or '–'}; YouTube: {meta['youtube'].get('status')}.",
         "TikTok wurde von diesem Skript nicht abgerufen (Nutzungsbedingungen, robots.txt; siehe README).",
         *([f"Herkunft: {meta['notiz']}"] if meta.get("notiz") else []), "",
         "## Kennzahlen", "",
         _tabelle(["Videos gesamt", "im Fenster mit Aufrufen", "davon Storys", "mit Likes/Shares", "mit Sound-Namen", "davon Originalton", "im Fenster ohne Beschreibung"],
                  [[tz(erg["zahlen"]["videos"]), tz(erg["zahlen"]["im_fenster"]), tz(erg["zahlen"]["storys_im_fenster"]), tz(erg["zahlen"]["mit_vollstatistik"]),
                    tz(erg["zahlen"]["mit_sound"]), tz(erg["zahlen"]["sound_original"]), tz(erg["zahlen"]["ohne_text_im_fenster"])]]), "",
         "**Ohne Daten in diesem Lauf** (Seiten von Hand speichern, siehe README): "
         + (", ".join([f"@{k}" for k in erg["fehlende_quellen"]["konten"]] + [f"#{h}" for h in erg["fehlende_quellen"]["hashtags"]]) or "keine"), "",
         "## Formate im Fenster", "", "Nur „Story“ geht in die Auswertungen zu Länge, Serie, Hook, Motiv und Genre ein.", "", _tabelle(gk, gzeilen(erg["formate"])), "",
         f"## Meistgesehen in den letzten {erg['fenster_tage']} Tagen", "", _tabelle(vk, [vzeile(u) for u in erg["top_aufrufe"][:15]]), "",
         "## Schnellste (Aufrufe pro Tag seit Upload, mindestens 1 Tag gerechnet)", "", _tabelle(vk, [vzeile(u) for u in erg["top_pro_tag"][:15]]), "",
         "## Hashtags", "", "„Top im Fenster“: wie viele der Top-Videos des Hashtags in den letzten Tagen hochgeladen wurden. Viele frische Top-Videos heißt: Der Hashtag lebt gerade.", "",
         _tabelle(["Hashtag", "Aufrufe gesamt", "Videos", "Top im Fenster", "Median-Datum Top", "Median Aufrufe Top", "Genre der Top-Videos", "Stand"],
                  [[f"#{h['name']}", tz(h["aufrufe"]), tz(h["videos"]), f"{h['top_im_fenster']}/{h['top_n']}", h["top_median_datum"] or "–",
                    tz(h["top_median_aufrufe"]), ", ".join(f"{g} {n}" for g, n in h["top_genre"].items()) or "–", h["stand"] or "–"] for h in erg["hashtags"]]), "",
         "## Konten", "", "Neueste bis zu 10 Videos. „2–6 T“ und „7–14 T“: Median-Aufrufe nach Alter; ältere Videos hatten mehr Zeit, liegt „2–6 T“ trotzdem höher, steigt das Konto.", "",
         _tabelle(["Konto", "Follower", "n", "Median neueste", "Max", "Takt/Woche", "Median 2–6 T", "Median 7–14 T", "Stand"],
                  [[f"@{k['name']}", tz(k.get("follower")), k["n"], tz(k.get("median_neueste")), tz(k.get("max_neueste")), tz(k.get("takt_pro_woche"), 1),
                    tz(k.get("median_2_6_tage")), tz(k.get("median_7_14_tage")), k.get("stand") or "–"] for k in erg["konten"]]), "",
         "## Länge (nur Storys mit bekannter Dauer, im Fenster)", "", _tabelle(gk, gzeilen(erg["laengen"])), "",
         "## Serien gegen Einzelvideos (Storys im Fenster)", "", _tabelle(gk, gzeilen(erg["serien"])), "",
         "**Paare im selben Konto (alle Daten, auch älter):** Teil N gegen den vorigen Teil. „unsicher“: Der Vorteil war nicht beschriftet, verglichen wird mit dem letzten früheren Video.", "",
         _tabelle(["Konto", "Teil", "Datum", "Aufrufe vorher", "Aufrufe Teil", "Quote", "Zuordnung"],
                  [[f"@{p['konto']}", p["teil"], p["datum"], f"[{tz(p['vorher_aufrufe'])}]({p['vorher_url']})",
                    f"[{tz(p['nachher_aufrufe'])}]({p['nachher_url']})", tz(p["quote"], 2), "sicher" if p["sicher"] else "unsicher"] for p in erg["serien_paare_alle_daten"]]) if erg["serien_paare_alle_daten"] else "keine Paare gefunden", "",
         "## Hook-Muster der Beschreibung (Storys im Fenster)", "", _tabelle(gk, gzeilen(erg["hook_muster"])), "",
         "## Motive und Monster (Storys im Fenster, aus der Beschreibung)", "", _tabelle(gk, gzeilen(erg["motive"])), "",
         "## Genre (Storys im Fenster)", "", _tabelle(gk, gzeilen(erg["genre"])), "",
         "## Sounds (nur von Videoseiten; „Original“ heißt: eigener Ton des Kontos)", "",
         _tabelle(["Sound", "Autor", "Original", "n", "Aufrufe zusammen", "Beispiel"],
                  [[kurz(e["titel"], 50), kurz(e.get("autor"), 30), "ja" if e.get("original") else "nein", e["n"], tz(e["aufrufe_summe"]), f"[Link]({e['videos'][0]})"]
                   for e in erg["sounds"][:25]]) if erg["sounds"] else "keine Sound-Daten", ""]
    vg = erg.get("vergleich") or {}
    t += ["## Was steigt, was fällt (gegen den letzten Lauf)", ""]
    if vg:
        t += [f"Vorlauf: {meta.get('vorher') or '–'}", "",
              _tabelle(["Hashtag", "Zuwachs Aufrufe/Tag", "% pro Tag"], [[f"#{h['hashtag']}", tz(h["zuwachs_pro_tag"]), tz(h["prozent_pro_tag"], 3)] for h in vg.get("hashtags", [])]), "",
              _tabelle(["Video", "Zuwachs/Tag", "Zuwachs %"], [[f"[{x['text'] or 'Video'}]({x['url']})", tz(x["zuwachs_pro_tag"]), tz(x["zuwachs_prozent"], 1)] for x in vg.get("videos", [])[:15]]), ""]
    else:
        t += ["Kein Vorlauf gefunden. Ab dem zweiten Lauf steht hier der Zuwachs je Video, Hashtag und Konto. Bis dahin zeigen die Spalten „2–6 T“ und „7–14 T“ bei den Konten die Richtung.", ""]
    t += ["## Grenzen", "",
          "- Hashtag-Seiten zeigen nur Top-Videos, Konto-Embeds nur die 10 neuesten: Das ist eine Auswahl, keine Stichprobe.",
          "- Muster, Motive und Genre stammen nur aus der Beschreibung. Konten ohne Beschreibung (z. B. concet5612) fallen unter „ohne Text“.",
          "- Aufrufe pro Tag benachteiligen alte Videos, deren Kurve längst abgeflacht ist; Werte unter n = 5 sind Anekdoten.", ""]
    return "\n".join(t)


# ---------------------------------------------------------------------------------------------
# Selbsttest
# ---------------------------------------------------------------------------------------------


def selbsttest() -> None:
    assert zahl_aus_text("1.2M") == 1_200_000
    assert zahl_aus_text("345,6K") == 345_600
    assert zahl_aus_text("12,3 Mio.") == 12_300_000
    assert zahl_aus_text("1.234") == 1234 and zahl_aus_text("987") == 987
    assert datum_aus_tiktok_id("7707748313222630686").strftime("%Y-%m-%d") == "2026-11-13"
    assert teil_erkennen("Lügen Monster Part 2#fyp")["art"] == "teil_2plus"
    assert teil_erkennen("Who wants a part 2? #fyp")["art"] == "teil_1"
    assert teil_erkennen("Folge für Part 2 #roblox")["art"] == "teil_1"
    assert teil_erkennen("Scary TikTok Story (3 of 3)")["nr"] == 3
    assert teil_erkennen("In this town, every night")["art"] == "einzel"
    assert "„In this town/world …“" in hook_muster("In this town, when you turn 18, you get CRACKED 😭 #inthistown")
    assert "Altersschwelle („when you turn 18“)" in hook_muster("In this town, when you turn 18, you get CRACKED")
    assert hook_muster("") == ["ohne Text"]
    assert hook_muster("He Didn't Blink 👀 #roblox") == ["Kurztitel (1–3 Wörter)"]
    assert genre("In This Town, A Game Of Tag Is Deadly💀") == "Horror"
    assert genre("In This World, Everyone Can Fly🪽") == "Fantasy"
    assert genre("", "Horror") == "Horror (laut Konto)" and genre("") == "unklar (ohne Text)"
    assert format_erkennen("THE BIGGEST COMPLATION IN THIS TOWN") == "Zusammenschnitt/Edit"
    assert format_erkennen("Game name Survive the SCPs #roblox") == "Gameplay"
    assert format_erkennen("He Didn't Blink 👀") == "Story"
    assert hook_muster("story #robloxstory #inthisworld") == ["nur Gattungswort („story“, „In this town“)"]
    html = ('<div data-e2e="user-post-item"><a href="https://www.tiktok.com/@abc/video/7707748313222630686">'
            '<img alt="In this town the scarecrows eat first"><strong data-e2e="video-views">1.5M</strong></a></div>')
    beob = list(_dom_raster(html, dt.datetime.now(UTC), "x.html"))
    assert beob and beob[0][1]["aufrufe"] == 1_500_000 and beob[0][1]["konto"] == "abc"
    print("Selbsttest bestanden.")


# ---------------------------------------------------------------------------------------------
# Hauptprogramm
# ---------------------------------------------------------------------------------------------


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--eingang", action="append", default=[], help="Ordner mit im Browser gespeicherten TikTok-Seiten (mehrfach möglich)")
    ap.add_argument("--quellen", default=str(HIER / "quellen.json"))
    ap.add_argument("--aus", default=str(HIER.parent.parent / "docs" / "trends"), help="Zielordner für JSON und Bericht")
    ap.add_argument("--datum", help="Name der Ausgabe (JJJJ-MM-TT), Standard: heute")
    ap.add_argument("--stand", help="Datenstand überschreiben (ISO, z. B. 2026-11-14T22:20Z); Standard: jüngste Datei")
    ap.add_argument("--vorher", help="JSON eines früheren Laufs für „steigt/fällt“; Standard: der jüngste ältere im Zielordner")
    ap.add_argument("--alle", action="store_true", help="alle Videos der Eingänge auswerten, nicht nur Liste aus quellen.json")
    ap.add_argument("--youtube", action="store_true", help="YouTube Data API abfragen (braucht YOUTUBE_API_KEY)")
    ap.add_argument("--youtube-trocken", action="store_true", help="nur anzeigen, welche YouTube-Aufrufe geplant sind")
    ap.add_argument("--notiz", help="freier Satz zur Herkunft der Seiten, steht im Kopf des Berichts")
    ap.add_argument("--selbsttest", action="store_true")
    a = ap.parse_args(argv)
    if a.selbsttest:
        selbsttest()
        return 0

    cfg = json.loads(Path(a.quellen).read_text(encoding="utf-8"))
    s = Sammlung()
    s.aus_ordnern(a.eingang)
    staende = [os.path.getmtime(p) for o in a.eingang for p in glob.glob(os.path.join(o, "**", "*.htm*"), recursive=True)]
    if a.stand:
        stand = dt.datetime.strptime(a.stand, "%Y-%m-%dT%H:%MZ").replace(tzinfo=UTC)
    elif staende:
        stand = dt.datetime.fromtimestamp(max(staende), UTC)
    else:
        stand = dt.datetime.now(UTC)
    lauf = dt.datetime.now(UTC)
    yt = youtube_holen(cfg, s, lauf if a.youtube else stand, cfg.get("fenster_tage", 14), trocken=a.youtube_trocken or not a.youtube)
    if a.youtube_trocken:
        print(json.dumps(yt, ensure_ascii=False, indent=1))
        return 0
    if not a.youtube:
        yt["status"] = "nicht angefordert (Schalter --youtube)"
    s.abschliessen(stand, {k.lower(): g for k, g in (cfg.get("konto_genre") or {}).items()})
    erg = auswerten(s, cfg, stand, a.alle)

    aus = Path(a.aus)
    aus.mkdir(parents=True, exist_ok=True)
    datum = a.datum or lauf.strftime("%Y-%m-%d")
    vorher_pfad = a.vorher
    if not vorher_pfad:
        alte = sorted(p for p in glob.glob(str(aus / "radar-*.json"))
                      if re.fullmatch(r"radar-\d{4}-\d{2}-\d{2}", Path(p).stem) and Path(p).stem < f"radar-{datum}")
        vorher_pfad = alte[-1] if alte else None
    vorher = json.loads(Path(vorher_pfad).read_text(encoding="utf-8")) if vorher_pfad else None
    erg["vergleich"] = vergleich_vorher(erg, vorher)
    staende_min = dt.datetime.fromtimestamp(min(staende), UTC) if staende else stand
    meta = {"datum": datum, "lauf": iso(lauf), "datenstand": f"{iso(staende_min)} bis {iso(stand)}" if staende else iso(stand),
            "dateien": s.dateien, "eingang": a.eingang, "youtube": yt, "vorher": vorher_pfad, "quellen": cfg, "notiz": a.notiz}
    (aus / f"radar-{datum}.json").write_text(json.dumps({"meta": meta, **erg}, ensure_ascii=False, indent=1, default=str), encoding="utf-8")
    (aus / f"radar-{datum}.md").write_text(markdown(erg, meta), encoding="utf-8")
    print(f"{s.dateien} Seiten gelesen, {erg['zahlen']['videos']} Videos ausgewertet, {erg['zahlen']['im_fenster']} im Fenster.")
    print(f"geschrieben: {aus / f'radar-{datum}.json'} und {aus / f'radar-{datum}.md'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
