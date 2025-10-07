class DiscordSender {
    constructor() {
        this.sendBtn = document.getElementById('sendBtn');
        this.statusDiv = document.getElementById('status');
        this.form = document.getElementById('messageForm');
        
        this.init();
    }
    
    init() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });
        
        // Счетчик символов для сообщения
        document.getElementById('message').addEventListener('input', this.updateCharCounter.bind(this));
        
        // Enter + Ctrl для отправки
        document.getElementById('message').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Проверка webhook URL на лету
        document.getElementById('webhookUrl').addEventListener('input', (e) => {
            this.validateWebhookUrl(e.target.value);
        });
    }
    
    updateCharCounter() {
        const message = document.getElementById('message');
        const counter = document.getElementById('charCounter');
        const length = message.value.length;
        
        counter.textContent = `${length}/2000`;
        
        counter.className = 'char-counter';
        if (length > 1900) {
            counter.classList.add('danger');
        } else if (length > 1500) {
            counter.classList.add('warning');
        }
    }
    
    validateWebhookUrl(url) {
        const webhookInput = document.getElementById('webhookUrl');
        
        if (url && !url.includes('discord.com/api/webhooks/')) {
            webhookInput.style.borderColor = '#e74c3c';
        } else {
            webhookInput.style.borderColor = '#e1e5e9';
        }
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
        
        if (!webhookUrl) {
            this.showStatus('Введите Webhook URL', 'error');
            return;
        }
        
        if (!webhookUrl.includes('discord.com/api/webhooks/')) {
            this.showStatus('Неверный формат Webhook URL', 'error');
            return;
        }

        // Показываем загрузку
        this.showStatus('Отправка сообщения в Discord...', 'loading');
        this.setLoading(true);

        try {
            const response = await fetch('/api/send-to-discord', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    message: message,
                    webhookUrl: webhookUrl
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showStatus('✅ Сообщение успешно отправлено в Discord!', 'success');
                document.getElementById('message').value = '';
                this.updateCharCounter();
            } else {
                this.showStatus(`❌ Ошибка: ${data.error}`, 'error');
            }
            
        } catch (error) {
            console.error('Ошибка:', error);
            this.showStatus('❌ Ошибка подключения к серверу', 'error');
        } finally {
            this.setLoading(false);
            
            // Автоскрытие успешного статуса
            if (this.statusDiv.classList.contains('success')) {
                setTimeout(() => {
                    this.hideStatus();
                }, 5000);
            }
        }
    }
    
    setLoading(loading) {
        if (loading) {
            this.sendBtn.disabled = true;
            this.sendBtn.classList.add('loading');
        } else {
            this.sendBtn.disabled = false;
            this.sendBtn.classList.remove('loading');
        }
    }
    
    showStatus(message, type) {
        this.statusDiv.textContent = message;
        this.statusDiv.className = `status ${type}`;
    }
    
    hideStatus() {
        this.statusDiv.style.display = 'none';
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new DiscordSender();
});
