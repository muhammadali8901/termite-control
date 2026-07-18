const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const sitemapFile = path.join(rootDir, 'sitemap.xml');

const directories = [
  { dir: rootDir, priority: '0.8' },
  { dir: path.join(rootDir, 'services'), priority: '0.6' },
  { dir: path.join(rootDir, 'locations'), priority: '0.6' },
  { dir: path.join(rootDir, 'blog'), priority: '0.6' }
];

function getHtmlFiles(dir) {
  try {
    return fs.readdirSync(dir)
      .filter(file => file.endsWith('.html'))
      .map(file => path.join(dir, file));
  } catch (err) {
    return [];
  }
}

const urls = [];
const today = new Date().toISOString().split('T')[0];

for (const item of directories) {
  const files = getHtmlFiles(item.dir);
  for (const file of files) {
    const fileRel = path.relative(rootDir, file).replace(/\\/g, '/');
    
    // Skip 404 and privacy policy from main SEO priority
    if (fileRel === '404.html') continue;
    
    let cleanPath = fileRel.replace(/\.html$/, '').replace(/\/index$/, '').replace(/^index$/, '');
    if (cleanPath && !cleanPath.startsWith('/')) {
      cleanPath = '/' + cleanPath;
    }
    
    let priority = item.priority;
    if (cleanPath === '') {
      priority = '1.0'; // Home page
    }
    
    urls.push({
      loc: `https://termitecontrolpaterson.online${cleanPath}`,
      lastmod: today,
      changefreq: 'monthly',
      priority: priority
    });
  }
}

// Generate XML
let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

for (const url of urls) {
  xml += '    <url>\n';
  xml += `        <loc>${url.loc}</loc>\n`;
  xml += `        <lastmod>${url.lastmod}</lastmod>\n`;
  xml += `        <changefreq>${url.changefreq}</changefreq>\n`;
  xml += `        <priority>${url.priority}</priority>\n`;
  xml += '    </url>\n';
}

xml += '</urlset>\n';

fs.writeFileSync(sitemapFile, xml, 'utf8');
console.log(`Successfully generated sitemap.xml with ${urls.length} URLs!`);
