import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const root = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(root, '../data/db.json');
export const readDb = () => JSON.parse(fs.readFileSync(file, 'utf8'));
export const writeDb = data => fs.writeFileSync(file, JSON.stringify(data, null, 2));
export const id = prefix => `${prefix}_${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
