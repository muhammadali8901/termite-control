const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const metaFile = path.join(rootDir, 'metadata.json');

// Check if metadata.json exists
if (!fs.existsSync(metaFile)) {
  console.error('Error: metadata.json does not exist. Run extract-meta.js first.');
  process.exit(1);
}

const metadata = JSON.parse(fs.readFileSync(metaFile, 'utf8'));

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

// Image Dimension Parser
function getImageSize(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const buffer = fs.readFileSync(filePath);
  
  // PNG
  if (buffer.toString('ascii', 1, 4) === 'PNG') {
    const width = buffer.readInt32BE(16);
    const height = buffer.readInt32BE(20);
    return { width, height, type: 'png' };
  }
  
  // JPEG
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
    let offset = 2;
    while (offset < buffer.length) {
      if (offset + 2 > buffer.length) break;
      const marker = buffer.readUInt16BE(offset);
      offset += 2;
      
      if (marker >= 0xFFC0 && marker <= 0xFFCF && marker !== 0xFFC4 && marker !== 0xFFC8 && marker !== 0xFFCC) {
        if (offset + 7 > buffer.length) break;
        const height = buffer.readUInt16BE(offset + 3);
        const width = buffer.readUInt16BE(offset + 5);
        return { width, height, type: 'jpeg' };
      }
      
      if (offset + 2 > buffer.length) break;
      const length = buffer.readUInt16BE(offset);
      offset += length;
    }
  }
  
  // WebP
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    const type = buffer.toString('ascii', 12, 16);
    
    if (type === 'VP8X') {
      if (buffer.length >= 30) {
        const width = (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16)) + 1;
        const height = (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16)) + 1;
        return { width, height, type: 'webp-vp8x' };
      }
    }
    
    if (type === 'VP8 ') {
      if (buffer.length >= 30) {
        const width = buffer[26] | (buffer[27] << 8);
        const height = buffer[28] | (buffer[29] << 8);
        return { width, height, type: 'webp-vp8' };
      }
    }
    
    if (type === 'VP8L') {
      if (buffer.length >= 25) {
        const b0 = buffer[21];
        const b1 = buffer[22];
        const b2 = buffer[23];
        const b3 = buffer[24];
        const width = 1 + (b0 | ((b1 & 0x3f) << 8));
        const height = 1 + (((b1 & 0xc0) >> 6) | (b2 << 2) | ((b3 & 0x0f) << 10));
        return { width, height, type: 'webp-vp8l' };
      }
    }
  }
  
  return null;
}

