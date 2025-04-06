Below is a structured “decision workbook” you can keep beside you while scoping **CreatorClaim**. Each section starts with the practical choice you need to make, followed by the reasoning, pitfalls to avoid, and a next‑step checklist.

---

## 1  — Choose the **first‑wave content types**

| Launch now (low legal drag) | Launch later (complex rights) |
|-----------------------------|-------------------------------|
| **Stock photography & digital illustration** – creators usually control 100 % of rights themselves. | Full‑length released music, film, TV clips – publisher/PRO clearances and sync rights multiply stakeholders. |
| **Original design assets** (icons, Figma/PSD templates, fonts). | User‑generated video or fan remixes – copyright + performer rights + privacy issues. |
| **Written works** (blog posts, documentation, short fiction). | AI‑generated works that copy stylistic elements – unsettled copyright status in many jurisdictions. |
| **Royalty‑free music loops / sample packs** – can be pre‑cleared with simple “one‑shot” licence. | Celebrity likeness or brand IP – requires right‑of‑publicity sign‑off. |

**Why start here?**

* Rights chain is short – usually just the creator.
* Lawyers don’t need to vet every transaction.
* DMCA takedown risk is relatively low if you verify the uploader’s identity.

---

## 2  — Licence templates to encode on‑chain

| Template name | Typical use | Key fields to parameterise |
|---------------|-------------|----------------------------|
| **Standard Non‑Exclusive Commercial** | Stock image in a blog, sample pack in a YouTube beat. | Worldwide, perpetual, rev‑share = 0, resale not allowed. |
| **Editorial‑Only** | News outlet illustration, textbook photo. | Territory = “Global (Editorial)”, duration = perpetual, no advertising use. |
| **Exclusive Buy‑Out** | Corporate re‑brand, film score. | Term = 10 y renewable, creator retains moral rights, sublicensing allowed. |
| **Limited Duration / Region** | Campaign jingle in LATAM for 6 months. | Territory = “LATAM”, term = 180 days, rev‑share % creator chooses. |

Store them as JSON objects in program state; hash → metadata URI → on‑chain so licence text can evolve while the hash stays immutable.

---

## 3  — Public NFT **vs.** Permissioned Asset

| Decision axis | Public NFT / cNFT | Permissioned token (token‑2022 w/ Transfer‑Hook) |
|---------------|-------------------|--------------------------------------------------|
| **Discoverability** | Open marketplaces, social virality, instant resale. | Only visible to whitelisted wallets, good for pre‑release music. |
| **Regulatory profile** | Looks like a collectible; low KYC needed if only fiat‑in / royalty‑out. | Treated more like a security if transfer restricted → heavier CDD. |
| **Artist comfort** | Visual artists & indie musicians like the open promo effect. | Labels & publishers prefer controlled circulation. |
| **Cost on Solana** | Compressed NFTs: ≈ 0.000005 SOL per mint citeturn1search1 | Same mint cost, but you pay CU for transfer‑hook enforcement. |

**Hybrid path:** Certificate is a public cNFT *and* it points to a permissioned Licence PDA that only unlocks the high‑res file when the licence is purchased.

---

## 4  — Royalty‑split data model

```rust
// inside Certificate account
pub struct RoyaltySplit {
    pub beneficiary: Pubkey,
    pub share_bps: u16, // 10_000 = 100 %
}
// Vec<RoyaltySplit> must sum to 10_000 at mint time
```

**Examples**

* Solo creator → `[ {Alice, 10 000} ]`
* Three‑piece band, equal → `[ {A, 3334}, {B, 3333}, {C, 3333} ]`
* Label deal (70/30) → `[ {Artist, 7000}, {Label, 3000} ]`

Add an optional `recoup_cap` field for advances: the label gets 100 % until they’ve recovered X USDC, then split reverts to agreed percentages.

---

## 5  — Cash‑out jurisdictions & compliance hooks

| Region you support | Why start here | Compliance check‑list |
|--------------------|---------------|-----------------------|
| **U S A** | Biggest creator market; PayPal/ACH rails. | FinCEN MSB registration, 1099‑K ≥ $2 500 per year (soon $600) citeturn0search5 |
| **EU/EEA + UK** | SEPA Instant, Revolut, Wise. | DAC7 platform reporting (first file due Jan 31 2025) citeturn0search0; MiCA stablecoin rules for USDC in 2024‑25 citeturn0search6; VAT on digital services. |
| **Canada** | Interac e‑Transfer; creators big on stock imagery. | FINTRAC MSB registration; GST/HST digital supplies. |
| **Australia** | PayID, Stripe. | AUSTRAC remittance provider licence; GST on digital. |
| **Singapore** | Strong creator hub, clear crypto regs. | PSA licence, Travel Rule compliance citeturn0search7. |
| **Nigeria (creator home market)** | Naira <> USDC liquidity improving. | CBN VASP guidelines 2024; local VAT 7.5 %. |

*Add others only after banking partners confirm payouts; each extra country means another sanctions‑screening list and possible withholding‑tax rule.*

---

## 6  — Key clauses for your Terms of Service

1. **On‑chain licence = binding contract**
   “By signing the transaction that mints or purchases a Certificate, the Creator and Licensee agree to the Licence Terms linked in the certificate metadata hash.”

2. **Chain‑of‑title warranty**
   Creator guarantees they own (or have secured) all rights; they indemnify Platform against third‑party claims.

3. **DMCA / Notice‑and‑Takedown**
   Off‑chain gateway link can be disabled while the NFT stays on‑chain; Licence PDA can be frozen pending dispute.

4. **Governing law & dispute resolution**
   Delaware law + JAMS arbitration (or your jurisdiction of choice). Include class‑action waiver.

5. **Payment agent language**
   Platform acts as limited agent to collect licence fees and remit on‑chain royalties—crucial for escrow protections.

6. **KYC / sanctions screening acceptance**
   Users agree to provide ID and that payouts may be withheld if they fail checks.

7. **Limitation of liability**
   Cap at the greater of $100 or total fees paid in last 12 months.

8. **Smart‑contract risk disclaimer**
   “Transactions are irreversible; bugs or network outages may delay or prevent royalties.”

*Ship ToS as Markdown, store SHA‑256 hash on Solana so each new version is provably timestamped.*

---

### Next steps

* Prototype one licence template end‑to‑end on Devnet.
* Run three real payout flows (solo artist, band, label) and generate 1099‑K / DAC7 test reports.
* Hand this workbook to legal counsel for jurisdiction‑specific tweaks, then start onboarding friendly beta artists.

This roadmap keeps you legally tidy, technically sound, and focused on the content verticals that let **CreatorClaim** deliver quick wins without weekly lawyer calls.