'use strict';
const { app, BrowserWindow, Menu, ipcMain, nativeTheme, net, protocol, shell } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { createStore } = require('./store.cjs');

const DEV_URL = process.env.VITE_DEV_SERVER_URL;
const DIST = path.join(__dirname, '..', 'dist');
const dataRoot = process.env.RECIVO_DATA_DIR || path.join(app.getPath('documents'), 'Recivo');
const store = createStore(dataRoot);

// recivo://app/*   -> built renderer (production)
// recivo://foto/*  -> recipe photos in <dataRoot>/fotos
protocol.registerSchemesAsPrivileged([
  { scheme: 'recivo', privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

const notFound = () => new Response(null, { status: 404 });

function handleProtocol(req) {
  const url = new URL(req.url);
  let file = null;
  if (url.hostname === 'foto') {
    file = store.photoPath(decodeURIComponent(url.pathname.slice(1)));
  } else if (url.hostname === 'app') {
    const candidate = path.join(DIST, decodeURIComponent(url.pathname));
    if (candidate.startsWith(DIST + path.sep)) file = url.pathname === '/' ? path.join(DIST, 'index.html') : candidate;
  }
  return file ? net.fetch(pathToFileURL(file).toString()) : notFound();
}

function handle(channel, fn) {
  ipcMain.handle(channel, async (_event, ...args) => {
    try {
      return { ok: true, value: await fn(...args) };
    } catch (e) {
      console.error(`[recivo] ${channel}:`, e);
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  });
}

function registerIpc() {
  handle('recipes:list', async () => ({ ...(await store.list()), root: dataRoot }));
  handle('recipes:save', (recipe) => store.save(recipe));
  handle('recipes:remove', (id) => store.remove(id));
  handle('photos:save', (bytes) => store.savePhoto(bytes));
  handle('app:open-folder', async () => {
    const err = await shell.openPath(dataRoot);
    if (err) throw new Error(err);
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 880,
    minHeight: 600,
    show: false,
    title: 'Recivo',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1a1210' : '#fdf9f6',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once('ready-to-show', () => win.show());
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(DEV_URL ?? 'recivo://app/')) event.preventDefault();
  });

  win.loadURL(DEV_URL ?? 'recivo://app/');
}

app.whenReady().then(() => {
  app.setAppUserModelId('com.recivo.app');
  if (!DEV_URL) Menu.setApplicationMenu(null);
  protocol.handle('recivo', handleProtocol);
  registerIpc();
  createWindow();
  app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow());
});

app.on('window-all-closed', () => app.quit());
