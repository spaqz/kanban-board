// ============================================================
//  ЛОГИКА ДОСКИ (ФИНАЛЬНАЯ ВЕРСИЯ)
// ============================================================

let boardData = []; 
let currentBoardId = null; 
const board = document.getElementById('board');

// Доступные категории
const CATEGORIES = [
    { name: 'Финансы', cls: 'tag-finance' },
    { name: 'Личные дела', cls: 'tag-personal' },
    { name: 'Карьера', cls: 'tag-career' },
    { name: 'Дом', cls: 'tag-home' },
    { name: 'Покупки', cls: 'tag-shopping' },
    { name: 'Другое', cls: 'tag-other' }
];

// Состояние "выполнено" храним локально, так как в схеме БД этого нет
let completedTasks = JSON.parse(localStorage.getItem('completedTasks')) || [];

// ============================================================
// ОТРИСОВКА ДОСКИ
// ============================================================
function renderBoard() {
    board.innerHTML = '';

    // Если колонок нет — показываем кнопку создания
    if (boardData.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-board-state';
        const btn = document.createElement('button');
        btn.className = 'btn-create-first-col';
        btn.innerHTML = '<span>+</span> Добавить список дел';
        btn.addEventListener('click', createNewColumn);
        emptyState.appendChild(btn);
        board.appendChild(emptyState);
        return;
    }

    // Отрисовываем колонки
    boardData.forEach(col => {
        const colEl = document.createElement('div');
        colEl.className = 'column';

        // --- ШАПКА КОЛОНКИ ---
        const header = document.createElement('div');
        header.className = 'column-header';
        
        // 1. Название (редактируемое)
        const titleInput = document.createElement('input');
        titleInput.className = 'column-title';
        titleInput.value = col.name;
        titleInput.addEventListener('change', async (e) => {
            const newName = e.target.value.trim();
            if (!newName) { e.target.value = col.name; return; }
            try {
                await api.request(`/columns/${col.id}`, { method: 'PATCH', body: { name: newName } });
                col.name = newName;
            } catch (err) {
                alert('Не удалось сохранить название: ' + err.message);
                e.target.value = col.name;
            }
        });

        // 2. Счетчик задач
        const count = document.createElement('span');
        count.className = 'column-count';
        count.textContent = col.cards.length;

        // 3. КНОПКА УДАЛЕНИЯ КОЛОНКИ (Всегда видимая)
        const delColBtn = document.createElement('button');
        delColBtn.innerHTML = '✕'; 
        delColBtn.title = 'Удалить колонку';
        delColBtn.style.background = 'transparent';
        delColBtn.style.border = 'none';
        delColBtn.style.color = '#b3b9c4';
        delColBtn.style.cursor = 'pointer';
        delColBtn.style.fontSize = '16px';
        delColBtn.style.padding = '4px';
        delColBtn.style.marginLeft = '8px';
        delColBtn.style.transition = 'color 0.2s';
        
        delColBtn.addEventListener('mouseover', () => delColBtn.style.color = '#d93025');
        delColBtn.addEventListener('mouseout', () => delColBtn.style.color = '#b3b9c4');
        delColBtn.addEventListener('click', () => deleteColumn(col.id));

        header.appendChild(titleInput);
        header.appendChild(count);
        header.appendChild(delColBtn);
        colEl.appendChild(header);

        // --- СПИСОК ЗАДАЧ ---
        const list = document.createElement('div');
        list.className = 'task-list';

        col.cards.forEach(task => {
            const t = document.createElement('div');
            const isCompleted = completedTasks.includes(task.id);
            t.className = `task ${isCompleted ? 'completed' : ''}`;
            
            // Тег категории
            let tagHtml = '';
            if (task.labels) {
                const cat = CATEGORIES.find(c => c.name === task.labels) || CATEGORIES[5];
                tagHtml = `<span class="task-tag ${cat.cls}">${task.labels}</span>`;
            }

            // Разметка карточки
            let html = `
                <div class="task-header-row">
                    <span class="task-check">${isCompleted ? '✓' : '○'}</span>
                    <div class="task-text">${task.title}</div>
                    <button class="task-del">✕</button>
                </div>
            `;
            
            if (task.deadline) {
                const dateStr = task.deadline.split('T')[0];
                html += `<div class="task-date">📅 ${dateStr}</div>`;
            }
            html += tagHtml;

            t.innerHTML = html;

            // Клик по кружочку (выполнено)
            t.querySelector('.task-check').addEventListener('click', () => {
                if (completedTasks.includes(task.id)) {
                    completedTasks = completedTasks.filter(id => id !== task.id);
                } else {
                    completedTasks.push(task.id);
                }
                localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
                renderBoard();
            });

            // Клик по крестику (удалить задачу)
            t.querySelector('.task-del').addEventListener('click', async (e) => {
                e.stopPropagation();
                if(confirm('Удалить задачу?')) {
                    try {
                        await api.request(`/cards/${task.id}`, { method: 'DELETE' });
                        col.cards = col.cards.filter(x => x.id !== task.id);
                        // Убираем из памяти выполенных
                        completedTasks = completedTasks.filter(id => id !== task.id);
                        localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
                        renderBoard();
                    } catch(err) { alert('Ошибка удаления: ' + err.message); }
                }
            });

            list.appendChild(t);
        });

        colEl.appendChild(list);

        // Форма добавления задачи
        const form = buildAddForm(col);
        colEl.appendChild(form);

        // Кнопка "Добавить задачу"
        const addTaskBtn = document.createElement('button');
        addTaskBtn.className = 'add-task-btn';
        addTaskBtn.textContent = '+ Добавить задачу';
        addTaskBtn.addEventListener('click', () => {
            document.querySelectorAll('.add-form.open').forEach(f => { if (f !== form) f.classList.remove('open'); });
            form.classList.toggle('open');
            if (form.classList.contains('open')) form.querySelector('input').focus();
        });
        
        colEl.appendChild(addTaskBtn);
        board.appendChild(colEl);
    });

    // Кнопка "Добавить колонку" в конце
    const addCol = document.createElement('button');
    addCol.className = 'add-column-btn';
    addCol.textContent = '+ Добавить колонку';
    addCol.addEventListener('click', createNewColumn);
    board.appendChild(addCol);
}

