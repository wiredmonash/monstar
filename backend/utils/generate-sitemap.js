const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_CONN_STRING;
const TODAY = new Date().toISOString().split('T')[0];

// Generate the sitemaps
generateSitemaps();

/**
 * * Generate Sitemaps
 *
 * Generates a sitemap.xml file for SEO purposes.
 */
async function generateSitemaps() {
  let connection = null;

  try {
    // Connect to MongoDB
    mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Import Unit Model
    const Unit = require('../models/unit');
    const SETU = require('../models/setu');

    const staticUrls = [
      {
        url: 'https://monstar.wired.org.au/',
        changefreq: 'weekly',
        priority: 1.0,
      },
      {
        url: 'https://monstar.wired.org.au/list',
        changefreq: 'daily',
        priority: 0.8,
      },
      {
        url: 'https://monstar.wired.org.au/about',
        changefreq: 'monthly',
        priority: 0.6,
      },
      {
        url: 'https://monstar.wired.org.au/terms-and-conditions',
        changefreq: 'monthly',
        priority: 0.5,
      },
      {
        url: 'https://monstar.wired.org.au/map',
        changefreq: 'weekly',
        priority: 0.7,
      },
    ];

    console.log('Fetching units from database...');
    // Get all units
    const units = await Unit.find({}, 'unitCode');
    console.log(`Found ${units.length} units`);

    // Sort units alphabetically
    const sortedUnits = units.sort((a, b) =>
      a.unitCode.localeCompare(b.unitCode)
    );

    // Split units into groups by first letter
    const unitsAF = sortedUnits.filter((u) => /^[a-f]/i.test(u.unitCode));
    const unitsGM = sortedUnits.filter((u) => /^[g-m]/i.test(u.unitCode));
    const unitsNZ = sortedUnits.filter((u) => /^[n-z]/i.test(u.unitCode));

    console.log(`Units A-F: ${unitsAF.length}`);
    console.log(`Units G-M: ${unitsGM.length}`);
    console.log(`Units N-Z: ${unitsNZ.length}`);

    // Get units with SETU data
    console.log('Fetching units with SETU data...');
    const setuData = await SETU.aggregate([
      { $group: { _id: '$unit_code' } },
      { $project: { unitCode: '$_id', _id: 0 } },
    ]);
    console.log(`Found ${setuData.length} units with SETU data`);

    // Sort SETU data alphabetically
    const sortedSetuData = setuData.sort((a, b) =>
      a.unitCode.localeCompare(b.unitCode)
    );

    // Split SETU data into groups by first letter
    const setuAF = sortedSetuData.filter((u) => /^[a-f]/i.test(u.unitCode));
    const setuGM = sortedSetuData.filter((u) => /^[g-m]/i.test(u.unitCode));
    const setuNZ = sortedSetuData.filter((u) => /^[n-z]/i.test(u.unitCode));

    console.log(`SETU Units A-F: ${setuAF.length}`);
    console.log(`SETU Units G-M: ${setuGM.length}`);
    console.log(`SETU Units N-Z: ${setuNZ.length}`);

    // Generate static sitemap
    const staticSitemap = generateStandardSitemapXML(staticUrls);

    // Generate unit sitemaps
    const unitsAFSitemap = generateUnitSitemapXML(unitsAF);
    const unitsGMSitemap = generateUnitSitemapXML(unitsGM);
    const unitsNZSitemap = generateUnitSitemapXML(unitsNZ);

    // Generate SETU sitemaps
    const setuAFSitemap = generateSetuSitemapXML(setuAF);
    const setuGMSitemap = generateSetuSitemapXML(setuGM);
    const setuNZSitemap = generateSetuSitemapXML(setuNZ);

    // Generate sitemap index
    const sitemapIndex = generateSitemapIndexXML();

    // Output directory
    const outputDir = path.join(__dirname, '..', '..', 'frontend', 'public');

    // Write sitemaps to files
    fs.writeFileSync(path.join(outputDir, 'sitemap-index.xml'), sitemapIndex);
    fs.writeFileSync(path.join(outputDir, 'sitemap-static.xml'), staticSitemap);
    fs.writeFileSync(
      path.join(outputDir, 'sitemap-units-a-f.xml'),
      unitsAFSitemap
    );
    fs.writeFileSync(
      path.join(outputDir, 'sitemap-units-g-m.xml'),
      unitsGMSitemap
    );
    fs.writeFileSync(
      path.join(outputDir, 'sitemap-units-n-z.xml'),
      unitsNZSitemap
    );
    fs.writeFileSync(
      path.join(outputDir, 'sitemap-setu-a-f.xml'),
      setuAFSitemap
    );
    fs.writeFileSync(
      path.join(outputDir, 'sitemap-setu-g-m.xml'),
      setuGMSitemap
    );
    fs.writeFileSync(
      path.join(outputDir, 'sitemap-setu-n-z.xml'),
      setuNZSitemap
    );

    // Write the full sitemap for backward compatibility
    const allUnits = [...sortedUnits];
    const fullSitemap = generateFullSitemapXML(
      [...staticUrls],
      allUnits,
      sortedSetuData
    );
    fs.writeFileSync(path.join(outputDir, 'sitemap.xml'), fullSitemap);

    console.log('All sitemaps generated successfully');
  } catch (error) {
    console.error('Error generating sitemap:', error);
  } finally {
    if (connection) {
      console.log('Disconnecting from MongoDB');
      await mongoose.disconnect();
    }
  }
}

