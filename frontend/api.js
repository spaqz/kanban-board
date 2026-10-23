// Общий клиент для работы с API
const TOKEN_KEY = 'kanbanToken';

const api = {
    getToken: () => localStorage.getItem(TOKEN_KEY),
    setToken: t => localStorage.setItem(TOKEN_KEY, t),

    logout() {
        localStorage.removeItem(TOKEN_KEY);
        location.href = 'vhod.html';
    },

    async request(path, { method = 'GET', body, auth = true } = {}) {
        const headers = { 'Content-Type': 'application/json' };
        if (auth) {
            const token = api.getToken();
            if (!token) { api.logout(); throw new Error('Нет токена'); }
            headers['Authorization'] = 'Bearer ' + token;
        }
        const res = await fetch('/api' + path, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 401 && auth) { api.logout(); throw new Error('Сессия истекла'); }
        if (!res.ok) throw new Error(data.error || 'Ошибка запроса');
        return data;
    }
};