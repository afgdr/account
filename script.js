class DiscordSender {
    constructor() {
        this.backendUrl = 'https://account-backend-delta.onrender.com/'; // ЗАМЕНИТЕ на ваш Render URL
        this.sendBtn = document.getElementById('sendBtn');
        this.statusDiv = document.getElementById('status');
        
        this.init();
    }
    
    init() {
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        
        // Enter для отправки
        document.getElementById('message').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.sendMessage();
            }
        });
    }
    
    async sendMessage() {
        const username = document.getElementById('username').value.trim();
        const message = document.getElementById('message').value.trim();
        const webhookUrl = document.getElementById('webhookUrl').value.trim();
        
        // Валидация
        if (!username) {
            this.showStatus('Введите ваше имя', 'error');
            return;
        }
        
        if (!message) {
            this.showStatus('Введите сообщение', 'error');
            return;
        }
        
        // Показываем загрузку
        this.showStatus('Отправка сообщения...', 'loading');
        this.sendBtn.disabled = true;
        
        try {
            const response = await fetch(`${this.backendUrl}/api/send-to-discord`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    message: message,
                    webhookUrl: webhookUrl || undefined // Отправляем только если указан
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showStatus('✅ Сообщение успешно отправлено в Discord!', 'success');
                document.getElementById('message').value = ''; // Очищаем поле сообщения
            } else {
                this.showStatus(`❌ Ошибка: ${data.error}`, 'error');
            }
            
        } catch (error) {
            this.showStatus('❌ Ошибка подключения к серверу', 'error');
            console.error('Ошибка:', error);
        } finally {
            this.sendBtn.disabled = false;
            
            // Автоскрытие успешного статуса
            if (this.statusDiv.classList.contains('success')) {
                setTimeout(() => {
                    this.hideStatus();
                }, 5000);
            }
        }
    }
    
    showStatus(message, type) {
        this.statusDiv.textContent = message;
        this.statusDiv.className = `status ${type}`;
        this.statusDiv.style.display = 'block';
    }
    
    hideStatus() {
        this.statusDiv.style.display = 'none';
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new DiscordSender();
});

// Дополнительные функции для UX
document.getElementById('message').addEventListener('input', function() {
    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = this.value.trim().length === 0;
});

// Показ символов
document.getElementById('message').addEventListener('input', function() {
    const charCount = this.value.length;
    const counter = document.getElementById('charCounter') || (() => {
        const counter = document.createElement('div');
        counter.id = 'charCounter';
        counter.style.cssText = 'text-align: right; font-size: 0.8rem; color: #666; margin-top: 5px;';
        this.parentNode.appendChild(counter);
        return counter;
    })();
    
    counter.textContent = `${charCount}/2000 символов`;
    
    if (charCount > 1900) {
        counter.style.color = '#e74c3c';
    } else if (charCount > 1500) {
        counter.style.color = '#f39c12';
    } else {
        counter.style.color = '#666';
    }
});
