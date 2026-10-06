import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const CURRENCIES = [
  { code: 'EUR', name: 'Euras', flag: '🇪🇺' },
  { code: 'PLN', name: 'Lenkijos zlotas', flag: '🇵🇱' },
  { code: 'GBP', name: 'Svaras sterlingų', flag: '🇬🇧' },
  { code: 'USD', name: 'JAV doleris', flag: '🇺🇸' },
]

const RATES_URL =
  'https://api.frankfurter.dev/v1/latest?base=EUR&symbols=PLN,GBP,USD'

function formatMoney(value, code) {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('lt-LT', {
    style: 'currency',
    currency: code,
    maximumFractionDigits: 4,
  }).format(value)
}

function formatRate(value) {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('lt-LT', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
  }).format(value)
}

function formatPercent(value) {
  if (!Number.isFinite(value)) return '—'
  return `${new Intl.NumberFormat('lt-LT', {
    maximumFractionDigits: 2,
    signDisplay: 'always',
  }).format(value)}%`
}

const CRYPTOCURRENCIES = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
  { id: 'tether', name: 'Tether', symbol: 'USDT' },
  { id: 'binancecoin', name: 'BNB', symbol: 'BNB' },
  { id: 'solana', name: 'Solana', symbol: 'SOL' },
  { id: 'ripple', name: 'XRP', symbol: 'XRP' },
]

const CRYPTO_IDS = CRYPTOCURRENCIES.map((item) => item.id).join(',')

function formatCryptoMoney(value, code) {
  if (!Number.isFinite(value)) return '—'
  const abs = Math.abs(value)
  const maximumFractionDigits = abs >= 1 ? 2 : abs >= 0.01 ? 4 : 6
  return new Intl.NumberFormat('lt-LT', {
    style: 'currency',
    currency: code,
    maximumFractionDigits,
  }).format(value)
}

