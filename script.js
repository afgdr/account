// ТВОЙ WORKER URL - замени на свой
const WORKER_URL = 'https://delta-exploits.elektroclesh.workers.dev';

// Когда страница загрузилась
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('myForm');
    const result = document.getElementById('result');
    
    // При отправке формы
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Получаем данные
        const webhook = document.getElementById('webhook').value;
        const username = document.getElementById('username').value || 'Webhook Bot';
        const message = document.getElementById('message').value;
        
        // Показываем загрузку
        result.textContent = '⏳ Отправка...';
        result.className = '';
        
        try {
            // Отправляем на Worker
            const response = await fetch(WORKER_URL + '/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    webhook_url: webhook,
                    message: message,
                    username: username
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                result.textContent = '✅ ' + data.message;
                result.className = 'success';
                form.reset(); // Очищаем форму
            } else {
                result.textContent = '❌ ' + data.error;
                result.className = 'error';
            }
            
        } catch (error) {
            result.textContent = '❌ Ошибка сети: ' + error.message;
            result.className = 'error';
        }
    });
});
