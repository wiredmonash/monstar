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

        const staticUrls = [
            { url: 'https://monstar.wired.org.au/', changefreq: 'weekly', priority: 1.0 },
            { url: 'https://monstar.wired.org.au/list', changefreq: 'daily', priority: 0.8 },
            { url: 'https://monstar.wired.org.au/about', changefreq: 'monthly', priority: 0.6 },
            { url: 'https://monstar.wired.org.au/terms-and-conditions', changefreq: 'monthly', priority: 0.5 },
            { url: 'https://monstar.wired.org.au/map', changefreq: 'weekly', priority: 0.7 }
        ];

        console.log('Fetching units from database...');
        // Get all units
        const units = await Unit.find({}, 'unitCode');
        console.log(`Found ${units.length} units`);

        // Sort units alphabetically
        const sortedUnits = units.sort((a,b) => a.unitCode.localeCompare(b.unitCode));

        // Split units into groups by first letter
        const unitsAF = sortedUnits.filter(u => /^[a-f]/i.test(u.unitCode));
        const unitsGM = sortedUnits.filter(u => /^[g-m]/i.test(u.unitCode));
        const unitsNZ = sortedUnits.filter(u => /^[n-z]/i.test(u.unitCode));
        
        console.log(`Units A-F: ${unitsAF.length}`);
        console.log(`Units G-M: ${unitsGM.length}`);
        console.log(`Units N-Z: ${unitsNZ.length}`);

        // Generate static sitemap
        const staticSitemap = generateStandardSitemapXML(staticUrls);

        // Generate unit sitemaps
        const unitsAFSitemap = generateUnitSitemapXML(unitsAF);
        const unitsGMSitemap = generateUnitSitemapXML(unitsGM);
        const unitsNZSitemap = generateUnitSitemapXML(unitsNZ);

        // Generate sitemap index
        const sitemapIndex = generateSitemapIndexXML();

        // Output directory
        const outputDir = path.join(__dirname, '..', '..', 'frontend', 'public');

        // Write sitemaps to files
        fs.writeFileSync(path.join(outputDir, 'sitemap-index.xml'), sitemapIndex);
        fs.writeFileSync(path.join(outputDir, 'sitemap-static.xml'), staticSitemap);
        fs.writeFileSync(path.join(outputDir, 'sitemap-units-a-f.xml'), unitsAFSitemap);
        fs.writeFileSync(path.join(outputDir, 'sitemap-units-g-m.xml'), unitsGMSitemap);
        fs.writeFileSync(path.join(outputDir, 'sitemap-units-n-z.xml'), unitsNZSitemap);

        // Write the full sitemap for backward compatibility
        const allUnits = [...sortedUnits];
        const fullSitemap = generateStandardSitemapXML([...staticUrls], allUnits);
        fs.writeFileSync(path.join(outputDir, 'sitemap.xml'), fullSitemap);

        console.log('All sitemaps generated successfully');
    }
    catch (error) {
        console.error('Error generating sitemap:', error);
    }
    finally {
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
function generateStandardSitemapXML(urls, units = []) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Add static URLs
    urls.forEach(page => {
        xml += '  <url>\n';
        xml += `    <loc>${page.url}</loc>\n`;
        xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
        xml += `    <priority>${page.priority}</priority>\n`;
        xml += `    <lastmod>${TODAY}</lastmod>\n`;
        xml += '  </url>\n';
    });
    
    // Add unit URLs
    if (units && units.length) {
        units.forEach(unit => {
            const unitCode = unit.unitCode.toLowerCase();

            xml += '  <url>\n';
            xml += `    <loc>https://monstar.wired.org.au/unit/${unitCode}</loc>\n`;
            xml += '    <changefreq>daily</changefreq>\n';
            xml += '    <priority>0.7</priority>\n';
            xml += `    <lastmod>${TODAY}</lastmod>\n`;
            xml += '  </url>\n';
        });
    }
    
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
    
    units.forEach(unit => {
        const unitCode = unit.unitCode.toLowerCase();

        xml += '  <url>\n';
        xml += `    <loc>https://monstar.wired.org.au/unit/${unitCode}</loc>\n`;
        xml += '    <changefreq>daily</changefreq>\n';
        xml += '    <priority>0.7</priority>\n';
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
    
    xml += '  <sitemap>\n';
    xml += '    <loc>https://monstar.wired.org.au/sitemap-static.xml</loc>\n';
    xml += `    <lastmod>${TODAY}</lastmod>\n`;
    xml += '  </sitemap>\n';
    
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
    
    xml += '</sitemapindex>';
    return xml;
}