function CryptoCalculator() {
  const [crypto, setCrypto] = useState('bitcoin')
  const [currency, setCurrency] = useState('eur')
  const [amount, setAmount] = useState('1')
  const [prices, setPrices] = useState(null)
  const [priceChanges, setPriceChanges] = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const requestController = useRef(null)

  const loadCryptoPrice = useCallback(async () => {
    requestController.current?.abort()
    const controller = new AbortController()
    requestController.current = controller
    setStatus('loading')
    setError('')
    setPriceChanges(null)

    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${CRYPTO_IDS}&vs_currencies=${currency}&include_last_updated_at=true&include_24hr_change=true`,
        { signal: controller.signal },
      )

      if (!response.ok) {
        throw new Error('Nepavyko gauti kriptovaliutos kainos.')
      }

      const data = await response.json()
      const nextPrices = {}
      const nextPriceChanges = {}
      let latestUpdate = 0

      for (const item of CRYPTOCURRENCIES) {
        const currentPrice = data?.[item.id]?.[currency]
        if (!Number.isFinite(currentPrice)) {
          throw new Error('Kainos duomenų nėra.')
        }
        nextPrices[item.id] = currentPrice
        const change = data?.[item.id]?.[`${currency}_24h_change`]
        nextPriceChanges[item.id] = Number.isFinite(change) ? change : null
        const stamp = data?.[item.id]?.last_updated_at
        if (Number.isFinite(stamp) && stamp > latestUpdate) {
          latestUpdate = stamp
        }
      }

      if (controller.signal.aborted) return
      setPrices(nextPrices)
      setPriceChanges(nextPriceChanges)
      setUpdatedAt(latestUpdate || Date.now() / 1000)
      setStatus('ready')
    } catch {
      if (controller.signal.aborted) return
      setPrices(null)
      setPriceChanges(null)
      setUpdatedAt(null)
      setStatus('error')
      setError(
        'Kriptovaliutos kainos gauti nepavyko. Patikrinkite internetą ir bandykite dar kartą.',
      )
    }
  }, [currency])

  useEffect(() => {
    loadCryptoPrice()
    return () => requestController.current?.abort()
  }, [loadCryptoPrice])

  const numericAmount = Number(String(amount).replace(',', '.'))
  const price = prices?.[crypto] ?? null
  const result =
    Number.isFinite(numericAmount) && price !== null
      ? numericAmount * price
      : NaN

  const selectedCrypto = CRYPTOCURRENCIES.find((item) => item.id === crypto)
  const fiatCode = currency.toUpperCase()

  return (
    <div className="fx-currency-column">
    <section className="crypto-card" aria-live="polite">
      <div className="crypto-header">
        <div>
          <p className="crypto-kicker">Kryptovaliutos</p>
          <h2>Kriptovaliutos skaičiuoklė</h2>
          <p className="crypto-lead">
            Apskaičiuokite kriptovaliutos vertę pagal aktualią rinkos kainą.
          </p>
        </div>
        <div className="crypto-symbol" aria-hidden="true">
          ₿
        </div>
      </div>

      <div className="crypto-grid">
        <div className="crypto-field crypto-field-wide">
          <label htmlFor="crypto">Kriptovaliuta</label>
          <select
            id="crypto"
            value={crypto}
            onChange={(event) => setCrypto(event.target.value)}
          >
            {CRYPTOCURRENCIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.symbol} — {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="crypto-field">
          <label htmlFor="crypto-amount">Kiekis</label>
          <input
            id="crypto-amount"
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="crypto-field">
          <label htmlFor="crypto-currency">Valiuta</label>
          <select
            id="crypto-currency"
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
          >
            <option value="eur">EUR — Euras</option>
            <option value="usd">USD — JAV doleris</option>
            <option value="gbp">GBP — Svaras sterlingų</option>
            <option value="pln">PLN — Lenkijos zlotas</option>
          </select>
        </div>
      </div>

      <div className="crypto-result">
        <p className="crypto-result-label">
          {selectedCrypto?.symbol} → {currency.toUpperCase()}
        </p>

        {status === 'loading' && (
          <p className="crypto-result-value">Kraunama…</p>
        )}

        {status === 'error' && (
          <div className="crypto-error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={loadCryptoPrice}>
              Bandyti dar kartą
            </button>
          </div>
        )}

        {status === 'ready' && (
          <>
            <p className="crypto-result-value">
              {formatCryptoMoney(result, fiatCode)}
            </p>

            <p className="crypto-result-rate">
              1 {selectedCrypto?.symbol} = {formatCryptoMoney(price, fiatCode)}
            </p>
          </>
        )}
      </div>

      <p className="crypto-source">
        ● Kaina gaunama iš kriptovaliutų rinkos API
      </p>
    </section>

    <section className="fx-rates">
      <div className="fx-rates-head">
        <h2>Kursai {fiatCode}</h2>
        <p>
          {updatedAt
            ? `Atnaujinta ${new Date(updatedAt * 1000).toLocaleString('lt-LT')}`
            : 'Laukiama duomenų'}
        </p>
      </div>
      <ul>
        {CRYPTOCURRENCIES.map((item) => (
          <li key={item.id}>
            <span>
              {item.symbol} — {item.name}
            </span>
            <div className="fx-rate-values">
              <strong>
                {prices ? formatCryptoMoney(prices[item.id], fiatCode) : '—'}
              </strong>
              <span className="fx-rate-change">
                {formatPercent(priceChanges?.[item.id])}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
    </div>
  )
}

function App() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') === 'light' ? 'light' : 'dark'
    } catch {
      return 'dark'
    }
  })
  const [amount, setAmount] = useState('100')
  const [from, setFrom] = useState('EUR')
  const [to, setTo] = useState('PLN')
  const [eurRates, setEurRates] = useState(null)
  const [previousEurRates, setPreviousEurRates] = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  const loadRates = useCallback(async () => {
    setStatus('loading')
    setError('')
    try {
      const response = await fetch(RATES_URL)
      if (!response.ok) {
        throw new Error('Nepavyko gauti kurso')
      }
      const data = await response.json()
      setEurRates({ EUR: 1, ...data.rates })
      setUpdatedAt(data.date)
      setPreviousEurRates(null)
      try {
        const latestDate = new Date(`${data.date}T00:00:00Z`)
        const rangeStart = new Date(latestDate)
        rangeStart.setUTCDate(rangeStart.getUTCDate() - 7)
        const fromDate = rangeStart.toISOString().slice(0, 10)
        const historyResponse = await fetch(
          `https://api.frankfurter.dev/v1/${fromDate}..${data.date}?base=EUR&symbols=PLN,GBP,USD`,
        )
        if (historyResponse.ok) {
          const history = await historyResponse.json()
          const previousDates = Object.keys(history.rates ?? {})
            .filter((date) => date < data.date)
            .sort()
          const previousDate = previousDates[previousDates.length - 1]
          if (previousDate) setPreviousEurRates(history.rates[previousDate])
        }
      } catch {
        setPreviousEurRates(null)
      }
      setStatus('ready')
    } catch {
      setStatus('error')
      setError('Kursų gauti nepavyko. Patikrinkite internetą ir bandykite dar kartą.')
    }
  }, [])

  useEffect(() => {
    loadRates()
  }, [loadRates])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('theme', theme)
    } catch {
      // Keep the selected theme for this session when storage is unavailable.
    }
  }, [theme])

  const numericAmount = useMemo(() => {
    const parsed = Number(String(amount).replace(',', '.'))
    return Number.isFinite(parsed) ? parsed : NaN
  }, [amount])

  const converted = useMemo(() => {
    if (!eurRates || !Number.isFinite(numericAmount)) return NaN
    const fromRate = eurRates[from]
    const toRate = eurRates[to]
    if (!fromRate || !toRate) return NaN
    return (numericAmount / fromRate) * toRate
  }, [eurRates, from, numericAmount, to])

  const pairRate = useMemo(() => {
    if (!eurRates) return NaN
    const fromRate = eurRates[from]
    const toRate = eurRates[to]
    if (!fromRate || !toRate) return NaN
    return toRate / fromRate
  }, [eurRates, from, to])

  function swapCurrencies() {
    setFrom(to)
    setTo(from)
  }

  const fromMeta = CURRENCIES.find((item) => item.code === from)
  const toMeta = CURRENCIES.find((item) => item.code === to)

  return (
    <main className="fx">
      <div className="fx-glow" aria-hidden="true" />

      <header className="fx-header">
        <div>
          <p className="fx-kicker">Naujausi valiutų kursai</p>
          <h1>Valiutų skaičiuoklė</h1>
          <p className="fx-lead">
            Konvertuokite tarp EUR, PLN, GBP ir USD pagal naujausius skelbiamus kursus.
          </p>
        </div>
        <button
          type="button"
          className="fx-theme-toggle"
          onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
          aria-label="Perjungti šviesią ir tamsią temą"
          aria-pressed={theme === 'light'}
        >
          {theme === 'dark' ? '☀ Šviesi tema' : '☾ Tamsi tema'}
        </button>
      </header>

      <div className="fx-layout">
        <div className="fx-currency-column">
          <section className="fx-card" aria-live="polite">
            <div className="fx-field">
              <label htmlFor="amount">Suma</label>
              <input
                id="amount"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="fx-pair">
              <div className="fx-field">
                <label htmlFor="from">Iš</label>
                <select
                  id="from"
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.flag} {currency.code} — {currency.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="fx-swap"
                onClick={swapCurrencies}
                aria-label="Sukeisti valiutas"
              >
                ⇄
              </button>

              <div className="fx-field">
                <label htmlFor="to">Į</label>
                <select
                  id="to"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.flag} {currency.code} — {currency.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="fx-result">
              <p className="fx-result-label">
                {fromMeta?.flag} {from} → {toMeta?.flag} {to}
              </p>
              <p className="fx-result-value">
                {status === 'loading' ? 'Kraunama…' : formatMoney(converted, to)}
              </p>
              <p className="fx-result-rate">
                1 {from} = {formatRate(pairRate)} {to}
              </p>
            </div>

            {status === 'error' && (
              <div className="fx-error" role="alert">
                <p>{error}</p>
                <button type="button" onClick={loadRates}>
                  Bandyti dar kartą
                </button>
              </div>
            )}
          </section>

          <section className="fx-rates">
            <div className="fx-rates-head">
              <h2>Kursai nuo 1 EUR</h2>
              <p>
                {updatedAt
                  ? `Atnaujinta ${new Date(`${updatedAt}T12:00:00`).toLocaleDateString('lt-LT')}`
                  : 'Laukiama duomenų'}
              </p>
            </div>
            <ul>
              {CURRENCIES.filter((item) => item.code !== 'EUR').map((currency) => (
                <li key={currency.code}>
                  <span>
                    {currency.flag} {currency.code}
                  </span>
                  <div className="fx-rate-values">
                    <strong>
                      {eurRates ? formatRate(eurRates[currency.code]) : '—'}
                    </strong>
                    <span className="fx-rate-change">
                      {previousEurRates && eurRates
                        ? formatPercent(
                            ((eurRates[currency.code] - previousEurRates[currency.code]) /
                              previousEurRates[currency.code]) *
                              100,
                          )
                        : '—'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <CryptoCalculator />
      </div>
    </main>
  )
}

export default App
