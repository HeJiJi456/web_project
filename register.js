// register.js - Логика обработки формы регистрации

// Как только страница полностью загрузилась, инициализируем базу данных
document.addEventListener("DOMContentLoaded", async () => {
    try {
        await initDB(); // функция из db.js
    } catch (err) {
        console.error("Не удалось запустить базу данных:", err);
    }
});

// Находим форму в HTML по её ID
const form = document.getElementById('registerForm');
const errorBanner = document.getElementById('error-banner');

// Перехватываем отправку формы
form.addEventListener('submit', async (event) => {
    event.preventDefault(); // отменяем перезагрузку страницы браузером
    
    // Скрываем прошлые сообщения об ошибках
    errorBanner.style.display = 'none';

    // Получаем значения из полей ввода
    const fio = document.getElementById('reg-fio').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;

    // 1. Проверяем совпадение паролей
    if (password !== confirm) {
        showError("Пароли не совпадают!");
        return;
    }

    // 2. Пытаемся сохранить пользователя в IndexedDB
    try {
        await registerUserInDB({ fio, email, password }); // функция из db.js
        
        // Если всё успешно, очищаем форму и перенаправляем на страницу входа
        form.reset();
        window.location.href = 'auth.html'; 
    } catch (error) {
        // Если база данных вернула ошибку (например, email занят), выводим её
        showError(error);
    }
});

// Вспомогательная функция для плавного показа ошибок прямо на карточке
function showError(message) {
    errorBanner.innerText = message;
    errorBanner.style.display = 'block';
}
