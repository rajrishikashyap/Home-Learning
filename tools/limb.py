"""Tapered limb outlines from a joint chain, for Sprout's arms in index.html.

Run this to regenerate a limb after moving a joint; paste the path data into
the mascot SVG. The joint chains the shipped arms were built from are at the
bottom of this file.

A limb is a polyline of joints, each with a half-width. The outline walks one
side from wrist to shoulder, caps round, and walks the other side back — the
same way a brush stroke with pressure would. Sides are smoothed with a Catmull-
Rom spline converted to cubic Beziers so the silhouette has no visible corners.
"""
import math

def _unit(ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    n = math.hypot(dx, dy) or 1.0
    return dx / n, dy / n

def _offsets(joints, side):
    """One side of the limb: each joint pushed along its mitred normal."""
    pts = []
    for i, (x, y, w) in enumerate(joints):
        if i == 0:
            ux, uy = _unit(x, y, *joints[1][:2])
        elif i == len(joints) - 1:
            ux, uy = _unit(*joints[-2][:2], x, y)
        else:                                   # average the two segment dirs
            ax, ay = _unit(*joints[i-1][:2], x, y)
            bx, by = _unit(x, y, *joints[i+1][:2])
            ux, uy = ax + bx, ay + by
            n = math.hypot(ux, uy) or 1.0
            ux, uy = ux / n, uy / n
        nx, ny = -uy * side, ux * side
        pts.append((x + nx * w, y + ny * w))
    return pts

def _spline(pts):
    """Catmull-Rom through pts -> cubic Bezier segments."""
    out = []
    ext = [pts[0]] + list(pts) + [pts[-1]]
    for i in range(1, len(ext) - 2):
        p0, p1, p2, p3 = ext[i-1], ext[i], ext[i+1], ext[i+2]
        c1 = (p1[0] + (p2[0]-p0[0])/6, p1[1] + (p2[1]-p0[1])/6)
        c2 = (p2[0] - (p3[0]-p1[0])/6, p2[1] - (p3[1]-p1[1])/6)
        out.append((c1, c2, p2))
    return out

def _f(v): 
    return ('%.1f' % v).rstrip('0').rstrip('.')

def limb(joints, round_start=True, round_end=True):
    a = _offsets(joints, +1)
    b = _offsets(joints, -1)
    d = ['M%s %s' % (_f(a[0][0]), _f(a[0][1]))]
    for c1, c2, p in _spline(a):
        d.append('C%s %s %s %s %s %s' % (_f(c1[0]), _f(c1[1]), _f(c2[0]), _f(c2[1]), _f(p[0]), _f(p[1])))
    # round cap at the far end
    r = joints[-1][2]
    d.append('A%s %s 0 0 1 %s %s' % (_f(r), _f(r), _f(b[-1][0]), _f(b[-1][1])) if round_end
             else 'L%s %s' % (_f(b[-1][0]), _f(b[-1][1])))
    for c1, c2, p in _spline(list(reversed(b))):
        d.append('C%s %s %s %s %s %s' % (_f(c1[0]), _f(c1[1]), _f(c2[0]), _f(c2[1]), _f(p[0]), _f(p[1])))
    r0 = joints[0][2]
    d.append('A%s %s 0 0 1 %s %s' % (_f(r0), _f(r0), _f(a[0][0]), _f(a[0][1])) if round_start
             else 'L%s %s' % (_f(a[0][0]), _f(a[0][1])))
    d.append('Z')
    return ''.join(d)


if __name__ == '__main__':
    # The chains the arms in index.html were generated from: (x, y, half-width).
    # The elbow's half-width is shared by both bones of an arm — the disc that
    # fills the joint is drawn at that same radius, and a mismatch would show.
    ARMS = {
        'upperL': [(79, 203, 11.2), (72, 217, 10.2), (66, 231, 9.4)],
        'foreL':  [(66, 231, 9.4),  (61, 247, 8.5),  (58, 262, 7.7)],
        'upperR': [(161, 203, 11.2), (168, 217, 10.2), (174, 231, 9.4)],
        'foreR':  [(174, 231, 9.4),  (179, 247, 8.5),  (182, 262, 7.7)],
    }
    for name, chain in ARMS.items():
        print('%s:\n  %s\n' % (name, limb(chain)))
