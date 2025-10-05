from django.urls import path
from django.http import HttpResponse

def home(request):
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Simple Django</title>
        <style>
            body { 
                margin: 0; 
                padding: 0; 
                background: #808080; 
                height: 100vh; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                color: white;
                font-family: Arial;
            }
        </style>
    </head>
    <body>
        <div style="text-align: center;">
            <h1>Django работает! ✅</h1>
            <p>Простой серый экран</p>
            <button onclick="goBlack()">Сделать черный экран</button>
        </div>
        
        <script>
            function goBlack() {
                document.body.innerHTML = '<div style="background:#000; width:100%; height:100vh;"></div>';
            }
        </script>
    </body>
    </html>
    """
    return HttpResponse(html)

urlpatterns = [path('', home)]