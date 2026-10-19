'use strict';
// Recipe storage: one JSON file per recipe in <root>/<category>/<id>.json.
// The folder a file lives in is the source of truth for its category, so files
// can be moved between folders by hand. Nothing is ever erased: removed
// recipes and replaced photos go to <root>/lixeira/.

const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const CATEGORIES = ['doce', 'salgada'];
const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PHOTO_RE = /^[a-z0-9]+\.jpg$/;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

const text = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const lines = (v, maxItems, maxLen) =>
  Array.isArray(v) ? v.map((x) => text(x, maxLen)).filter(Boolean).slice(0, maxItems) : [];
const int = (v, min, max) => (Number.isInteger(v) && v >= min && v <= max ? v : null);

function slugify(s) {
  return (
    s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'receita'
  );
}

function normalize(r) {
  return {
    title: text(r.title, 120),
    ingredients: lines(r.ingredients, 200, 300),
    steps: lines(r.steps, 100, 1000),
    prepMinutes: int(r.prepMinutes, 1, 9999),
    servings: int(r.servings, 1, 999),
    notes: text(r.notes, 5000),
    photo: typeof r.photo === 'string' && PHOTO_RE.test(r.photo) ? r.photo : null,
    favorite: r.favorite === true,
  };
}

function checkId(id) {
  if (typeof id !== 'string' || !ID_RE.test(id)) throw new Error('Identificador inválido.');
  return id;
}

function createStore(root) {
  const dir = (...p) => path.join(root, ...p);

  const ensure = () =>
    Promise.all([...CATEGORIES, 'fotos', 'lixeira'].map((d) => fs.mkdir(dir(d), { recursive: true })));

  async function atomicWrite(file, data) {
    const tmp = `${file}.tmp`;
    await fs.writeFile(tmp, data);
    await fs.rename(tmp, file);
  }

  const trash = (file) =>
    fs.rename(file, dir('lixeira', `${Date.now()}-${path.basename(file)}`)).catch((e) => {
      if (e.code !== 'ENOENT') throw e;
    });

  async function find(id) {
    for (const category of CATEGORIES) {
      const file = dir(category, `${id}.json`);
      try {
        return { file, category, data: JSON.parse(await fs.readFile(file, 'utf8')) };
      } catch (e) {
        if (e.code !== 'ENOENT') throw e;
      }
    }
    return null;
  }

  async function list() {
    await ensure();
    const recipes = [];
    const skipped = [];
    for (const category of CATEGORIES) {
      for (const name of await fs.readdir(dir(category))) {
        if (!name.endsWith('.json')) continue;
        const id = name.slice(0, -5);
        const file = dir(category, name);
        try {
          if (!ID_RE.test(id)) throw new Error('nome de arquivo inválido');
          const data = JSON.parse(await fs.readFile(file, 'utf8'));
          const fields = normalize(data);
          if (!fields.title) throw new Error('sem título');
          const mtime = (await fs.stat(file)).mtime.toISOString();
          recipes.push({
            ...fields,
            id,
            category,
            createdAt: text(data.createdAt, 40) || mtime,
            updatedAt: text(data.updatedAt, 40) || mtime,
          });
        } catch (e) {
          console.warn(`[recivo] arquivo ignorado: ${category}/${name} (${e.message})`);
          skipped.push(`${category}/${name}`);
        }
      }
    }
    return { recipes, skipped };
  }

  async function save(input) {
    if (!input || typeof input !== 'object') throw new Error('Receita inválida.');
    const fields = normalize(input);
    if (!fields.title) throw new Error('Dê um nome à receita.');
    if (!CATEGORIES.includes(input.category)) throw new Error('Categoria inválida.');
    await ensure();

    const id = input.id == null ? `${slugify(fields.title)}-${crypto.randomBytes(2).toString('hex')}` : checkId(input.id);
    const prev = input.id == null ? null : await find(id);
    const now = new Date().toISOString();
    const record = { ...fields, createdAt: prev?.data.createdAt ?? now, updatedAt: now };

    await atomicWrite(dir(input.category, `${id}.json`), `${JSON.stringify(record, null, 2)}\n`);
    if (prev && prev.category !== input.category) await fs.rm(prev.file);
    const oldPhoto = prev ? normalize(prev.data).photo : null;
    if (oldPhoto && oldPhoto !== fields.photo) await trash(dir('fotos', oldPhoto));
    return { ...record, id, category: input.category };
  }

  async function remove(id) {
    const found = await find(checkId(id));
    if (!found) return;
    const photo = normalize(found.data).photo;
    await trash(found.file);
    if (photo) await trash(dir('fotos', photo));
  }

  async function savePhoto(bytes) {
    const buf = Buffer.from(bytes);
    if (buf.length === 0 || buf.length > MAX_PHOTO_BYTES) throw new Error('A foto é grande demais (máximo 8 MB).');
    if (buf[0] !== 0xff || buf[1] !== 0xd8 || buf[2] !== 0xff) throw new Error('Formato de foto não suportado.');
    await ensure();
    const name = `${crypto.randomBytes(6).toString('hex')}.jpg`;
    await atomicWrite(dir('fotos', name), buf);
    return name;
  }

  const photoPath = (name) => (typeof name === 'string' && PHOTO_RE.test(name) ? dir('fotos', name) : null);

  return { list, save, remove, savePhoto, photoPath };
}

module.exports = { createStore };
