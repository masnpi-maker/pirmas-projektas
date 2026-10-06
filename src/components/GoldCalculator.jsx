import { useEffect, useMemo, useState } from 'react'
import { goldPurities, GOLD_FALLBACK_PRICE_EUR_PER_GRAM, TROY_OUNCE_GRAMS } from '../data/goldPurities.js'
import { getGoldPrice, getGoldPriceHistory } from '../services/goldPriceService.js'
import '../GoldCalculator.css'

const BUYBACK_RATES = [1, 0.95, 0.9, 0.85, 0.8]
const HISTORY_RANGES = [
  { label: '24 val.', days: 1 },
  { label: '7 dienos', days: 7 },
  { label: '1 mėnuo', days: 30 },
  { label: '6 mėnesiai', days: 183 },
  { label: '1 metai', days: 365 },
]

function formatNumber(value, maximumFractionDigits = 2) {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('lt-LT', { maximumFractionDigits }).format(value)
}

function formatEuro(value) {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('lt-LT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function parseDecimal(value) {
  if (!value.trim()) return 0
  if (!/^-?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(value.trim())) return NaN
  return Number(value.replace(',', '.'))
}

function relativeUpdateTime(value) {
  if (!value || !Number.isFinite(Date.parse(value))) return 'laikas nežinomas'
  const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 60000))
  const unit = minutes < 60 ? 'minute' : minutes < 1440 ? 'hour' : 'day'
  const amount = unit === 'minute' ? minutes : unit === 'hour' ? Math.floor(minutes / 60) : Math.floor(minutes / 1440)
  return new Intl.RelativeTimeFormat('lt', { numeric: 'auto' }).format(-amount, unit)
}

function PuritySelector({ selected, onSelect }) {
  const current = goldPurities.find((item) => item.purity === selected)

  return (
    <section className="gold-card" aria-labelledby="purity-title">
      <div className="gold-section-heading">
        <div>
          <p className="gold-eyebrow">1 žingsnis</p>
          <h2 id="purity-title">Pasirinkite prabą</h2>
        </div>
        <span className="gold-purity-summary">
          {current.purity} praba <strong>{formatNumber(current.karat, 1)}K</strong>
          <small>{formatNumber(current.purity / 10, 1)} % gryno aukso</small>
        </span>
      </div>
      <div className="gold-purity-options" role="group" aria-label="Aukso praba">
        {goldPurities.map((item) => (
          <button
            key={item.purity}
            type="button"
            className={`gold-purity-button${selected === item.purity ? ' is-selected' : ''}`}
            aria-pressed={selected === item.purity}
            onClick={() => onSelect(item.purity)}
          >
            <strong>{item.purity}</strong>
            <span>{formatNumber(item.karat, 1)}K</span>
          </button>
        ))}
      </div>
    </section>
  )
}

function WeightInput({ value, onChange, error }) {
  return (
    <section className="gold-card" aria-labelledby="weight-title">
      <p className="gold-eyebrow">2 žingsnis</p>
      <h2 id="weight-title">Įveskite aukso svorį</h2>
      <label className="gold-label" htmlFor="gold-weight-input">Aukso svoris</label>
      <div className="gold-weight-input-wrap">
        <input
          id="gold-weight-input"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="0,00"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'gold-weight-error' : undefined}
        />
        <span aria-hidden="true">g</span>
      </div>
      {error && <p id="gold-weight-error" className="gold-validation" role="alert">{error}</p>}
      {!error && <p className="gold-help">Galite įvesti dešimtainį skaičių, pvz., 10,5.</p>}
    </section>
  )
}

function MarketPrice({ quote, troyOuncePrice }) {
  return (
    <section className="gold-card gold-market-card" id="market" aria-labelledby="market-title">
      <div className="gold-market-icon" aria-hidden="true">Au</div>
      <div className="gold-market-content">
        <p className="gold-eyebrow">999 / 24K</p>
        <h2 id="market-title">Dabartinė aukso rinkos kaina</h2>
        <strong className="gold-market-price">{formatEuro(quote.pricePerGram)}<span> /g</span></strong>
        <p className="gold-market-ounce">{formatEuro(troyOuncePrice)} / trojos oz</p>
        <p className="gold-market-updated">
          {quote.isFallback
            ? 'Atsarginė demonstracinė kaina – rinkos duomenys nepasiekiami.'
            : `NBP gryno aukso kaina, ${quote.updatedAt}. Atnaujinta ${relativeUpdateTime(`${quote.updatedAt}T12:00:00Z`)}.`}
        </p>
      </div>
      <span className={`gold-market-status${quote.isFallback ? ' is-fallback' : ''}`}>
        {quote.isFallback ? 'Demo kaina' : '● NBP duomenys'}
      </span>
    </section>
  )
}

