// auth.js - Логика обработки формы авторизации

// Инициализируем базу данных при загрузке страницы
document.addEventListener("DOMContentLoaded", async () => {
    try {
        await initDB(); // функция из db.js
    } catch (err) {
        console.error("Не удалось подключить базу данных:", err);
    }
});

const loginForm = document.getElementById('loginForm');
const errorBanner = document.getElementById('error-banner');

// Отслеживаем отправку формы авторизации
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Отменяем перезагрузку страницы
    
    // Скрываем прошлые ошибки
    errorBanner.style.display = 'none';

    // Получаем введенные данные
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;

    try {
        // Проверяем пользователя через функцию в db.js
        const user = await loginUserInDB(email, password);
        
        // Сохраняем вошедшего пользователя в локальную память браузера (сессия)
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Очищаем форму и перенаправляем на главную страницу с каталогом
        loginForm.reset();
        window.location.href = 'index.html';
    } catch (error) {
        // Если база данных вернула "Неверный Email или пароль!", показываем ошибку
        showError(error);
    }
});

// Функция вывода ошибок на экран
function showError(message) {
    errorBanner.innerText = message;
    errorBanner.style.display = 'block';
}
