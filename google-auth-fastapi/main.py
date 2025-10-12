from fastapi import FastAPI, Request, Depends, HTTPException, status
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer
from authlib.integrations.starlette_client import OAuth
from starlette.middleware.sessions import SessionMiddleware
import os
from dotenv import load_dotenv
import secrets
from typing import Optional

# Загрузка переменных окружения
load_dotenv()

app = FastAPI(title="Google OAuth FastAPI", debug=True)

# Настройка middleware для сессий
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv('SECRET_KEY', secrets.token_hex(16)),
    session_cookie="google_auth_session"
)

# Настройка статических файлов и шаблонов
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

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

security = HTTPBearer()

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Главная страница с кнопкой входа"""
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/login")
async def login(request: Request):
    """Начало OAuth потока - перенаправление на Google"""
    redirect_uri = request.url_for('auth_callback')
    return await oauth.google.authorize_redirect(request, str(redirect_uri))

@app.get("/auth/callback")
async def auth_callback(request: Request):
    """Обработка callback от Google"""
    try:
        # Получаем токен от Google
        token = await oauth.google.authorize_access_token(request)
        
        # Получаем информацию о пользователе
        user_info = token.get('userinfo')
        
        if not user_info:
            raise HTTPException(status_code=400, detail="Не удалось получить данные пользователя")
        
        # Сохраняем в сессии
        request.session['user'] = {
            'id': user_info['sub'],
            'name': user_info.get('name', ''),
            'email': user_info.get('email', ''),
            'picture': user_info.get('picture', ''),
            'email_verified': user_info.get('email_verified', False)
        }
        
        return RedirectResponse(url=request.url_for('dashboard'))
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Ошибка авторизации: {str(e)}")

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    """Страница после успешного входа"""
    user = request.session.get('user')
    if not user:
        return RedirectResponse(url=request.url_for('home'))
    
    return templates.TemplateResponse("dashboard.html", {
        "request": request,
        "user": user
    })

@app.get("/logout")
async def logout(request: Request):
    """Выход из системы"""
    request.session.clear()
    return RedirectResponse(url=request.url_for('home'))

@app.get("/api/user")
async def get_current_user(request: Request):
    """API для получения данных текущего пользователя"""
    user = request.session.get('user')
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    return user

@app.get("/api/health")
async def health_check():
    """Проверка здоровья API"""
    return {"status": "healthy", "service": "Google OAuth FastAPI"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get('PORT', 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)