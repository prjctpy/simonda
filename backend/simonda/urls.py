from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path

from inovasi.api import api

admin.site.site_header = "SIMONDA Rote Ndao"
admin.site.site_title = "SIMONDA"
admin.site.index_title = "Pengelolaan data inovasi daerah"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", api.urls),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
