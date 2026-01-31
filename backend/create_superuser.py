import os
import django
import sys

# Add project root to path if needed (since we run from root, backend/ is in path if we do it right, 
# but better to handle strictly)
sys.path.append(os.path.join(os.getcwd(), 'backend'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hackathon_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@hackathon.com', 'adminpass')
    print("Superuser 'admin' created.")
else:
    print("Superuser 'admin' already exists.")
