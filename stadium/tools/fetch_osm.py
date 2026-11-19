"""Download OSM buildings + roads around a stadium (OSM API 0.6 map calls, a few tiles) and write
compact JSON in local metres (E, N relative to LAT0/LON0, same frame as the satellite image).

Usage: python3 tools/fetch_osm.py LAT0 LON0 out.json [half_size_m=900]
Data © OpenStreetMap contributors, ODbL.
"""
import json, math, sys, time, urllib.request
import xml.etree.ElementTree as ET

LAT0, LON0, OUT = float(sys.argv[1]), float(sys.argv[2]), sys.argv[3]
HALF = float(sys.argv[4]) if len(sys.argv) > 4 else 900
kx = 111320 * math.cos(math.radians(LAT0)); ky = 110574
dlat, dlon = HALF / ky, HALF / kx
NT = 3  # NT x NT tiles
nodes, ways = {}, {}
for i in range(NT):
    for j in range(NT):
        lo0 = LON0 - dlon + 2 * dlon * i / NT; lo1 = LON0 - dlon + 2 * dlon * (i + 1) / NT
        la0 = LAT0 - dlat + 2 * dlat * j / NT; la1 = LAT0 - dlat + 2 * dlat * (j + 1) / NT
        url = f'https://api.openstreetmap.org/api/0.6/map?bbox={lo0:.6f},{la0:.6f},{lo1:.6f},{la1:.6f}'
        for attempt in range(3):
            try:
                req = urllib.request.Request(url, headers={'User-Agent': 'stadium-demo/1.0'})
                root = ET.fromstring(urllib.request.urlopen(req, timeout=90).read()); break
            except Exception as e:
                print('retry', i, j, e, file=sys.stderr); time.sleep(3)
        else:
            continue
        for n in root.iter('node'):
            nodes[n.get('id')] = ((float(n.get('lon')) - LON0) * kx, (float(n.get('lat')) - LAT0) * ky)
        for w in root.iter('way'):
            ways[w.get('id')] = ([nd.get('ref') for nd in w.iter('nd')], {t.get('k'): t.get('v') for t in w.iter('tag')})
        print('tile', i, j, len(nodes), len(ways), flush=True)
        time.sleep(1.5)


def num(v):
    try: return float(str(v).split()[0].replace(',', '.'))
    except Exception: return None


buildings, roads = [], []
for wid, (refs, tags) in ways.items():
    pts = [nodes[r] for r in refs if r in nodes]
    if len(pts) < 2: continue
    if 'building' in tags or 'building:part' in tags:
        if tags.get('building') in ('stadium',) or tags.get('leisure') == 'stadium' or len(pts) < 4: continue
        h = num(tags.get('height'))
        lv = num(tags.get('building:levels'))
        if h is None and lv is not None: h = lv * 3.1 + 1
        btype = tags.get('building', 'yes')
        buildings.append({'p': [[round(x, 1), round(y, 1)] for x, y in pts[:-1]], 'h': round(h, 1) if h else None, 't': btype})
    elif 'highway' in tags and tags['highway'] in ('motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'motorway_link', 'trunk_link', 'primary_link', 'secondary_link', 'residential', 'unclassified', 'service'):
        roads.append({'p': [[round(x, 1), round(y, 1)] for x, y in pts], 't': tags['highway'], 'l': num(tags.get('lanes')), 'o': tags.get('oneway') == 'yes'})
json.dump({'lat0': LAT0, 'lon0': LON0, 'buildings': buildings, 'roads': roads, 'attribution': '© OpenStreetMap contributors'}, open(OUT, 'w'), separators=(',', ':'))
print('buildings', len(buildings), 'roads', len(roads), 'with height', sum(1 for b in buildings if b['h']))
