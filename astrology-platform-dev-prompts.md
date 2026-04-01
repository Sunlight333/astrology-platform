# Astrology Platform - Development Prompts for Claude Code (VS Code)

## Project Overview

Web platform for selling personalized birth charts (mapa astral) with author-written interpretive texts.
Built on a Lovable prototype (starlight-embrace-app). MVP scope covers natal charts and astrological transits.
Brazilian market only. Swiss Ephemeris integration for astronomical calculations.

Reference prototype: `starlight-embrace-app.lovable.app`

---

## Phase 1 - Environment Setup and External Service Validation

### Prompt 1.1 - Project Scaffolding from Lovable Prototype

```
I have a Lovable prototype for an astrology platform (starlight-embrace-app). I need to set up a
production-ready project structure based on this prototype.

Create a monorepo project structure with the following:

Frontend: React with TypeScript, Vite as the build tool, Tailwind CSS for styling. The visual
identity should follow the dark celestial aesthetic from the Lovable prototype with gradients,
star-field backgrounds, and zodiac iconography.

Backend: Node.js with Express and TypeScript. The backend will handle all Swiss Ephemeris
calculations server-side, serve the API, and manage user authentication.

Shared: A shared types package for astrological data structures that both frontend and backend
consume. This includes types for planetary positions (planet, longitude, latitude, speed, sign,
degree, minute), house cusps (house number, sign, degree), aspects (planet A, planet B, aspect
type, orb, applying or separating), and the complete natal chart object.

Set up ESLint, Prettier, and tsconfig for each package. Include a docker-compose.yml for local
development with a PostgreSQL database. Add a .env.example with placeholders for all environment
variables the project will need: database connection, geocoding API key, payment gateway keys,
and JWT secret.

Do not implement any business logic yet. This is strictly the skeleton and tooling.
```

### Prompt 1.2 - Swiss Ephemeris Integration and Licensing Validation

```
Set up the Swiss Ephemeris integration for the backend. This is a commercial project so we need
to handle licensing correctly.

Install the sweph npm package (by timotejroiko) which provides Node.js bindings for the Swiss
Ephemeris C library. Create a service file at src/services/ephemeris.service.ts that wraps the
sweph library.

The service must:

1. Initialize the ephemeris by setting the path to the ephemeris data files. Create a directory
at data/ephe/ in the project root and add a README explaining that the Swiss Ephemeris data
files (sepl_18.se1, semo_18.se1, seas_18.se1 at minimum) must be downloaded from the official
Astrodienst repository and placed here. Do not commit the actual data files.

2. Expose a function calculatePlanetaryPositions(julianDay: number) that calculates positions
for Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, and Pluto. Each position
should return longitude, latitude, distance, speed in longitude, and the derived sign and degree.

3. Expose a function calculateHouseCusps(julianDay: number, latitude: number, longitude: number,
houseSystem: string) that calculates the 12 house cusps and the Ascendant, MC, ARMC, and Vertex.
Default house system should be Placidus ("P").

4. Add a note in a LICENSING.md file explaining that the Swiss Ephemeris is dual-licensed under
AGPL and a commercial license from Astrodienst AG, that this project requires the commercial
license for production use, and list the steps to acquire it.

5. Write a simple test script at scripts/test-ephemeris.ts that calculates planetary positions
for January 1, 2000 at 12:00 UTC and prints the results, so we can verify the integration works.

Handle the case where ephemeris files are not found by falling back to the Moshier ephemeris
(built-in, lower precision but no external files needed) and log a warning.
```

### Prompt 1.3 - Geocoding API Integration

```
Create a geocoding service at src/services/geocoding.service.ts that converts city names and
addresses into geographic coordinates (latitude and longitude), which are required for
calculating house cusps and the Ascendant.

The service should:

1. Integrate with the Google Maps Geocoding API as the primary provider. Accept a location
string like "Sao Paulo, Brazil" and return latitude, longitude, and the resolved formatted
address. Cache results in the database to avoid repeated API calls for the same location.

2. Include a fallback to the OpenCage Geocoding API in case the primary fails or hits rate
limits.

3. Create a database migration for a geocoding_cache table with columns: id, query_normalized
(lowercase trimmed input), latitude, longitude, formatted_address, timezone_id, provider,
created_at. Add a unique index on query_normalized.

4. The timezone is critical for astrology calculations because we need to convert local birth
time to UTC before computing the Julian Day. Integrate with a timezone lookup that, given
latitude and longitude, returns the IANA timezone identifier. Google Maps Time Zone API or the
geo-tz npm package (offline, no API calls) are both acceptable. Prefer geo-tz for cost savings.

5. Create a utility function convertToUTC(date: string, time: string, timezoneId: string) that
takes a date string (YYYY-MM-DD), a time string (HH:mm), and an IANA timezone, and returns the
UTC Date object and the corresponding Julian Day number using the sweph julday conversion.

This is one of the most error-prone areas of the system. Historical timezone data for Brazil
changed multiple times (daylight saving time was abolished in 2019, but birth charts from the
1980s-2000s need the correct historical offset). The geo-tz package combined with the IANA tz
database handles this, but add a note in the code explaining this dependency.
```

