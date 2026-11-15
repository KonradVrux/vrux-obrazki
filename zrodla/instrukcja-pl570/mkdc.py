import re, json, pathlib
D = pathlib.Path('/tmp/claude-0/-home-claude/30964f7b-9667-5743-bd31-7087e75664f6/scratchpad')
P = D / 'design-a56lp/project'
tpl = (P / 'MK2-PL.dc.html').read_text()
IMG = ['c06f349e3d5d1f575c09468bc9948ae8', '2e8119ac5a40c782b31151858b24c184', 'b51a253c494e01027cfe9d53b2259439', '990c2b07618c48d8d2b1270c0135c81f', 'd84cde6064d05ec0b81c7c3760f7f373']
T = {
 'pl': dict(lang='pl', title='Instrukcja wymiany gum – Pioneer PL-570 / XL-A700', sub='Wymiana gumy w oryginalnych nóżkach · także PL-550, XL-1550 i odpowiedniki',
   steps='kroki<br>wymiany',
   kit_alt='Gumy zamienne i tubka kleju do silikonu', kit_h='W zestawie', kit_p='Gumy zamienne z otworem M4 i klej do silikonu.',
   kit_s='Mosiężny trzpień, nakrętki i metalową podkładkę bierzesz z oryginalnej nóżki.',
   prep_h='Przygotuj', prep_p='Oryginalne nóżki, klucz płaski 7&nbsp;mm, alkohol izopropylowy i czystą szmatkę.', prep_s='Do zardzewiałych obudów: pasta polerska.',
   S=[('Stara guma i trzpień wyjmowane z obudowy nóżki', 'Rozbierz starą nóżkę', 'Odkręć nakrętki, wyjmij mosiężny trzpień z podkładką i usuń całą starą, zniszczoną gumę z obudowy.'),
      ('Czyszczenie wnętrza obudowy', 'Oczyść obudowę', 'Nóżka musi być bardzo dobrze oczyszczona ze starej gumy i brudu, wnętrze odtłuść. Rdzę poleruj z zewnątrz tylko teraz – polerowanie nagrzewa nóżkę.'),
      ('Nakrętka w gnieździe gumy, trzpień z podkładką i druga nakrętka od spodu', 'Skręć trzpień z nową gumą', 'Włóż nakrętkę w gniazdo na górze gumy. Wkręć trzpień z podkładką przez nakrętkę i otwór, od spodu dokręć drugą nakrętkę – z wyczuciem.'),
      ('Guma z trzpieniem wklejana do obudowy', 'Wklej gumę do obudowy', 'Nałóż klej z zestawu na dno obudowy, wciśnij gumę na środek. Wklejone nóżki obciąż równomiernie na 2 godziny.')],
   foot='Guma silikonowa z otworem M4 · klej do silikonu w zestawie'),
 'en': dict(lang='en', title='Rubber replacement guide – Pioneer PL-570 / XL-A700', sub='Replacing the rubber in the original feet · also PL-550, XL-1550 and equivalents',
   steps='steps',
   kit_alt='Replacement rubbers and a tube of silicone adhesive', kit_h='In the kit', kit_p='Replacement rubbers with an M4 hole and silicone adhesive.',
   kit_s='The brass stud, nuts and metal washer come from your original foot.',
   prep_h='You need', prep_p='Your original feet, a 7&nbsp;mm spanner, isopropyl alcohol and a clean cloth.', prep_s='For rusty housings: polishing paste.',
   S=[('Old rubber and stud taken out of the foot housing', 'Take the old foot apart', 'Undo the nuts, take out the brass stud with its washer and remove all of the old, perished rubber from the housing.'),
      ('Cleaning the inside of the housing', 'Clean the housing', 'The foot must be very thoroughly cleaned of old rubber and dirt, degrease the inside. Polish off rust on the outside only now – polishing heats the foot.'),
      ('Nut in the rubber pocket, stud with washer, second nut from below', 'Fit the stud to the new rubber', 'Put a nut into the pocket on top of the rubber. Screw the stud with its washer through the nut and the hole, then tighten the second nut from below – gently.'),
      ('Rubber with stud glued into the housing', 'Glue the rubber into the housing', 'Apply the included adhesive to the bottom of the housing, press the rubber in, centred. Weigh the glued feet down evenly for 2 hours.')],
   foot='Silicone rubber with M4 hole · silicone adhesive included'),
 'de': dict(lang='de', title='Anleitung Gummitausch – Pioneer PL-570 / XL-A700', sub='Gummitausch in den Originalfüßen · auch PL-550, XL-1550 und Entsprechungen',
   steps='Schritte',
   kit_alt='Ersatzgummis und eine Tube Silikonkleber', kit_h='Im Set', kit_p='Ersatzgummis mit M4-Bohrung und Silikonkleber.',
   kit_s='Messingbolzen, Muttern und Metallscheibe stammen vom Originalfuß.',
   prep_h='Bereitlegen', prep_p='Originalfüße, Gabelschlüssel 7&nbsp;mm, Isopropylalkohol und ein sauberes Tuch.', prep_s='Bei rostigen Gehäusen: Polierpaste.',
   S=[('Alter Gummi und Bolzen werden aus dem Fußgehäuse genommen', 'Alten Fuß zerlegen', 'Muttern lösen, Messingbolzen mit Scheibe herausnehmen und den alten, zerfallenen Gummi vollständig aus dem Gehäuse entfernen.'),
      ('Reinigung des Gehäuses innen', 'Gehäuse reinigen', 'Der Fuß muss sehr gründlich von altem Gummi und Schmutz gereinigt sein, innen entfetten. Rost außen nur jetzt polieren – Polieren erwärmt den Fuß.'),
      ('Mutter in der Gummiaufnahme, Bolzen mit Scheibe, zweite Mutter von unten', 'Bolzen am neuen Gummi montieren', 'Mutter in die Aufnahme oben im Gummi legen. Bolzen mit Scheibe durch Mutter und Bohrung schrauben, von unten die zweite Mutter anziehen – mit Gefühl.'),
      ('Gummi mit Bolzen wird ins Gehäuse geklebt', 'Gummi ins Gehäuse kleben', 'Kleber aus dem Set auf den Gehäuseboden auftragen, Gummi mittig eindrücken. Geklebte Füße 2 Stunden gleichmäßig beschweren.')],
   foot='Silikongummi mit M4-Bohrung · Silikonkleber im Set'),
}
for k, t in T.items():
    s = tpl
    s = s.replace('<html lang="pl">', f'<html lang="{t["lang"]}">')
    s = re.sub(r'<title>.*?</title>', f'<title>{t["title"]}</title>', s)
    s = s.replace('>AVC A56 MK2</h1>', '>Pioneer PL-570 / XL-A700</h1>')
    s = s.replace('Instrukcja montażu nóżek gramofonowych', t['sub'])
    s = s.replace('kroki<br>montażu', t['steps'])
    blobs = re.findall(r'/_blob/([0-9a-f]{32})', s)
    for old, new in zip(blobs, IMG): s = s.replace(old, new)
    s = s.replace('Cztery nóżki AVC A56 MK2 i cztery śruby', t['kit_alt'])
    s = s.replace('>W zestawie<', f'>{t["kit_h"]}<').replace('>Przygotuj<', f'>{t["prep_h"]}<')
    s = s.replace('4 nóżki oraz 4 śruby M3–M6 lub 4 wkręty do drewna 3–6 mm w wybranym rozmiarze.', t['kit_p'])
    s = s.replace('Bez śrub: użyj śrub od oryginalnych nóżek.', t['kit_s'])
    s = s.replace('Śrubokręt krzyżakowy lub klucz imbusowy pasujący do śruby, miękki koc i poziomicę.', t['prep_p'])
    s = s.replace('Zdejmij talerz i zabezpiecz ramię.', t['prep_s'])
    alts = re.findall(r'<img src="/_blob/[0-9a-f]+" alt="([^"]*)" style="width: 347px', s)
    h3 = re.findall(r'font-weight: 700">([^<]*)</h3>', s)
    ps = re.findall(r'<p style="margin: 0; font-size: 13px; line-height: 1.45">(.*?)</p>', s)
    assert len(alts) == len(h3) == len(ps) == 4, (len(alts), len(h3), len(ps))
    for i, (a, h, p) in enumerate(t['S']):
        s = s.replace(f'alt="{alts[i]}"', f'alt="{a}"', 1).replace(f'>{h3[i]}</h3>', f'>{h}</h3>', 1).replace(f'line-height: 1.45">{ps[i]}</p>', f'line-height: 1.45">{p}</p>', 1)
    s = s.replace('Półsferyczne gumowe zawieszenie AVC · korpus z wytrzymałego polimeru technicznego', t['foot'])
    assert 'A56' not in s and 'AVC' not in s, k
    (P / f'PL570-{k.upper()}.dc.html').write_text(s)
c = json.loads((P / 'canvas.json').read_text())
c['title'] = 'Instrukcje graficzne VRUX – A56 LP, A56 MK2, Pioneer PL-570'
for i, k in enumerate(['PL', 'EN', 'DE']):
    n = f'PL570-{k}.dc.html'; c['boards'][n] = {'x': 874 * i, 'y': 2486, 'w': 794, 'h': 1123, 'title': f'Pioneer PL-570 – {k}', 'paper': 'a4'}
    if n not in c['order']: c['order'].append(n)
(P / 'canvas.json').write_text(json.dumps(c, ensure_ascii=False))
print('ok')
