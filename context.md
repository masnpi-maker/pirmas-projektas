# Projekto kontekstas: pirmas-projektas

Paskutinį kartą atnaujinta: 2026-10-06

## Apžvalga

Lietuviška React programa su valiutų konverteriu, kriptovaliutų skaičiuokle, istorinių grafikų ir aukso skaičiuoklės puslapiais. Pagrindinė valiutų programa turi tamsią ir šviesią temas; aukso skaičiuoklė naudoja atskirą šviesų aukso akcentų dizainą.

## Technologijos ir komandos

- React 19, Vite 8, JavaScript/JSX, paprastas CSS.
- ESLint 10 su React Hooks ir React Refresh taisyklėmis.
- Runtime priklausomybės: `react`, `react-dom`; papildomų UI bibliotekų nėra.
- `npm run dev` – vystymo serveris; `npm run build` – produkcinis build; `npm run preview` – build peržiūra; `npm run lint` – ESLint.
- Vite konfigūracija naudoja tik React įskiepį; aliasų ir proxy nėra.

## Failų struktūra

- `src/App.jsx` – valiutų konverteris, `CryptoCalculator` ir kelių puslapių navigacija.
- `src/components/GoldCalculator.jsx`, `src/GoldCalculator.css` – `/gold` aukso skaičiuoklės puslapis ir stiliai.
- `src/data/goldPurities.js` – aukso prabų konfigūracija, uncijos konstanta ir aiškiai pažymėta atsarginė kaina.
- `src/services/goldPriceService.js` – NBP aukso ir EUR/PLN dabartinės bei istorinių kainų užklausos.
- `src/App.css`, `src/index.css` – valiutų ir kripto puslapių stiliai.
- `src/main.jsx` – React įėjimo taškas, `StrictMode`.
- `src/AGENTS.md` – `src/` katalogo darbo instrukcijos.
- `public/`, `index.html`, `vite.config.js`, `eslint.config.js`, `package.json`.

## Veikimas ir API

### Valiutų konverteris

`App` saugo sumą, valiutų porą, EUR bazės kursus, atnaujinimo datą, užklausos būseną ir klaidą. Kursai vieną kartą užkraunami per `useEffect`/`useCallback` iš Frankfurter (`https://api.frankfurter.dev/v1/latest?base=EUR&symbols=PLN,GBP,USD`). Papildoma laiko eilutės užklausa randa ankstesnį paskelbtą kursą (iki 7 kalendorinių dienų atgal); EUR bazės kursų lentelėje rodomas procentinis pokytis nuo to kurso. Jei istorinių duomenų gauti nepavyksta, pokytis rodomas kaip brūkšnys, o dabartiniai kursai veikia toliau. Konvertavimas skaičiuojamas per EUR bazę; yra valiutų sukeitimo mygtukas. Sumos kablelis pakeičiamas tašku, formatavimui naudojamas `Intl.NumberFormat('lt-LT')`.

Palaikomos valiutos: EUR, PLN, GBP, USD.

### Istorinių kursų ir kriptovaliutų grafikai

`/graphics` puslapyje galima perjungti fiat valiutų ir kriptovaliutų grafikus. Fiat grafikui pasirenkamas 7D, 30D, 90D arba 1Y laikotarpis ir EUR/USD, EUR/PLN arba EUR/GBP pora; duomenys gaunami Frankfurter v1 laiko eilutės API. Kripto grafikui pasirenkamas tas pats laikotarpis, vienas iš palaikomų aktyvų (BTC, ETH, USDT, BNB, SOL, XRP) ir EUR, USD, GBP arba PLN kainos valiuta; istorija gaunama CoinGecko `coins/{id}/market_chart` endpointu. Abu grafikai yra SVG linijiniai, rodo datas ir kainos/kurso skalę. Pasikeitus pasirinkimui ankstesnė užklausa atšaukiama ir grafikas atnaujinamas; klaidos būsenoje rodomas pranešimas.

### Kriptovaliutų skaičiuoklė

`CryptoCalculator` saugo pasirinktos kriptovaliutos ID, valiutą, kiekį, visų kainų ir 24 val. pokyčių objektus, atnaujinimo laiką, būseną ir klaidą. CoinGecko `simple/price` užklausa prašo visų šešių palaikomų aktyvų kainų pasirinkta fiat valiuta, `last_updated_at` ir `include_24hr_change=true`. Kainų sąraše rodomas 24 val. pokytis procentais; kai API jo nepateikia, rodomas brūkšnys. Užklausa kartojama pasikeitus valiutai; ankstesnė užklausa atšaukiama per `AbortController`. Klaidos būsenoje rodomas bandymo iš naujo mygtukas.

Palaikomi CoinGecko ID: bitcoin, ethereum, tether, binancecoin, solana, ripple (BTC, ETH, USDT, BNB, SOL, XRP). Valiutos: EUR, USD, GBP, PLN. Rodoma pasirinkto kiekio vertė, vieneto kaina ir visų šešių kriptovaliutų kainų sąrašas. Kiekio kablelis pakeičiamas tašku; pinigai formatuojami `Intl.NumberFormat('lt-LT')`.

### Aukso skaičiuoklė