### Prompt 1.4 - Payment Gateway Sandbox Configuration

```
Set up the payment integration for selling natal charts to Brazilian customers.

Create a payment service at src/services/payment.service.ts using Mercado Pago as the primary
gateway (most popular in Brazil, supports PIX, credit card, and boleto).

The service should:

1. Install the mercadopago npm SDK. Create a configuration module that reads MERCADO_PAGO_ACCESS_TOKEN
and MERCADO_PAGO_PUBLIC_KEY from environment variables.

2. Implement a function createCheckout(userId: string, productType: "natal_chart" | "transit_report",
amount: number, description: string) that creates a Mercado Pago preference (checkout session)
and returns the checkout URL.

3. Implement a webhook handler at POST /api/webhooks/mercadopago that receives payment
notifications. The handler must verify the webhook signature, update the order status in the
database, and trigger content delivery (unlocking the natal chart for the user) when payment
is confirmed.

4. Create database migrations for: an orders table (id, user_id, product_type, status, amount,
mp_payment_id, mp_preference_id, created_at, paid_at) and a products table (id, type, name,
price_brl, active, created_at).

5. Seed the products table with two initial products: "Mapa Astral Completo" and "Relatorio de
Transitos". Use placeholder prices.

6. Add a test route at GET /api/payment/test-checkout that creates a sandbox checkout for the
natal chart product and returns the sandbox payment URL so we can verify the entire flow.

Include error handling for common Mercado Pago failure scenarios: expired preferences, duplicate
payments, and refund requests. Log all webhook events for debugging.
```

### Prompt 1.5 - Database Schema and Authentication

```
Design and implement the complete database schema and user authentication system.

Database migrations (PostgreSQL with Knex or Prisma, choose Prisma for type safety):

1. users table: id (UUID), email (unique), password_hash, name, created_at, updated_at.

2. birth_profiles table: id, user_id (FK), name (the profile label, e.g. "My Chart"),
birth_date (DATE), birth_time (TIME), birth_city (text), birth_latitude (decimal),
birth_longitude (decimal), timezone_id (text), utc_datetime (timestamp), julian_day (decimal),
created_at. A user can have multiple birth profiles.

3. natal_charts table: id, birth_profile_id (FK), order_id (FK, nullable for free previews),
planetary_positions (JSONB), house_cusps (JSONB), aspects (JSONB), calculated_at, is_paid (boolean).

4. interpretive_texts table: id, category (enum: "planet_sign", "planet_house", "aspect",
"transit"), planet (text), sign (text, nullable), house (integer, nullable), aspect_type (text,
nullable), transit_planet (text, nullable), title (text), body (text), author (text), created_at,
updated_at. This table holds the client's author-written texts.

5. transit_reports table: id, birth_profile_id (FK), order_id (FK), transit_date (DATE),
active_transits (JSONB), generated_at.

Authentication: Implement JWT-based auth with bcrypt for password hashing. Create routes for
POST /api/auth/register, POST /api/auth/login, GET /api/auth/me. Use httpOnly cookies for the
refresh token and a short-lived access token in the Authorization header. Add middleware that
protects all routes under /api/charts and /api/orders.

Do not implement social login at this stage.
```

---

## Phase 2 - Natal Chart Engine and Frontend

### Prompt 2.1 - Complete Natal Chart Calculation Pipeline

