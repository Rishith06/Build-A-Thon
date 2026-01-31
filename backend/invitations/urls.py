from django.urls import path
from rest_framework.authtoken import views as auth_views
from .views import RegisterView, MyQRCodeView, generate_invite, UserListView, revoke_invite, verify_qr, suspend_user, EventListView, delete_user, UserDetailView, face_recognize, ComplaintListCreateView, delete_complaint

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('me/', UserDetailView.as_view(), name='user-detail'),
    path('events/', EventListView.as_view(), name='event-list'),
    path('login/', auth_views.obtain_auth_token, name='api_token_auth'),
    path('my-qr/', MyQRCodeView.as_view(), name='my-qr'),
    path('admin/generate-invite/', generate_invite, name='generate-invite'),
    path('admin/revoke-invite/', revoke_invite, name='revoke-invite'),
    path('admin/verify-qr/', verify_qr, name='verify-qr'),
    path('admin/suspend-user/', suspend_user, name='suspend-user'),
    path('admin/delete-user/', delete_user, name='delete-user'),
    path('admin/face-recognize/', face_recognize, name='face-recognize'),
    path('complaints/', ComplaintListCreateView.as_view(), name='complaint-list-create'),
    path('admin/delete-complaint/', delete_complaint, name='delete-complaint'),
]
