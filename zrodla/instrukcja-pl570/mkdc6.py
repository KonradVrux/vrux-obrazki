import re, pathlib
D = pathlib.Path('/tmp/claude-0/-home-claude/30964f7b-9667-5743-bd31-7087e75664f6/scratchpad')
P = D / 'design-a56lp/project'
IMG = ['2e8119ac5a40c782b31151858b24c184', 'b51a253c494e01027cfe9d53b2259439', '9442c81f10b6c689c420c1c1a915fac0', '699c3cf652e4d1e1d828d4a00d560122', 'd84cde6064d05ec0b81c7c3760f7f373', 'f8a438fd0f0591b208b105eb3876068d']
T = {
 'PL': ('6', 'kroków<br>wymiany', [
  ('Stara guma i trzpień wyjmowane z obudowy', 'Rozbierz starą nóżkę', 'Odkręć nakrętki, wyjmij mosiężny trzpień z podkładką i usuń całą starą gumę.'),
  ('Czyszczenie wnętrza obudowy', 'Oczyść obudowę', 'Nóżka musi być bardzo dobrze oczyszczona ze starej gumy i brudu, wnętrze odtłuść. Rdzę poleruj z zewnątrz tylko teraz – polerowanie nagrzewa nóżkę.'),
  ('Nakrętka wkładana w gniazdo na górze gumy, trzpień z podkładką', 'Nakrętka i trzpień', 'Włóż nakrętkę w gniazdo na górze gumy. Wkręć w nią trzpień z podkładką.'),
  ('Guma od spodu: druga nakrętka i kropla kleju', 'Dokręć od spodu', 'Od spodu gumy nakręć drugą nakrętkę, dokręć z wyczuciem i dodaj kroplę kleju.'),
  ('Guma z trzpieniem wklejana do obudowy', 'Wklej gumę', 'Nałóż klej z zestawu na dno obudowy i wciśnij gumę na środek.'),
  ('Cztery nóżki obciążone deską z ciężarkiem', 'Obciąż na 2 godziny', 'Wklejone nóżki obciąż równomiernie na 2 godziny, np. deską z ciężarkiem. Potem przykręć je do gramofonu.')]),
 'EN': ('6', 'steps', [
  ('Old rubber and stud taken out of the housing', 'Take the old foot apart', 'Undo the nuts, take out the brass stud with its washer and remove all of the old rubber.'),
  ('Cleaning the inside of the housing', 'Clean the housing', 'The foot must be very thoroughly cleaned of old rubber and dirt, degrease the inside. Polish off rust on the outside only now – polishing heats the foot.'),
  ('Nut into the pocket on top of the rubber, stud with washer', 'Nut and stud', 'Put a nut into the pocket on top of the rubber. Screw the stud with its washer into it.'),
  ('Rubber from below: second nut and a drop of glue', 'Tighten from below', 'From underneath the rubber, screw on the second nut, tighten gently and add a drop of glue.'),
  ('Rubber with stud glued into the housing', 'Glue the rubber in', 'Apply the included adhesive to the bottom of the housing and press the rubber in, centred.'),
  ('Four feet weighed down with a board and a weight', 'Weigh down for 2 hours', 'Weigh the glued feet down evenly for 2 hours, e.g. with a board and a weight. Then fit them to the turntable.')]),
 'DE': ('6', 'Schritte', [
  ('Alter Gummi und Bolzen werden aus dem Gehäuse genommen', 'Alten Fuß zerlegen', 'Muttern lösen, Messingbolzen mit Scheibe herausnehmen und den alten Gummi vollständig entfernen.'),
  ('Reinigung des Gehäuses innen', 'Gehäuse reinigen', 'Der Fuß muss sehr gründlich von altem Gummi und Schmutz gereinigt sein, innen entfetten. Rost außen nur jetzt polieren – Polieren erwärmt den Fuß.'),
  ('Mutter in die Aufnahme oben im Gummi, Bolzen mit Scheibe', 'Mutter und Bolzen', 'Mutter in die Aufnahme oben im Gummi legen. Bolzen mit Scheibe hineinschrauben.'),
  ('Gummi von unten: zweite Mutter und ein Tropfen Kleber', 'Von unten anziehen', 'Von unten die zweite Mutter aufschrauben, mit Gefühl anziehen und einen Tropfen Kleber auftragen.'),
  ('Gummi mit Bolzen wird ins Gehäuse geklebt', 'Gummi einkleben', 'Kleber aus dem Set auf den Gehäuseboden auftragen und den Gummi mittig eindrücken.'),
  ('Vier Füße, mit Brett und Gewicht beschwert', '2 Stunden beschweren', 'Geklebte Füße 2 Stunden gleichmäßig beschweren, z.&nbsp;B. mit Brett und Gewicht. Danach an den Plattenspieler schrauben.')]),
}
def step(i, img, alt, h, p):
    return f'''<div style="display: flex; flex-direction: column; gap: 9px">
<img src="/_blob/{img}" alt="{alt}" style="width: 224px; height: 212px; object-fit: cover; border-radius: 10px; display: block">
<div style="display: flex; gap: 10px; align-items: flex-start">
<div style="flex-shrink: 0; width: 28px; height: 28px; border-radius: 14px; background: {{{{accent}}}}; color: #ffffff; font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 700; display: flex; align-items: center; justify-content: center">{i}</div>
<div style="display: flex; flex-direction: column; gap: 3px">
<h3 style="margin: 0; font-family: 'Space Grotesk', sans-serif; font-size: 14px; font-weight: 700; line-height: 1.25">{h}</h3>
<p style="margin: 0; font-size: 12px; line-height: 1.45">{p}</p>
</div>
</div>
</div>
'''
for k, (n, lab, S) in T.items():
    f = P / f'PL570-{k}.dc.html'; s = f.read_text()
    a = s.index('<section style="display: grid'); b = s.index('</section>', a) + len('</section>')
    grid = '<section style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px 21px">\n\n' + '\n'.join(step(i + 1, IMG[i], *S[i]) for i in range(6)) + '\n</section>'
    s = s[:a] + grid + s[b:]
    s = re.sub(r'(line-height: 1; color: \{\{accent\}\}">)\d(</div>\s*<div style="font-size: 12px; line-height: 1.35; color: #c9ccd1">)[^<]*(?:<br>[^<]*)?(</div>)', lambda m: m.group(1) + n + m.group(2) + lab + m.group(3), s)
    f.write_text(s)
print('ok')
