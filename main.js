const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const pool = require('./database');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'src', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('get-tasks', async () => {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
    return result.rows;
  } catch (error) {
    console.error('Error al obtener tareas:', error);
    return [];
  }
});

ipcMain.handle('add-task', async (event, title) => {
  try {
    const result = await pool.query(
      'INSERT INTO tasks (title) VALUES ($1) RETURNING *',
      [title]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error al agregar tarea:', error);
    throw error;
  }
});

ipcMain.handle('toggle-task', async (event, { id, completed }) => {
  try {
    const result = await pool.query(
      'UPDATE tasks SET completed = $1 WHERE id = $2 RETURNING *',
      [completed, id]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error al actualizar tarea:', error);
    throw error;
  }
});

// NUEVO: Handler para actualizar el título de la tarea
ipcMain.handle('update-task-title', async (event, { id, title }) => {
  try {
    const result = await pool.query(
      'UPDATE tasks SET title = $1 WHERE id = $2 RETURNING *',
      [title, id]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error al actualizar título de la tarea:', error);
    throw error;
  }
});

ipcMain.handle('delete-task', async (event, id) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    return id;
  } catch (error) {
    console.error('Error al eliminar tarea:', error);
    throw error;
  }
});