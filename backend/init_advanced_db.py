import os
import django
import sys

sys.path.append(r'c:\Users\rishi\Documents\rishi-codes\_Hackethon2k26\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hackathon_backend.settings')
django.setup()

from invitations.models import Event, UserProfile
from django.contrib.auth.models import User

def init_data():
    # 1. Create Default "Main Gate" Event
    main_gate, created = Event.objects.get_or_create(
        name="Main Gate Access",
        defaults={'is_persistent': True}
    )
    if created:
        print("Created 'Main Gate Access' event.")
    
    # 2. Create a Sample "Hackathon 2026" Event
    hackathon, created = Event.objects.get_or_create(
        name="Hackathon 2026",
        defaults={'is_persistent': False}
    )
    if created:
        print("Created 'Hackathon 2026' event.")

    # 3. Create Profiles for existing users
    for user in User.objects.all():
        if not hasattr(user, 'profile'):
            role = 'student'
            if user.is_staff: role = 'staff'
            # Check if username suggests guest
            if 'guest' in user.username.lower(): role = 'guest'
            
            UserProfile.objects.create(user=user, role=role)
            print(f"Created {role} profile for {user.username}")

if __name__ == '__main__':
    init_data()
