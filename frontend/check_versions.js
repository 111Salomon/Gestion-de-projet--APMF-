import fs from 'fs';
import { execSync } from 'child_process';

console.log('='.repeat(50));
console.log('📦 VERSIONS DES TECHNOLOGIES - FRONTEND');
console.log('='.repeat(50));

// Node.js
console.log(`\n📗 Node.js: ${process.version}`);

// npm
try {
  const npmVersion = execSync('npm --version').toString().trim();
  console.log(`📦 npm: ${npmVersion}`);
} catch (e) {
  console.log('📦 npm: Non détecté');
}

// package.json
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

console.log('\n📚 Dependencies:');
Object.entries(packageJson.dependencies || {}).forEach(([name, version]) => {
  console.log(`  - ${name}: ${version}`);
});

console.log('\n🛠️  DevDependencies:');
Object.entries(packageJson.devDependencies || {}).forEach(([name, version]) => {
  console.log(`  - ${name}: ${version}`);
});

console.log('\n✅ Script terminé !');
