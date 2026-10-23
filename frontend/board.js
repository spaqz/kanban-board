// ============================================================
//  ЛОГИКА РАБОЧЕЙ КАНБАН-ДОСКИ
// ============================================================

// Загружаем данные из памяти браузера (если они есть)
let boardData = [];

// Доступные категории (классы цветов берутся из твоего body.css)
const TAGS = [
    { name: 'Финансы',      cls: 'tag-finance'  },
    { name: 'Личные дела',  cls: 'tag-personal' },
    { name: 'Карьера',      cls: 'tag-career'   },
    { name: 'Дом',          cls: 'tag-home'     },
    { name: 'Покупки',      cls: 'tag-shopping' },
    { name: 'Другое',       cls: 'tag-other'    }
];

const board = document.getElementById('board');
let uid = Date.now();
const newId = () => 'id' + (uid++);

// Функция сохранения
let saveTimer = null;
function saveData() {
    // Небольшая задержка, чтобы не слать запрос на каждую набранную букву
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        api.request('/board', { method: 'PUT', body: boardData })
            .catch(err => console.error('Не удалось сохранить доску:', err.message));
    }, 400);
}

// Форматирование даты
function formatDateTime(val) {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    const months = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    if (hh === '00' && mm === '00') return `${day} ${month}`;
    return `${day} ${month}, ${hh}:${mm}`;
}

// Главная функция отрисовки
function renderBoard() {
    board.innerHTML = '';

    // Если доска пустая — показываем большую кнопку
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

    // Если есть колонки — рисуем их
    boardData.forEach(col => {
        const colEl = document.createElement('div');
        colEl.className = 'column';

        // 1. Шапка колонки (Название, счетчик, меню)
        const header = document.createElement('div');
        header.className = 'column-header';

        const titleInput = document.createElement('input');
        titleInput.className = 'column-title';
        titleInput.value = col.title;
        titleInput.addEventListener('input', e => {
            col.title = e.target.value;
            saveData();
        });

        const count = document.createElement('span');
        count.className = 'column-count';
        count.textContent = col.tasks.length;

        const menuWrap = document.createElement('div');
        menuWrap.className = 'menu-wrap';
        const menuBtn = document.createElement('button');
        menuBtn.className = 'menu-btn';
        menuBtn.textContent = '⋮';
        
        const dropdown = document.createElement('div');
        dropdown.className = 'menu-dropdown';
        const delColBtn = document.createElement('button');
        delColBtn.className = 'danger';
        delColBtn.textContent = '🗑 Удалить колонку';
        delColBtn.addEventListener('click', () => {
            if (confirm(`Удалить колонку «${col.title}»?`)) {
                boardData = boardData.filter(c => c.id !== col.id);
                saveData();
                renderBoard();
            }
        });

        dropdown.appendChild(delColBtn);
        menuBtn.addEventListener('click', e => {
            e.stopPropagation();
            document.querySelectorAll('.menu-dropdown').forEach(d => d.classList.remove('open'));
            dropdown.classList.toggle('open');
        });
        
        menuWrap.appendChild(menuBtn);
        menuWrap.appendChild(dropdown);
        header.appendChild(titleInput);
        header.appendChild(count);
        header.appendChild(menuWrap);
        colEl.appendChild(header);

        // 2. Список задач
        const list = document.createElement('div');
        list.className = 'task-list';

        col.tasks.forEach(task => {
            const t = document.createElement('div');
            t.className = `task ${task.completed ? 'completed' : ''}`;
            
            // Формируем HTML карточки
            let html = `
                <div class="task-header-row">
                    <span class="task-check" title="Отметить выполнение">${task.completed ? '✓' : '○'}</span>
                    <div class="task-text">${escapeHtml(task.text)}</div>
                    <button class="task-del" title="Удалить">✕</button>
                </div>
            `;
            
            // Если есть тег или дата, добавляем нижнюю часть
            if (task.tag || task.date) {
                html += `<div class="task-footer">`;
                if (task.tag) {
                    html += `<span class="task-tag ${task.tagClass}">${task.tag}</span>`;
                } else {
                    html += `<span></span>`;
                }
                if (task.date) {
                    html += `<div class="task-date">${formatDateTime(task.date)}</div>`;
                }
                html += `</div>`;
            }

            t.innerHTML = html;

            // Клик по кружочку (зачеркнуть)
            t.querySelector('.task-check').addEventListener('click', (e) => {
                e.stopPropagation();
                task.completed = !task.completed;
                saveData();
                renderBoard();
            });

            // Клик по крестику (удалить)
            t.querySelector('.task-del').addEventListener('click', (e) => {
                e.stopPropagation();
                col.tasks = col.tasks.filter(x => x.id !== task.id);
                saveData();
                renderBoard();
            });

            list.appendChild(t);
        });

        colEl.appendChild(list);

        // 3. Форма добавления задачи (скрыта по умолчанию)
        const form = buildAddForm(col);
        colEl.appendChild(form);

        // 4. Кнопка открытия формы
        const addTaskBtn = document.createElement('button');
        addTaskBtn.className = 'add-task-btn';
        addTaskBtn.textContent = '+ Добавить задачу';
        addTaskBtn.addEventListener('click', () => {
            document.querySelectorAll('.add-form.open').forEach(f => { if (f !== form) f.classList.remove('open'); });
            form.classList.toggle('open');
            if (form.classList.contains('open')) {
                form.querySelector('input').focus();
            }
        });
        
        colEl.appendChild(addTaskBtn);
        board.appendChild(colEl);
    });

    // 5. Кнопка добавления новой колонки (в конце)
    const addCol = document.createElement('button');
    addCol.className = 'add-column-btn';
    addCol.textContent = '+ Добавить колонку';
    addCol.addEventListener('click', createNewColumn);
    board.appendChild(addCol);
}

