import re,sys,pathlib
D=pathlib.Path('/tmp/claude-0/-home-claude/30964f7b-9667-5743-bd31-7087e75664f6/scratchpad')
IMG=D/'lpfilm/instr'
blob={'4c075cd9c944fca28852e36db84c160b':'mk2_kit','b580f8f1749ed26dd4ec01eef1684993':'mk2_step1','73668541a9467df4a7ddab54edeec4c1':'mk2_step2','f2e06b07915d155df2af41e10b5245c1':'mk2_step3','2e60bfe60cd64770c2fa221d211cc210':'mk2_step4','dfe7b797191d2a9610687a6ebeedf0bf':'kit','11f89ef6fae6d1689b6ef5735abc51f3':'step1','8e920ee31d814fc0f7e7b0641251571e':'step2','6a5442f1a262ce370ff0330f1c23722b':'step3','0a934a4054b579ad95d1667e770052c3':'step4'}
F=D/'pdfbuild/node_modules/@fontsource'
faces=''
for fam,dirn,ws in [('Inter','inter',[400,500,600]),('Space Grotesk','space-grotesk',[500,600,700])]:
  for w in ws:
    for sub,rng in [('latin','U+0000-00FF,U+2000-206F,U+2190-21FF'),('latin-ext','U+0100-024F,U+1E00-1EFF,U+2020,U+20A0-20AB,U+2113,U+2C60-2C7F,U+A720-A7FF')]:
      faces+=f"@font-face{{font-family:'{fam}';font-weight:{w};src:url('file://{F}/{dirn}/files/{dirn}-{sub}-{w}-normal.woff2') format('woff2');unicode-range:{rng}}}\n"
for name,out in [('Main','pl'),('EN','en'),('DE','de'),('MK2-PL','mk2-pl'),('MK2-EN','mk2-en'),('MK2-DE','mk2-de')]:
  s=(D/f'design-a56lp/project/{name}.dc.html').read_text()
  body=re.search(r'<x-dc>(.*)</x-dc>',s,re.S).group(1)
  body=re.sub(r'<helmet>.*?</helmet>','',body,flags=re.S).replace('{{accent}}','#0b8f98')
  for b,n in blob.items(): body=body.replace(f'/_blob/{b}',f'file://{IMG}/{n}.jpg')
  lang=re.search(r'<html lang="(\w+)"',s).group(1); title=re.search(r'<title>(.*?)</title>',s).group(1)
  html=f'<!doctype html><html lang="{lang}"><head><meta charset="utf-8"><title>{title}</title><style>{faces}@page{{size:794px 1123px;margin:0}}html,body{{margin:0;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>{body}</body></html>'
  (D/f'pdfbuild/{out}.html').write_text(html)
print('ok')
