"""Manim-Sequenz für die Szene „kurve“: Tauschkurve zwischen Erfolg heute und Geld für morgen.

Rendern: manim -o kurve.mp4 --media_dir build/manim build/kurve_manim.py Tauschkurve
Das Bild ist quadratisch (1080 × 1080) und wird in der HyperFrames-Szene platziert.
Länge 4,9 s = Länge der Szene laut assets/timing.json.
"""
import numpy as np
from manim import (
    DOWN, LEFT, RIGHT, UP, Axes, Create, DashedLine, Dot, FadeIn, Line, MoveAlongPath,
    Scene, Text, VGroup, ValueTracker, always_redraw, config, linear, rate_functions,
)

config.pixel_width = 1080
config.pixel_height = 1080
config.frame_rate = 30
config.frame_width = 8
config.frame_height = 8
config.background_color = "#0E1726"

GOLD = "#C9A84C"
CREME = "#F5F0E8"
VERLUST = "#E07A5F"
FONT = "Inter"


def kurve(x):
    # Konkav nach außen wie eine Produktionsmöglichkeitenkurve: y = 5·sqrt(1 − (x/5)²)
    return 5 * np.sqrt(max(0.0, 1 - (x / 5) ** 2))


class Tauschkurve(Scene):
    def construct(self):
        ax = Axes(
            x_range=[0, 5.4, 1], y_range=[0, 5.4, 1], x_length=5.0, y_length=5.0,
            axis_config={"color": CREME, "stroke_opacity": 0.55, "include_ticks": False,
                         "tip_width": 0.18, "tip_height": 0.18},
        ).shift(0.45 * UP + 0.45 * RIGHT)
        xl = Text("Erfolg diese Saison", font=FONT, color=CREME, weight="SEMIBOLD").scale(0.5)
        xl.next_to(ax.x_axis, DOWN, buff=0.28)
        yl = Text("Geld für morgen", font=FONT, color=CREME, weight="SEMIBOLD").scale(0.5).rotate(np.pi / 2)
        yl.next_to(ax.y_axis, LEFT, buff=0.28)

        graph = ax.plot(kurve, x_range=[0, 5, 0.01], color=GOLD, stroke_width=7)
        self.add(ax, xl, yl)
        self.play(Create(graph), run_time=1.1, rate_func=rate_functions.ease_out_cubic)

        # Punkt A: behalten (viel Erfolg, wenig Geld) -> Punkt B: verkaufen (weniger Erfolg, mehr Geld)
        t = ValueTracker(4.6)
        dot = always_redraw(lambda: Dot(ax.c2p(t.get_value(), kurve(t.get_value())), radius=0.12, color=CREME))
        vx = always_redraw(lambda: DashedLine(ax.c2p(t.get_value(), 0), ax.c2p(t.get_value(), kurve(t.get_value())),
                                              color=CREME, stroke_opacity=0.5, dash_length=0.08))
        hy = always_redraw(lambda: DashedLine(ax.c2p(0, kurve(t.get_value())), ax.c2p(t.get_value(), kurve(t.get_value())),
                                              color=CREME, stroke_opacity=0.5, dash_length=0.08))
        self.play(FadeIn(dot, scale=0.5), FadeIn(vx), FadeIn(hy), run_time=0.35)

        x_a, x_b = 4.6, 2.6
        y_a, y_b = kurve(x_a), kurve(x_b)
        # Geisterpunkt bleibt am Start stehen, damit der Weg von A nach B sichtbar bleibt.
        geist = Dot(ax.c2p(x_a, y_a), radius=0.1, color=CREME).set_opacity(0.35)
        a_txt = Text("behalten", font=FONT, color=CREME, weight="SEMIBOLD").scale(0.48).set_opacity(0.7)
        a_txt.next_to(geist, RIGHT, buff=0.18)
        b_txt = Text("verkaufen", font=FONT, color=CREME, weight="BOLD").scale(0.5)
        b_txt.next_to(ax.c2p(x_b, kurve(x_b)), UP + RIGHT, buff=0.12)
        self.add(geist)
        self.play(FadeIn(a_txt), run_time=0.2)
        self.play(t.animate.set_value(x_b), run_time=1.2, rate_func=rate_functions.ease_in_out_cubic)
        self.play(FadeIn(b_txt, shift=0.1 * UP), run_time=0.2)

        # Klammern: Gewinn auf der y-Achse (gold), Verzicht auf der x-Achse (rot)
        gewinn = Line(ax.c2p(-0.22, y_a), ax.c2p(-0.22, y_b), color=GOLD, stroke_width=8)
        verzicht = Line(ax.c2p(x_b, -0.22), ax.c2p(x_a, -0.22), color=VERLUST, stroke_width=8)
        g_txt = Text("+ Geld", font=FONT, color=GOLD, weight="BOLD").scale(0.58)
        g_txt.next_to(ax.c2p(0, (y_a + y_b) / 2), RIGHT, buff=0.25)
        v_txt = Text("− Erfolg", font=FONT, color=VERLUST, weight="BOLD").scale(0.58)
        v_txt.next_to(ax.c2p((x_a + x_b) / 2, 0), UP, buff=0.25)
        self.play(Create(gewinn), Create(verzicht), FadeIn(g_txt), FadeIn(v_txt), run_time=0.6)
        self.wait(1.25)
