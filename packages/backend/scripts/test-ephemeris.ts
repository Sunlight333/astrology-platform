/**
 * Manual smoke-test for the ephemeris service.
 *
 * Run with:
 *   npx tsx scripts/test-ephemeris.ts
 */

import {
  dateToJulianDay,
  calculatePlanetaryPositions,
  calculateHouseCusps,
} from '../src/services/ephemeris.service';

// J2000.0 epoch – January 1 2000, 12:00 UTC
const testDate = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));

console.log('=== Swiss Ephemeris Integration Test ===\n');
console.log(`Test date : ${testDate.toISOString()}`);

const jd = dateToJulianDay(testDate);
console.log(`Julian Day: ${jd}\n`);

// ---- Planetary positions ----

console.log('--- Planetary Positions ---\n');

const positions = calculatePlanetaryPositions(jd);

for (const pos of positions) {
  const retro = pos.isRetrograde ? ' (R)' : '';
  console.log(
    `${pos.planet.padEnd(8)} ` +
      `${pos.sign.padEnd(12)} ` +
      `${String(pos.degree).padStart(2, '0')}°${String(pos.minute).padStart(2, '0')}' ` +
      `(${pos.longitude.toFixed(4)}°)` +
      `  speed ${pos.speedInLongitude.toFixed(4)}°/day${retro}`,
  );
}

// ---- House cusps (Buenos Aires, Placidus) ----

const testLat = -34.6037; // Buenos Aires
const testLon = -58.3816;

console.log(
  `\n--- House Cusps (Placidus) – lat ${testLat}, lon ${testLon} ---\n`,
);

const { cusps, angles } = calculateHouseCusps(jd, testLat, testLon);

for (const cusp of cusps) {
  console.log(
    `House ${String(cusp.house).padStart(2, ' ')} : ` +
      `${cusp.sign.padEnd(12)} ` +
      `${String(cusp.degree).padStart(2, '0')}° ` +
      `(${cusp.longitude.toFixed(4)}°)`,
  );
}

console.log(`\nAscendant : ${angles.ascendant.toFixed(4)}°`);
console.log(`MC        : ${angles.mc.toFixed(4)}°`);
console.log(`ARMC      : ${angles.armc.toFixed(4)}°`);
console.log(`Vertex    : ${angles.vertex.toFixed(4)}°`);

console.log('\n=== Test complete ===');