```
Build the complete natal chart calculation pipeline that connects all the services created in
Phase 1.

Create a chart calculation orchestrator at src/services/chart.service.ts that:

1. Accepts a birth profile (date, time, city) and runs the full pipeline: geocode the city,
resolve the timezone, convert local time to UTC, compute the Julian Day, calculate planetary
positions for all 10 main bodies, calculate house cusps with Placidus, and compute all major
aspects between planets.

2. Aspect calculation logic: Check every pair of planets for the following aspects with their
standard orbs: conjunction (0 degrees, orb 8), opposition (180, orb 8), trine (120, orb 8),
square (90, orb 7), sextile (60, orb 6), quincunx (150, orb 3), semisextile (30, orb 2),
semisquare (45, orb 2), sesquiquadrate (135, orb 2). For each aspect found, record whether
it is applying (the faster planet is moving toward exactitude) or separating. Use the planet
speeds from the ephemeris calculation to determine this.

3. Sign derivation: Convert each planet's ecliptic longitude (0-360) into its zodiac sign and
degree. Aries = 0-30, Taurus = 30-60, and so on. Return both the sign name and the degree
within that sign.

4. After calculation, save the complete chart data to the natal_charts table as JSONB and return
the structured result.

5. Handle the critical concurrency problem: the Swiss Ephemeris library uses global state in its
configuration functions (swe_set_ephe_path, swe_set_sid_mode, swe_set_topo). If multiple chart
calculations run simultaneously on the server, they can corrupt each other's results. Implement
a calculation queue using Bull (backed by Redis) that processes one chart at a time per worker.
Alternatively, use a mutex lock around the ephemeris calls. Document the tradeoff in comments.

6. Create the API endpoint POST /api/charts/calculate that receives { birthProfileId } and
returns the calculated chart. This endpoint requires authentication and a valid paid order
linked to the profile, unless we add a flag for free preview (showing only Sun, Moon, and
Ascendant).

Include comprehensive error handling for: invalid dates (e.g. birth times before timezone data
exists), coordinates outside valid ranges, and ephemeris calculation failures.
```

### Prompt 2.2 - Interpretive Text Assembly System

```
Build the system that matches calculated chart positions to the client's author-written
interpretive texts stored in the database.

Create an interpretation service at src/services/interpretation.service.ts that:

1. Takes a completed natal chart (planetary positions, house placements, aspects) and assembles
the full interpretive report by querying the interpretive_texts table.

2. For each planet, look up two texts: the planet-in-sign text (e.g. "Sun in Aries") and the
planet-in-house text (e.g. "Sun in House 7"). This means 10 planets x 2 lookups = 20 base
interpretations per chart.

3. For each aspect found in the chart, look up the corresponding aspect text (e.g. "Sun square
Moon"). Aspects are bidirectional so the lookup should check both orderings (Sun-Moon and
Moon-Sun).

4. Organize the output into sections: a summary section (Sun sign, Moon sign, Ascendant), a
planets section (each planet with its sign and house interpretations), and an aspects section
(grouped by planet). Return structured JSON that the frontend can render in order.

5. Handle missing texts gracefully. The client will write these texts over time, so many
combinations will initially be empty. When a text is missing, return a placeholder indicating
the interpretation is "coming soon" so the frontend can display this elegantly.

6. Create an admin API at /api/admin/texts with CRUD endpoints for managing interpretive texts.
Include bulk import via JSON file upload so the client can prepare texts in batch. Each text
entry needs: category, planet, sign (nullable), house (nullable), aspect_type (nullable),
transit_planet (nullable), title, and body (rich text in markdown format).

No authentication on the admin routes for now, but add a TODO to protect them with an admin
role before production.
```

### Prompt 2.3 - Natal Chart Frontend and Zodiac Wheel Visualization

