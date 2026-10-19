// End-to-end smoke test: launches the real Electron app (production build) against a throw-away
// data folder, creates/edits/favorites/deletes recipes and asserts what lands on disk.
// Screenshots go to .e2e/ for visual review.
import assert from 'node:assert/strict';
import { access, mkdir, mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import electronPath from 'electron';
import { _electron as electron } from 'playwright-core';

const dataDir = await mkdtemp(join(tmpdir(), 'recivo-e2e-'));
const shots = join(process.cwd(), '.e2e');
await mkdir(shots, { recursive: true });

const app = await electron.launch({
  // RECIVO_EXE=release\win-unpacked\Recivo.exe tests the packaged app instead of the dev checkout
  executablePath: process.env.RECIVO_EXE ?? electronPath,
  args: process.env.RECIVO_EXE ? [] : ['.'],
  env: { ...process.env, RECIVO_DATA_DIR: dataDir },
});
const page = await app.firstWindow();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.setViewportSize({ width: 1240, height: 820 });

const exists = (p) => access(p).then(() => true, () => false);
const reader = (title) => page.locator('#sheet-title').filter({ hasText: title });
const shot = (name) => page.screenshot({ path: join(shots, `${name}.png`) });

try {
  // First run: welcome state, nothing fabricated
  await page.getByRole('heading', { name: 'Sua cozinha começa aqui' }).waitFor();
  await shot('1-welcome');

  // Create a savory recipe from the welcome screen (category pre-selected)
  await page.getByRole('button', { name: 'Receita salgada' }).click();
  await page.getByLabel('Nome da receita').fill('Strogonoff de frango');
  await page.getByLabel('Tempo de preparo').fill('45');
  await page.getByLabel('Rendimento').fill('4');
  await page.getByLabel('Ingredientes').fill('- 500 g de frango\n- 1 cebola\n- 1 caixa de creme de leite');
  await page.getByLabel('Modo de preparo').fill('1. Refogue a cebola\n2. Junte o frango\n3. Finalize com o creme de leite');
  await page.waitForTimeout(800);
  await page.locator('.sheet-scroll').evaluate((el) => (el.scrollTop = 0));
  await shot('2-editor');
  await page.getByRole('button', { name: 'Salvar receita' }).click();
  await reader('Strogonoff de frango').waitFor();
  await page.waitForTimeout(700);
  await shot('3-reader');

  const files = await readdir(join(dataDir, 'salgada'));
  assert.equal(files.length, 1, 'recipe file written to salgada/');
  const saved = JSON.parse(await readFile(join(dataDir, 'salgada', files[0]), 'utf8'));
  assert.deepEqual(saved.ingredients, ['500 g de frango', '1 cebola', '1 caixa de creme de leite'], 'list markers stripped');
  assert.equal(saved.steps.length, 3);
  assert.equal(saved.prepMinutes, 45);

  // Validation: missing category is caught inline
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Nova receita' }).click();
  await page.getByLabel('Nome da receita').fill('Brigadeiro');
  await page.getByRole('button', { name: 'Salvar receita' }).click();
  await page.getByText('Escolha se é doce ou salgada.').waitFor();

  // Pick doce, save, favorite
  await page.getByRole('radio', { name: 'Doce', exact: true }).check();
  await page.getByLabel('Ingredientes').fill('1 lata de leite condensado\n3 colheres de chocolate em pó');
  await page.getByRole('button', { name: 'Salvar receita' }).click();
  await reader('Brigadeiro').waitFor();
  assert.equal((await readdir(join(dataDir, 'doce'))).length, 1, 'recipe file written to doce/');
  await page.getByRole('dialog').getByRole('button', { name: 'Marcar como favorita' }).click();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(700);
  await shot('4-grid-light');

  // Spectrum filter + search + favorites
  await page.getByRole('radio', { name: /^Doces/ }).check();
  await page.waitForTimeout(700);
  await shot('5-doces');
  assert.equal(await page.getByRole('heading', { name: 'Strogonoff de frango' }).count(), 0, 'salgada hidden on Doces shelf');
  await page.getByRole('radio', { name: /^Todas/ }).check();
  await page.getByLabel('Buscar receita ou ingrediente').fill('creme de leite');
  assert.equal(await page.getByRole('heading', { name: 'Brigadeiro' }).count(), 0, 'ingredient search excludes non-matches');
  await page.getByRole('heading', { name: 'Strogonoff de frango' }).waitFor();
  await page.getByLabel('Buscar receita ou ingrediente').fill('xyz');
  await page.getByRole('heading', { name: 'Nada encontrado' }).waitFor();
  await page.getByRole('button', { name: 'Limpar filtros' }).click();

  // Unsaved edits are protected
  await page.getByRole('button', { name: 'Abrir Brigadeiro' }).click();
  await page.getByRole('button', { name: 'Editar' }).click();
  await page.getByLabel('Nome da receita').fill('Brigadeiro gourmet');
  await page.keyboard.press('Escape');
  await page.getByText('Descartar as alterações?').waitFor();
  await page.getByRole('button', { name: 'Continuar editando' }).click();
  await page.getByRole('button', { name: 'Salvar receita' }).click();
  await reader('Brigadeiro gourmet').waitFor();

  // Delete moves to lixeira (never erased)
  await page.getByRole('button', { name: 'Excluir receita' }).click();
  await page.getByRole('button', { name: 'Excluir', exact: true }).click();
  await page.getByRole('list', { name: 'Receitas' }).getByRole('heading', { name: 'Brigadeiro gourmet' }).waitFor({ state: 'detached' });
  assert.equal((await readdir(join(dataDir, 'doce'))).length, 0);
  assert.equal((await readdir(join(dataDir, 'lixeira'))).length, 1, 'deleted recipe kept in lixeira/');

  // Photo upload (webp in, jpeg out) shown through the recivo://foto protocol
  await page.getByRole('button', { name: 'Nova receita' }).click();
  await page.getByLabel('Nome da receita').fill('Pão de queijo');
  await page.getByRole('radio', { name: 'Salgada', exact: true }).check();
  await page.locator('input[type=file]').setInputFiles(join(process.cwd(), 'assets', 'brand', 'recivo-icon.webp'));
  await page.getByAltText('Pré-visualização da foto').waitFor();
  await page.getByRole('button', { name: 'Salvar receita' }).click();
  await reader('Pão de queijo').waitFor();
  await page.waitForTimeout(700);
  const photos = await readdir(join(dataDir, 'fotos'));
  assert.equal(photos.length, 1, 'photo stored in fotos/');
  assert.match(photos[0], /\.jpg$/);
  assert.ok(await page.locator('.reader-media img').evaluate((img) => img.naturalWidth > 0), 'photo loads via recivo://foto');
  await shot('8-reader-photo');
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 900, height: 700 });
  await page.waitForTimeout(500);
  await shot('9-narrow');
  await page.setViewportSize({ width: 1240, height: 820 });
  // Dark scheme
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.waitForTimeout(400);
  await shot('6-grid-dark');
  await page.getByRole('button', { name: 'Abrir Strogonoff de frango' }).click();
  await page.waitForTimeout(700);
  await shot('7-reader-dark');

  assert.deepEqual(errors, [], `no renderer errors: ${errors.join(' | ')}`);
  assert.ok(!(await exists(join(dataDir, 'salgada', `${files[0]}.tmp`))), 'no temp files left behind');
  console.log('e2e ok');
} finally {
  await app.close();
  await rm(dataDir, { recursive: true, force: true });
}
