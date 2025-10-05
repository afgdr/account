import os
import sys
from django.conf import settings
from django.core.management import execute_from_command_line
from django.urls import path
from django.http import HttpResponse

# Минимальные настройки
settings.configure(
    DEBUG=True,
    SECRET_KEY='minimal-secret-key',
    ROOT_URLCONF=__name__,
    ALLOWED_HOSTS=['*'],
    INSTALLED_APPS=[],
    MIDDLEWARE=[],
)

# View - черный экран
def black_view(request):
    return HttpResponse('<html style="background:black;height:100vh;margin:0"></html>')

# URL routing
urlpatterns = [
    path('', black_view),
]

if __name__ == '__main__':
    execute_from_command_line(sys.argv)