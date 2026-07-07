# pilotRADAR CB Rádió + Tolmács mód – telepítés

## 1. Szerver (Railway)
1. Új Railway projekt → `server.js` + `package.json` feltöltése (vagy GitHub repo-ból deploy).
2. Node 18+ kell (Railway alapból ezt adja) – a fordításhoz beépített fetch-et használ.
3. A kapott domain lesz a szerver címe, pl.: `wss://cb-radio-production.up.railway.app`
   (a kliensben **wss://** előtaggal add meg – a fordítási hívásokhoz a kliens
   ebből magától képzi a https:// címet).

## 2. Kliens (weboldalba beépítés)
Az `index.html` önálló fájl. Két beépítési mód:

**A) Iframe:**
```html
<iframe src="/cb/index.html" style="width:100%;max-width:440px;height:760px;border:none;" allow="microphone"></iframe>
```
Fontos: iframe-nél kell az `allow="microphone"` attribútum!

**B) Külön oldal** – feltöltés a webtárhelyre (pl. pilotradar.hu/cb/).

A mikrofonhoz **HTTPS** kell.

## 3. Tolmács mód használata
1. Kapcsold be a FORDÍTÓ kapcsolót.
2. „ÉN ÍGY BESZÉLEK": a saját nyelved (ezen ismeri fel a beszéded).
3. „ÍGY AKAROM HALLANI": amilyen nyelven a bejövő adásokat hallani akarod.
4. Adáskor a beszéded felismerésre kerül és szövegként is elmegy a csatornára.
5. Vételkor: az eredeti hang halkan szól a háttérben, felette a gép
   felolvassa a fordítást a választott nyelven. Az LCD-n felirat is megy
   (eredeti + fordítás).
6. Ha az adó és a hallgató nyelve azonos, nincs fordítás – az eredeti hang
   szól teljes hangerőn.

20 választható nyelv: magyar, angol, német, román, szlovák, cseh, lengyel,
szlovén, ukrán, orosz, horvát, bolgár, szerb, török, holland, svéd, francia,
spanyol, portugál, olasz.

## Ismert korlátok
- Beszédfelismerés: **Chrome/Edge** böngészőben működik (Firefoxban nem).
  Ha az adó böngészője nem támogatja, az ő adása fordítás nélkül megy,
  de a bejövő adások fordítása nála is működik.
- A felolvasáshoz a készüléken lennie kell az adott nyelvű hangnak
  (a főbb nyelveknél alapból van).
- Mobil böngészőben a hardveres hangerőgombot a rendszer nem adja át a
  weboldalnak – ott a képernyős PTT gomb működik.
- A fordítás a mondat végén (rövid szünet után) érkezik, kb. 1-2 mp késéssel –
  mint egy tolmácsnál.
