import os
import django
import sys

# Setup Django environment
sys.path.append(r'c:\Users\rishi\Documents\rishi-codes\_Hackethon2k26\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hackathon_backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def create_coordinator():
    username = 'coordinator'
    password = 'coordinatorpass'
    email = 'coordinator@hackathon.com'
    
    if not User.objects.filter(username=username).exists():
        print(f"Creating coordinator user: {username}")
        # Coordinators are staff but not superusers maybe? Or mostly just regular users with special logic.
        # For prototype simplicity: make them is_staff=True so we can differentiate if needed, 
        # or just rely on username. Let's make them normal staff so they pass IsAdminUser if we re-used that,
        # BUT we want to separate them.
        # Let's just make a normal user for now and rely on our code knowing this username is special,
        # OR better: make them is_staff so they can access "admin" features if we shared permissions.
        # Let's make them is_staff=True so they can hit the @permission_classes([permissions.IsAdminUser]) endpoints we currently used for verify_qr.
        User.objects.create_user(username=username, email=email, password=password, is_staff=True)
        print("Coordinator created successfully.")
    else:
        print("Coordinator user already exists.")
        # Ensure is_staff is true just in case
        u = User.objects.get(username=username)
        if not u.is_staff:
            u.is_staff = True
            u.save()
            print("Updated existing coordinator to have is_staff=True")

if __name__ == '__main__':
    create_coordinator()
