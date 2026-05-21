// db.js - Модуль работы с IndexedDB
const DB_NAME = 'LibraryDB';
const DB_VERSION = 1;
let db;

// 1. Инициализация базы данных (вызывается при загрузке страниц)
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => reject("Ошибка открытия БД: " + event.target.errorCode);
        
        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Создаем таблицу (хранилище объектов) пользователей, если её нет
            if (!db.objectStoreNames.contains('users')) {
                // id будет генерироваться автоматически (autoIncrement)
                const userStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
                
                // Создаем уникальный индекс по email, чтобы нельзя было регистрировать дубликаты
                userStore.createIndex('email', 'email', { unique: true });
            }
        };
    });
}

// 2. Логика регистрации пользователя (вызывается из register.js)
function registerUserInDB(userData) {
    return new Promise((resolve, reject) => {
        // Открываем транзакцию на чтение и запись в таблицу 'users'
        const transaction = db.transaction(['users'], 'readwrite');
        const store = transaction.objectStore('users');
        
        // Используем ранее созданный индекс 'email', чтобы найти пользователя
        const index = store.index('email');
        const checkRequest = index.get(userData.email);

        // Срабатывает, когда IndexedDB завершила поиск по email
        checkRequest.onsuccess = () => {
            // Если результат поиска существует — значит, такой email уже есть в базе
            if (checkRequest.result) {
                reject("Пользователь с таким Email уже зарегистрирован!");
            } else {
                // Если email свободен, добавляем объект пользователя { fio, email, password }
                const addRequest = store.add(userData);
                
                // Срабатывает при успешной записи
                addRequest.onsuccess = () => {
                    resolve(addRequest.result); // возвращает сгенерированный id пользователя
                };
                
                // Срабатывает при непредвиденной ошибке записи
                addRequest.onerror = () => {
                    reject("Ошибка при сохранении пользователя в базу данных.");
                };
            }
        };

        // Срабатывает при системной ошибке во время поиска
        checkRequest.onerror = () => {
            reject("Ошибка базы данных при проверке Email.");
        };
    });
}

// 3. Логика авторизации пользователя (вызывается из auth.js)
function loginUserInDB(email, password) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readonly');
        const store = transaction.objectStore('users');
        const index = store.index('email');
        const request = index.get(email);

        request.onsuccess = () => {
            const user = request.result;
            // Проверяем, существует ли пользователь и совпадает ли его пароль
            if (user && user.password === password) {
                resolve(user); // Авторизация успешна
            } else {
                reject("Неверный Email или пароль!");
            }
        };
        
        request.onerror = () => {
            reject("Ошибка базы данных при попытке входа.");
        };
    });
}
