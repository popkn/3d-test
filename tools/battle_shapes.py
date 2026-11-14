# 배틀무기 실제 모양 (도면용 2D 외곽선, src/kit/battleShapes.js와 같은 치수) — 가운데 기준 (u, v), v = 위
import math
def star(R=48.5, r=36.5, n=12):
    out = []
    for i in range(n * 2):
        a = math.pi * i / n + math.pi / 12
        rr = R if i % 2 == 0 else r
        out.append((round(math.sin(a) * rr, 2), round(math.cos(a) * rr, 2)))
    return out
def _center(pts):
    us = [p[0] for p in pts]; vs = [p[1] for p in pts]
    cu, cv = (min(us) + max(us)) / 2, (min(vs) + max(vs)) / 2
    return [(round(u - cu, 2), round(v - cv, 2)) for u, v in pts]
S = _center([(x, -z) for x, z in [(-12, -46), (12, -46), (26, -39), (41, 42), (38, 46), (-38, 46), (-41, 42), (-26, -39)]])
_T = [(22, 20), (150, 62), (238, 122), (292, 190), (300, 240), (268, 252), (288, 272), (330, 300), (346, 332), (336, 400), (318, 482), (96, 482), (95, 330), (88, 210), (60, 100)]
T = _center([((x - 215) / 7.83, -(y - 420) / 7.83) for x, y in _T])          # u = 가로, v = 위 (칼날 끝이 위)
I = _center([(-45, -15), (45, -15), (45, 7), (18, 15), (-45, 15)])
J = [(u, -v) for u, v in I]
G = [(-49, -10), (49, -10), (49, 10), (-49, 10)]
STAR = star()
