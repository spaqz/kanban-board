require('dotenv').config();
const path = require('path');
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('❌ Не задан JWT_SECRET (см. .env.example)');
    process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '6mb' })); // 6mb — из-за аватара в base64

// ==========================================
// БАЗА ДАННЫХ (пул соединений)
// ==========================================
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kanbano_db',
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4'
});

// Таблицы создаются автоматически при старте
async function initDb() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(64) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            email VARCHAR(255) NULL,
            full_name VARCHAR(255) NOT NULL DEFAULT '',
            role VARCHAR(255) NOT NULL DEFAULT '',
            bio TEXT NULL,
            avatar MEDIUMTEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) CHARACTER SET utf8mb4
    `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS boards (
            user_id INT PRIMARY KEY,
            data LONGTEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) CHARACTER SET utf8mb4
    `);
}

// Обёртка, чтобы ошибки async-обработчиков не роняли сервер
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ==========================================
// ПРОСТОЙ ЛИМИТ ПОПЫТОК ВХОДА (по IP)
// ==========================================
const attempts = new Map();
function authLimiter(req, res, next) {
    const now = Date.now();
    const rec = attempts.get(req.ip) || { count: 0, reset: now + 15 * 60 * 1000 };
    if (now > rec.reset) { rec.count = 0; rec.reset = now + 15 * 60 * 1000; }
    rec.count++;
    attempts.set(req.ip, rec);
    if (rec.count > 30) return res.status(429).json({ error: 'Слишком много попыток, попробуйте позже' });
    next();
}

const makeToken = userId => jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });

// ==========================================
// MIDDLEWARE: ПРОВЕРКА ТОКЕНА
// ==========================================
function authenticateToken(req, res, next) {
    const header = req.headers['authorization'];
    const token = header && header.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Нет доступа' });
    jwt.verify(token, JWT_SECRET, (err, payload) => {
        if (err) return res.status(401).json({ error: 'Токен невалиден или истёк' });
        req.user = payload;
        next();
    });
}

// ==========================================
// 1. РЕГИСТРАЦИЯ
// ==========================================
app.post('/api/register', authLimiter, wrap(async (req, res) => {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');

    if (username.length < 3 || username.length > 64)
        return res.status(400).json({ error: 'Логин должен быть от 3 до 64 символов' });
    if (password.length < 6)
        return res.status(400).json({ error: 'Пароль должен быть не короче 6 символов' });

    const hash = await bcrypt.hash(password, 10);
    let result;
    try {
        [result] = await pool.query(
            'INSERT INTO users (username, password_hash, full_name) VALUES (?, ?, ?)',
            [username, hash, username]
        );
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Этот логин уже занят' });
        throw err;
    }
    await pool.query('INSERT INTO boards (user_id, data) VALUES (?, ?)', [result.insertId, '[]']);
    res.status(201).json({ token: makeToken(result.insertId) });
}));

// ==========================================
// 2. ВХОД
// ==========================================
app.post('/api/login', authLimiter, wrap(async (req, res) => {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');

    const [rows] = await pool.query('SELECT id, password_hash FROM users WHERE username = ?', [username]);
    const ok = rows.length > 0 && await bcrypt.compare(password, rows[0].password_hash);
    if (!ok) return res.status(401).json({ error: 'Неверный логин или пароль' });

    res.json({ token: makeToken(rows[0].id) });
}));

// ==========================================
// 3. ДОСКА
// ==========================================
app.get('/api/board', authenticateToken, wrap(async (req, res) => {
    const [rows] = await pool.query('SELECT data FROM boards WHERE user_id = ?', [req.user.userId]);
    if (rows.length === 0) return res.json([]);
    res.json(JSON.parse(rows[0].data));
}));

app.put('/api/board', authenticateToken, wrap(async (req, res) => {
    if (!Array.isArray(req.body)) return res.status(400).json({ error: 'Ожидается массив колонок' });
    await pool.query(
        `INSERT INTO boards (user_id, data) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE data = VALUES(data)`,
        [req.user.userId, JSON.stringify(req.body)]
    );
    res.json({ success: true });
}));

// ==========================================
// 4. ПРОФИЛЬ
// ==========================================
app.get('/api/profile', authenticateToken, wrap(async (req, res) => {
    const [rows] = await pool.query(
        'SELECT username, email, full_name, role, bio, avatar FROM users WHERE id = ?',
        [req.user.userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json(rows[0]);
}));

app.put('/api/profile', authenticateToken, wrap(async (req, res) => {
    const { full_name = '', email = '', role = '', bio = '', avatar = null } = req.body;
    if (avatar && (typeof avatar !== 'string' || !avatar.startsWith('data:image/')))
        return res.status(400).json({ error: 'Некорректное изображение' });

    await pool.query(
        'UPDATE users SET full_name = ?, email = ?, role = ?, bio = ?, avatar = ? WHERE id = ?',
        [String(full_name).slice(0, 255), String(email).slice(0, 255) || null,
         String(role).slice(0, 255), String(bio).slice(0, 5000), avatar, req.user.userId]
    );
    res.json({ success: true });
}));

// ==========================================
// СТАТИКА (только фронтенд-файлы, без server.js, .env и т.п.)
// ==========================================
const BLOCKED = /^\/(server\.js|package(-lock)?\.json|schema\.sql|\.env.*|node_modules)(\/|$)/i;
app.use((req, res, next) => (BLOCKED.test(req.path) ? res.status(404).end() : next()));
app.use(express.static(path.join(__dirname), { dotfiles: 'ignore', index: 'index.html' }));

// Обработчик ошибок
app.use((err, req, res, next) => {
    console.error(err);
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Слишком большой запрос' });
    res.status(500).json({ error: 'Ошибка сервера' });
});

initDb()
    .then(() => app.listen(PORT, () => console.log(`🚀 Сервер запущен на http://localhost:${PORT}`)))
    .catch(err => {
        console.error('❌ Ошибка подключения к БД:', err.message);
        process.exit(1);
    });