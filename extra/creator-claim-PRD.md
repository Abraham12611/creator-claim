# Product‑Requirements Document (PRD)
**Project:** CreatorClaim – Real‑Time Licensing & Royalty Platform
**Version:** Draft 0.9 (2025‑04‑19)
**Author:** Abraham Dahunsi

---

## 1 — Executive Summary
CreatorClaim lets creators mint verifiable **digital certificates** for their work, sell/licence those works through smart‑contract templates, and receive split royalties the moment a buyer pays. The MVP targets photography, design assets, and short music loops—content with the simplest rights chain—while establishing rails that can extend to film, long‑form music, and AI‑generated content later.

---

## 2 — Goals & Success Metrics

| Goal | KPI (MVP) | Stretch (12 mo) |
|------|-----------|-----------------|
| **Instant, verifiable payouts** | 90 % royalties settled < 15 s after purchase | 99 % < 5 s |
| **Lower creator fees vs. incumbents** | Platform fee ≤ 8 % per licence | ≤ 5 % |
| **Accurate royalty attribution** | < 0.5 % unmatched payments | < 0.1 % |
| **Creator adoption** | 500 active creators by Q4 2025 | 5 000 by Q2 2026 |
| **Buyer NPS** | ≥ 60 | ≥ 75 |

---

## 3 — Non‑Goals (MVP)

* Full‑length commercial music licensing (complex PRO & publisher splits).
* AI infringement detection; handled by partner APIs in v2.
* Fiat ↔ USDC on‑ramp; we use third‑party providers during MVP.

---

## 4 — Personas & User Stories

| Persona | Key Story |
|---------|-----------|
| **Indie Photographer** | “I want proof my photo is mine and to get paid instantly when bloggers license it.” |
| **Design‑Agency Buyer** | “I need clean commercial rights for an icon set without waiting for legal paperwork.” |
| **Co‑Artist Duo** | “We split 70/30—please route that automatically so we don’t chase each other.” |

---

## 5 — Functional Requirements

### 5.1  Creator‑Side
- Upload asset (≤ 100 MB) + metadata → system pins to IPFS/Arweave.
- Choose a licence template & price.
- Define royalty splits (1‑10 recipients, total = 100 %).
- Sign *MintCertificate* txn (wallet or custodial).
- View real‑time earnings dashboard; withdraw USDC.

### 5.2  Buyer‑Side
- Browse/search listings (public cNFT index).
- Authenticate (wallet or email + custodial).
- View licence text & price.
- Pay with USDC; receive download link & licence token.
- Export licence proof (PDF containing tx hash).

### 5.3  Admin / Ops
- Suspend certificate if DMCA notice validated.
- Blacklist wallet or IP.
- Generate DAC‑7 / 1099‑K reports.

---

## 6 — Non‑Functional Requirements
* **Latency:** p95 end‑to‑end < 1 s for purchase acknowledgement.
* **Throughput:** 100 tx/s burst (Solana mainnet headroom).
* **Availability:** API uptime ≥ 99.5 %.
* **GDPR:** erase PII on request; on‑chain data immutable but pseudonymous.
* **Security:** audited smart contracts, multisig upgrade authority.

---

## 7 — On‑Chain Architecture

### 7.1  Core Accounts

| Account | Seeds | Size | Immutable | Description |
|---------|-------|------|-----------|-------------|
| `Certificate` | `"creatorclaim", mint_pk` | ≤ 600 B | Yes | Stores metadata hash, royalty array, licence template ID. |
| `Licence` | `mint_pk, buyer_pk` | ≤ 128 B | Revocable flag | Records purchase price, expiry, rights. |
| `RoyaltyRouter` (token‑2022 ext.) | token mint | — | Upgradable | Splits USDC transfer per bps array. |
| `Treasury` | `"treasury"` | 64 B | No | Accumulates platform fees. |
| `UpgradeAuthMultisig` | SPL multisig | — | — | Holds upgrade/freeze authority. |

### 7.2  Instruction Set

| Ix | Accounts | Happy Path | Failure Cases |
|----|----------|-----------|---------------|
| **MintCertificate** | Creator, Tree, Certificate PDA | Emits `NewCertificate` | *InvalidRoyaltySum*, *TooManyRecipients*, *TreeCapacity* |
| **PurchaseLicence** | Buyer, Escrow, Licence PDA, Certificate, Router | Funds escrow ► Router splits ► Licence minted | *ExpiredTemplate*, *InsufficientFunds*, *SplitMismatch* |
| **RevokeLicence** | Creator or Admin, Licence | Sets `revoked=true`; refunds buyer optional | *NotAuthorised*, *LicenceNotFound* |
| **WithdrawFees** | Treasury, Admin | Transfers fees to ops wallet | *ZeroBalance*, *AuthFail* |

---

## 8 — Interaction Flow (Sequence)

```text
Creator Browser             API            Solana         RoyaltyRouter
     |                         |                |                |
1. Upload & metadata  ───────► |                |                |
2. /certificates POST         ├─► MintCertificate ix ───────────┤
3. 200 OK + txSig             ◄─┤                |                |
4. List appears               |                |                |
Buyer Wallet                  |                |                |
5. select licence             |                |                |
6. /licences POST             ├─► PurchaseLicence ix ───────────► Splits USDC
7. WebSocket 'paid'           ◄─┤                                |
8. Download asset             |                |                |
```

---

## 9 — Success vs. Failure Cases

| Action | Success Criteria | Failure Handling |
|--------|-----------------|------------------|
| Upload asset | IPFS hash stored; tx confirmed | Retry 3×; alert if pinning fails |
| Purchase licence | All royalty accounts credited; Licence PDA exists | Roll back escrow via `CloseAccount` CPI; surface error code to UI |
| Royalty withdrawal | Transfer confirmed within 2 blocks | If Solana outage > 1 min, queue in Postgres and retry |

---

## 10 — Open Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Token‑2022 still beta** | Royalty router bug could lock funds | Audited wrapper; escape hatch to transfer fees manually |
| **Creator uploads infringing work** | Legal takedown, reputation | KYC each creator; fast DMCA flow; escrow retains 14‑day buffer |
| **High CU spikes** | Tx failures for buyers | Benchmark; add address‑lookup tables; recommend priority fees |

---

## 11 — Milestones

| Date | Deliverable |
|------|-------------|
| **May 15 2025** | Program scaffolds compile; local tests green |
| **Jun 15 2025** | Devnet MVP; upload & purchase happy path |
| **Jul 30 2025** | Audit complete; mainnet beta soft‑launch |
| **Sep 2025** | EU/US payout rails; 500 creators onboarded |

---

## 12 — Appendices

### 12.1  Licence Templates (IDs)

| ID | Name | Notes |
|----|------|-------|
| `0x01` | Standard Non‑Exclusive Commercial | Default; perpetual worldwide |
| `0x02` | Editorial‑Only | No advertising use |
| `0x03` | Exclusive Buy‑Out | Term 10 y, sublicensable |
| `0x04` | Limited Region/Duration | Params: region, days |

### 12.2  Error Codes

| Code | Meaning |
|------|---------|
| `0x10` | InvalidRoyaltySum |
| `0x11` | TooManyRecipients |
| `0x20` | ExpiredTemplate |
| `0x21` | SplitMismatch |
| `0x30` | NotAuthorised |
| `0x40` | ZeroBalance |

---

> **Living document:** update this PRD when scope or timelines shift; every change must tag a GitHub issue/PR so engineering, product, and legal stay in lock‑step.