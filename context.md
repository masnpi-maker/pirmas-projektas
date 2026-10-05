# Projekto kontekstas: pirmas-projektas

> Šis failas atnaujinamas kiekvieno pokalbio su Claude pabaigoje. Pradėdamas naują pokalbį, įklijuok šį failą į pirmą žinutę.

Paskutinį kartą atnaujinta: 2026-10-01

## 1. Apžvalga

Lietuviška valiutų skaičiuoklė su kriptovaliutų skaičiuokle. Vieno puslapio React programa, tamsi tema su rožiniais akcentais.

- **Valiutų skaičiuoklė:** konvertuoja tarp EUR, PLN, GBP ir USD, yra valiutų sukeitimo mygtukas, rodomas kurso pavyzdys ir lentelė „Kursai nuo 1 EUR“ su atnaujinimo data.
- **Kriptovaliutų skaičiuoklė:** pasirenkama kriptovaliuta, kiekis ir valiuta, rodoma bendra vertė ir 1 vieneto kaina.
- **Paskirtis / auditorija:** _Reikia patikslinti (mokymasis, portfolio, realus naudojimas?)_

## 2. Technologijos

| Sritis | Pasirinkimas |
|---|---|
| Karkasas | React 19 (`react`, `react-dom` ^19.2.8) |
| Bundler | Vite 8 su `@vitejs/plugin-react` |
| Kalba | JavaScript (JSX), ne TypeScript |
| Linteris | ESLint 10 + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh` |
| Stiliai | Paprastas CSS (be bibliotekų) |
| Išorinės bibliotekos | Jokių papildomų (tik React) |

Vite konfigūracija minimali: tik React įskiepis, jokių aliasų ar proxy.

### Komandos

- `npm run dev` — vystymo serveris
- `npm run build` — produkcinė versija
- `npm run preview` — build peržiūra
- `npm run lint` — ESLint

## 3. Failų struktūra

```
pirmas-projektas/
├── public/            favicon.svg, icons.svg
├── src/
│   ├── assets/        hero.png, react.svg, vite.svg
│   ├── App.jsx        pagrindinis komponentas + CryptoCalculator komponentas viduje (AKTYVUS)
│   ├── App.css        valiutų (fx-*) ir, tikėtina, kripto (crypto-*) stiliai (tamsi tema)
│   ├── index.css
│   └── main.jsx       įėjimo taškas (StrictMode, importuoja index.css ir App.jsx)
├── index.html
├── eslint.config.js
├── vite.config.js
└── package.json, README.md, .gitignore
```

**Svarbu:** puslapyje rodomas kriptovaliutų blokas yra `CryptoCalculator` komponentas, apibrėžtas tiesiai `App.jsx`.

## 4. Architektūra

`main.jsx` atvaizduoja `<App />`. Plačiame ekrane valiutų konverteris ir kursų lentelė yra kairėje, o kriptovaliutų skaičiuoklė – dešinėje. Mažesniuose nei 900 px ekranuose blokai išdėstomi viename stulpelyje. `App` turi du funkcinius blokus:

1. **Valiutų konverteris** (pats `App`)
   - Būsena: `amount`, `from`, `to`, `eurRates`, `updatedAt`, `status` (`loading` / `ready` / `error`), `error`.
   - Kursai kraunami vieną kartą per `useEffect` + `useCallback` (`loadRates`).
   - Konvertavimas per EUR bazę: `suma / kursas(from) * kursas(to)`. Kursų objektas turi `EUR: 1` ir kitas valiutas iš API.
   - Skaičiavimai (`converted`, `pairRate`, `numericAmount`) per `useMemo`.
   - Sumos įvestyje kablelis keičiamas tašku prieš konvertuojant (`replace(',', '.')`).
   - Formatavimas per `Intl.NumberFormat('lt-LT')` (`formatMoney`, `formatRate`).
2. **`CryptoCalculator`** (komponentas `App.jsx` faile)
   - Būsena: `crypto`, `currency`, `amount`, `price`, `status`, `error`.
   - Kaina kraunama kaskart pasikeitus kriptovaliutai arba valiutai (`loadCryptoPrice`, `useCallback` + `useEffect`); ankstesnė užklausa atšaukiama naudojant `AbortController`.
   - Rezultatas = kiekis × kaina; kiekio kablelis keičiamas tašku; tikrinama, ar kaina yra skaičius.
   - Rezultatas formatuojamas per `Intl.NumberFormat` su valiutos stiliumi.
   - Klaidos atveju rodomas mygtukas „Bandyti dar kartą“.

### Duomenys programoje

- `CURRENCIES`: EUR, PLN, GBP, USD (kodas, lietuviškas pavadinimas, vėliavos emoji).
- `CRYPTOCURRENCIES`: BTC, ETH, USDT, BNB, SOL, XRP (CoinGecko `id`, pavadinimas, simbolis).
- Kriptovaliutų skaičiuoklės valiutų sąrašas (EUR, USD, GBP, PLN) įrašytas tiesiai JSX `<option>` elementuose, ne iš `CURRENCIES`.

## 5. Išoriniai API

| Paskirtis | API | Užklausa |
|---|---|---|
| Valiutų kursai | Frankfurter (`api.frankfurter.dev/v1/latest`) | `base=EUR&symbols=PLN,GBP,USD`, grąžina ir datą |
| Kriptovaliutų kainos | CoinGecko (`/api/v3/simple/price`) | `ids=<id>&vs_currencies=<valiuta>` |

- Abu be API raktų, kviečiami tiesiai iš naršyklės.
- `.env` kintamųjų nėra.
- Kursai atnaujinami puslapiui atsidarius ir pateikiami pagal Frankfurter API naujausią galimą datą; tai nėra tiesioginė (realaus laiko) kainų transliacija.

## 6. UI ir stilius

- **UI kalba:** lietuvių. Visi tekstai, `aria-label` ir klaidų žinutės lietuviškai.
- **Išvaizda:** tamsus fonas, bordo / rožinių tonų kortelės su suapvalintais kampais, rožinis akcentas (pvz., sukeitimo mygtukas ir ₿ ikona), švytėjimo efektas viršuje (`fx-glow`).
- **CSS klasių prefiksai:** `fx-*` valiutų daliai, `crypto-*` kriptovaliutų daliai.
- **Prieinamumas:** `aria-live="polite"` rezultatų kortelėse, `role="alert"` klaidoms, `label` susieti su laukais per `htmlFor`.
- **Konvencijos:** funkciniai komponentai su hook'ais, kodas be kabliataškių, viengubos kabutės, 2 tarpų atitraukimas (`App.jsx`).

## 7. Diegimas ir versijavimas

- Hostingas: _Reikia patikslinti_
- Git / GitHub: _Reikia patikslinti_ (`.gitignore` yra)

## 8. Žinomos problemos ir idėjos

Žinomos ribos:
- CoinGecko nemokamas API turi užklausų limitus, galimos klaidos esant dideliam naudojimui.
- Valiutų sąrašas dubliuojamas (`CURRENCIES` ir `<option>` kriptovaliutų bloke).
- Užkoduota `lt-LT` lokalė, kalbos perjungimo nėra.

Planai ir idėjos: _Reikia patikslinti_

## 9. Sprendimų žurnalas

- 2026-10-01: Atšaukiamos ankstesnės kriptovaliutų kainų užklausos, patikslinta kursų antraštė, pataisyta kriptovaliutos rašyba, atnaujintas glow akcentas ir pašalinta nenaudojama kopija. Atnaujintos projekto instrukcijos.
- 2026-10-01: Plačiame ekrane valiutų konverteris ir kursų lentelė išdėstomi kairėje, kriptovaliutų skaičiuoklė dešinėje; siaurame ekrane naudojamas vienas stulpelis.

- 2026-10-01: Nuspręsta palaikyti šį `context.md` ir atnaujinti jį kiekvieno pokalbio pabaigoje. Sukurta pirma versija iš `App.jsx`, `main.jsx`, `package.json`, `vite.config.js` ir failų struktūros.
- 2026-10-01: Peržiūrėti `CryptoCalculator.jsx` ir `CryptoCalculator.css`: nustatyta, kad tai nebenaudojama senesnė kopija (šviesi tema, neimportuojama). Atnaujinti skyriai 3, 4 ir 8.
