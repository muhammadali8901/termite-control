const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const indexPath = path.join(rootDir, 'index.html');

const indexContent = fs.readFileSync(indexPath, 'utf8');
const headerMatch = indexContent.match(/<header[\s\S]*?<\/header>/i);

if (!headerMatch) {
  console.error('Could not find <header> tag in index.html');
  process.exit(1);
}

const homepageHeader = headerMatch[0];
console.log('Successfully extracted homepage header.');

function getHtmlFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (file !== '.git' && file !== 'node_modules' && file !== 'dist') {
        results = results.concat(getHtmlFiles(filePath));
      }
    } else if (file.endsWith('.html')) {
      results.push(filePath);
    }
  });
  return results;
}

const htmlFiles = getHtmlFiles(rootDir);
let updatedCount = 0;

htmlFiles.forEach(filePath => {
  if (filePath === indexPath) return; // Skip index.html itself

  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('<header')) {
    content = content.replace(/<header[\s\S]*?<\/header>/i, homepageHeader);
    fs.writeFileSync(filePath, content, 'utf8');
    updatedCount++;
  } else {
    console.warn(`Warning: No <header> tag found in ${path.relative(rootDir, filePath)}`);
  }
});

console.log(`Successfully updated header in ${updatedCount} HTML files!`);
