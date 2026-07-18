const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const metaFile = path.join(rootDir, 'metadata.json');

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

const metadata = {};

for (const file of allFiles) {
  const relativePath = path.relative(rootDir, file).replace(/\\/g, '/');
  const content = fs.readFileSync(file, 'utf8');

  // Extract title
  const titleMatch = content.match(/<title>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  // Extract description
  const descMatch = content.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i) ||
                    content.match(/<meta[^>]*content="([^"]*)"[^>]*name="description"/i);
  const description = descMatch ? descMatch[1].trim() : '';

  // Extract schema JSON-LD scripts
  const schemaRegex = /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  const schemas = [];
  let match;
  while ((match = schemaRegex.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      schemas.push(parsed);
    } catch (e) {
      // In case parsing fails, save as string
      schemas.push(match[1].trim());
    }
  }

  metadata[relativePath] = {
    title,
    description,
    schemas
  };
}

fs.writeFileSync(metaFile, JSON.stringify(metadata, null, 2), 'utf8');
console.log(`Successfully extracted metadata for ${allFiles.length} files to ${metaFile}`);
