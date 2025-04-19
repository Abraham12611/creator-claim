# CreatorClaim – Real‑Time Licensing & Royalty Engine for Creators
*A Solana‑powered platform that turns every creative work into a traceable, instantly‑paid asset.*

---

> **TL;DR** – CreatorClaim makes creative rights liquid, traceable and automatically paid. Mint a certificate, set a licence price, and get paid the instant someone uses your work—no middlemen, no 9‑month royalty delays, no guess‑work.

---

## 1  — Why CreatorClaim Exists
Creative professionals lose billions each year because current licensing rails are:

| Pain‑Point | Symptoms | Data‑Point |
|------------|----------|-----------|
| **Under‑compensation** | Creators see only a fraction of revenues. | Musicians captured **12 %** of U.S. industry income (2017). |
| **Rights infringement** | Works shared without permission or payment. | ~**2.5 B** images stolen daily; **$53 B** lost music revenue. |
| **Slow, opaque royalty systems** | 6‑ to 12‑month payout delays; unmatched “black‑box” funds. | **$424 M** unmatched streaming royalties pre‑2021. |

---

## 2  — Solution in One Sentence
CreatorClaim issues **tamper‑proof digital certificates** (compressed NFTs) for every work and runs an **automated licence marketplace** where payments are split and streamed to right‑holders in **real time**.

---

## 3  — Key Features

* 🔏 **Digital Certificates** – proof of authorship & metadata hashed on Solana.
* ⚡ **Instant Licensing** – choose a template, set price, buyers self‑serve; smart contracts handle escrow.
* 💸 **Real‑Time Royalty Splitter** – token‑2022 hooks distribute each cent the moment usage is logged.
* 🔍 **Transparent Ledger** – every licence and payout is publicly verifiable (or permissioned for private deals).
* 🪄 **Usage Oracle Bridge** – content‑ID bots can trigger on‑chain micropayments for streams, embeds, prints.

---

## 4  — High‑Level Architecture

```text
        ┌────────────────────────┐       ┌────────────────────────┐
        │  Front‑End (Next.js)   │       │   Mobile SDK (RN)      │
        └──────────┬─────────────┘       └──────────┬─────────────┘
                   │ REST/gRPC                           │
                   ▼                                     ▼
┌────────────────────────────┐            ┌───────────────────────────┐
│  API Gateway  (Rust Axum)  │◄──JWT────►│  Auth / KYC (passkeys)    │
└──────────────┬─────────────┘            └──────────────┬────────────┘
               │ gRPC / WebSocket                       │
               ▼                                        ▼
         ┌──────────────┐                      ┌────────────────┐
         │  Indexer     │◄──────RPC───────────►│  Solana Mainnet│
         │  (Helius)    │       /Devnet        └────────────────┘
         └────┬─────────┘                           ▲
              │    CPI                              │
              ▼                                     │
┌────────────────────────────┐            ┌─────────┴──────────┐
│   Certificate Program      │            │  Licence Program   │
│  (mints cNFT + metadata)   │            │(escrow & royalty)  │
└────────────────────────────┘            └────────────────────┘
              ▲                                     ▲
              │ Logs / Webhooks                     │
              ▼                                     ▼
        ┌───────────────┐                     ┌───────────────┐
        │  Postgres +   │  ← analytics ────── │  Object Store │
        │  Hasura       │                     │  (media)      │
        └───────────────┘                     └───────────────┘
```

---

## 5  — How It Works (Step‑by‑Step)

```text
Creator uploads file ──┐
                       ├─► 1. Hash & pin to IPFS / Arweave
                       ├─► 2. Mint Certificate (cNFT) on Solana
                       ├─► 3. Define royalty splits + licence template
                       ▼
Marketplace listing    │
Buyer selects licence ─┘
                       ├─► 4. Licence Program escrows payment (USDC)
                       ├─► 5. Token‑2022 hook splits funds to creators
                       ├─► 6. Licence token (PDA) issued to buyer
                       ▼
Royalty dashboard      │  (WebSocket pushes)
                       └─► 7. Payout: creators withdraw USDC / fiat
```

---

## 6  — Sample User Journeys

### 6.1  Creator On‑Boarding

| # | Action in UI | On‑Chain Effect |
|---|--------------|-----------------|
| 1 | Sign up, pass KYC. | No chain call. |
| 2 | Click **“Mint certificate”**, upload *myphoto.jpg*. | `certificate::mint()` – creates compressed NFT with metadata hash. |
| 3 | Choose **Standard Non‑Exclusive** licence, price $15. | Metadata URI updated, licence template stored. |
| 4 | Royalty split 80 % me, 20 % collaborator. | Split array written to NFT account. |
| 5 | Asset appears in marketplace. | — |

### 6.2  Buyer Licensing Flow

1. Searches, finds *myphoto.jpg* → clicks **Buy licence ($15)**.
2. Wallet pops up: approves Tx with `licence::purchase()` → 15 USDC sent to escrow.
3. Royalty‑router immediately transfers 12 USDC to creator, 3 USDC to collaborator (80/20).
4. Licence token PDA minted to buyer; metadata contains usage rights JSON.
5. Buyer downloads high‑res file via signed URL.

---

## 7  — Licence Smart‑Contract Logic (ASCII)

```text
      ┌───────── Transaction ─────────┐
      │  Accounts:                    │
      │  - Payer (buyer)              │
      │  - Licence Escrow PDA         │
      │  - Creator A, Creator B       │
      │  - Royalty Router Program     │
      │  - Certificate Metadata       │
      └─────────────┬─────────────────┘
                    │
          1. transfer USDC to Escrow
                    │
                    ▼
        ┌────────────────────────┐
        │  Royalty Router (CPI)  │
        └────────────────────────┘
                    │
        splits by basis‑points table
                    │
     ┌──────────────┴──────────────┐
     ▼                             ▼
Creator A receives 80 %     Creator B receives 20 %
```

---

## 8  — Technology Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Chain | **Solana mainnet‑beta** (token‑2022, cNFT) | Sub‑cent fees, high TPS for micropayments. |
| Programs | Rust + **Anchor** | Declarative accounts, easy testing. |
| Indexer | **Helius** webhook → Kafka | Handles compressed NFT events. |
| API | Rust **Axum** + sqlx | Low‑latency JSON + WebSocket push. |
| DB | **Postgres 16** | Strong consistency for royalties & audit. |
| Storage | Arweave/IPFS; Civo Object Store for cache | Permanent & cheap. |
| Front‑End | **Next.js / Tailwind** | SSR + dark theme with neon accents. |

---

## 9  — Compliance Snapshot

* **KYC/AML** – Tiered: payout ≥ €150 → full ID; Travel Rule for transfers > US $1 000.
* **DAC7 / 1099‑K** – Automatic yearly export of creator earnings CSV/JSON.
* **GDPR** – PII stored off‑chain, hashed references on‑chain.
* **DMCA** – Takedown disables gateway link; NFT remains immutable.

---

## 10  — FAQ (Abbreviated)

* **Can licences be private?**
  Yes – use permissioned token & encrypted metadata URI.

* **What if a creator loses their wallet?**
  Multisig + social recovery contract can re‑assert certificate ownership.

* **Does this create securities?**
  CreatorClaim sells access licences, not revenue‑sharing tokens; splits are payouts for work already created (similar to mechanical royalties).

---