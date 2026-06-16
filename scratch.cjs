const fs = require('fs');
const path = require('path');
const dir = 'frontend/src';
const replaceInFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  content = content.replace(/'http:\/\/localhost:5000\/api(.*?)'/g, '`${import.meta.env.VITE_API_URL || "https://rent-hub-xnoh.onrender.com/api"}$1`');
  content = content.replace(/`http:\/\/localhost:5000\/api(.*?)`/g, '`${import.meta.env.VITE_API_URL || "https://rent-hub-xnoh.onrender.com/api"}$1`');
  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Updated', filePath);
  }
};
const walk = (dir) => {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      replaceInFile(fullPath);
    }
  });
};
walk(dir);
