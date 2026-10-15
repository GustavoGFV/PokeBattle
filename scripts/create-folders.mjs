import fs from 'fs';
import path from 'path';

// 1. Trainer folders
const trainerDir = 'src/data/TrainerSprites';
const trainerList = JSON.parse(fs.readFileSync(path.join(trainerDir, 'TrainerList.json'), 'utf8'));
const trainerNames = [...new Set(trainerList.map((t) => t.Name))];

for (const name of trainerNames) {
  const p = path.join(trainerDir, name.replace(/[\\/:*?"<>|]/g, ''));
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
    console.log('Created trainer folder:', name);
  }
}

// 2. Pokemon folders
const pokeDir = 'src/data/PokemonSprites';
const dexFiles = ['kanto_pokemons.json', 'johto_pokemons.json', 'hoenn_pokemons.json', 'sinnoh_pokemons.json'];
let createdCount = 0;

for (const file of dexFiles) {
  const data = JSON.parse(fs.readFileSync(path.join('src/data/Dex', file), 'utf8'));
  for (const p of Object.values(data.Pokemons)) {
    // Sanitize any characters that are illegal in Windows folder names like : * ? " < > |
    const safeName = p.name.replace(/[\\/:*?"<>|]/g, '');
    const targetPath = path.join(pokeDir, safeName);
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
      createdCount++;
    }
  }
}

console.log(`Created ${createdCount} pokemon folders in PokemonSprites.`);

