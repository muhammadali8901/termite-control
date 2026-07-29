const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

function getHtmlFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (file !== '.git' && file !== 'node_modules') {
        results = results.concat(getHtmlFiles(filePath));
      }
    } else if (file.endsWith('.html')) {
      results.push(filePath);
    }
  });
  return results;
}

const htmlFiles = getHtmlFiles(rootDir);
console.log(`Found ${htmlFiles.length} HTML files.`);

const newFooterHtml = `<footer class="t6-band-ink" style="position:relative;padding:3.5rem 0 2rem;">
  <div class="t6-container">
    <div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:2rem;align-items:center;border-bottom:1px solid rgba(255,255,255,.12);padding-bottom:2rem;margin-bottom:1.5rem;">
      <div>
        <h3 style="color:#fff;margin:0 0 .4rem;font-size:1.3rem;font-weight:700;">Termite Control Paterson</h3>
        <p style="color:rgba(255,255,255,.9);margin:0 0 .25rem;font-size:.95rem;">Phone: <a href="tel:+18622882865" style="color:#fff;text-decoration:none;font-weight:600;">+1 (862) 288-2865</a></p>
        <p style="color:rgba(255,255,255,.75);margin:0;font-size:.95rem;">Address: Main Street, Paterson, NJ 07505</p>
      </div>
      <div>
        <a href="tel:+18622882865" class="t6-btn t6-btn-primary">Call +1 (862) 288-2865</a>
      </div>
    </div>

    <div style="color:rgba(255,255,255,.6);font-size:.85rem;display:flex;flex-wrap:wrap;justify-content:space-between;gap:1rem;">
      <p style="margin:0;">&copy; 2026 Termite Control Paterson. All rights reserved. | Designed &amp; Developed by <a href="https://imrandigitals.online/" target="_blank" rel="noopener" style="color:rgba(255,255,255,0.8);text-decoration:underline;">Imran Digitals</a></p>
      <p style="margin:0;"><a href="/privacy-policy" style="color:rgba(255,255,255,.6);text-decoration:none;">Privacy Policy</a> | <a href="/sitemap.xml" style="color:rgba(255,255,255,.6);text-decoration:none;">Sitemap</a></p>
    </div>
  </div>
</footer>`;

htmlFiles.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Replace phone numbers
  content = content.replace(/\+1\s*\(862\)\s*475-0111/g, '+1 (862) 288-2865');
  content = content.replace(/\(862\)\s*475-0111/g, '(862) 288-2865');
  content = content.replace(/\+18624750111/g, '+18622882865');
  content = content.replace(/8624750111/g, '8622882865');
  content = content.replace(/862-475-0111/g, '862-288-2865');

  // 2. Remove license claims
  content = content.replace(/Licensed\s*&amp;\s*Insured\s*Local\s*Exterminators\s*\|\s*NJDEP\s*License\s*#99482A/gi, 'Local Termite & Pest Control Services in Paterson, NJ');
  content = content.replace(/Licensed,\s*insured\s*termite\s*control\s*pros/gi, 'Local termite control experts');
  content = content.replace(/Licensed\s*&amp;\s*insured\./gi, 'Professional local service.');
  content = content.replace(/Licensed\s*NJDEP\s*pest\s*exterminators/gi, 'Professional pest exterminators');
  content = content.replace(/Licensed\s*and\s*insured\s*local\s*pest\s*exterminators/gi, 'Professional local pest exterminators');
  content = content.replace(/Licensed\s*inspectors/gi, 'Professional inspectors');
  content = content.replace(/NJDEP\s*Licensed/gi, 'Local Experts');
  content = content.replace(/<li><strong>NJDEP License #99482A:<\/strong>[^<]*<\/li>/gi, '');

  // 3. Replace footer section with standard NAP footer
  content = content.replace(/<footer[\s\S]*?<\/footer>/i, newFooterHtml);

  fs.writeFileSync(filePath, content, 'utf8');
});
console.log('Processed all HTML files.');

// Process metadata.json
const metaPath = path.join(rootDir, 'metadata.json');
if (fs.existsSync(metaPath)) {
  let metaStr = fs.readFileSync(metaPath, 'utf8');
  metaStr = metaStr.replace(/\+1\s*\(862\)\s*475-0111/g, '+1 (862) 288-2865');
  metaStr = metaStr.replace(/\(862\)\s*475-0111/g, '(862) 288-2865');
  metaStr = metaStr.replace(/\+18624750111/g, '+18622882865');
  metaStr = metaStr.replace(/8624750111/g, '8622882865');
  metaStr = metaStr.replace(/862-475-0111/g, '862-288-2865');
  metaStr = metaStr.replace(/NJDEP\s*Licensed/gi, 'Professional');
  metaStr = metaStr.replace(/NJDEP\s*License\s*#99482A/gi, '');
  fs.writeFileSync(metaPath, metaStr, 'utf8');
  console.log('Processed metadata.json.');
}
