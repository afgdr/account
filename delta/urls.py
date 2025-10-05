from django.urls import path
from django.http import HttpResponse

def index(request):
    html = '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>Security Check</title>
        <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
        <style>
            body {
                margin: 0;
                padding: 0;
                background: #808080;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
            }
        </style>
    </head>
    <body>
        <div class="cf-turnstile" 
             data-sitekey="0x4AAAAAAB48k0M029aXhS6PbAwMODb6hsk"
             data-callback="onVerify">
        </div>
        
        <script>
            function onVerify() {
                document.body.innerHTML = '<div style="background:#000; width:100%; height:100vh;"></div>';
            }
        </script>
    </body>
    </html>
    '''
    return HttpResponse(html)

urlpatterns = [
    path('', index),
]