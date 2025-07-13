from django.urls import path
from . import views

app_name = 'analyzer'

urlpatterns = [
    path('', views.index, name='index'),
    path('analyze/<str:owner>/<str:repo>/', views.analyze_repository, name='analyze_repository'),
    path('compare/', views.compare_repositories, name='compare_repositories'),
    path('about/', views.about, name='about'),
    path('api/docs/', views.api_docs, name='api_docs'),
    path('api/analyze/', views.api_analyze_repository, name='api_analyze_repository'),
] 