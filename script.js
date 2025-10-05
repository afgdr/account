class DiscordSender {
    constructor() {
        this.backendUrl = 'https://your-worker.your-subdomain.workers.dev'; // Замените на ваш URL Worker
        this.form = document.getElementById('discordForm');
        this.messageInput = document.getElementById('message');
        this.usernameInput = document.getElementById('username');
        this.sendBtn = document.getElementById('sendBtn');
        this.resultDiv = document.getElementById('result');
        
        this.init();
    }
    
    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        const message = this.messageInput.value.trim();
        const username = this.usernameInput.value.trim() || 'Webhook Bot';
        
        if (!message) {
            this.showResult('Пожалуйста, введите сообщение', 'error');
            return;
        }
        
        this.setLoading(true);
        
        try {
            const response = await this.sendToDiscord(message, username);
            
            if (response.success) {
                this.showResult('✅ Сообщение успешно отправлено в Discord!', 'success');
                this.form.reset();
            } else {
                this.showResult(`❌ Ошибка: ${response.error}`, 'error');
            }
        } catch (error) {
            this.showResult('❌ Ошибка сети. Попробуйте еще раз.', 'error');
            console.error('Error:', error);
        } finally {
            this.setLoading(false);
        }
    }
    
    async sendToDiscord(message, username) {
        const response = await fetch(`${this.backendUrl}/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                username: username
            })
        });
        
        return await response.json();
    }
    
    setLoading(loading) {
        const btnText = this.sendBtn.querySelector('.btn-text');
        const btnLoading = this.sendBtn.querySelector('.btn-loading');
        
        if (loading) {
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline';
            this.sendBtn.disabled = true;
        } else {
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            this.sendBtn.disabled = false;
        }
    }
    
    showResult(message, type) {
        this.resultDiv.textContent = message;
        this.resultDiv.className = `result ${type}`;
        this.resultDiv.style.display = 'block';
        
        // Авто-скрытие успешных сообщений
        if (type === 'success') {
            setTimeout(() => {
                this.resultDiv.style.display = 'none';
            }, 5000);
        }
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new DiscordSender();
});
