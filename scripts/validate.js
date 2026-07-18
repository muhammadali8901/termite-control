const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const directories = [
  rootDir,
  path.join(rootDir, 'services'),
  path.join(rootDir, 'locations'),
  path.join(rootDir, 'blog')
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

const allFiles = [];
for (const dir of directories) {
  allFiles.push(...getHtmlFiles(dir));
}

let errors = 0;
let warnings = 0;

function reportError(file, msg) {
  console.error(`ERROR in [${file}]: ${msg}`);
  errors++;
}

function reportWarning(file, msg) {
  console.warn(`WARNING in [${file}]: ${msg}`);
  warnings++;
}

console.log('Running automated validation check...\n');

// 1. Validate Sitemap
const sitemapPath = path.join(rootDir, 'sitemap.xml');
if (!fs.existsSync(sitemapPath)) {
  reportError('sitemap.xml', 'File is missing!');
} else {
  const xml = fs.readFileSync(sitemapPath, 'utf8');
  if (xml.includes('.html')) {
    reportError('sitemap.xml', 'Contains .html links!');
  }
}

// 2. Validate Robots.txt
const robotsPath = path.join(rootDir, 'robots.txt');
if (!fs.existsSync(robotsPath)) {
  reportError('robots.txt', 'File is missing!');
}

// 3. Validate HTML Files
for (const file of allFiles) {
  const fileRel = path.relative(rootDir, file).replace(/\\/g, '/');
  const content = fs.readFileSync(file, 'utf8');

  // Skip 404 for some rules (like canonical clean url redirects)
  const is404 = fileRel === '404.html';

  // Check single H1 tag
  const h1Match = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi);
  if (!h1Match) {
    reportError(fileRel, 'Missing <h1> tag!');
  } else if (h1Match.length > 1) {
    reportError(fileRel, `Multiple <h1> tags found (${h1Match.length})!`);
  }

  // Check Heading Hierarchy
  const headingTagRegex = /<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>/gi;
  const headings = [];
  let m;
  while ((m = headingTagRegex.exec(content)) !== null) {
    headings.push(parseInt(m[1]));
  }
  
  if (headings.length > 0) {
    let prev = 1;
    for (let i = 0; i < headings.length; i++) {
      const curr = headings[i];
      if (curr > prev + 1) {
        reportError(fileRel, `Heading hierarchy jump from h${prev} to h${curr}!`);
      }
      prev = curr;
    }
  }

  // Check Canonical Tag
  const canonicalMatch = content.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/i) ||
                         content.match(/<link[^>]*href="([^"]*)"[^>]*rel="canonical"/i);
  if (!canonicalMatch) {
    reportError(fileRel, 'Missing canonical link tag!');
  } else {
    const href = canonicalMatch[1];
    if (href.endsWith('.html')) {
      reportError(fileRel, `Canonical link contains .html: ${href}`);
    }
    if (href.endsWith('/') && href !== 'https://termitecontrolpaterson.online/') {
      reportError(fileRel, `Canonical link has trailing slash: ${href}`);
    }
  }

  // Check image tags (width, height, loading, src)
  const imgRegex = /<img\s+([^>]+)>/gi;
  let imgMatch;
  while ((imgMatch = imgRegex.exec(content)) !== null) {
    const attrsStr = imgMatch[1];
    const attrs = {};
    const attrRegex =/([a-z-]+)="([^"]*)"/gi;
    let attrM;
    while ((attrM = attrRegex.exec(attrsStr)) !== null) {
      attrs[attrM[1].toLowerCase()] = attrM[2];
    }

    const src = attrs['src'];
    const alt = attrs['alt'];
    const width = attrs['width'];
    const height = attrs['height'];
    const loading = attrs['loading'];

    if (!src) {
      reportError(fileRel, 'Image tag missing src attribute!');
      continue;
    }

    // Logo image usually doesn't lazy load
    const isLogo = src.includes('logo') || (alt && alt.toLowerCase().includes('logo'));

    // Check dimensions
    if (!width || !height) {
      reportError(fileRel, `Image missing dimensions (width/height): ${src}`);
    }

    // Check lazy loading
    if (!isLogo && loading !== 'lazy') {
      reportWarning(fileRel, `Image missing loading="lazy": ${src}`);
    }
    if (isLogo && loading === 'lazy') {
      reportWarning(fileRel, `Logo image has loading="lazy" (should be eager): ${src}`);
    }

    // Check if src is root-relative (starts with /)
    if (!src.startsWith('/') && !src.startsWith('http')) {
      reportError(fileRel, `Image src is not root-relative: ${src}`);
    }
  }

  // Check internal links (href)
  const linkRegex = /<a\s+([^>]+)>/gi;
  let linkMatch;
  while ((linkMatch = linkRegex.exec(content)) !== null) {
    const attrsStr = linkMatch[1];
    const attrs = {};
    const attrRegex =/([a-z-]+)="([^"]*)"/gi;
    let attrM;
    while ((attrM = attrRegex.exec(attrsStr)) !== null) {
      attrs[attrM[1].toLowerCase()] = attrM[2];
    }

    const href = attrs['href'];
    if (href) {
      const isExternal = href.startsWith('http') || href.startsWith('tel:') || href.startsWith('mailto:') || href.startsWith('javascript:');
      const isHash = href.startsWith('#');
      
      if (!isExternal && !isHash) {
        if (href.includes('.html')) {
          reportError(fileRel, `Internal link contains .html: ${href}`);
        }
        if (!href.startsWith('/')) {
          reportError(fileRel, `Internal link is not root-relative: ${href}`);
        }
      }
    }
  }

  // Check GTM / GA4 analytics slots
  if (!content.includes('<!-- Google Tag Manager / Analytics Head Section Placeholder -->')) {
    reportWarning(fileRel, 'Missing GTM Head placeholder!');
  }
  if (!content.includes('<!-- Google Tag Manager (noscript) Placeholder -->')) {
    reportWarning(fileRel, 'Missing GTM Body placeholder!');
  }
}

console.log(`\nValidation complete. Found ${errors} error(s) and ${warnings} warning(s).`);
if (errors === 0) {
  console.log('SUCCESS: Codebase is 100% compliant with the SEO and structural rules!');
} else {
  console.log('FAILURE: Please fix the errors above.');
}
process.exit(errors > 0 ? 1 : 0);
