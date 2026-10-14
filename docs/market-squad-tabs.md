# Market Squad tabs

As of the Monday 12 October 2026 US cash close. Prices, ranges, analyst counts, EPS estimates, institutional ownership, and short interest are Yahoo Finance prints. Each tab also has a **Description** control on the page with the same column definitions.

The ten names on Research, Fund Flows, Earnings, and Macro are AMD, PLTR, MU, AVGO, GEV, COF, TER, STX, WDC, and APP. Switching the fund keeps these ten on those four tabs. Digital Assets is a separate sample screen.

## 1. Research & Alpha

**Question it answers.** Which of these ten names rank higher on a simple blend of recent price trend, recent EPS-estimate changes, and the buy/hold/sell mix, as of the 12 Oct close.

**Score.** Kept between 0 and 1:

`0.50 + 0.20 × momentum + 0.15 × revisions + 0.15 × sentiment`

- Momentum starts as the price change over 21 sessions (last close divided by the close 21 sessions earlier, minus 1). That return is doubled and then capped at ±1.
- Revisions starts as the percent change in the current-quarter EPS estimate versus seven days earlier. That percent is multiplied by 10 and capped at ±1.
- Sentiment is `(buys − sells) / (buys + holds + sells)` from the latest analyst-recommendation mix. Strong buy counts with buy. Strong sell counts with sell.

**Columns**

| Column | Meaning |
|---|---|
| Rank | 1 is the highest score in this set of ten. |
| Score | Green at 0.60 and above, neutral between 0.40 and 0.60, red at 0.40 and below. |
| Quality | `50 + 25 × momentum + 15 × sentiment`, shown as a whole number from 5 to 99. It follows the price trend and the analyst mix. It is not a reported profit margin or ROE. |
| Momentum | Arrow for the raw 21-session return. ↑↑ above +8%, ↑ above +2%, flat inside ±2%, ↓ below −2%, ↓↓ below −8%. |
| Revisions | Upward EPS revisions in the last 7 days minus downward ones, current quarter. |
| Sentiment | `pos` when (buys − sells) is more than 15% of the analyst count, `neg` when below −15%, otherwise `neutral`. |
| 1d range | Low to high of the 12 Oct session. |
| 5d range | Low to high of the last five sessions. |
| Thesis fit | `strong` at score ≥ 0.70, `fit` at ≥ 0.55, `hold` at ≥ 0.40, `short` below 0.40. Every name in this set is `fit`. |

**Memo above the table**

- Call: BUY at score ≥ 0.65, ACCUMULATE at ≥ 0.55, HOLD at ≥ 0.45, AVOID below that.
- Last is the 12 Oct close. Target is the mean analyst target. Upside is that target versus the close.
- Thesis is one of three labels: “momentum + consensus up” when the 21-session gain is above 5%, “revisions turning up” when the EPS estimate rose, otherwise “quality defensive”.
- Next catalyst is the next earnings date from Yahoo’s calendar, plus how many days away. It is the earnings date, not a headline.

**Factor bars under the memo.** Momentum counts how many of the ten have a 21-session move above +2% or below −2%. Revisions counts names with more up revisions than down. Sentiment counts names whose buys are more than twice the sells. The Quality bar is a fixed “mixed” label; it is not a fifth calculated factor.

**Card under the table (“AI explanation”).** That write-up is an earlier Palantir note (score 0.85, margin, ROE, beta). It is not recomputed from the ten-name score above. Use the memo and the table for this set.

## 2. Fund Flows & Positioning

**Question it answers.** For the same ten names, how widely held the stock is, how large the short is, and whether that combination looks crowded.

**The map.** One bar, scored 0 to 100 from left to right. The word above each stretch is the range of scores that stretch covers:

| Stretch | Scores |
|---|---|
| Lonely | 0–54 |
| Balanced | 55–69 |
| Busy | 70–84 |
| Crowded | 85–100 |

A dot marks each name’s score. The ticker and the score are listed under the stretch they fall in. On 12 Oct nobody in this set is below 62, so Lonely is empty.

**Crowding score**

`20 + 0.60 × institutional % + 1.20 × short % of float`

Rounded, and kept between 0 and 99. Institutional percent and short percent of float come from Yahoo key statistics. The short-interest print in force on 12 Oct is the 30 September FINRA report.