```
Build the frontend pages for the natal chart experience, following the dark celestial visual
identity from the Lovable prototype.

1. Birth Data Form page (/new-chart): A form with fields for full name (label for the profile),
birth date (date picker), birth time (time picker with hour and minute), and birth city
(autocomplete input that calls the geocoding API as the user types, showing matching cities
in a dropdown). Include a note explaining why exact birth time matters for accurate house
calculations. The form should validate that all fields are filled before submission. On submit,
create the birth profile via the API, trigger the checkout flow (redirect to Mercado Pago),
and on payment confirmation redirect to the chart results page.

2. Zodiac Wheel component: Build an SVG-based interactive zodiac wheel that renders the natal
chart visually. The wheel should show the 12 zodiac signs as segments around the outer ring
(each 30 degrees, with their traditional glyphs), the 12 houses as inner segments (varying
sizes based on calculated cusps), planet glyphs positioned at their calculated longitudes,
and aspect lines drawn between planets in the center (color coded: trines in blue, squares
in red, oppositions in red, sextiles in green, conjunctions in gold). The component receives
the calculated chart data as props and renders everything with SVG. Make it responsive. Include
hover tooltips on each planet showing the exact position (e.g. "Sun at 15 degrees 23 minutes
Aries, House 7").

3. Interpretive Report page (/chart/:id): Below the zodiac wheel, render the interpretive
texts organized in expandable sections. Start with the "Your Big Three" summary (Sun, Moon,
Ascendant), then each planet in order (Sun through Pluto), then aspects. Each section shows
the planet glyph, the sign and house placement, and the author's interpretive text. Use smooth
animations for expanding and collapsing sections. If a text is missing (not yet written by the
client), show a subtle "interpretation coming soon" card.

4. User dashboard (/dashboard): Show all saved birth profiles and purchased charts. Allow
creating new profiles. Show order history and payment status.

Use Framer Motion for animations and transitions between pages. The overall feel should be
mystical and premium, not cluttered.
```

---

## Phase 3 - Transit System and Payment Flow

### Prompt 3.1 - Astronomical Transit Calculation Engine

```
Build the transit calculation system that computes current planetary positions and compares
them against a user's natal chart.

Create a transit service at src/services/transit.service.ts that:

1. Calculates the current (or any given date's) planetary positions using the same Swiss
Ephemeris pipeline from the natal chart engine. This gives us the "transit planets."

2. Compares each transit planet against each natal planet and identifies active aspects using
the same aspect detection logic from the natal chart engine, but with tighter orbs for transits:
conjunction (orb 3 for outer planets, 2 for inner), opposition (orb 3/2), square (orb 3/2),
trine (orb 3/2), sextile (orb 2/1). Outer planets are Jupiter through Pluto. Inner planets
are Sun through Mars.

3. For each active transit aspect, calculate whether it is applying or separating, and compute
the exact date when the aspect will be exact (using iterative calculation by stepping forward
in small increments and checking when the orb reaches zero). This gives the user a timeline.

4. Set up a background job using Bull queue (or node-cron) that runs daily at midnight UTC and
recalculates the current planetary positions. Store these in a transit_positions table
(date, planet, longitude, latitude, speed, sign, degree) so that individual transit lookups
do not need to recalculate the ephemeris every time.

5. Create the API endpoint GET /api/transits/:birthProfileId that returns all active transits
for the given natal chart on the current date. Include the transit planet, natal planet, aspect
type, current orb, exact date, and the interpretive text if available.

6. Create a second endpoint GET /api/transits/:birthProfileId/range?start=YYYY-MM-DD&end=YYYY-MM-DD
that returns a calendar of transit events over a date range (maximum 90 days). This powers a
transit calendar view on the frontend.

Include special handling for retrograde planets. When a transit planet is retrograde, it can
pass over the same natal point three times (direct, retrograde, direct again), and each pass
should be tracked as a separate event.
```

### Prompt 3.2 - Transit Frontend and Calendar View

```
Build the frontend for the transit report experience.

1. Active Transits page (/transits/:birthProfileId): Show a list of all currently active
transits affecting the user's natal chart. Each transit card shows the transit planet glyph
and the natal planet glyph connected by the aspect symbol, the current orb and whether it is
applying or separating, the exact date of the aspect, and the interpretive text for this
transit. Sort transits by relevance: exact aspects first, then applying (smaller orb first),
then separating. Use color intensity to indicate how close to exact the transit is.

2. Transit Calendar page (/transits/:birthProfileId/calendar): A monthly calendar view that
shows which transits are active on each day. Each day cell shows small planet glyphs for
active transits. Clicking a day opens a detail panel with the full list of transits for that
date. Allow navigating forward and backward by month (up to 3 months forward from current
date). Highlight days with exact transits in a different color.

3. Transit Zodiac Wheel: Render a dual-ring zodiac wheel showing the natal chart in the inner
ring (static) and the current transit positions in an outer ring. Draw aspect lines from transit
planets to natal planets. This gives a visual overview of the current sky relative to the
birth chart.

4. Gate the transit features behind the transit report purchase. Show a preview with the 3
most significant active transits (by tightest orb), and blur or lock the rest behind a
purchase prompt that links to the Mercado Pago checkout for the transit product.

Keep the same visual identity: dark theme, celestial gradients, planet and sign glyphs.
```

