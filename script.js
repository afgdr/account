class DiscordWebhookApp {
    constructor() {
        // URL бэкенда - замените на ваш реальный URL после деплоя
        this.backendUrl = 'delta-exploits.elektroclesh.workers.dev/';
        
        // Элементы DOM
        this.form = document.getElementById('discordForm');
        this.webhookInput = document.getElementById('webhookUrl');
        this.usernameInput = document.getElementById('username');
        this.messageInput = document.getElementById('message');
        this.sendBtn = document.getElementById('sendBtn');
        this.resultDiv = document.getElementById('result');
        this.charCount = document.getElementById('charCount');
        this.apiStatus = document.getElementById('apiStatus');
        
        this.init();
    }
    
    init() {
        // Обработчики событий
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.messageInput.addEventListener('input', () => this.updateCharCount());
        this.webhookInput.addEventListener('input', () => this.validateWebhookUrl());
        
        // Сохранение вебхука в localStorage для удобства
        this.loadSavedWebhook();
        
        // Обновляем счетчик символов при загрузке
        this.updateCharCount();
    }
    
    loadSavedWebhook() {
        const savedWebhook = localStorage.getItem('last_webhook_url');
        if (savedWebhook) {
            this.webhookInput.value = savedWebhook;
            this.validateWebhookUrl();
        }
    }
    
    saveWebhook(webhookUrl) {
        if (webhookUrl && this.isValidWebhookUrl(webhookUrl)) {
            localStorage.setItem('last_webhook_url', webhookUrl);
        }
    }
    
    validateWebhookUrl() {
        const url = this.webhookInput.value.trim();
        if (url && !this.isValidWebhookUrl(url)) {
            this.webhookInput.setCustomValidity('Пожалуйста, введите корректный URL вебхука Discord');
        } else {
            this.webhookInput.setCustomValidity('');
        }
    }
    
    isValidWebhookUrl(url) {
        const webhookPattern = /^https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+$/;
        return webhookPattern.test(url);
    }
    
    updateCharCount() {
        const count = this.messageInput.value.length;
        this.charCount.textContent = count;
        
        if (count > 1800) {
            this.charCount.classList.add('warning');
        } else {
            this.charCount.classList.remove('warning');
        }
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        const webhookUrl = this.webhookInput.value.trim();
        const message = this.messageInput.value.trim();
        const username = this.usernameInput.value.trim() || 'Webhook Bot';
        
        // Валидация
        if (!this.isValidWebhookUrl(webhookUrl)) {
            this.showResult('❌ Пожалуйста, введите корректный URL вебхука Discord', 'error');
            this.webhookInput.focus();
            return;
        }
        
        if (!message) {
            this.showResult('❌ Пожалуйста, введите сообщение', 'error');
            this.messageInput.focus();
            return;
        }
        
        if (message.length > 2000) {
            this.showResult('❌ Сообщение слишком длинное (максимум 2000 символов)', 'error');
            return;
        }
        
        // Сохраняем вебхук для будущего использования
        this.saveWebhook(webhookUrl);
        
        // Блокируем форму на время отправки
        this.setLoading(true);
        
        try {
            const result = await this.sendToBackend(webhookUrl, message, username);
            
            if (result.success) {
                this.showResult('✅ Сообщение успешно отправлено в Discord!', 'success');
                // Очищаем только поле сообщения, оставляя вебхук
                this.messageInput.value = '';
                this.updateCharCount();
            } else {
                this.showResult(`❌ Ошибка: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showResult('❌ Ошибка сети. Проверьте подключение и попробуйте снова.', 'error');
            console.error('Submission error:', error);
        } finally {
            this.setLoading(false);
        }
    }
    
    async sendToBackend(webhookUrl, message, username) {
        const response = await fetch(`${this.backendUrl}/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                webhook_url: webhookUrl,
                message: message,
                username: username
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    }
    
    setLoading(loading) {
        const btnText = this.sendBtn.querySelector('.btn-text');
        const btnLoading = this.sendBtn.querySelector('.btn-loading');
        
        if (loading) {
            btnText.style.display = 'none';
            btnLoading.style.display = 'flex';
            this.sendBtn.disabled = true;
        } else {
            btnText.style.display = 'flex';
            btnLoading.style.display = 'none';
            this.sendBtn.disabled = false;
        }
    }
    
    showResult(message, type) {
        this.resultDiv.textContent = message;
        this.resultDiv.className = `result-message ${type}`;
        this.resultDiv.style.display = 'block';
        
        // Автоматически скрываем успешные сообщения через 5 секунд
        if (type === 'success') {
            setTimeout(() => {
                this.resultDiv.style.display = 'none';
            }, 5000);
        }
        
        // Прокручиваем к результату
        this.resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Инициализация приложения когда DOM загружен
document.addEventListener('DOMContentLoaded', () => {
    new DiscordWebhookApp();
});