**Columns**

| Column | Meaning |
|---|---|
| Crowding | The score above. Orange when the score is 80 or higher. |
| Inst. % | Percent of the company reported as held by institutions. A print above 100% can appear when the vendor’s float and reported shares do not match. TER prints 101.0% for that reason. |
| 13F Δ · 30 Jun | On this ten-name table the cell is insider ownership, in points. It is not a holder’s change from the prior quarter. The latest 13F quarter still on file is 30 June 2026. |
| Short % · 30 Sep | Short interest as a percent of float. |
| Put−call skew | A label from the 21-session price change, not an options implied-volatility spread. Gain above +5% is `call-skew`. Loss below −5% is `put-skew`. Otherwise `flat`. |
| Flag | OK below 70, watch from 70 through 84, crowded at 85 and above. TER 88 is crowded. WDC 80 is watch, and the score is orange because it is at least 80. |

**Fade / Follow under the map.** Fade lists scores of 80 or more (do not add). Follow lists names with institutional ownership under 80% and a 21-session gain above 5%.

**Two cards under the crowding table.** These are an earlier, wider pull, not the ten names above.

- **13F divergence vs research.** The holder with the largest ownership-point change in the top holders, using the 30 June 2026 13F. Ownership-point change is the holder’s percent of the company times their share-count change, adjusted so a percent change in shares becomes a change in ownership points. Aligned means a holder cut a research short or added a research long. Counter means they did the opposite. The names on the Alpha card (FLNC, MOS, CABO, GPRO, OLN, METCB) come from that wider book.
- **Sector tape · 5 sessions to 12 Oct.** Price change of the ETF from the close five sessions earlier to the 12 Oct close. The bar width is that move relative to the largest move on the card. It is the price change, not ETF creation or redemption dollars. Alpha shows SPY +0.4%, QQQ −1.3%, SMH −6.8%, IWM −1.9%, XLE +4.0%, XLK −2.3%, IBIT −3.5%, ETHA −7.1%.

## 3. Earnings & Sentiment

**Question it answers.** When each of the ten names next reports, what the street expects, and how the last reported quarter compared with the estimate.

**Where the figures come from.** Yahoo earnings calendar, earnings history (actual and estimate), and the seven-day change in the EPS trend. A date marked “est” is one Yahoo flagged as estimated.

**Playbook at the top**

- EPS and revenue are the consensus for the next report.
- “Last Q” on the row is the prior surprise percent.
- Plan: long into the print when revisions are net up and the last quarter beat by more than 2%; hedge when the last surprise was worse than −5%; tilt long on net upgrades; flat on net downgrades; otherwise no position.

**Upcoming prints**

| Column | Meaning |
|---|---|
| When | Next earnings date. |
| Cons. EPS / Cons. Rev | Consensus for that report. |
| Impl. move | ±3.0% on every row. This is a fixed placeholder, not an options-implied move. |
| Point view | Net upgrades or downgrades in 7 days, or the next-year EPS estimate change when there is no rating change. |

**Recent prints**

| Column | Meaning |
|---|---|
| Qtr end | Quarter date from the earnings history. |
| EPS A/E | Actual versus estimate. |
| Surprise | (actual − estimate) / absolute value of the estimate. |
| Max 1d post | Largest one-day price change in the 45 calendar days after that quarter end, from the daily bars on hand. |
| Tone | Surprise percent doubled, then kept between −1 and +1. It comes from the beat or miss. It is not read off a transcript. |
| Read-across | A label from the surprise size: beat and guide raised above +5%, in-line beat from 0 to +5%, miss and guide pressure down to −5%, miss and guide-cut risk below that. |

Rows are dropped when the estimate is under $0.10 or the surprise is beyond 100%, so a tiny denominator cannot dominate the sort.

**Phrases card.** The hedging number is chosen from the surprise bucket: 0.14, 0.19, 0.32, or 0.46. The quoted phrases and the “×8” counts are the stock phrase for that bucket. They are not counts from a call transcript.

**Revisions card**

