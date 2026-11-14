import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';
import mongoose from 'mongoose';

const backendRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..'
);

dotenv.config({
  path: path.join(backendRoot, '.env'),
  quiet: true,
});

const BASE_URL = 'https://monstar.wired.org.au';
const OUTPUT_DIR = path.join(backendRoot, '..', 'frontend', 'public');
const TODAY = new Date().toISOString().split('T')[0];

interface SitemapUrl {
  url: string;
  changefreq: string;
  priority: number;
}

const STATIC_URLS: SitemapUrl[] = [
  { url: `${BASE_URL}/`, changefreq: 'weekly', priority: 1.0 },
  { url: `${BASE_URL}/list`, changefreq: 'daily', priority: 0.8 },
  { url: `${BASE_URL}/jobs`, changefreq: 'daily', priority: 0.8 },
  { url: `${BASE_URL}/about`, changefreq: 'monthly', priority: 0.6 },
  {
    url: `${BASE_URL}/terms-and-conditions`,
    changefreq: 'monthly',
    priority: 0.5,
  },
  { url: `${BASE_URL}/map`, changefreq: 'weekly', priority: 0.7 },
];

// Unit pages are split across sitemaps by the first letter of the unit code
const UNIT_GROUPS = [
  { name: 'a-f', pattern: /^[a-f]/i },
  { name: 'g-m', pattern: /^[g-m]/i },
  { name: 'n-z', pattern: /^[n-z]/i },
];

const urlset = (urls: SitemapUrl[]) =>
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls
    .map(
      (page) =>
        '  <url>\n' +
        `    <loc>${page.url}</loc>\n` +
        `    <changefreq>${page.changefreq}</changefreq>\n` +
        `    <priority>${page.priority}</priority>\n` +
        `    <lastmod>${TODAY}</lastmod>\n` +
        '  </url>\n'
    )
    .join('') +
  '</urlset>';

const sitemapIndex = (files: string[]) =>
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  files
    .map(
      (file) =>
        '  <sitemap>\n' +
        `    <loc>${BASE_URL}/${file}</loc>\n` +
        `    <lastmod>${TODAY}</lastmod>\n` +
        '  </sitemap>\n'
    )
    .join('') +
  '</sitemapindex>';

/**
 * Writes the static and unit sitemaps, plus the index that lists them, into
 * the frontend's public folder.
 */
async function generateSitemaps() {
  try {
    await mongoose.connect(process.env.MONGODB_CONN_STRING as string);
    const { Unit } = await import('@domains/academics/units');

    const units: { unitCode: string }[] = await Unit.find({}, 'unitCode');
    units.sort((a, b) => a.unitCode.localeCompare(b.unitCode));
    console.log(`Found ${units.length} units`);

    const sitemaps: Record<string, string> = {
      'sitemap-static.xml': urlset(STATIC_URLS),
    };
    for (const { name, pattern } of UNIT_GROUPS) {
      sitemaps[`sitemap-units-${name}.xml`] = urlset(
        units
          .filter((unit) => pattern.test(unit.unitCode))
          .map((unit) => ({
            url: `${BASE_URL}/unit/${unit.unitCode.toLowerCase()}`,
            changefreq: 'weekly',
            priority: 0.7,
          }))
      );
    }
    sitemaps['sitemap-index.xml'] = sitemapIndex(Object.keys(sitemaps));

    for (const [file, xml] of Object.entries(sitemaps)) {
      fs.writeFileSync(path.join(OUTPUT_DIR, file), xml);
    }
    console.log('All sitemaps generated successfully');
  } catch (error) {
    console.error('Error generating sitemap:', error);
  } finally {
    await mongoose.disconnect();
  }
}

void generateSitemaps();
