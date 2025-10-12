from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from authlib.integrations.starlette_client import OAuth
from starlette.middleware.sessions import SessionMiddleware
import os
import secrets

app = FastAPI(title="Google OAuth FastAPI", debug=False)

# Настройка middleware для сессий
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv('SECRET_KEY', secrets.token_hex(16)),
    session_cookie="google_auth_session"
)

# OAuth конфигурация
oauth = OAuth()
oauth.register(
    name='google',
    client_id=os.getenv('GOOGLE_CLIENT_ID'),
    client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
    server_metadata_url='https://accounts.google.com/.well-known/openid_configuration',
    client_kwargs={
        'scope': 'openid email profile',
        'prompt': 'select_account'
    }
)

# Читаем HTML файлы напрямую
def read_html_file(filename):
    try:
        with open(filename, 'r', encoding='utf-8') as file:
            return file.read()
    except FileNotFoundError:
        return f"<h1>Error: {filename} not found</h1>"

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Главная страница с кнопкой входа"""
    return read_html_file("index.html")

@app.get("/login")
async def login(request: Request):
    """Начало OAuth потока - перенаправление на Google"""
    # Явно указываем redirect_uri для вашего домена
    redirect_uri = "https://account-login-com.onrender.com/auth/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get("/auth/callback")
async def auth_callback(request: Request):
    """Обработка callback от Google"""
    try:
        # Явно указываем redirect_uri при получении токена
        redirect_uri = "https://account-login-com.onrender.com/auth/callback"
        token = await oauth.google.authorize_access_token(request, redirect_uri=redirect_uri)
        user_info = token.get('userinfo')
        
        if not user_info:
            raise HTTPException(status_code=400, detail="Не удалось получить данные пользователя")
        
        request.session['user'] = {
            'id': user_info['sub'],
            'name': user_info.get('name', ''),
            'email': user_info.get('email', ''),
            'picture': user_info.get('picture', ''),
            'email_verified': user_info.get('email_verified', False)
        }
        
        return RedirectResponse(url="/dashboard")
        
    except Exception as e:
        error_html = f"""
        <html>
            <body style="background: #000; color: white; padding: 20px;">
                <h1>Ошибка авторизации</h1>
                <p>{str(e)}</p>
                <a href="/">Вернуться на главную</a>
            </body>
        </html>
        """
        return HTMLResponse(content=error_html, status_code=400)

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    """Страница после успешного входа"""
    user = request.session.get('user')
    if not user:
        return RedirectResponse(url="/")
    
    # Читаем dashboard.html и подставляем данные
    html_content = read_html_file("dashboard.html")
    
    # Заменяем плейсхолдеры на реальные данные
    replacements = {
        "{{ user.name }}": user.get('name', ''),
        "{{ user.email }}": user.get('email', ''),
        "{{ user.id }}": user.get('id', ''),
        "{{ user.picture }}": user.get('picture', '')
    }
    
    for placeholder, value in replacements.items():
        html_content = html_content.replace(placeholder, value)
    
    return HTMLResponse(content=html_content)

@app.get("/logout")
async def logout(request: Request):
    """Выход из системы"""
    request.session.clear()
    return RedirectResponse(url="/")

@app.get("/api/user")
async def get_current_user(request: Request):
    """API для получения данных текущего пользователя"""
    user = request.session.get('user')
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

@app.get("/health")
async def health_check():
    """Проверка здоровья приложения"""
    return {"status": "healthy", "service": "Google OAuth"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
