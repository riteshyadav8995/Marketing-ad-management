import fs from 'fs';
import path from 'path';

const dir = path.join(process.cwd(), 'src');

function walk(dirPath) {
  let results = [];
  const list = fs.readdirSync(dirPath);
  list.forEach(file => {
    file = path.join(dirPath, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(dir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  if (content.includes('http://localhost:5000')) {
    content = content.replace(/const API_BASE = 'http:\/\/localhost:5000\/api\/dashboard';/g, "const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/dashboard`;");
    content = content.replace(/'http:\/\/localhost:5000/g, "`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}");
    content = content.replace(/`http:\/\/localhost:5000/g, "`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}");
    content = content.replace(/\${import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:5000'}([^`'\n]+)'/g, "${import.meta.env.VITE_API_URL || 'http://localhost:5000'}$1`");

    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
