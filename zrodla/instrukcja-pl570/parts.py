# Builds the PL-570 foot parts from NOZKA_PL570.vxcad geometry (z up, axis at x=y=0, cup bottom at z=0)
import math
from OCP.STEPControl import STEPControl_Reader
from OCP.BRepMesh import BRepMesh_IncrementalMesh
from OCP.StlAPI import StlAPI_Writer
from OCP.gp import gp_Trsf, gp_Ax1, gp_Ax2, gp_Pnt, gp_Dir, gp_Vec, gp_Ax3
from OCP.BRepBuilderAPI import BRepBuilderAPI_Transform, BRepBuilderAPI_MakePolygon, BRepBuilderAPI_MakeFace
from OCP.BRepPrimAPI import BRepPrimAPI_MakeCylinder, BRepPrimAPI_MakeBox, BRepPrimAPI_MakePrism, BRepPrimAPI_MakeRevol
from OCP.BRepAlgoAPI import BRepAlgoAPI_Cut, BRepAlgoAPI_Fuse
from OCP.BRepFilletAPI import BRepFilletAPI_MakeFillet
from OCP.TopExp import TopExp_Explorer
from OCP.TopAbs import TopAbs_EDGE
from OCP.BRepAdaptor import BRepAdaptor_Curve
from OCP.GeomAbs import GeomAbs_Circle
from OCP.TopoDS import TopoDS

Z0 = 33.5
AX = (6.2253, 5.4437)
def tr(s, t):
    return BRepBuilderAPI_Transform(s, t, True).Shape()
def mv(s, x, y, z):
    t = gp_Trsf(); t.SetTranslation(gp_Vec(x, y, z)); return tr(s, t)
def cyl(r, h, z=0):
    return BRepPrimAPI_MakeCylinder(gp_Ax2(gp_Pnt(0, 0, z), gp_Dir(0, 0, 1)), r, h).Shape()
cut = lambda a, b: BRepAlgoAPI_Cut(a, b).Shape()
fuse = lambda a, b: BRepAlgoAPI_Fuse(a, b).Shape()
def stl(s, name, lin=0.02, ang=0.15):
    BRepMesh_IncrementalMesh(s, lin, False, ang, True); w = StlAPI_Writer(); w.Write(s, name); print('wrote', name)
def hexprism(af, h, z):  # across flats
    R = af / math.sqrt(3); p = BRepBuilderAPI_MakePolygon()
    for i in range(6):
        a = math.radians(30 + 60 * i); p.Add(gp_Pnt(R * math.cos(a), R * math.sin(a), z))
    p.Close(); f = BRepBuilderAPI_MakeFace(p.Wire()).Face()
    return BRepPrimAPI_MakePrism(f, gp_Vec(0, 0, h)).Shape()
def grooves(s, r, z0, z1, pitch):  # V rings that read as a thread in renders
    d = 0.6134 * pitch * 0.9
    n = int((z1 - z0) / pitch)
    for i in range(n):
        zc = z0 + pitch * (i + 0.5)
        p = BRepBuilderAPI_MakePolygon(); p.Add(gp_Pnt(r + 0.3, 0, zc - pitch * 0.5)); p.Add(gp_Pnt(r - d, 0, zc - 0.06)); p.Add(gp_Pnt(r - d, 0, zc + 0.06)); p.Add(gp_Pnt(r + 0.3, 0, zc + pitch * 0.5)); p.Close()
        f = BRepBuilderAPI_MakeFace(p.Wire()).Face()
        ring = BRepPrimAPI_MakeRevol(f, gp_Ax1(gp_Pnt(0, 0, 0), gp_Dir(0, 0, 1))).Shape()
        s = cut(s, ring)
    return s
def fillet_circles(s, rad, pick):
    fm = BRepFilletAPI_MakeFillet(s); e = TopExp_Explorer(s, TopAbs_EDGE); n = 0
    while e.More():
        ed = TopoDS.Edge(e.Current()); c = BRepAdaptor_Curve(ed)
        if c.GetType() == GeomAbs_Circle:
            ci = c.Circle(); r = ci.Radius(); z = ci.Location().Z()
            if pick(r, z): fm.Add(rad, ed); n += 1
        e.Next()
    return fm.Shape() if n else s

# --- rubber (imported STEP, flipped; top trimmed to 56.69, hex nut pocket from the top, 1 mm wall with M4 hole above the cavity)
rd = STEPControl_Reader(); rd.ReadFile('emwgvxdr91.step'); rd.TransferRoots(); g = rd.OneShape()
t = gp_Trsf(); t.SetRotation(gp_Ax1(gp_Pnt(6.2531, 5.4146, 48.5), gp_Dir(1, 0, 0)), math.pi); g = tr(g, t)
g = mv(g, -AX[0], -AX[1], -Z0)
TOP = 56.686 - Z0
g = cut(g, BRepPrimAPI_MakeBox(gp_Pnt(-50, -50, TOP), 100, 100, 20).Shape())
g = cut(g, cyl(6.2, 10, 54.0 - Z0))               # replace the moulded nub by a clean core
g = fuse(g, cyl(6.2, TOP - (54.0 - Z0), 54.0 - Z0))
g = cut(g, hexprism(7.05, 5, 55.0 - Z0))         # nut pocket from the top, floor at 55.0
g = cut(g, cyl(2.0, 3, 53.5 - Z0))               # M4 hole through the 1 mm wall
from OCP.ShapeFix import ShapeFix_Shape
fx = ShapeFix_Shape(g); fx.Perform(); g = fx.Shape()
stl(g, 'rubber.stl', 0.03, 0.2)

# --- original cup (Ø53 x 27, 3 mm ring underneath, Ø22.6 hole, open towards the plinth)
c = cyl(26.5, 27, 3)
c = fuse(c, cut(cyl(22.5, 3, 0), cyl(19, 3, 0)))
c = cut(c, cyl(11.3137, 40, -1))
c = cut(c, cyl(25, 24, 6))
c = cut(c, cyl(19, 1, 5))
try:
    c = fillet_circles(c, 0.8, lambda r, z: abs(r - 26.5) < 0.01 and (abs(z - 3) < 0.01 or abs(z - 30) < 0.01))
except Exception as ex: print('fillet cup', ex)
stl(c, 'cup.stl', 0.02, 0.1)

# --- threaded stud: M4 x 8 down, hex 2.5, M6 x 15 up (positions in the assembled foot)
zM4 = 57.7 - 8 - Z0
s = cyl(2, 8, zM4)
s = fuse(s, hexprism(8 * math.sqrt(3) / 2, 2.5, zM4 + 8))
s = fuse(s, cyl(3, 15, zM4 + 10.5))
s = grooves(s, 2, zM4 + 0.2, zM4 + 7.8, 0.7)
s = grooves(s, 3, zM4 + 10.7, zM4 + 25.3, 1.0)
s = mv(s, 0, 0, -zM4)  # local: stud bottom at 0
stl(s, "stud.stl", 0.02, 0.2)
print('stud z0', zM4)

# --- thin nut ISO 4035 M4 (s=7, m=2.2) and washer Ø22/Ø4 x 2
n = cut(hexprism(7, 2.2, 0), cyl(1.75, 4, -1))
try:
    n = fillet_circles(n, 0.25, lambda r, z: abs(r - 1.75) < 0.01)
except Exception as ex: print('fillet nut', ex)
stl(n, 'nut.stl', 0.01, 0.15)
w = cut(cyl(11, 2, 0), cyl(2, 4, -1))
stl(w, 'washer.stl', 0.02, 0.12)
