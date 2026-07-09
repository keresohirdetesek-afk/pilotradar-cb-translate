# pilotRADAR CB Rádió + Tolmács mód – telepítés

## Röviden: nem kell szerver
Az új változat egy nyilvános üzenetközvetítőt (MQTT broker) használ, ezért
**semmit sem kell telepíteni vagy üzemeltetni**. Elég megnyitni az `index.html`-t
(HTTPS-en, hogy a mikrofon működjön), megadni egy hívójelet, és megnyomni a
CSATLAKOZÁS gombot. Aki ugyanarra a csatornára lép, hallja egymást.

A fordítás is közvetlenül a böngészőből történik (MyMemory, kulcs nélkül), így
ahhoz sem kell háttérszerver.

## 1. Közzététel (a legegyszerűbb: GitHub Pages)
1. A repóban: **Settings → Pages → Deploy from a branch → `gh-pages` / root**.
2. Pár perc múlva él a cím, pl.: `https://<felhasználó>.github.io/<repo>/`.
3. Ezt a linket bárki megnyithatja telefonon vagy gépen.

Fontos: az `index.html` mellett a `mqtt.min.js` fájlnak is ott kell lennie
(ugyanabban a mappában) – ez az MQTT-kliens könyvtár.

## 2. Beépítés meglévő weboldalba
**Iframe:**
```html
<iframe src="/cb/index.html" style="width:100%;max-width:440px;height:760px;border:none;" allow="microphone"></iframe>
```
Iframe-nél kötelező az `allow="microphone"` attribútum. A mikrofonhoz HTTPS kell.

Töltsd fel az `index.html`-t és a `mqtt.min.js`-t ugyanabba a mappába
(pl. pilotradar.hu/cb/).

## 3. Csatornák
- **Nyilvános 1–40:** a léptető gombokkal válts csatornát.
- **Privát kód:** min. 4 karakteres kód (pl. KHT2026). Csak az hallja, aki
  ugyanazt a kódot írja be. A kód a „jelszó” – aki ismeri, be tud lépni.

## 4. Tolmács mód
1. Kapcsold be a FORDÍTÓ kapcsolót.
2. „ÉN ÍGY BESZÉLEK”: a saját nyelved (ezen ismeri fel a beszéded).
3. „ÍGY AKAROM HALLANI”: amilyen nyelven a bejövő adásokat hallani akarod.
4. Adáskor a beszéded felismerésre kerül és szövegként is elmegy a csatornára.
5. Vételkor: az eredeti hang halkan szól a háttérben, felette a gép felolvassa a
   fordítást, az LCD-n pedig felirat megy (eredeti + fordítás).
6. Ha az adó és a hallgató nyelve azonos, nincs fordítás – az eredeti hang szól
   teljes hangerőn.

20 választható nyelv: magyar, angol, német, román, szlovák, cseh, lengyel,
szlovén, ukrán, orosz, horvát, bolgár, szerb, török, holland, svéd, francia,
spanyol, portugál, olasz.

## 5. Haladó: saját broker
A rádió alján a „Haladó beállítás” alatt megadható másik MQTT-broker címe
(WebSocket-en, `wss://…`). Alapból a `broker.emqx.io` nyilvános brokerét
használja. Ha saját, privát brokert szeretnél (pl. EMQX/Mosquitto WebSocket
támogatással), csak írd be ide a címét.

## Ismert korlátok
- **Beszédfelismerés (a te adásod feliratozása/fordítása): Chrome/Edge**
  böngészőben működik (Firefoxban nem). Ha a te böngésződ nem támogatja, a te
  adásod fordítás nélkül megy, de a bejövő adások fordítása nálad is működik.
- A felolvasáshoz a készüléken lennie kell az adott nyelvű hangnak (a főbb
  nyelveknél alapból van).
- A nyilvános broker és a fordítási szolgáltatás ingyenes, megosztott
  szolgáltatások – nagy terhelésnél lassulhatnak. Éles, privát használatra
  érdemes saját brokert megadni (lásd 5. pont).
- A nyilvános csatornákat elvileg más is hallgathatja, ha ugyanazt a brokert és
  csatornát használja – mint egy igazi CB-rádiónál. Érzékeny beszélgetéshez
  használj privát kódot (és lehetőleg saját brokert).
- A fordítás a mondat végén (rövid szünet után) érkezik, kb. 1-2 mp késéssel –
  mint egy tolmácsnál.

## Régi, szerveres változat
A repóban maradt `server.js` a korábbi, saját WebSocket-szerveres megoldás.
Az új klienshez **nincs rá szükség**; csak akkor kell, ha a régi módon,
saját Node-szerverrel akarod üzemeltetni.
