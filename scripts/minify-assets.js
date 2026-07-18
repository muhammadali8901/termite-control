const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

// Folders/files to exclude from copying to dist
const EXCLUDES = [
  '.git',
  '.agents',
  'node_modules',
  'scripts',
  'package.json',
  'package-lock.json',
  'metadata.json',
  'dist'
];

// Minify HTML
function minifyHtml(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '') // remove comments
    .replace(/\s+/g, ' ')            // collapse multiple spaces/newlines
    .replace(/>\s+</g, '><')          // remove space between tags
    .trim();
}

// Minify CSS
function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // remove comments
    .replace(/\s+/g, ' ')            // collapse multiple spaces
    .replace(/\s*([{}|:;,])\s*/g, '$1') // remove spaces around brackets and punctuation
    .replace(/;}/g, '}')             // remove final semicolon before closing brace
    .trim();
}

// Minify JS
function minifyJs(js) {
  return js
    .replace(/\/\*[\s\S]*?\*\//g, '') // remove multiline comments
    .replace(/\/\/.*$/gm, '')         // remove singleline comments
    .replace(/\s+/g, ' ')             // collapse spaces
    .replace(/\s*([=+\-*/{}()\[\]|&,;:?])\s*/g, '$1') // remove spaces around punctuation/operators
    .trim();
}

// Clean and recreate dist directory
if (fs.existsSync(distDir)) {
  console.log('Cleaning existing dist directory...');
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir);

function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  
  if (stats.isDirectory()) {
    // If directory, check exclusions
    const base = path.basename(src);
    if (EXCLUDES.includes(base)) return;
    
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    
    const children = fs.readdirSync(src);
    for (const child of children) {
      copyRecursive(path.join(src, child), path.join(dest, child));
    }
  } else {
    // File
    const ext = path.extname(src).toLowerCase();
    const base = path.basename(src);
    if (EXCLUDES.includes(base)) return;
    
    // Read and minify or copy directly
    if (ext === '.html') {
      const content = fs.readFileSync(src, 'utf8');
      fs.writeFileSync(dest, minifyHtml(content), 'utf8');
      console.log(`Minified and copied: ${path.relative(rootDir, src)}`);
    } else if (ext === '.css') {
      const content = fs.readFileSync(src, 'utf8');
      fs.writeFileSync(dest, minifyCss(content), 'utf8');
      console.log(`Minified and copied: ${path.relative(rootDir, src)}`);
    } else if (ext === '.js') {
      const content = fs.readFileSync(src, 'utf8');
      fs.writeFileSync(dest, minifyJs(content), 'utf8');
      console.log(`Minified and copied: ${path.relative(rootDir, src)}`);
    } else {
      // Binary file
      fs.copyFileSync(src, dest);
    }
  }
}

console.log('Starting asset minification...');
const children = fs.readdirSync(rootDir);
for (const child of children) {
  copyRecursive(path.join(rootDir, child), path.join(distDir, child));
}
console.log('Minification completed! Output saved in /dist/');