| Column | Meaning |
|---|---|
| FY26 Δ | Percent change in the current-quarter EPS estimate versus 7 days ago. |
| FY27 Δ | Same, for the next fiscal year. |
| Tgt price | Mean analyst target minus the 12 Oct close, in dollars. |
| # rev | Up revisions plus down revisions in the last 7 days. |
| Signal | Positive above +0.005, negative below −0.005, otherwise mixed. The score is the current-quarter revision percent, plus half the next-year revision percent, plus 0.03 times (upgrades − downgrades). |

**Social sentiment card.** Sample bars for NVDA, TSLA, META, COIN, and AMD. Those percents are not computed from the ten-name Yahoo pull.

## 4. Macro & Regime

**Question it answers.** How these ten names have moved with rates, the dollar, oil, and equity volatility, and what a simple shock does to a $1 million position in each.

**Beta.** Slope of the stock’s daily percent change on the factor’s daily percent change, using the daily bars through 12 Oct (about three months). A positive beta means the stock rose on days that factor rose.

| Column | Factor | Yahoo series |
|---|---|---|
| β 10Y | 10-year yield index | ^TNX |
| β DXY | US dollar index | DX-Y.NYB |
| β WTI | Crude futures | CL=F |
| β VIX | Equity volatility | ^VIX |

The 10-year beta is versus the percent change of the yield index. It is not “basis points of stock per basis point of yield.”

**Hot-CPI PnL**, for a $1M position:

`(β10Y × 0.50 + βDXY × 1 + βVIX × 5) × $1,000,000`

The card names that shock “10Y +50bp · DXY +1% · VIX +5pt”. The arithmetic uses 0.50, 1, and 5 directly as multipliers on the betas.

**Scenario PnL.** The same multiplication, summed across all ten names at $1M each.

| Scenario | Multipliers used |
|---|---|
| Base case | all shocks 0, then add $500,000 |
| Hot CPI | 10Y 0.50, DXY 1, VIX 5 |
| Cold CPI | 10Y −0.30, DXY −0.50, VIX −3 |
| Fed +25 surprise | 10Y 0.25, DXY 0.80, VIX 2 |
| 10Y +50 bp pure | 10Y 0.50 |
| Risk-off | 10Y −0.10, DXY 2, WTI −10, VIX 10 |

Read the dollars as this model’s own scale.

**Regime light.** Risk-on when the 12 Oct VIX close is under 20, neutral from 20 to 28, risk-off above 28.

**Tiles.** 10Y, DXY, WTI, and VIX are the last daily close in the three-month window, with the change versus about 21 sessions earlier.

**Yield curve.** The 10-year point is the ^TNX close. The 3-month 4.68%, 2-year 4.42%, 5-year 4.14%, and 30-year 4.72% are fixed reference levels in the file.

**Calendar.** A typed list: bank prints 13 Oct, ECB speech 14 Oct, FOMC minutes and UK CPI 15 Oct, BOJ minutes and China GDP 16 Oct, Fed Chair and housing starts 20 Oct, FOMC decision 28 Oct. It is not a live calendar feed.

**Who wins / loses.** Rates-up winners are names with a positive 10-year beta. Rates-up losers are names with a 10-year beta below −0.30. Dollar-up winners are names with a dollar beta above 0.50. Dollar-up losers are names with a dollar beta below −0.30.

## 5. Digital Assets

**Question it is drawn to answer.** How a tokenized stock sits versus its primary listing over a weekend, and how a bitcoin move would hit a small crypto sleeve.

**These figures are sample numbers written into the page.** They were not pulled from an exchange for the 12 Oct close.

| Block | What the sample is showing |
|---|---|
| BTC, ETH, funding, open interest | Sample level, 24-hour change, 8-hour funding, and open interest. |
| Tokenized equities | Token last, a listed cash close, basis = (token − listing) / listing, sample depth within 10 basis points, and a sample signal. |
| Weekend chart | An illustration of a 24/7 token price against a closed listing, labeled illustrative. |
| Crypto bridge | Sample position size, a sample bitcoin beta, and a sample 24-hour dollar impact. The rows change with the fund: Alpha shows COIN, MSTR, HOOD, CLSK; Digital shows BTC, ETH, MSTR, COIN, CLSK; Global and Neutral show monitoring rows. |

The other four tabs do not use this sample book. They stay on the ten names above.