// ============================================================
// ДЕЙСТВИЯ С КОЛОНКАМИ
// ============================================================
async function createNewColumn() {
    const name = prompt('Название списка:', 'Новая колонка');
    if (!name || !currentBoardId) return;

    try {
        const newCol = await api.request(`/boards/${currentBoardId}/columns`, { 
            method: 'POST', 
            body: { name: name, order: boardData.length } 
        });
        
        boardData.push({ id: newCol.id, name: newCol.name, cards: [] });
        renderBoard();
    } catch (err) {
        alert('Ошибка при создании колонки: ' + err.message);
    }
}

async function deleteColumn(colId) {
    if (!confirm('Вы уверены, что хотите удалить колонку со всеми задачами?')) return;
    try {
        await api.request(`/columns/${colId}`, { method: 'DELETE' });
        boardData = boardData.filter(c => c.id !== colId);
        renderBoard();
    } catch (err) {
        alert('Ошибка при удалении колонки (возможно, нет такого роута): ' + err.message);
    }
}

// ============================================================
// ДОБАВЛЕНИЕ ЗАДАЧИ
// ============================================================
function buildAddForm(col) {
    const form = document.createElement('div');
    form.className = 'add-form';
    
    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.placeholder = 'Что нужно сделать?';
    
    const dateInput = document.createElement('input');
    dateInput.type = 'datetime-local';

    const categorySelect = document.createElement('select');
    CATEGORIES.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.name;
        opt.textContent = cat.name;
        categorySelect.appendChild(opt);
    });
    
    const row = document.createElement('div');
    row.className = 'form-row';
    
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn-save'; saveBtn.textContent = 'Добавить';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-cancel'; cancelBtn.textContent = 'Отмена';
    
    row.appendChild(saveBtn); row.appendChild(cancelBtn);
    form.appendChild(textInput); form.appendChild(dateInput); form.appendChild(categorySelect); form.appendChild(row);

    saveBtn.addEventListener('click', async () => {
        const text = textInput.value.trim();
        if (!text) { textInput.focus(); return; }
        
        try {
            const newCard = await api.request('/cards', { 
                method: 'POST', 
                body: { 
                    title: text, 
                    columnId: col.id, 
                    deadline: dateInput.value || null,
                    labels: categorySelect.value, // Отправляем категорию
                    order: col.cards.length
                } 
            });
            
            col.cards.push({ 
                id: newCard.id, 
                title: newCard.title, 
                deadline: newCard.deadline, 
                labels: newCard.labels || categorySelect.value
            });
            renderBoard();
        } catch(err) {
            alert('Ошибка при создании задачи: ' + err.message);
        }
    });

    cancelBtn.addEventListener('click', () => form.classList.remove('open'));
    return form;
}


// ============================================================
// ИНИЦИАЛИЗАЦИЯ ДОСКИ (ЛИЧНЫЙ ПРОЕКТ)
// ============================================================
(async function init() {
    try {
        let projects = await api.request('/projects');
        
        // Ищем проект для личных задач
        let personalProject = projects.find(p => p.name === 'Личные дела');
        
        // Если его нет — создаем
        if (!personalProject) {
            personalProject = await api.request('/projects', { 
                method: 'POST', 
                body: { name: 'Личные дела', description: 'Личные задачи пользователя' }
            });
        }
        
        const projectId = personalProject.id;
        
        // Ищем доску внутри этого проекта
        let boards = await api.request(`/projects/${projectId}/boards`); 
        
        // Если доски нет — создаем её
        if (boards.length === 0) {
            const newBoard = await api.request(`/projects/${projectId}/boards`, { 
                method: 'POST', 
                body: { name: 'Моя доска' }
            });
            boards = [newBoard];
        }
        
        currentBoardId = boards[0].id;
        const boardDetails = await api.request(`/boards/${currentBoardId}`);
        
        if (boardDetails.columns && boardDetails.columns.length > 0) {
            boardData = boardDetails.columns.map(col => ({
                id: col.id, name: col.name, cards: col.cards || []
            }));
        }

        renderBoard();

    } catch (err) {
        console.error("Ошибка загрузки доски:", err.message);
        renderBoard();
    }
})();