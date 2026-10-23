// Логика форм входа и регистрации (vhod.html, index-login.html)
(function () {
    const form = document.querySelector('.auth-form');
    if (!form) return;

    const isRegister = !!document.getElementById('confirm-password');

    // Блок для ошибок
    const errorEl = document.createElement('div');
    errorEl.style.cssText = 'color:#d93025;font-size:13px;min-height:16px;';
    form.insertBefore(errorEl, form.querySelector('.btn-submit'));

    // Если уже вошли — сразу на доску
    if (api.getToken()) location.href = 'board.html';

    form.addEventListener('submit', async e => {
        e.preventDefault();
        errorEl.textContent = '';

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (isRegister && password !== document.getElementById('confirm-password').value) {
            errorEl.textContent = 'Пароли не совпадают';
            return;
        }

        const btn = form.querySelector('.btn-submit');
        btn.disabled = true;
        try {
            const { token } = await api.request(isRegister ? '/register' : '/login', {
                method: 'POST',
                body: { username, password },
                auth: false
            });
            api.setToken(token);
            location.href = 'board.html';
        } catch (err) {
            errorEl.textContent = err.message;
            btn.disabled = false;
        }
    });
})();