### Prompt 3.3 - Complete Payment Flow and Content Delivery

```
Wire together the complete purchase flow from product selection through payment and content
delivery.

1. Pricing page (/pricing): Show the two available products (Mapa Astral Completo and
Relatorio de Transitos) with their prices, descriptions, and feature lists. Each product
has a CTA button that either starts the purchase flow (for logged-in users) or redirects
to registration first.

2. Purchase flow: When a user clicks to buy, create an order record in pending status, create
a Mercado Pago preference with the order details and the success/failure/pending callback URLs,
redirect the user to the Mercado Pago checkout page. On the success callback URL (/payment/success),
show a confirmation page and poll the order status until the webhook confirms payment.

3. Webhook processing: The Mercado Pago webhook handler (already created in Phase 1) should,
on payment approved, update the order status to paid, trigger the chart or transit calculation
if not already done, mark the natal_chart or transit_report record as is_paid = true, and send
a confirmation email to the user with a link to view their results.

4. Content access control middleware: Create a middleware that checks, before serving any chart
or transit data, whether the user has a paid order for that specific content. Return 403 with
a structured error that the frontend can use to show the purchase prompt. Allow free preview
of Sun sign, Moon sign, and Ascendant only.

5. Handle edge cases: payment timeout (preference expires after 24h, clean up pending orders),
duplicate webhooks (idempotent processing based on mp_payment_id), user requests refund
(mark order as refunded and revoke access).

Do not implement email sending yet, just create the interface and log what would be sent.
```

---

## Phase 4 - Testing and Pre-Launch Validation

### Prompt 4.1 - Astrological Calculation Accuracy Tests

```
Create a comprehensive test suite that validates the accuracy of all astrological calculations
against known reference data.

1. Unit tests for the ephemeris service: Use reference data from Astro.com (Swiss Ephemeris
online) to validate planetary positions for at least 5 known dates spread across different
decades (1950, 1975, 1990, 2000, 2024). For each date, compare calculated longitude for all
10 planets against the reference values. Acceptable deviation is less than 0.01 degrees
(approximately 36 arcseconds) which accounts for minor differences in ephemeris file versions.

2. House cusp validation: For at least 3 birth chart examples with known house cusps from
professional astrology software (Solar Fire or Astro.com), verify that our Placidus house
cusps match within 0.1 degree. Include edge cases: births at extreme latitudes (above 60N
where Placidus becomes problematic), births exactly on the cusp boundary, and births at
midnight UTC.

3. Aspect calculation tests: Create a test chart with known aspects and verify that all
expected aspects are detected and no false aspects are reported. Test the applying/separating
detection by using a chart where a known aspect is applying and verifying the flag.

4. Timezone conversion tests: Critical for Brazil. Test the following scenarios: a birth in
Sao Paulo during the DST period (e.g. January 15, 1995, when Brazil observed DST, UTC-2),
a birth in Sao Paulo after DST abolition (e.g. January 15, 2020, UTC-3), a birth in Manaus
(which never observed DST, always UTC-4), and a birth in Fernando de Noronha (UTC-2 always).
Verify that the Julian Day computed matches the expected UTC conversion in each case.

5. Transit calculation tests: For a known natal chart, calculate transits for a specific date
and verify against manually computed aspects. Test the retrograde triple-pass scenario by
finding a date range where Saturn retrogrades over a natal planet and verifying three separate
transit events are generated.

6. Integration test for the full pipeline: Submit a birth profile through the API and verify
the returned chart data end-to-end. Compare the result with a manually calculated chart.

Use Jest as the test framework. Create test fixtures in a __fixtures__ directory with the
reference data as JSON files. Add npm scripts: test:unit, test:integration, test:accuracy.
```

### Prompt 4.2 - Payment and User Flow End-to-End Tests

