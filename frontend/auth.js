// Логика форм входа и регистрации (vhod.html, index-login.html)
(function () {
    const form = document.querySelector('.auth-form');
    if (!form) return;

    // Проверяем, есть ли поле подтверждения пароля (значит, это страница регистрации)
    const isRegister = !!document.getElementById('confirm-password');

    // Блок для ошибок
    const errorEl = document.createElement('div');
    errorEl.style.cssText = 'color:#d93025;font-size:13px;min-height:16px; margin-bottom: 10px; line-height: 1.4;';
    form.insertBefore(errorEl, form.querySelector('.btn-submit'));

    // Если токен уже есть, сразу на доску
    if (api.getToken()) location.href = 'board.html';

    form.addEventListener('submit', async e => {
        e.preventDefault();
        errorEl.textContent = '';

        const password = document.getElementById('password').value;
        let bodyData = {};

        if (isRegister) {
            // Для регистрации берем email и name
            const email = document.getElementById('email').value.trim();
            const name = document.getElementById('name').value.trim();
            
            if (password !== document.getElementById('confirm-password').value) {
                errorEl.textContent = 'Пароли не совпадают';
                return;
            }
            bodyData = { email, name, password };
        } else {
            // Для входа берем только email и пароль
            const email = document.getElementById('email').value.trim();
            bodyData = { email, password };
        }

        const btn = form.querySelector('.btn-submit');
        btn.disabled = true;
        const originalText = btn.textContent;
        btn.textContent = 'Загрузка...';

        try {
            // Отправляем запрос на сервер Маши
            const response = await api.request(isRegister ? '/auth/register' : '/auth/login', {
                method: 'POST',
                body: bodyData,
                auth: false
            });
            
            // Сервер возвращает токен
            api.setToken(response.token);
            location.href = 'board.html';
            
        } catch (err) {
            errorEl.textContent = err.message || 'Ошибка сервера';
            btn.disabled = false;
            btn.textContent = originalText;
        }
    });
})();