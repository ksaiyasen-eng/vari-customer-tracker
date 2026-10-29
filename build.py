"""Build index.html (web version) from tracker.html (the claude.ai artifact page).

The web version swaps the claude.ai storage boot for web-boot.js (team PIN + name gate,
Supabase API) and wraps the page in a full HTML document.  Run: python3 build.py
"""
import re
from pathlib import Path

here = Path(__file__).parent
src = (here / 'tracker.html').read_text(encoding='utf-8')
boot = (here / 'web-boot.js').read_text(encoding='utf-8')

head, body = src.split('</style>', 1)
head = head.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '')
head += '''[hidden]{display:none!important}
body{margin:0;font-size:14px}
.gate{position:fixed;inset:0;z-index:20;background:var(--bg);display:grid;place-items:center;padding:16px}
.gate form{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:24px;width:min(100%,380px);display:grid;gap:14px}
.gate h2{margin:0;font-size:19px}
.gate label{display:grid;gap:4px;font-size:13px;color:var(--muted)}
.gate input{font-size:16px;padding:10px 12px}
.gate .pri{padding:10px}
</style>'''

i = body.rindex('(async()=>{')
j = body.index('})();', i) + len('})();')
body = body[:i] + boot + body[j:]

gate = '''<div id="gate" class="gate" hidden>
  <form id="gateF" autocomplete="on">
    <h2>ຕິດຕາມລູກຄ້າ VARI</h2>
    <p class="asof" style="margin:0">ໃສ່ລະຫັດທີມ ແລະ ຊື່ຂອງທ່ານກ່ອນເຂົ້າໃຊ້ · ທຸກການບັນທຶກຈະໃຊ້ຊື່ນີ້</p>
    <label for="gPin">ລະຫັດທີມ<input id="gPin" type="password" autocomplete="current-password" required></label>
    <label for="gName">ຊື່ຜູ້ເຮັດ (ຊື່ທີ່ທີມຮູ້ຈັກ ເຊັ່ນ ແອັດມິນ ນ້ອຍ)<input id="gName" autocomplete="name" minlength="2" required></label>
    <p id="gErr" class="ferr" style="margin:0" role="alert"></p>
    <button class="pri" type="submit">ເຂົ້າໃຊ້</button>
  </form>
</div>
'''
body = body.replace('<header>', gate + '<header>', 1)
body = body.replace('<button id="exp" hidden>', '<button id="switchUser" type="button" hidden>ປ່ຽນຜູ້ໃຊ້</button>\n        <button id="exp" hidden>', 1)

out = ('<!doctype html>\n<html lang="lo">\n<head>\n<meta charset="utf-8">\n'
       '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
       '<meta name="robots" content="noindex,nofollow">\n'
       + head + '\n</head>\n<body>\n' + body.strip() + '\n</body>\n</html>\n')
(here / 'index.html').write_text(out, encoding='utf-8')
print('index.html', len(out.encode()), 'bytes')
