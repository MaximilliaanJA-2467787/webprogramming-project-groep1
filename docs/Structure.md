# Projectplan

## 1. Hoog overzicht
Een event-cashless platform waarmee:

- bezoekers virtuele munten kopen (conversie echt geld → tokens),
- bezoekers tokens uitgeven via een mobiele web-app (drank, eten, merch),
- groepen een gezamenlijke ‘pot’ kunnen maken en uitgaven delen,
- beheerders inkomsten en bezoekersbewegingen in real-time analyseren (populaire items, drukke locaties, piekmomenten),
- gebruikers hun reële uitgaven en budgetten nauwkeurig kunnen volgen en meldingen krijgen.

Systeemeisen: Node.js/Express backend, web front-end (Bootstrap), persistente opslag (SQlite 3), Dockerized, interactieve visualisaties (Canvas), minstens 3 browser-API’s (incl. Fetch), minstens 1 externe API (QR code, geolocation gekozen).


## 2. Functionele requirements

1. Auth: accounts voor bezoekers, vendors, beheerders
2. Wallets: kopen van tokens, conversies etc.
3. Betaalflow: betalen met tokens bij vendors (QR-code)
4. Groepspot: creeren uitnodigen, betalen uit pot, settlement -> voorschieten en betalers zelf achteraf authoriseren van terugbetaling
5. Transactiegeschiedenis: (tijd, locatie, vendor, primair valuta-equivalent).
6. Budgetten en alerts per categorie (drank, eten, merch, extra)
7. Analytics dashbroard -> voor vendors
8. Visualisaties interactief: klikbare grafieken, drill-down naar transacties.
9. Docker support

## 3. Browser APIs
1. Fetch API (verplicht)
    - Voor alle HTTP-calls vanuit front-end naar backend (auth, transacties, analytics).
    - Nodig en centraal.

2. Geolocation API
    - Voor: locatie van consument (opt-in) om heatmaps te bouwen, locatie-gebaseerde aanbiedingen of “vind dichtstbijzijnde bar” te bieden en voor accurate locatie-tags op transacties.
    - (optioneel) Privacy: expliciete toestemming, opt-out, korte bewaartermijnen.

3. Notifications API
    - Voor: meldingen wanneer budget bijna op is, groepspot-updates, of wanneer favoriete items in de aanbieding zijn.

4. Browser Storage (localStorage / IndexedDB) & Service Worker cache
    - (optioneel) Voor offline-caching van menu’s, recente transacties en om de app robuust op slecht-netwerk te maken.

5. Canvas API
    - Voor aangepaste interactieve visualisaties zoals een heatmap overlay of custom chart interacties (naast Chart.js kan Canvas rechtstreeks gebruikt worden voor performant tekenen).


## 4. Externe APIs
QRcode -> tbd

Geolocation -> tbd

## 5. Tech stack

Backend: Node.js + Express.js
Auth: express-session
DB: SQlite 3
Payments: (optional in the end) Paypal / stripe
Frontend: HTML/CSS/JS Bootrstrap 5.3
Charts: Iets van chart lib misschien?
Github Actions: Docker
Containerization: Docker + docker-compose


## 6. File Structure

```
.
├── app
│   ├── base
│   │   ├── controller
│   │   ├── middleware
│   │   ├── model
│   │   └── router
│   ├── config
│   ├── data
│   │   ├── database
│   │   └── models
│   ├── resources
│   │   ├── public
│   │   │   ├── css
│   │   │   │   └── bootstrap
│   │   │   │       └── fonts
│   │   │   ├── fonts
│   │   │   ├── images
│   │   │   └── js
│   │   │       ├── bootstrap
│   │   │       └── ejs
│   │   └── views
│   │       ├── layouts
│   │       ├── pages
│   │       │   ├── admin
│   │       │   ├── error
│   │       │   ├── user
│   │       │   └── vendor
│   │       └── partials
│   ├── utils
│   └── web
│       ├── controllers
│       ├── middleware
│       └── routing
├── docs
├── logs
└── scripts
```

## 7. Data model

users:
- id (PK) 
- uuid -> as discord id :P
- email
- password_hash
- name
- role -> user / vendor / admin
- created_at

wallets
- id
- user_id (Fk)
- balance_tokens (integer/float)
- currency (EUR, USD, etc)
- created_at

transactions
- id
- walletSource_id (FK) nullable
- walletDestination_id (FK) nullable
- type (purchase/deposit/withdraw/repay)
- amount_tokens
- item_id (FK) nullable
- vendor_id (FK) nullable
- location
- timestamp
- metadata json

vendors
- id
- user_id (FK)
- name
- location

categories
- id
- name (drank/eten/merch, andere)

items
- id
- vendor_id
- naam
- category_id (FK) 
- price_tokens
- popularity_count

group_pots
- id
- name
- owner_id (FK)

group_repayment
- user_id (FK)
- group_pot_id (FK)
- transaction_id (FK)
- share (procent)

user_group
- user_id (FK)
- group_pot_id (FK)
- group_auth_token hash

budgets
- id
- user_id (FK)
- category_id (FK) 
- limit_tokens
- interval (limit per day, week, etc)

budget_alerts
- budget_id (FK)
- alert_threshold_percent
- message


notifications
- id
- user_id (FK)
- type
- payload (json)
- read (bool)
- created_at


## 8. API endpoints (REST) `/v1`

Auth
- POST `/auth/login`
- POST `/auth/register`
- POST `/auth/refresh`
- POST `/auth/logout`

Wallets
- GET `/wallet` -> JSON wallet summary
- POST `/wallet/deposit` -> backend just deposits some tokens
- POST `/wallet/deposit/confirm`
- POST `/wallet/withdraw` -> backend just removes some tokens

Transactions
- GET `/transactions?userId=&from=&to=&category=`
- POST `/transactions/pay` -> QR code content route (payload: user_id, item_id or amount, pot_id optional, ...) or just P2P
- POST `transactions/repay` -> repaying group members

Group pots
- POST `/pots/create`
- POST `/pots/invite/:uuid` -> add instance to usergroup table
- POST `/pots/:id/pay`
- POST `/pots/:id/leave`
- POST `/pots/:id`


Vendors
- GET `/vendors` list of vendors
- GET `/vendors/:id/menu` lijst van items met prijs
- POST `/vendors/:id/item` -> create item

Analytics / admin
- GET `/analytics/summary` total sales, tokens sold, visitors
- GET `/analytics/popular-items` top N items
- GET `/analytics/heatmap?from=&to=` returns geolocated points for front-end map
- GET `/analytics/time-series?metric=sales` sales per interval

Budgets
- GET `/budgets` get all budgets per cat
// CRUD


Utilities for extern APIs
- GET `/geo/ip` to extern api returns country, region timezone whatever
