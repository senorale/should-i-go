import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// College Scorecard institution-level export. Download the latest from
// https://collegescorecard.ed.gov/data/ and drop it here.
const CSV_PATH = path.join(process.cwd(), 'data', 'Most-Recent-Cohorts-Institution.csv');

type Row = Record<string, string>;

const num = (v: string | undefined): number | null => {
  if (v == null) return null;
  const s = v.trim();
  if (s === '' || s === 'NULL' || s === 'PrivacySuppressed') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const median = (arr: (number | null)[]): number | null => {
  const a = arr.filter((x): x is number => x != null).sort((x, y) => x - y);
  if (!a.length) return null;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : Math.round((a[m - 1] + a[m]) / 2);
};

async function main() {
  const raw = fs.readFileSync(CSV_PATH, 'utf8');
  const rows: Row[] = parse(raw, { columns: true, skip_empty_lines: true });

  // Cohort: currently operating, 4-year (ICLEVEL=1), predominantly bachelor's (PREDDEG=3).
  const bach = rows.filter(
    (r) => r.ICLEVEL === '1' && r.CURROPER === '1' && r.PREDDEG === '3'
  );
  const pub = bach.filter((r) => r.CONTROL === '1');
  const priv = bach.filter((r) => r.CONTROL === '2'); // private nonprofit

  const cohorts = [
    {
      cohort: 'public_in_state',
      label: 'Public (in-state)',
      rows: pub,
      stickerCol: 'TUITIONFEE_IN',
      netCol: 'NPT4_PUB',
    },
    {
      cohort: 'public_out_of_state',
      label: 'Public (out-of-state)',
      rows: pub,
      stickerCol: 'TUITIONFEE_OUT',
      netCol: null, // Scorecard reports net price for in-state students only
    },
    {
      cohort: 'private_nonprofit',
      label: 'Private (nonprofit)',
      rows: priv,
      stickerCol: 'TUITIONFEE_IN', // in == out for private
      netCol: 'NPT4_PRIV',
    },
    {
      cohort: 'all',
      label: 'All 4-year schools',
      rows: bach,
      stickerCol: 'TUITIONFEE_IN',
      netCol: null, // computed below from whichever net field applies
    },
  ] as const;

  for (const c of cohorts) {
    const sticker = median(c.rows.map((r) => num(r[c.stickerCol])));
    const coa = median(c.rows.map((r) => num(r.COSTT4_A)));

    let net: number | null;
    if (c.cohort === 'all') {
      // Each school reports either public or private net price, never both.
      net = median(c.rows.map((r) => num(r.NPT4_PUB) ?? num(r.NPT4_PRIV)));
    } else {
      net = c.netCol ? median(c.rows.map((r) => num(r[c.netCol!]))) : null;
    }

    await prisma.tuitionMedian.upsert({
      where: { cohort: c.cohort },
      create: {
        cohort: c.cohort,
        label: c.label,
        sticker_annual: sticker,
        net_price_annual: net,
        cost_of_attendance_annual: coa,
        sample_size: c.rows.length,
      },
      update: {
        label: c.label,
        sticker_annual: sticker,
        net_price_annual: net,
        cost_of_attendance_annual: coa,
        sample_size: c.rows.length,
      },
    });

    console.log(
      `${c.cohort.padEnd(22)} sticker=$${sticker ?? '—'}  net=$${net ?? '—'}  coa=$${coa ?? '—'}  (n=${c.rows.length})`
    );
  }
}

main()
  .then(() => console.log('Tuition medians seeded.'))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
