// Конфигурация Google OAuth
const GOOGLE_CONFIG = {
    client_id: "421466180389-vlbok5rmkea0s22evhj2cig4qcie0a01.apps.googleusercontent.com",
    redirect_uri: "https://delta-exploits.pages.dev/auth-callback.html",
    scope: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
    response_type: "token id_token"
};

// Функция для начала OAuth flow
function startGoogleOAuth() {
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", GOOGLE_CONFIG.client_id);
    authUrl.searchParams.set("redirect_uri", GOOGLE_CONFIG.redirect_uri);
    authUrl.searchParams.set("scope", GOOGLE_CONFIG.scope);
    authUrl.searchParams.set("response_type", GOOGLE_CONFIG.response_type);
    authUrl.searchParams.set("nonce", generateNonce());
    
    window.location.href = authUrl.toString();
}

// Генерация nonce для безопасности
function generateNonce() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Проверка авторизации
function checkAuth() {
    return localStorage.getItem('google_user') !== null;
}

// Получение данных пользователя
function getUserData() {
    const userData = localStorage.getItem('google_user');
    return userData ? JSON.parse(userData) : null;
}
