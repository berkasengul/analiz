# Injects the generated skyline SVGs into index.html (between marker comments).
import re,sys
site=sys.argv[1]
h=open(site+'/index.html').read()
for name in ('SKY','LINE'):
    svg=open(name.lower()+'.svg').read()
    h=re.sub(r'<!--%s-->.*?<!--/%s-->'%(name,name), lambda m:'<!--%s-->'%name+svg+'<!--/%s-->'%name, h, flags=re.S)
open(site+'/index.html','w').write(h)
