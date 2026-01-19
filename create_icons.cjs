const fs = require('fs');
const path = require('path');

const icons = {
    'physics.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="5"><circle cx="50" cy="50" r="40"/><path d="M50 10 L50 90 M10 50 L90 50"/><circle cx="50" cy="50" r="10" fill="currentColor"/></svg>`,
    'chemistry.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="5"><path d="M30 80 L30 40 L50 20 L70 40 L70 80 Q50 90 30 80 Z"/><circle cx="45" cy="50" r="5"/><circle cx="60" cy="65" r="5"/></svg>`,
    'maths.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="5"><path d="M10 50 L90 50 M50 10 L50 90"/><path d="M20 20 L40 40 M20 40 L40 20"/><text x="60" y="80" font-family="sans-serif" font-size="40">π</text></svg>`,
    'biology.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="5"><path d="M50 80 Q30 50 30 30 Q30 10 50 10 Q70 10 70 30 Q70 50 50 80 Z"/><path d="M50 80 L50 30"/></svg>`,
    'english.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="5"><text x="10" y="70" font-family="serif" font-size="80">A</text></svg>`,
    'hindi.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="5"><text x="10" y="70" font-family="sans-serif" font-size="60">अ</text></svg>`
};

const targetDir = path.join('public', 'assets', 'subject-icons');
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

Object.entries(icons).forEach(([filename, content]) => {
    fs.writeFileSync(path.join(targetDir, filename), content);
    console.log(`Created ${filename}`);
});
