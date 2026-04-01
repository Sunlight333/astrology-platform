# Swiss Ephemeris Licensing

## Overview

This project uses the **Swiss Ephemeris** library (via the `sweph` npm
package by Timotej Roiko) for astronomical calculations. The Swiss Ephemeris
is developed and maintained by **Astrodienst AG** (Zurich, Switzerland).

## Dual-License Model

The Swiss Ephemeris is distributed under a **dual-license** arrangement:

1. **GNU Affero General Public License (AGPL v3)** -- Free / open-source
   option. Any software that links to the Swiss Ephemeris and is made
   available over a network (e.g., a web application) must itself be released
   under the AGPL. This means the complete source code of the application,
   including server-side code, must be made publicly available to all users.

2. **Commercial License** -- Proprietary / closed-source option. A paid
   license from Astrodienst AG allows you to use the Swiss Ephemeris in
   proprietary software without the AGPL obligations.

## Implications for This Project

Because this project is a **commercial, proprietary SaaS platform**, the AGPL
license is **not suitable** for production use. Deploying the Swiss Ephemeris
under the AGPL would legally require publishing the entire backend source code.

**A commercial Swiss Ephemeris license is required before deploying to
production.**

## Acquiring a Commercial License

1. Visit the Astrodienst licensing page:
   <https://www.astro.com/swisseph/>

2. Contact Astrodienst AG directly to discuss licensing terms:
   - Email: `swisseph@astro.ch`
   - Website: <https://www.astro.com/>

3. The license fee depends on the nature of the application. Review the
   current pricing on their website or request a quote.

4. Once the license is obtained, store the license documentation in a secure
   location accessible to the engineering team and reference it in the
   project's internal compliance records.

## Development and Testing

During **local development and automated testing**, usage of the Swiss
Ephemeris under the AGPL is acceptable as long as the software is not
distributed or made available to users over a network. Ensure that no
pre-production environment is publicly accessible without the commercial
license in place.

## Data Files

The Swiss Ephemeris data files (`*.se1`) are also subject to the same
dual-license terms. The built-in Moshier analytical ephemeris (used as a
fallback when data files are absent) is public-domain and does not carry
additional licensing requirements.