```
Create end-to-end tests for the complete user journey from registration through payment and
content access.

1. Authentication flow tests: Test registration with valid data creates a user and returns
tokens. Test registration with duplicate email returns appropriate error. Test login with
correct credentials returns tokens. Test login with wrong password returns 401. Test accessing
protected routes without a token returns 401. Test expired access token returns 401 and can
be refreshed with the refresh token.

2. Payment flow tests using Mercado Pago sandbox: Test creating a checkout preference returns
a valid redirect URL. Test the webhook handler with a simulated payment approved notification
correctly updates the order status and triggers chart calculation. Test the webhook handler
with a payment rejected notification keeps the order in pending. Test idempotent webhook
processing by sending the same notification twice and verifying the order is only processed
once. Test expired preference cleanup.

3. Content access control tests: Test that an unauthenticated user cannot access chart data.
Test that an authenticated user without a paid order receives only the free preview (Sun, Moon,
Ascendant). Test that an authenticated user with a paid order receives the full chart with all
planets, houses, aspects, and interpretive texts. Test that a user with a refunded order loses
access.

4. Birth profile validation tests: Test that submitting a birth time without a city is rejected.
Test that a city that cannot be geocoded returns an appropriate error. Test that a date in the
future is rejected. Test that a date before 1800 returns a warning about reduced accuracy.

5. Load testing: Use k6 or autocannon to simulate 50 concurrent chart calculation requests
and verify that the queue system processes them without data corruption (the Swiss Ephemeris
global state issue). Measure response times and ensure 95th percentile is under 10 seconds
for chart calculation.

6. Frontend smoke tests with Playwright: Test the registration form submission and redirect.
Test the birth data form autocomplete for city search. Test that the zodiac wheel renders
without errors after chart calculation. Test responsive layout on mobile viewport (375px width).

Use separate test database and Mercado Pago sandbox credentials. Include a docker-compose.test.yml
that spins up the test database and Redis for the queue. Add CI pipeline configuration
(GitHub Actions) that runs all tests on pull requests.
```

### Prompt 4.3 - Security Audit and Production Hardening

```
Perform a security audit and apply production hardening to the entire application.

1. Input validation: Review every API endpoint and ensure all inputs are validated with Zod
schemas. Specifically validate that birth dates are within the range supported by the ephemeris
files (13000 BC to 17000 AD, but practically limit to 1800-present), birth times are valid
24h format, coordinates are within valid ranges (-90 to 90 latitude, -180 to 180 longitude),
and all text inputs are sanitized against XSS.

2. Rate limiting: Add rate limiting to all public endpoints. Registration and login: 5 requests
per minute per IP. Chart calculation: 10 requests per hour per user. Geocoding: 100 requests
per hour per user. Webhook endpoint: whitelist Mercado Pago IP ranges only.

3. CORS configuration: Restrict allowed origins to the production domain and localhost for
development. Do not use wildcard origins.

4. Database security: Ensure all queries use parameterized statements (Prisma handles this).
Review the JSONB fields for injection vulnerabilities. Add database connection pooling with
pg-pool, configured for the expected concurrent load.

5. Payment security: Verify that webhook signature validation is correctly implemented. Ensure
that order amounts cannot be tampered with client-side (always read the price from the database,
never from the request). Verify that content access checks use server-side order validation,
not client-side flags.

6. Environment and secrets: Verify no secrets are committed to the repository. Add a pre-commit
hook that scans for common secret patterns (API keys, tokens). Ensure the .env file is in
.gitignore.

7. Error handling: Review all error responses to ensure no internal details (stack traces,
database errors, file paths) leak to the client. Implement a global error handler that logs
full details server-side and returns sanitized messages to the client.

8. HTTPS and headers: Configure Helmet.js for security headers. Ensure all cookies are set
with Secure, HttpOnly, and SameSite=Strict flags.

Generate a SECURITY_CHECKLIST.md file documenting each item, its status, and any remaining
action items for the client to address before launch.
```

---

## Notes for Development

### Admin Text Management Priority

The client will write all interpretive texts. The total number of text entries needed for full
coverage of the natal chart is approximately: 10 planets x 12 signs = 120 planet-in-sign texts,
10 planets x 12 houses = 120 planet-in-house texts, and roughly 45 unique planet pairs x 9
aspect types = up to 405 aspect texts (not all combinations occur). Total: approximately 645
individual interpretive texts for full natal chart coverage. Transit texts add another similar
volume. The admin interface and bulk import functionality should be prioritized so the client
can begin writing content in parallel with development.

### Swiss Ephemeris Commercial License

Before deploying to production, the client must acquire the commercial license from Astrodienst AG
(webmaster@astro.ch). Without this, the AGPL license requires open-sourcing the entire application
code. The license cost should be factored into the project budget.

### Future Phase (Not in MVP)

Synastry (relationship compatibility) can be implemented by calculating two natal charts and
running the aspect detection between all planets of Chart A against all planets of Chart B.
The same engine and interpretive text system applies, just with a different comparison matrix.
