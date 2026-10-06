const NBP_API = 'https://api.nbp.pl/api'
const NBP_GOLD_URL = `${NBP_API}/cenyzlota`

async function fetchJson(url, signal) {
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Duomenų užklausa nepavyko (${response.status}).`)
  return response.json()
}

async function getEurPlnRate(date, signal) {
  const data = await fetchJson(
    `${NBP_API}/exchangerates/rates/a/eur/${date}/?format=json`,
    signal,
  )
  const rate = data?.rates?.[0]?.mid
  if (!Number.isFinite(rate) || rate <= 0) throw new Error('EUR/PLN kursas negautas.')
  return rate
}

export async function getGoldPrice(signal) {
  const gold = await fetchJson(`${NBP_GOLD_URL}/?format=json`, signal)
  const latest = gold?.[0]
  if (!latest || !Number.isFinite(latest.cena)) throw new Error('Aukso kaina negauta.')
  const eurPln = await getEurPlnRate(latest.data, signal)

  return {
    pricePerGram: latest.cena / eurPln,
    updatedAt: latest.data,
    source: 'NBP',
    isFallback: false,
  }
}

export async function getGoldPriceHistory(days, signal) {
  const requestedDays = days <= 1 ? 7 : days
  const end = new Date()
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - requestedDays)

  const formatDate = (date) => date.toISOString().slice(0, 10)
  const ranges = []
  let rangeStart = new Date(start)

  while (rangeStart <= end) {
    const rangeEnd = new Date(rangeStart)
    rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 89)
    if (rangeEnd > end) rangeEnd.setTime(end.getTime())
    ranges.push([formatDate(rangeStart), formatDate(rangeEnd)])
    rangeStart = new Date(rangeEnd)
    rangeStart.setUTCDate(rangeStart.getUTCDate() + 1)
  }

  const batches = await Promise.all(ranges.map(async ([from, to]) => {
    const [goldResponse, fxResponse] = await Promise.all([
      fetchJson(`${NBP_GOLD_URL}/${from}/${to}/?format=json`, signal),
      fetchJson(`${NBP_API}/exchangerates/rates/a/eur/${from}/${to}/?format=json`, signal),
    ])

    const fxByDate = new Map((fxResponse.rates ?? []).map((rate) => [rate.effectiveDate, rate.mid]))
    return (goldResponse ?? [])
      .map((point) => {
        const eurPln = fxByDate.get(point.data)
        return {
          date: point.data,
          timestamp: Date.parse(`${point.data}T12:00:00Z`),
          price: Number.isFinite(eurPln) && eurPln > 0 ? point.cena / eurPln : NaN,
        }
      })
      .filter((point) => Number.isFinite(point.price))
  }))

  const history = batches.flat().sort((left, right) => left.timestamp - right.timestamp)
  if (days <= 1) return history.slice(-2)
  return history
}