Pagrindinio puslapio mygtukas atidaro `/gold`. Praba pasirenkama iš vieno `goldPurities` konfigūracijos sąrašo. Svoris priima tašką arba kablelį; tuščias laukas reiškia 0, o netinkama/neigiama reikšmė rodoma kaip validacijos klaida. Bazinė gryno aukso kaina gaunama per `getGoldPrice()` iš NBP aukso kainos (PLN/g) ir tos pačios datos NBP EUR/PLN kurso, tada konvertuojama į EUR/g. Kainos būsena dalijama tarp antraštės, skaičiuoklės, prabų lentelės ir uncijos skaičiavimo. Duomenys atnaujinami kas 5 minutes; nepavykus užklausai naudojama 118.89 EUR/g demonstracinė atsarginė reikšmė, aiškiai pažymima UI.

Rezultatas, gryno aukso svoris ir supirkimo įvertis skaičiuojami iš vienos bazinės kainos; prabos gramo kaina apvalinama iki centų, po to skaičiuojama bendra vertė. Istorijos grafikas gauna NBP dienines gryno aukso PLN/g ir EUR/PLN kotiruotes iki 90 dienų dalimis (NBP užklausa ribojama iki 93 dienų), perskaičiuoja į EUR/g, palaiko 24 val., 7 dienų, 1 mėnesio, 6 mėnesių ir 1 metų intervalus. NBP istorija yra darbo dienų orientacinė fiksacija, ne dienos eigos realaus laiko grafikas. API klaidos atveju rodomas prašytas istorijos klaidos pranešimas; demo istorijos duomenų nėra.

### API ribos

Frankfurter, CoinGecko ir NBP API kviečiami tiesiai iš naršyklės, be raktų ir `.env`. Fiat ir aukso dienos referenciniai kursai nėra prekybinė realaus laiko kotiruotė; CoinGecko kainoms galioja paslaugos užklausų limitai.

## UI ir konvencijos

- UI tekstai lietuviški; galima perjungti tamsią ir šviesią temas viršuje esančiu prieinamu mygtuku. Pasirinkimas saugomas `localStorage`; tamsi tema naudoja bordo/plum korteles, šviesi – baltas korteles, abiejose lieka rožiniai akcentai ir viršutinis glow.
- Abiejų skaičiuoklių rezultatų kortelėse yra mygtukas rezultatui nukopijuoti per naršyklės Clipboard API; kopijavimo sėkmė ar klaida parodoma lietuviškai.
- `fx-*` klasės skirtos valiutų konverteriui, `crypto-*` – kriptovaliutų daliai.
- Išdėstymas dviejų stulpelių, iki 900 px – vieno stulpelio; mažesniuose ekranuose laukų grupės taip pat persirikiuoja.
- Rezultatams naudojamas `aria-live="polite"`, klaidoms `role="alert"`, laukams susieti `label`/`htmlFor`, ikoniniam mygtukui `aria-label`.
- JavaScript stilius: funkciniai komponentai ir hooks, be kabliataškių, viengubos kabutės, 2 tarpų įtrauka.

## Žinomos ribos ir klausimai

- CoinGecko nemokamas API gali riboti užklausas; jo 24 val. pokyčio laukas gali būti tuščias, jei duomenys pasenę.
- Fiat valiutų parinktys kripto dalyje įrašytos JSX atskirai nuo `CURRENCIES`.
- Lokalė fiksuota į `lt-LT`; kalbos perjungimo nėra.
- Produkto paskirtis, hostingas, Git/GitHub eiga ir planai: reikia patikslinti.

## Sprendimų žurnalas

- 2026-10-06: `/gold` atnaujintas iki veikiančios aukso skaičiuoklės su NBP kainomis ir istorija, prabų lentele, supirkimo koeficientu, validacija, responsive SVG grafiku ir aiškiai pažymėta atsargine kaina.
- 2026-10-06: Pagrindiniame puslapyje pridėtas „Aukso skaičiuoklė“ mygtukas ir atskiras rankiniu būdu įvedamos aukso kainos skaičiuoklės puslapis.
- 2026-10-06: Pridėtas „Graphics“ navigacijos mygtukas ir atskiras `/graphics` puslapis su grįžimo nuoroda.
- 2026-10-06: „Graphics“ puslapyje pridėtas istorinių EUR kursų grafikas, 7D/30D/90D/1Y laikotarpiai ir EUR/USD, EUR/PLN, EUR/GBP poros.
- 2026-10-06: „Graphics“ puslapyje pridėtas perjungimas į kriptovaliutų istoriją su šešiais palaikomais aktyvais ir EUR/USD/GBP/PLN kainos valiutomis.
- 2026-10-06: Pridėti rezultatų kopijavimo mygtukai valiutų ir kriptovaliutų skaičiuoklėse.
- 2026-10-06: Pridėtas tamsios ir šviesios temos perjungiklis; pasirinkimas išsaugomas `localStorage`.
- 2026-10-06: Patikslintas projekto kontekstas pagal esamą kodą, įskaitant CoinGecko užklausą visoms kriptovaliutoms ir kripto kainų sąrašą. Pridėtos projekto lygmens instrukcijos `AGENTS.md`.
- 2026-10-06: Valiutų ir kriptovaliutų kursų sąrašuose pridėtas pokytis procentais: fiat valiutoms lyginama su ankstesne paskelbta darbo diena, kriptovaliutoms naudojamas CoinGecko 24 val. pokytis.
- 2026-10-01: Atnaujintas valiutų ir kriptovaliutų išdėstymas bei projekto instrukcijos.
