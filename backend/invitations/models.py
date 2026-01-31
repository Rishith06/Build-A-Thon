from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('guest', 'Guest'),
        ('staff', 'Staff'),
    )
    STUDENT_TYPE_CHOICES = (
        ('internal', 'Internal Student'),
        ('external', 'External Student'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    student_type = models.CharField(max_length=20, choices=STUDENT_TYPE_CHOICES, default='internal')
    college_name = models.CharField(max_length=200, blank=True, null=True)
    student_id = models.CharField(max_length=50, blank=True, null=True)
    is_suspended = models.BooleanField(default=False)
    is_suspended = models.BooleanField(default=False)
    suspension_end_date = models.DateTimeField(null=True, blank=True)
    photo = models.ImageField(upload_to='profile_photos/', blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} - {self.role}"

class Event(models.Model):
    name = models.CharField(max_length=100)
    date = models.DateTimeField(null=True, blank=True)
    is_persistent = models.BooleanField(default=False) # True for "Main Gate Access", False for "Music Fest"

    def __str__(self):
        return self.name

class Pass(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='passes')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='passes')
    qr_code_data = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.username} - {self.event.name}"

class Complaint(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('resolved', 'Resolved'),
        ('dismissed', 'Dismissed'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='complaints_against')
    reporter = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='complaints_filed')
    description = models.TextField()
    proof_photo = models.ImageField(upload_to='complaints/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    def __str__(self):
        return f"Complaint against {self.user.username} by {self.reporter.username if self.reporter else 'Unknown'}"
