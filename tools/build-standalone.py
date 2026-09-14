#!/usr/bin/env python3
"""Inline every asset index.html references into one file that opens from disk."""
import base64, io, mimetypes, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def read(p): return io.open(os.path.join(ROOT, p), encoding='utf-8').read()
def datauri(p):
    mime = mimetypes.guess_type(p)[0] or 'application/octet-stream'
    if p.endswith('.webp'): mime = 'image/webp'
    if p.endswith('.woff2'): mime = 'font/woff2'
    raw = open(os.path.join(ROOT, p), 'rb').read()
    return 'data:%s;base64,%s' % (mime, base64.b64encode(raw).decode())

def inline_css(css, base):
    """Turn url(...) references inside a stylesheet into data URIs."""
    def sub(m):
        u = m.group(1).strip('\'"')
        if u.startswith(('data:', 'http:', 'https:', '#')): return m.group(0)
        path = os.path.normpath(os.path.join(base, u))
        if not os.path.exists(os.path.join(ROOT, path)): return m.group(0)
        return 'url("%s")' % datauri(path)
    return re.sub(r'url\(([^)]+)\)', sub, css)

html = read('index.html')

# stylesheets
for href in ('assets/css/fonts.css', 'assets/css/site.css'):
    css = inline_css(read(href), os.path.dirname(href))
    html = html.replace('<link rel="stylesheet" href="%s">' % href,
                        '<style>\n/* %s */\n%s\n</style>' % (href, css))

# scripts
for src in ('vendor/jquery.min.js', 'vendor/turn.js', 'assets/js/book.js'):
    js = read(src)
    html = re.sub(r'<script src="%s"></script>' % re.escape(src),
                  lambda m: '<script>\n/* %s */\n%s\n</script>' % (src, js), html, count=1)

# the 3D mascot is an ES module; it cannot run from file:// so it is dropped
html = re.sub(r'<script type="module" src="assets/js/sprout-3d\.js"></script>', '', html)

# images and the favicon
for path in ('assets/img/logo.png', 'assets/img/philosophy-krishna.webp'):
    html = html.replace('"%s"' % path, '"%s"' % datauri(path))

open(os.path.join(ROOT, 'Home-Learning-standalone.html'), 'w', encoding='utf-8').write(html)
print('wrote Home-Learning-standalone.html  %.2f MB' %
      (os.path.getsize(os.path.join(ROOT, 'Home-Learning-standalone.html')) / 1e6))