/**
 * * Generate XML for standard sitemap
 *
 * @param urls The list of pages to generate XML for
 * @param units The list of units to generate XML for (optional)
 */
function generateStandardSitemapXML(urls) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Add static URLs
  urls.forEach((page) => {
    xml += '  <url>\n';
    xml += `    <loc>${page.url}</loc>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `    <lastmod>${TODAY}</lastmod>\n`;
    xml += '  </url>\n';
  });

  xml += '</urlset>';
  return xml;
}

/**
 * * Generate XML for a unit-specific sitemap
 *
 * @param units The list of units to generate URLs for
 */
function generateUnitSitemapXML(units) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  units.forEach((unit) => {
    const unitCode = unit.unitCode.toLowerCase();

    xml += '  <url>\n';
    xml += `    <loc>https://monstar.wired.org.au/unit/${unitCode}</loc>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.7</priority>\n';
    xml += `    <lastmod>${TODAY}</lastmod>\n`;
    xml += '  </url>\n';
  });

  xml += '</urlset>';
  return xml;
}
/**
 * * Generate XML for a SETU-specifc sitemap
 *
 * @param setuUnits The list of units with SETU data to generate URLS for
 */
function generateSetuSitemapXML(setuUnits) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  setuUnits.forEach((unit) => {
    const unitCode = unit.unitCode.toLowerCase();

    xml += '  <url>\n';
    xml += `    <loc>https://monstar.wired.org.au/setu/${unitCode}</loc>\n`;
    xml += '    <changefreq>monthly</changefreq>\n';
    xml += '    <priority>0.6</priority>\n';
    xml += `    <lastmod>${TODAY}</lastmod>\n`;
    xml += '  </url>\n';
  });

  xml += '</urlset>';
  return xml;
}

/**
 * * Generate XML For the full sitemap (all pages)
 *
 * @param urls The list of static pages
 * @param units The list of unit pages
 * @param setuUnits the list of units with SETU data
 */
function generateFullSitemapXML(urls, units = [], setuUnits = []) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Add static URLs
  urls.forEach((page) => {
    xml += '  <url>\n';
    xml += `    <loc>${page.url}</loc>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `    <lastmod>${TODAY}</lastmod>\n`;
    xml += '  </url>\n';
  });

  // Add unit URLs
  units.forEach((unit) => {
    const unitCode = unit.unitCode.toLowerCase();

    xml += '  <url>\n';
    xml += `    <loc>https://monstar.wired.org.au/unit/${unitCode}</loc>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.7</priority>\n';
    xml += `    <lastmod>${TODAY}</lastmod>\n`;
    xml += '  </url>\n';
  });

  // Add SETU URLs
  setuUnits.forEach((unit) => {
    const unitCode = unit.unitCode.toLowerCase();

    xml += '  <url>\n';
    xml += `    <loc>https://monstar.wired.org.au/setu/${unitCode}</loc>\n`;
    xml += '    <changefreq>monthly</changefreq>\n';
    xml += '    <priority>0.6</priority>\n';
    xml += `    <lastmod>${TODAY}</lastmod>\n`;
    xml += '  </url>\n';
  });

  xml += '</urlset>';
  return xml;
}

/**
 * * Generate Sitemap Index
 *
 * This will generate the index sitemap when using the split sitemap format
 */
function generateSitemapIndexXML() {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Static pages sitemaps
  xml += '  <sitemap>\n';
  xml += '    <loc>https://monstar.wired.org.au/sitemap-static.xml</loc>\n';
  xml += `    <lastmod>${TODAY}</lastmod>\n`;
  xml += '  </sitemap>\n';

  // Unit sitemaps
  xml += '  <sitemap>\n';
  xml += '    <loc>https://monstar.wired.org.au/sitemap-units-a-f.xml</loc>\n';
  xml += `    <lastmod>${TODAY}</lastmod>\n`;
  xml += '  </sitemap>\n';

  xml += '  <sitemap>\n';
  xml += '    <loc>https://monstar.wired.org.au/sitemap-units-g-m.xml</loc>\n';
  xml += `    <lastmod>${TODAY}</lastmod>\n`;
  xml += '  </sitemap>\n';

  xml += '  <sitemap>\n';
  xml += '    <loc>https://monstar.wired.org.au/sitemap-units-n-z.xml</loc>\n';
  xml += `    <lastmod>${TODAY}</lastmod>\n`;
  xml += '  </sitemap>\n';

  // Setu sitemaps
  xml += '  <sitemap>\n';
  xml += '    <loc>https://monstar.wired.org.au/sitemap-setu-a-f.xml</loc>\n';
  xml += `    <lastmod>${TODAY}</lastmod>\n`;
  xml += '  </sitemap>\n';

  xml += '  <sitemap>\n';
  xml += '    <loc>https://monstar.wired.org.au/sitemap-setu-g-m.xml</loc>\n';
  xml += `    <lastmod>${TODAY}</lastmod>\n`;
  xml += '  </sitemap>\n';

  xml += '  <sitemap>\n';
  xml += '    <loc>https://monstar.wired.org.au/sitemap-setu-n-z.xml</loc>\n';
  xml += `    <lastmod>${TODAY}</lastmod>\n`;
  xml += '  </sitemap>\n';

  xml += '</sitemapindex>';
  return xml;
}
