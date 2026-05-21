// app.js - Основной контроллер приложения
let currentUser = null;
let isRegisterMode = false;

// Инициализация при старте страницы
document.addEventListener("DOMContentLoaded", async () => {
    await initDB();
    setupMockData(); // Заполнение тестовыми книгами, если БД пуста
    renderCatalog();
});

// Навигация между секциями (SPA)
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
    document.getElementById(`page-${pageId}`).classList.remove('hidden');
    
    if (pageId === 'profile') renderProfile();
}

// Переключение режима Вход / Регистрация
function toggleAuthMode() {
    isRegisterMode = !isRegisterMode;
    document.getElementById('auth-title').innerText = isRegisterMode ? 'Регистрация' : 'Авторизация';
    document.getElementById('reg-fields').classList.toggle('hidden', !isRegisterMode);
    document.getElementById('auth-toggle-text').innerText = isRegisterMode ? 'Уже есть аккаунт?' : 'Нет аккаунта?';
    document.getElementById('auth-toggle-link').innerText = isRegisterMode ? 'Войти' : 'Зарегистрироваться';
}

// Обработка авторизации и регистрации
async function handleAuth(event) {
    event.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;

    if (isRegisterMode) {
        const name = document.getElementById('auth-name').value;
        const role = document.getElementById('auth-role').value;
        const newUser = { name, email, password, role };
        
        try {
            await addRecord('users', newUser);
            alert("Регистрация успешна! Теперь вы можете войти.");
            toggleAuthMode();
        } catch (e) {
            alert("Пользователь с таким Email уже существует.");
        }
    } else {
        const users = await getAllRecords('users');
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            currentUser = user;
            updateUIForAuth();
            showPage('main');
        } else {
            alert("Неверный email или пароль.");
        }
    }
}

// Обновление элементов интерфейса после входа
function updateUIForAuth() {
    document.getElementById('nav-login').classList.add('hidden');
    document.getElementById('nav-profile').classList.remove('hidden');
    document.getElementById('nav-logout').classList.remove('hidden');
    
    // Показ панели администратора/библиотекаря
    if (currentUser && currentUser.role === 'librarian') {
        document.getElementById('librarian-panel').classList.remove('hidden');
    }
}

function logout() {
    currentUser = null;
    document.getElementById('nav-login').classList.remove('hidden');
    document.getElementById('nav-profile').classList.add('hidden');
    document.getElementById('nav-logout').classList.add('hidden');
    document.getElementById('librarian-panel').classList.add('hidden');
    showPage('main');
}

// Рендеринг списка книг с фильтрацией
async function renderCatalog() {
    const books = await getAllRecords('books');
    const grid = document.getElementById('books-grid');
    grid.innerHTML = '';

    const filterTitle = document.getElementById('search-title').value.toLowerCase();
    const filterGenre = document.getElementById('search-genre').value.toLowerCase();

    books.forEach(book => {
        if (book.title.toLowerCase().includes(filterTitle) && book.genre.toLowerCase().includes(filterGenre)) {
            const card = document.createElement('div');
            card.className = "border p-4 rounded shadow-sm bg-white flex flex-col justify-between";
            card.innerHTML = `
                <div>
                    <h4 class="font-bold text-lg text-gray-800">${book.title}</h4>
                    <p class="text-sm text-gray-600">Автор: ${book.author}</p>
                    <p class="text-xs text-blue-600 mt-1">Жанр: ${book.genre}</p>
                </div>
                <button onclick="bookBook(${book.id})" class="mt-4 bg-blue-500 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-600 cursor-pointer">
                    Забронировать
                </button>
            `;
            grid.appendChild(card);
        }
    });
}

// Функция добавления книги библиотекарем
async function addNewBook() {
    const title = document.getElementById('new-title').value;
    const author = document.getElementById('new-author').value;
    const genre = document.getElementById('new-genre').value;

    if (!title || !author || !genre) return alert("Заполните все поля!");

    await addRecord('books', { title, author, genre });
    alert("Книга добавлена в каталог!");
    renderCatalog();
}

// Логика бронирования книги
async function bookBook(bookId) {
    if (!currentUser) {
        alert("Для бронирования необходимо авторизоваться!");
        showPage('auth');
        return;
    }

    const reservation = {
        userId: currentUser.id,
        bookId: bookId,
        date: new Date().toLocaleDateString(),
        status: 'Активно'
    };

    await addRecord('reservations', reservation);
    alert("Книга успешно забронирована!");
}

// Загрузка данных в личный кабинет
async function renderProfile() {
    document.getElementById('user-display-name').innerText = currentUser.name;
    const allReservations = await getAllRecords('reservations');
    const books = await getAllRecords('books');
    const tableBody = document.getElementById('reservations-table');
    tableBody.innerHTML = '';

    const userReservations = allReservations.filter(r => r.userId === currentUser.id);

    userReservations.forEach(res => {
        const book = books.find(b => b.id === res.bookId);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="border p-3">${book ? book.title : 'Неизвестная книга'}</td>
            <td class="border p-3">${res.date}</td>
            <td class="border p-3 text-green-600 font-semibold">${res.status}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Наполнение дефолтными данными при первом запуске
async function setupMockData() {
    const books = await getAllRecords('books');
    if (books.length === 0) {
        await addRecord('books', { title: 'Евгений Онегин', author: 'Александр Пушкин', genre: 'Роман' });
        await addRecord('books', { title: 'Война и мир', author: 'Лев Толстой', genre: 'Драма' });
        await addRecord('books', { title: 'Преступление и наказание', author: 'Федор Достоевский', genre: 'Роман' });
        renderCatalog();
    }
}