function ResultCard({ purity, weight, marketPrice, purityPrice, marketValue, fineGoldWeight, buybackRate, onBuybackChange }) {
  const purityInfo = goldPurities.find((item) => item.purity === purity)

  return (
    <section className="gold-result-card" aria-live="polite" aria-labelledby="gold-result-title">
      <p className="gold-eyebrow">Apskaičiuota pagal dabartinę rinkos kainą</p>
      <h2 id="gold-result-title">Jūsų aukso vertė</h2>
      <p className="gold-result-total">{formatEuro(marketValue)}</p>
      <p className="gold-result-subtitle">{formatNumber(weight)} g × {formatEuro(purityPrice)} /g</p>
      <div className="gold-result-details">
        <div><span>Praba</span><strong>{purity} / {formatNumber(purityInfo.karat, 1)}K</strong></div>
        <div><span>Gryno aukso kiekis</span><strong>{formatNumber(fineGoldWeight, 3)} g</strong></div>
        <div><span>Rinkos kaina (999)</span><strong>{formatEuro(marketPrice)} /g</strong></div>
        <div><span>Pasirinktos prabos kaina</span><strong>{formatEuro(purityPrice)} /g</strong></div>
      </div>
      <p className="gold-calculation-note">Gryno aukso kiekis = svoris × praba / 1000</p>
      <div className="gold-buyback">
        <div className="gold-buyback-heading">
          <div><span>Orientacinė supirkimo vertė</span><strong>{formatEuro(marketValue * buybackRate)}</strong></div>
          <span>Koeficientas <strong>{formatNumber(buybackRate * 100, 0)}%</strong></span>
        </div>
        <BuybackRateSelector value={buybackRate} onChange={onBuybackChange} />
        <p>Tai orientacinis skaičiavimas. Faktinė supirkimo kaina priklauso nuo supirkėjo, gaminio būklės ir kitų sąlygų.</p>
      </div>
    </section>
  )
}

function BuybackRateSelector({ value, onChange }) {
  return (
    <fieldset className="gold-buyback-selector">
      <legend>Supirkimo koeficientas</legend>
      <div className="gold-buyback-options">
        {BUYBACK_RATES.map((rate) => (
          <button
            key={rate}
            type="button"
            className={`gold-buyback-button${value === rate ? ' is-selected' : ''}`}
            aria-pressed={value === rate}
            onClick={() => onChange(rate)}
          >
            {formatNumber(rate * 100, 0)}%
          </button>
        ))}
      </div>
    </fieldset>
  )
}

