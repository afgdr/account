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
    with open(filename, 'r', encoding='utf-8') as file:
        return file.read()

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Главная страница с кнопкой входа"""
    return read_html_file("index.html")

@app.get("/login")
async def login(request: Request):
    """Начало OAuth потока - перенаправление на Google"""
    redirect_uri = str(request.url_for('auth_callback'))
    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get("/auth/callback")
async def auth_callback(request: Request):
    """Обработка callback от Google"""
    try:
        token = await oauth.google.authorize_access_token(request)
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
        raise HTTPException(status_code=400, detail=f"Ошибка авторизации: {str(e)}")

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    """Страница после успешного входа"""
    user = request.session.get('user')
    if not user:
        return RedirectResponse(url="/")
    
    # Читаем dashboard.html и подставляем данные
    html_content = read_html_file("dashboard.html")
    html_content = html_content.replace("{{ user.name }}", user.get('name', ''))
    html_content = html_content.replace("{{ user.email }}", user.get('email', ''))
    html_content = html_content.replace("{{ user.id }}", user.get('id', ''))
    html_content = html_content.replace("{{ user.picture }}", user.get('picture', ''))
    
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

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
