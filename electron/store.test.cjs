'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createStore } = require('./store.cjs');

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
const base = { title: 'Bolo de cenoura', category: 'doce', ingredients: ['3 cenouras'], steps: ['Bata tudo'] };

async function withStore(fn) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'recivo-test-'));
  try {
    await fn(createStore(root), root);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}
const exists = (p) => fs.access(p).then(() => true, () => false);

test('save writes one file in the category folder and list returns it', () =>
  withStore(async (store, root) => {
    const saved = await store.save(base);
    assert.match(saved.id, /^bolo-de-cenoura-[0-9a-f]{4}$/);
    assert.ok(await exists(path.join(root, 'doce', `${saved.id}.json`)));
    const { recipes, skipped } = await store.list();
    assert.equal(recipes.length, 1);
    assert.equal(recipes[0].category, 'doce');
    assert.deepEqual(recipes[0].ingredients, ['3 cenouras']);
    assert.deepEqual(skipped, []);
  }));

test('changing category moves the file and keeps createdAt', () =>
  withStore(async (store, root) => {
    const a = await store.save(base);
    const b = await store.save({ ...a, category: 'salgada' });
    assert.equal(b.id, a.id);
    assert.equal(b.createdAt, a.createdAt);
    assert.ok(await exists(path.join(root, 'salgada', `${a.id}.json`)));
    assert.ok(!(await exists(path.join(root, 'doce', `${a.id}.json`))));
  }));

test('remove moves recipe and photo to lixeira instead of erasing', () =>
  withStore(async (store, root) => {
    const photo = await store.savePhoto(JPEG);
    const a = await store.save({ ...base, photo });
    await store.remove(a.id);
    assert.equal((await store.list()).recipes.length, 0);
    assert.equal((await fs.readdir(path.join(root, 'lixeira'))).length, 2);
  }));

test('replacing a photo trashes the old one', () =>
  withStore(async (store, root) => {
    const p1 = await store.savePhoto(JPEG);
    const a = await store.save({ ...base, photo: p1 });
    const p2 = await store.savePhoto(JPEG);
    await store.save({ ...a, photo: p2 });
    assert.ok(!(await exists(path.join(root, 'fotos', p1))));
    assert.ok(await exists(path.join(root, 'fotos', p2)));
  }));

test('rejects invalid input', () =>
  withStore(async (store) => {
    await assert.rejects(store.save({ ...base, title: '   ' }), /nome/);
    await assert.rejects(store.save({ ...base, category: 'sobremesa' }), /Categoria/);
    await assert.rejects(store.save({ ...base, id: '../evil' }), /Identificador/);
    await assert.rejects(store.remove('..\\evil'), /Identificador/);
    await assert.rejects(store.savePhoto(Buffer.from('not a jpeg')), /Formato/);
  }));

test('photoPath only resolves well-formed photo names', () =>
  withStore(async (store, root) => {
    assert.equal(store.photoPath('abc123.jpg'), path.join(root, 'fotos', 'abc123.jpg'));
    assert.equal(store.photoPath('../../x.jpg'), null);
    assert.equal(store.photoPath('a.png'), null);
  }));

test('list skips unreadable files and reports them', () =>
  withStore(async (store, root) => {
    await store.save(base);
    await fs.writeFile(path.join(root, 'salgada', 'quebrado.json'), '{ not json');
    const { recipes, skipped } = await store.list();
    assert.equal(recipes.length, 1);
    assert.deepEqual(skipped, ['salgada/quebrado.json']);
  }));