function PurityTable({ marketPrice }) {
  return (
    <section className="gold-card" id="purity-rates" aria-labelledby="purity-rates-title">
      <p className="gold-eyebrow">Visos prabos</p>
      <h2 id="purity-rates-title">Aukso prabų kainos</h2>
      <div className="gold-table-scroll">
        <table className="gold-purity-table">
          <thead><tr><th scope="col">Praba</th><th scope="col">Karatai</th><th scope="col">Gryno aukso dalis</th><th scope="col">Kaina /g</th></tr></thead>
          <tbody>
            {goldPurities.map((item) => (
              <tr key={item.purity}>
                <th scope="row">{item.purity}</th>
                <td>{formatNumber(item.karat, 1)}K</td>
                <td>{formatNumber(item.purity / 10, 1)}%</td>
                <td>{formatEuro(marketPrice * item.purity / 1000)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function GoldChart({ range, onRangeChange, history, status }) {
  const [hovered, setHovered] = useState(null)
  const chart = useMemo(() => {
    if (!history.length) return null
    const width = 900
    const height = 330
    const padding = { top: 22, right: 22, bottom: 42, left: 72 }
    const prices = history.map((point) => point.price)
    const low = Math.min(...prices)
    const high = Math.max(...prices)
    const spread = high - low || high * 0.02 || 1
    const min = low - spread * 0.08
    const max = high + spread * 0.08
    const points = history.map((point, index) => ({
      ...point,
      x: padding.left + index / Math.max(history.length - 1, 1) * (width - padding.left - padding.right),
      y: padding.top + (max - point.price) / (max - min) * (height - padding.top - padding.bottom),
    }))
    return { width, height, padding, min, max, points }
  }, [history])

  return (
    <section className="gold-card gold-history-card" id="history" aria-labelledby="gold-history-title">
      <div className="gold-section-heading">
        <div><p className="gold-eyebrow">Rinkos duomenys</p><h2 id="gold-history-title">Aukso kainos istorija</h2></div>
        <span className="gold-chart-unit">EUR / g</span>
      </div>
      <div className="gold-chart-ranges" role="group" aria-label="Grafiko laikotarpis">
        {HISTORY_RANGES.map((item) => (
          <button
            key={item.days}
            type="button"
            className={`gold-range-button${range === item.days ? ' is-selected' : ''}`}
            aria-pressed={range === item.days}
            onClick={() => {
              setHovered(null)
              onRangeChange(item.days)
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      {status === 'loading' && <p className="gold-chart-message">Kraunama aukso kainų istorija…</p>}
      {status === 'error' && <p className="gold-chart-message" role="alert">Rinkos istorijos duomenys laikinai nepasiekiami.</p>}
      {status === 'ready' && chart && (
        <div className="gold-chart-wrap">
          {hovered && <div className="gold-tooltip" role="status">{new Date(hovered.timestamp).toLocaleDateString('lt-LT')} · {formatEuro(hovered.price)} /g</div>}
          <svg className="gold-chart" viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-label="Gryno aukso kainos istorija eurais už gramą">
            {[0, 0.5, 1].map((fraction) => {
              const y = chart.padding.top + fraction * (chart.height - chart.padding.top - chart.padding.bottom)
              const value = chart.max - fraction * (chart.max - chart.min)
              return <g key={fraction}><line x1={chart.padding.left} x2={chart.width - chart.padding.right} y1={y} y2={y} className="gold-gridline" /><text x={chart.padding.left - 10} y={y + 4} textAnchor="end" className="gold-axis-label">{formatNumber(value)}</text></g>
            })}
            <polyline points={chart.points.map((point) => `${point.x},${point.y}`).join(' ')} className="gold-chart-line" />
            {chart.points.map((point, index) => <circle key={`${point.timestamp}-${index}`} cx={point.x} cy={point.y} r={hovered === point ? 6 : 3} className="gold-chart-point" tabIndex="0" aria-label={`${new Date(point.timestamp).toLocaleDateString('lt-LT')}: ${formatEuro(point.price)} už gramą`} onMouseEnter={() => setHovered(point)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(point)} onBlur={() => setHovered(null)}><title>{new Date(point.timestamp).toLocaleDateString('lt-LT')}: {formatEuro(point.price)} /g</title></circle>)}
            <text x={chart.padding.left} y={chart.height - 10} className="gold-axis-label">{new Date(history[0].timestamp).toLocaleDateString('lt-LT')}</text>
            <text x={chart.width - chart.padding.right} y={chart.height - 10} textAnchor="end" className="gold-axis-label">{new Date(history[history.length - 1].timestamp).toLocaleDateString('lt-LT')}</text>
          </svg>
        </div>
      )}
      <p className="gold-chart-footnote">Istoriniai duomenys – NBP dienos aukso kainos, perskaičiuotos į EUR. 24 val. laikotarpiui rodomi paskutiniai prieinami dienos įrašai.</p>
    </section>
  )
}

export default function GoldCalculator() {
  const [purity, setPurity] = useState(585)
  const [weightInput, setWeightInput] = useState('')
  const [buybackRate, setBuybackRate] = useState(0.9)
  const [quote, setQuote] = useState({
    pricePerGram: GOLD_FALLBACK_PRICE_EUR_PER_GRAM,
    updatedAt: null,
    source: 'fallback',
    isFallback: true,
  })
  const [quoteStatus, setQuoteStatus] = useState('loading')
  const [range, setRange] = useState(7)
  const [history, setHistory] = useState([])
  const [historyStatus, setHistoryStatus] = useState('loading')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const previousTitle = document.title
    const description = document.querySelector('meta[name="description"]')
    const previousDescription = description?.content
    document.title = 'Aukso skaičiuoklė – aukso vertė pagal prabą ir svorį'
    description?.setAttribute('content', 'Apskaičiuokite aukso vertę pagal prabą, svorį ir dabartinę aukso rinkos kainą.')
    return () => {
      document.title = previousTitle
      if (description && previousDescription) description.setAttribute('content', previousDescription)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    const loadQuote = async () => {
      setQuoteStatus('loading')
      try {
        const nextQuote = await getGoldPrice(controller.signal)
        if (!active) return
        setQuote(nextQuote)
        setQuoteStatus('ready')
      } catch {
        if (!active) return
        setQuote({
          pricePerGram: GOLD_FALLBACK_PRICE_EUR_PER_GRAM,
          updatedAt: null,
          source: 'fallback',
          isFallback: true,
        })
        setQuoteStatus('fallback')
      }
    }
    loadQuote()
    const timer = window.setInterval(loadQuote, 5 * 60 * 1000)
    return () => {
      active = false
      window.clearInterval(timer)
      controller.abort()
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    getGoldPriceHistory(range, controller.signal)
      .then((data) => {
        if (!active) return
        if (!data.length) throw new Error('Istorinių duomenų nėra.')
        setHistory(data)
        setHistoryStatus('ready')
      })
      .catch(() => {
        if (!active) return
        setHistory([])
        setHistoryStatus('error')
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [range])

  const selectedPurity = goldPurities.find((item) => item.purity === purity) ?? goldPurities[2]
  const parsedWeight = parseDecimal(weightInput)
  const weightError = Number.isNaN(parsedWeight)
    ? 'Įveskite tinkamą svorį gramais.'
    : parsedWeight < 0
      ? 'Svoris negali būti neigiamas.'
      : ''
  const weight = weightError ? 0 : parsedWeight
  const purityPrice = quote.pricePerGram * selectedPurity.purity / 1000
  const marketValue = Math.round((weight * purityPrice + Number.EPSILON) * 100) / 100
  const fineGoldWeight = weight * selectedPurity.purity / 1000
  const troyOuncePrice = quote.pricePerGram * TROY_OUNCE_GRAMS

  function changeHistoryRange(nextRange) {
    setHistory([])
    setHistoryStatus('loading')
    setRange(nextRange)
  }

  return (
    <main className="gold-app" id="top">
      <header className="gold-header">
        <a className="gold-brand" href="#top" aria-label="Aukso skaičiuoklė – pradžia"><span>Au</span> AUKSO SKAIČIUOKLĖ</a>
        <button className="gold-menu-toggle" type="button" aria-label={menuOpen ? 'Uždaryti navigaciją' : 'Atidaryti navigaciją'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? '×' : '☰'}</button>
        <nav className={`gold-nav${menuOpen ? ' is-open' : ''}`} aria-label="Pagrindinė navigacija">
          <a href="#top" onClick={() => setMenuOpen(false)}>Pradžia</a>
          <a href="#calculator" onClick={() => setMenuOpen(false)}>Skaičiuoklė</a>
          <a href="#market" onClick={() => setMenuOpen(false)}>Rinkos kaina</a>
          <a href="#history" onClick={() => setMenuOpen(false)}>Kainų istorija</a>
        </nav>
        <div className="gold-header-price" aria-live="polite">
          <span className="gold-live-label"><i /> RINKOS KAINA</span>
          <strong>{formatEuro(quote.pricePerGram)} <small>/g</small></strong>
          <span className="gold-header-updated">{quote.isFallback ? 'Atsarginė demonstracinė kaina' : `Atnaujinta: ${relativeUpdateTime(`${quote.updatedAt}T12:00:00Z`)}`}</span>
        </div>
      </header>

      <div className="gold-main-content">
        <section className="gold-hero">
          <p className="gold-eyebrow">Paprasta. Aišku. Tikslu.</p>
          <h1>Kiek vertas mano <em>auksas?</em></h1>
          <p>Pasirinkite aukso prabą, įveskite svorį ir akimirksniu apskaičiuokite orientacinę aukso vertę pagal dabartinę rinkos kainą.</p>
        </section>

        {quoteStatus === 'fallback' && (
          <p className="gold-data-notice" role="status">
            Rinkos kainos nepavyko gauti. Skaičiavimams naudojama atsarginė demonstracinė reikšmė {formatEuro(GOLD_FALLBACK_PRICE_EUR_PER_GRAM)} /g, ji nėra realaus laiko kursas.
          </p>
        )}
        {quoteStatus === 'loading' && quote.isFallback && <p className="gold-data-notice" role="status">Gaunami naujausi rinkos duomenys. Kol kas rodoma demonstracinė atsarginė kaina.</p>}

        <div className="gold-calculator-grid" id="calculator">
          <div className="gold-input-column">
            <PuritySelector selected={purity} onSelect={setPurity} />
            <WeightInput value={weightInput} onChange={setWeightInput} error={weightError} />
          </div>
          <ResultCard
            purity={purity}
            weight={weight}
            marketPrice={quote.pricePerGram}
            purityPrice={purityPrice}
            marketValue={marketValue}
            fineGoldWeight={fineGoldWeight}
            buybackRate={buybackRate}
            onBuybackChange={setBuybackRate}
          />
        </div>

        <div className="gold-secondary-grid">
          <MarketPrice quote={quote} troyOuncePrice={troyOuncePrice} />
          <div className="gold-note-card"><span className="gold-note-icon" aria-hidden="true">i</span><p>Kaina paremta NBP skelbiama gryno aukso dienos kaina. Tai orientacinė vertė, o ne supirkėjo pasiūlymas.</p></div>
        </div>

        <PurityTable marketPrice={quote.pricePerGram} />
        <GoldChart range={range} onRangeChange={changeHistoryRange} history={history} status={historyStatus} />
      </div>
      <footer className="gold-footer">Aukso skaičiuoklė <span>·</span> Orientaciniai skaičiavimai pagal viešai skelbiamus duomenis.</footer>
    </main>
  )
}