// Helper to resolve standard paths to clean root-relative URLs
function cleanUrlPath(currentFileRel, href) {
  // If it's empty, external, anchor or root relative, keep as is
  if (!href || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('tel:') || href.startsWith('mailto:') || href.startsWith('javascript:') || href.startsWith('#') || href.startsWith('/')) {
    return href;
  }

  // Split path from hash/query
  const parts = href.split(/([?#].*)/);
  const linkPath = parts[0];
  const suffix = parts[1] || '';

  if (!linkPath) return href;

  const currentDir = path.dirname(currentFileRel);
  let resolved = path.join(currentDir, linkPath).replace(/\\/g, '/');

  // Strip .html
  resolved = resolved.replace(/\.html$/, '');

  // Strip trailing '/index' or 'index'
  resolved = resolved.replace(/\/index$/, '').replace(/^index$/, '');

  // Make root relative
  if (!resolved.startsWith('/')) {
    resolved = '/' + resolved;
  }

  // Remove duplicate slashes
  resolved = resolved.replace(/\/+/g, '/');

  // Remove trailing slash for uniformity unless it's just '/'
  if (resolved.length > 1 && resolved.endsWith('/')) {
    resolved = resolved.slice(0, -1);
  }

  return resolved + suffix;
}

// Helper to resolve assets path to root-relative
function cleanAssetPath(currentFileRel, src) {
  if (!src || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/')) {
    return src;
  }
  const currentDir = path.dirname(currentFileRel);
  let resolved = path.join(currentDir, src).replace(/\\/g, '/');
  if (!resolved.startsWith('/')) {
    resolved = '/' + resolved;
  }
  return resolved.replace(/\/+/g, '/');
}

for (const file of allFiles) {
  const fileRel = path.relative(rootDir, file).replace(/\\/g, '/');
  console.log(`\nOptimizing page: ${fileRel}`);
  
  let content = fs.readFileSync(file, 'utf8');
  const fileMeta = metadata[fileRel] || { title: '', description: '', schemas: [] };
  
  // 1. Resolve Canonical URL
  let cleanCanonicalPath = fileRel.replace(/\.html$/, '').replace(/\/index$/, '').replace(/^index$/, '');
  if (cleanCanonicalPath && !cleanCanonicalPath.startsWith('/')) {
    cleanCanonicalPath = '/' + cleanCanonicalPath;
  }
  const canonicalUrl = `https://termitecontrolpaterson.online${cleanCanonicalPath}`;

  // Ensure GTM/GA4 placeholders
  const gtmHeadSlot = `<!-- Google Tag Manager / Analytics Head Section Placeholder -->`;
  const gtmBodySlot = `<!-- Google Tag Manager (noscript) Placeholder -->`;

  // 2. Parse head and body
  const headMatch = content.match(/<head>([\s\S]*?)<\/head>/i);
  if (!headMatch) {
    console.warn(`Warning: No <head> found in ${fileRel}`);
    continue;
  }
  
  let headContent = headMatch[1];
  
  // Update/inject Title Tag
  if (fileMeta.title) {
    if (headContent.match(/<title>([\s\S]*?)<\/title>/i)) {
      headContent = headContent.replace(/<title>([\s\S]*?)<\/title>/i, `<title>${fileMeta.title}</title>`);
    } else {
      headContent = `<title>${fileMeta.title}</title>\n    ` + headContent;
    }
  }

  // Update/inject Meta Description
  if (fileMeta.description) {
    const descRegex = /<meta[^>]*name="description"[^>]*content="[^"]*"[^>]*>/i ||
                      /<meta[^>]*content="[^"]*"[^>]*name="description"[^>]*>/i;
    if (headContent.match(descRegex)) {
      headContent = headContent.replace(descRegex, `<meta name="description" content="${fileMeta.description}">`);
    } else if (headContent.match(/<meta[^>]*name="description"[^>]*>/i)) {
      headContent = headContent.replace(/<meta[^>]*name="description"[^>]*>/i, `<meta name="description" content="${fileMeta.description}">`);
    } else {
      headContent = `<meta name="description" content="${fileMeta.description}">\n    ` + headContent;
    }
  }

  // Update/inject Canonical
  const canonicalRegex = /<link[^>]*rel="canonical"[^>]*href="[^"]*"[^>]*>/i ||
                        /<link[^>]*href="[^"]*"[^>]*rel="canonical"[^>]*>/i;
  if (headContent.match(canonicalRegex)) {
    headContent = headContent.replace(canonicalRegex, `<link rel="canonical" href="${canonicalUrl}">`);
  } else if (headContent.match(/<link[^>]*rel="canonical"[^>]*>/i)) {
    headContent = headContent.replace(/<link[^>]*rel="canonical"[^>]*>/i, `<link rel="canonical" href="${canonicalUrl}">`);
  } else {
    headContent = `<link rel="canonical" href="${canonicalUrl}">\n    ` + headContent;
  }

  // Update Open Graph url, title, description
  if (headContent.match(/<meta[^>]*property="og:url"[^>]*>/i)) {
    headContent = headContent.replace(/<meta[^>]*property="og:url"[^>]*content="[^"]*"[^>]*>/i, `<meta property="og:url" content="${canonicalUrl}">`);
  } else {
    headContent = `<meta property="og:url" content="${canonicalUrl}">\n    ` + headContent;
  }

  if (fileMeta.title) {
    if (headContent.match(/<meta[^>]*property="og:title"[^>]*>/i)) {
      headContent = headContent.replace(/<meta[^>]*property="og:title"[^>]*content="[^"]*"[^>]*>/i, `<meta property="og:title" content="${fileMeta.title}">`);
    } else {
      headContent = `<meta property="og:title" content="${fileMeta.title}">\n    ` + headContent;
    }
  }

  if (fileMeta.description) {
    if (headContent.match(/<meta[^>]*property="og:description"[^>]*>/i)) {
      headContent = headContent.replace(/<meta[^>]*property="og:description"[^>]*content="[^"]*"[^>]*>/i, `<meta property="og:description" content="${fileMeta.description}">`);
    } else {
      headContent = `<meta property="og:description" content="${fileMeta.description}">\n    ` + headContent;
    }
  }

  // Handle JSON-LD Schema (remove existing, inject new)
  headContent = headContent.replace(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi, '');
  if (fileMeta.schemas && fileMeta.schemas.length > 0) {
    let schemaBlock = '';
    for (const schema of fileMeta.schemas) {
      schemaBlock += `\n    <script type="application/ld+json">\n${JSON.stringify(schema, null, 2).split('\n').map(l => '    ' + l).join('\n')}\n    </script>`;
    }
    headContent = headContent + schemaBlock;
  }

  // Ensure GTM Head Section
  if (!headContent.includes(gtmHeadSlot)) {
    headContent = `\n    ${gtmHeadSlot}\n    ` + headContent;
  }

  // Replace head content
  content = content.replace(/<head>([\s\S]*?)<\/head>/i, `<head>${headContent}</head>`);

  // Ensure GTM Body Section
  const bodyTagMatch = content.match(/<body[^>]*>/i);
  if (bodyTagMatch) {
    const bodyTag = bodyTagMatch[0];
    const bodyIndex = content.indexOf(bodyTag) + bodyTag.length;
    // Check if placeholder is already present near start of body
    const sample = content.substring(bodyIndex, bodyIndex + 200);
    if (!sample.includes(gtmBodySlot)) {
      content = content.slice(0, bodyIndex) + `\n    ${gtmBodySlot}` + content.slice(bodyIndex);
    }
  }

  // 3. Process tags using a token/state machine or regex replacements
  
  // A. Replace internal links (href)
  content = content.replace(/(href=")([^"]+)(")/gi, (match, prefix, href, suffix) => {
    // If it's a relative stylesheet link, we handle it as asset path later
    if (href.endsWith('.css') || href.endsWith('.js') || href.startsWith('assets/') || href.startsWith('../assets/')) {
      return prefix + cleanAssetPath(fileRel, href) + suffix;
    }
    const clean = cleanUrlPath(fileRel, href);
    return prefix + clean + suffix;
  });

  // B. Replace asset paths for stylesheets and scripts
  content = content.replace(/(src=")([^"]+)(")/gi, (match, prefix, src, suffix) => {
    // Ignore external scripts or absolute root relative
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/')) {
      return match;
    }
    const clean = cleanAssetPath(fileRel, src);
    return prefix + clean + suffix;
  });
  
  // C. Repeat for link hrefs that are assets
  content = content.replace(/(href=")([^"]+)(")/gi, (match, prefix, href, suffix) => {
    if (href.endsWith('.css') || href.endsWith('.ico') || href.endsWith('.png') || href.endsWith('.jpg') || href.endsWith('.jpeg') || href.endsWith('.webp')) {
      if (!href.startsWith('http') && !href.startsWith('/')) {
        return prefix + cleanAssetPath(fileRel, href) + suffix;
      }
    }
    return match;
  });

  // D. Image dimensions and lazy loading
  // Match <img> tags and inject width, height, loading attributes
  content = content.replace(/<img\s+([^>]+)>/gi, (match, attrsStr) => {
    // Parse attributes
    const attrs = {};
    const attrRegex =/([a-z-]+)="([^"]*)"/gi;
    let m;
    while ((m = attrRegex.exec(attrsStr)) !== null) {
      attrs[m[1].toLowerCase()] = m[2];
    }
    
    const src = attrs['src'];
    if (src && src.startsWith('/')) {
      const localPath = path.join(rootDir, src);
      if (fs.existsSync(localPath)) {
        const size = getImageSize(localPath);
        if (size) {
          attrs['width'] = String(size.width);
          attrs['height'] = String(size.height);
        }
      }
    }
    
    // Check if inside header (we can find out if it's the logo or not). 
    // Logo usually doesn't lazy load. The rule: "Every image in the content area must default to native lazy loading...".
    // Content area is inside <main>.
    // Since we're processing inline, let's look at the filename or context, or we can check if it's the logo.
    // Let's set loading="lazy" if it is NOT the logo (e.g. contains 'logo' in src or alt).
    const isLogo = src && (src.includes('logo') || attrs['alt'] && attrs['alt'].toLowerCase().includes('logo'));
    if (!isLogo) {
      attrs['loading'] = 'lazy';
    } else {
      // Remove loading attribute if it was previously set to lazy
      delete attrs['loading'];
    }
    
    // Reconstruct tag
    let newAttrsStr = '';
    for (const [key, value] of Object.entries(attrs)) {
      newAttrsStr += `${key}="${value}" `;
    }
    return `<img ${newAttrsStr.trim()} />`;
  });

  // E. Single H1 Rule
  // Match all <h1> tags and replace second and subsequent with <h2>
  let h1Count = 0;
  content = content.replace(/<h1([^>]*)>([\s\S]*?)<\/h1>/gi, (match, attrs, h1Text) => {
    h1Count++;
    if (h1Count > 1) {
      console.log(`  - Converted secondary <h1> to <h2>: "${h1Text.trim().substring(0, 30)}..."`);
      return `<h2${attrs}>${h1Text}</h2>`;
    }
    return match;
  });
  if (h1Count === 0) {
    console.warn(`  - Warning: No <h1> found in ${fileRel}`);
  }

  // F. Heading Hierarchy Check and Fix
  // Scan all heading tags in order and enforce strict hierarchical sequence
  const headings = [];
  const headingTagRegex = /<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>/gi;
  let matchHead;
  while ((matchHead = headingTagRegex.exec(content)) !== null) {
    headings.push({
      full: matchHead[0],
      level: parseInt(matchHead[1]),
      attrs: matchHead[2],
      text: matchHead[3],
      index: matchHead.index
    });
  }

  if (headings.length > 0) {
    let prevLevel = 1; // start hierarchy at level 1 (h1)
    let headingReplacements = [];
    
    for (let i = 0; i < headings.length; i++) {
      const h = headings[i];
      if (h.level > prevLevel + 1) {
        const newLevel = prevLevel + 1;
        console.log(`  - Heading hierarchy jump fixed: <h${h.level}> to <h${newLevel}> ("${h.text.trim().substring(0, 30)}...")`);
        headingReplacements.push({
          target: h.full,
          replacement: `<h${newLevel}${h.attrs}>${h.text}</h${newLevel}>`
        });
        prevLevel = newLevel;
      } else {
        prevLevel = h.level;
      }
    }

    // Apply Replacements
    for (const rep of headingReplacements) {
      content = content.replace(rep.target, rep.replacement);
    }
  }

  // G. Semantic Layout Check
  if (!content.includes('<header')) console.warn(`  - Warning: No <header> element found!`);
  if (!content.includes('<nav')) console.warn(`  - Warning: No <nav> element found!`);
  if (!content.includes('<main')) console.warn(`  - Warning: No <main> element found!`);
  if (!content.includes('<footer')) console.warn(`  - Warning: No <footer> element found!`);

  // Write changes back to file
  fs.writeFileSync(file, content, 'utf8');
}

console.log('\nOptimizations completed successfully!');
