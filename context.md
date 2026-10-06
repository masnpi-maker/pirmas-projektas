# Projekto kontekstas: pirmas-projektas

Paskutinį kartą atnaujinta: 2026-10-06

## Apžvalga

Lietuviška vieno puslapio React programa, kurioje yra fiat valiutų konverteris ir kriptovaliutų skaičiuoklė. Tamsi ir šviesi temos su bordo/rožiniais akcentais; pasirinkimas išsaugomas naršyklės `localStorage`. Paskirtis, hostingas ir Git/GitHub darbo eiga: reikia patikslinti.

## Technologijos ir komandos

- React 19, Vite 8, JavaScript/JSX, paprastas CSS.
- ESLint 10 su React Hooks ir React Refresh taisyklėmis.
- Runtime priklausomybės: `react`, `react-dom`; papildomų UI bibliotekų nėra.
- `npm run dev` – vystymo serveris; `npm run build` – produkcinis build; `npm run preview` – build peržiūra; `npm run lint` – ESLint.
- Vite konfigūracija naudoja tik React įskiepį; aliasų ir proxy nėra.

## Failų struktūra

- `src/App.jsx` – valiutų konverteris ir jame apibrėžtas `CryptoCalculator`.
- `src/App.css`, `src/index.css` – komponentų ir bendrieji stiliai.
- `src/main.jsx` – React įėjimo taškas, `StrictMode`.
- `src/AGENTS.md` – `src/` katalogo darbo instrukcijos.
- `public/`, `index.html`, `vite.config.js`, `eslint.config.js`, `package.json`.

## Veikimas ir API

### Valiutų konverteris

`App` saugo sumą, valiutų porą, EUR bazės kursus, atnaujinimo datą, užklausos būseną ir klaidą. Kursai vieną kartą užkraunami per `useEffect`/`useCallback` iš Frankfurter (`https://api.frankfurter.dev/v1/latest?base=EUR&symbols=PLN,GBP,USD`). Papildoma laiko eilutės užklausa randa ankstesnį paskelbtą kursą (iki 7 kalendorinių dienų atgal); EUR bazės kursų lentelėje rodomas procentinis pokytis nuo to kurso. Jei istorinių duomenų gauti nepavyksta, pokytis rodomas kaip brūkšnys, o dabartiniai kursai veikia toliau. Konvertavimas skaičiuojamas per EUR bazę; yra valiutų sukeitimo mygtukas. Sumos kablelis pakeičiamas tašku, formatavimui naudojamas `Intl.NumberFormat('lt-LT')`.

Palaikomos valiutos: EUR, PLN, GBP, USD.

### Kriptovaliutų skaičiuoklė

`CryptoCalculator` saugo pasirinktos kriptovaliutos ID, valiutą, kiekį, visų kainų ir 24 val. pokyčių objektus, atnaujinimo laiką, būseną ir klaidą. CoinGecko `simple/price` užklausa prašo visų šešių palaikomų aktyvų kainų pasirinkta fiat valiuta, `last_updated_at` ir `include_24hr_change=true`. Kainų sąraše rodomas 24 val. pokytis procentais; kai API jo nepateikia, rodomas brūkšnys. Užklausa kartojama pasikeitus valiutai; ankstesnė užklausa atšaukiama per `AbortController`. Klaidos būsenoje rodomas bandymo iš naujo mygtukas.

Palaikomi CoinGecko ID: bitcoin, ethereum, tether, binancecoin, solana, ripple (BTC, ETH, USDT, BNB, SOL, XRP). Valiutos: EUR, USD, GBP, PLN. Rodoma pasirinkto kiekio vertė, vieneto kaina ir visų šešių kriptovaliutų kainų sąrašas. Kiekio kablelis pakeičiamas tašku; pinigai formatuojami `Intl.NumberFormat('lt-LT')`.

### API ribos

Abu API kviečiami tiesiai iš naršyklės, be raktų ir `.env`. Fiat kursai pateikiami pagal naujausią Frankfurter datą, o CoinGecko kainoms galioja paslaugos užklausų limitai. Tai nėra tiesioginė kainų transliacija.

## UI ir konvencijos

- UI tekstai lietuviški; galima perjungti tamsią ir šviesią temas viršuje esančiu prieinamu mygtuku. Pasirinkimas saugomas `localStorage`; tamsi tema naudoja bordo/plum korteles, šviesi – baltas korteles, abiejose lieka rožiniai akcentai ir viršutinis glow.
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

- 2026-10-06: Pridėtas tamsios ir šviesios temos perjungiklis; pasirinkimas išsaugomas `localStorage`.
- 2026-10-06: Patikslintas projekto kontekstas pagal esamą kodą, įskaitant CoinGecko užklausą visoms kriptovaliutoms ir kripto kainų sąrašą. Pridėtos projekto lygmens instrukcijos `AGENTS.md`.
- 2026-10-06: Valiutų ir kriptovaliutų kursų sąrašuose pridėtas pokytis procentais: fiat valiutoms lyginama su ankstesne paskelbta darbo diena, kriptovaliutoms naudojamas CoinGecko 24 val. pokytis.
- 2026-10-01: Atnaujintas valiutų ir kriptovaliutų išdėstymas bei projekto instrukcijos.
