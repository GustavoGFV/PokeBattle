import fs from 'fs';
import path from 'path';

const dexDir = 'src/data/Dex';
const files = fs.readdirSync(dexDir).filter(f => f.endsWith('.json'));

const dexPokemons = {};
for (const file of files) {
  const content = JSON.parse(fs.readFileSync(path.join(dexDir, file), 'utf8'));
  const region = content.Region;
  for (const [key, poke] of Object.entries(content.Pokemons)) {
    dexPokemons[poke.id.toLowerCase()] = { ...poke, region };
    dexPokemons[poke.name.toLowerCase()] = { ...poke, region };
  }
}

console.log('Total entries in dex:', Object.keys(dexPokemons).length);

const trainers = JSON.parse(fs.readFileSync('src/data/TrainerSprites/TrainerList.json', 'utf8'));
const missing = [];
for (const t of trainers) {
  for (const p of t.Pokemons) {
    const cleanP = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const found = Object.keys(dexPokemons).some(k => k.replace(/[^a-z0-9]/g, '') === cleanP);
    if (!found) {
      missing.push(`${t.Name} -> ${p.name}`);
    }
  }
}
console.log('Missing count:', missing.length);
if (missing.length > 0) {
  console.log('Missing:', missing);
}