// Функция создания колонки
function createNewColumn() {
    const name = prompt('Введите название списка (например: Входящие, В работе):', 'Новый список');
    if (name === null) return;
    
    boardData.push({ 
        id: newId(), 
        title: name.trim() || 'Без названия', 
        tasks: [] 
    });
    saveData();
    renderBoard();
}

// Функция создания формы добавления задачи
function buildAddForm(col) {
    const form = document.createElement('div');
    form.className = 'add-form'; // display: none из body.css
    
    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.placeholder = 'Что нужно сделать?';
    
    const dateInput = document.createElement('input');
    dateInput.type = 'datetime-local';
    
    const tagSelect = document.createElement('select');
    TAGS.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.name; 
        opt.textContent = t.name;
        tagSelect.appendChild(opt);
    });

    const row = document.createElement('div');
    row.className = 'form-row';
    
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn-save'; 
    saveBtn.textContent = 'Добавить';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-cancel'; 
    cancelBtn.textContent = 'Отмена';
    
    row.appendChild(saveBtn); 
    row.appendChild(cancelBtn);
    form.appendChild(textInput); 
    form.appendChild(dateInput); 
    form.appendChild(tagSelect); 
    form.appendChild(row);

    // Сохранение задачи
    function saveTask() {
        const text = textInput.value.trim();
        if (!text) { textInput.focus(); return; }
        
        const tagName = tagSelect.value;
        const tagObj = TAGS.find(t => t.name === tagName) || { cls: 'tag-other' };
        
        col.tasks.push({ 
            id: newId(), 
            text: text, 
            date: dateInput.value, 
            tag: tagName, 
            tagClass: tagObj.cls,
            completed: false
        });
        
        saveData();
        renderBoard();
    }

    saveBtn.addEventListener('click', saveTask);
    cancelBtn.addEventListener('click', () => form.classList.remove('open'));
    textInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') saveTask();
        if (e.key === 'Escape') form.classList.remove('open');
    });

    return form;
}

// Защита от HTML-инъекций
function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// Закрытие меню при клике вне его
document.addEventListener('click', () => {
    document.querySelectorAll('.menu-dropdown.open').forEach(d => d.classList.remove('open'));
});

// Старт: загружаем доску с сервера
(async function init() {
    try {
        boardData = await api.request('/board');

        // Одноразовый перенос старых данных из localStorage
        const old = JSON.parse(localStorage.getItem('kanbanData') || '[]');
        if (boardData.length === 0 && old.length > 0) {
            boardData = old;
            await api.request('/board', { method: 'PUT', body: boardData });
        }
        localStorage.removeItem('kanbanData');
    } catch (err) {
        console.error(err.message);
    }
    renderBoard();
})();