const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const taskTemplate = document.getElementById('task-template');
const filterBtns = document.querySelectorAll('.filter-btn');
const taskCounter = document.getElementById('task-counter');

let currentFilter = 'all';
let allTasks = [];

async function loadTasks() {
    try {
        allTasks = await window.electronAPI.getTasks();
        renderTasks();
    } catch (error) {
        console.error('Error cargando tareas en la UI:', error);
    }
}

function renderTasks() {
    taskList.innerHTML = '';

    // Filtrar tareas según el botón seleccionado
    const filteredTasks = allTasks.filter(task => {
        if (currentFilter === 'pending') return !task.completed;
        if (currentFilter === 'completed') return task.completed;
        return true;
    });

    // Actualizar contador de pendientes
    const pendingCount = allTasks.filter(t => !t.completed).length;
    taskCounter.textContent = `${pendingCount} pendiente${pendingCount === 1 ? '' : 's'}`;

    filteredTasks.forEach(task => {
        const clone = taskTemplate.content.cloneNode(true);
        const li = clone.querySelector('.task-item');
        const checkbox = clone.querySelector('.task-checkbox');
        const titleSpan = clone.querySelector('.task-title');
        const deleteBtn = clone.querySelector('.delete-btn');

        li.dataset.id = task.id;
        titleSpan.textContent = task.title;
        checkbox.checked = task.completed;
        if (task.completed) li.classList.add('completed');

        // Marcar como completada / pendiente
        checkbox.addEventListener('change', async () => {
            const updated = await window.electronAPI.toggleTask({ id: task.id, completed: checkbox.checked });
            if (updated) {
                task.completed = updated.completed;
                renderTasks();
            }
        });

        // NUEVO: Edición por doble clic en el texto
        titleSpan.addEventListener('dblclick', () => {
            const inputEdit = document.createElement('input');
            inputEdit.type = 'text';
            inputEdit.className = 'task-edit-input';
            inputEdit.value = task.title;
            
            li.replaceChild(inputEdit, titleSpan);
            inputEdit.focus();

            async function saveEdit() {
                const newTitle = inputEdit.value.trim();
                if (newTitle && newTitle !== task.title) {
                    const updated = await window.electronAPI.updateTaskTitle({ id: task.id, title: newTitle });
                    if (updated) task.title = updated.title;
                }
                renderTasks();
            }

            inputEdit.addEventListener('blur', saveEdit);
            inputEdit.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') saveEdit();
            });
        });

        // Eliminar tarea
        deleteBtn.addEventListener('click', async () => {
            await window.electronAPI.deleteTask(task.id);
            allTasks = allTasks.filter(t => t.id !== task.id);
            renderTasks();
        });

        taskList.appendChild(clone);
    });
}

// Cambiar de filtro activo
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTasks();
    });
});

taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = taskInput.value.trim();
    if (!title) return;

    try {
        const newTask = await window.electronAPI.addTask(title);
        if (newTask) {
            allTasks.unshift(newTask);
            taskInput.value = '';
            renderTasks();
        }
    } catch (error) {
        console.error('Error al guardar la tarea:', error);
    }
});

loadTasks();