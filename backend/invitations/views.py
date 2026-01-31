from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import get_user_model
from .models import Pass, Event, UserProfile
from .serializers import UserSerializer, PassSerializer, EventSerializer
from django.conf import settings
import qrcode
import io
from django.core.mail import EmailMultiAlternatives
from django.utils import timezone
from datetime import timedelta
from deepface import DeepFace
import tempfile
import os
import pandas as pd

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserSerializer

class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

class EventListView(generics.ListCreateAPIView):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAdminUser]

class UserDetailView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class MyQRCodeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Return ALL active passes
        user_passes = Pass.objects.filter(user=request.user, is_active=True)
        if user_passes.exists():
            return Response(PassSerializer(user_passes, many=True).data)
        return Response({"detail": "No active pass found."}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def generate_invite(request):
    username = request.data.get('username')
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

    # Get Default Event (e.g., Hackathon 2026)
    event_name = request.data.get('event', 'Hackathon 2026')
    event, _ = Event.objects.get_or_create(name=event_name)

    # Check if pass exists
    # Check if pass exists
    if Pass.objects.filter(user=user, event=event).exists():
        return Response({"detail": f"Pass already exists for {user.username} in {event.name}."}, status=status.HTTP_400_BAD_REQUEST)

    # Generate QR Data
    qr_data = f"EVENT_{event.id}_USER_{user.id}_{user.username}"
    
    # Generate QR Image
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(qr_data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Save Pass
    new_pass = Pass.objects.create(user=user, event=event, qr_code_data=qr_data)
    
    # Send Email
    subject = f'Your Pass for {event.name}'
    message = f'Hi {user.username}, here is your entry pass for {event.name}.'
    email_from = settings.EMAIL_HOST_USER if hasattr(settings, 'EMAIL_HOST_USER') else 'admin@hackathon.com'
    recipient_list = [user.email]
    
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)

    try:
        email = EmailMultiAlternatives(subject, message, email_from, recipient_list)
        email.attach(f'pass_{user.username}.png', buffer.getvalue(), 'image/png')
        email.send()
    except Exception as e:
        print(f"Email failed: {e}")
    
    return Response(PassSerializer(new_pass).data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def revoke_invite(request):
    username = request.data.get('username')
    event_name = request.data.get('event', 'Hackathon 2026')
    
    try:
        user = User.objects.get(username=username)
        event = Event.objects.get(name=event_name)
        user_pass = Pass.objects.get(user=user, event=event)
        user_pass.delete() # Or set is_active=False
        return Response({"detail": f"Pass revoked for {username}."}, status=status.HTTP_200_OK)
    except (User.DoesNotExist, Event.DoesNotExist, Pass.DoesNotExist):
        return Response({"detail": "Pass not found."}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def suspend_user(request):
    username = request.data.get('username')
    action = request.data.get('action') # 'suspend' or 'unsuspend'
    duration = request.data.get('duration') # Optional hours
    
    try:
        user = User.objects.get(username=username)
        # Ensure profile exists
        if not hasattr(user, 'profile'):
             UserProfile.objects.create(user=user, role='student')
        profile = user.profile
        
        if action == 'suspend':
            profile.is_suspended = True
            if duration:
                profile.suspension_end_date = timezone.now() + timedelta(hours=int(duration))
                msg = f"User {username} has been SUSPENDED for {duration} hours."
            else:
                profile.suspension_end_date = None
                msg = f"User {username} has been SUSPENDED indefinitely."
        else:
            profile.is_suspended = False
            profile.suspension_end_date = None
            msg = f"User {username} has been ACTIVE/UNSUSPENDED."
            
        profile.save()
        return Response({"detail": msg, "is_suspended": profile.is_suspended}, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def delete_user(request):
    username = request.data.get('username')
    try:
        user = User.objects.get(username=username)
        user.delete()
        return Response({"detail": f"User {username} deleted successfully."}, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
# Allow Coordinators too (assumed staff or specific permission)
@permission_classes([permissions.IsAuthenticated]) 
def verify_qr(request):
    if not request.user.is_staff: # Simple coordinator check
         return Response({"detail": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

    qr_data = request.data.get('qr_data')
    if not qr_data:
        return Response({"detail": "QR Data is required."}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        user_pass = Pass.objects.get(qr_code_data=qr_data)
        
        # Check suspension
        if hasattr(user_pass.user, 'profile') and user_pass.user.profile.is_suspended:
             # Check if timed suspension has expired
             if user_pass.user.profile.suspension_end_date and timezone.now() > user_pass.user.profile.suspension_end_date:
                 # Auto-unsuspend
                 user_pass.user.profile.is_suspended = False
                 user_pass.user.profile.suspension_end_date = None
                 user_pass.user.profile.save()
                 # Allow through (fall through to success response)
             else:
                 return Response({"valid": False, "detail": "User is SUSPENDED."}, status=status.HTTP_403_FORBIDDEN)

        serialized = PassSerializer(user_pass)
        
        # Get extra user details
        profile = user_pass.user.profile if hasattr(user_pass.user, 'profile') else None
        user_details = {
            "name": user_pass.user.username,
            "role": profile.role if profile else "Unknown",
            "photo_url": profile.photo.url if profile and profile.photo else None
        }

        return Response({
            "valid": True, 
            "message": f"ACCESS GRANTED: {user_pass.user.username} ({user_pass.event.name})",
            "data": serialized.data,
            "user_details": user_details
        }, status=status.HTTP_200_OK)
    except Pass.DoesNotExist:
        return Response({"valid": False, "detail": "Invalid QR Code."}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated]) 
def face_recognize(request):
    if 'image' not in request.FILES:
        return Response({"detail": "Image required."}, status=status.HTTP_400_BAD_REQUEST)
    
    # Save uploaded file to temp
    img_file = request.FILES['image']
    fd, tmp_path = tempfile.mkstemp(suffix=".jpg")
    os.close(fd) # Close the file descriptor immediately so other processes can read it
    
    try:
        with open(tmp_path, 'wb') as f:
            for chunk in img_file.chunks():
                f.write(chunk)

        # DB Path: where user photos are
        db_path = os.path.join(settings.MEDIA_ROOT, 'profile_photos')
        
        # Check if db_path exists and has images
        if not os.path.exists(db_path) or not os.listdir(db_path):
             return Response({"detail": "No registered users with photos found."}, status=status.HTTP_404_NOT_FOUND)

        # Run Face Search
        # silent=True suppresses some logs
        try:
            results = DeepFace.find(img_path=tmp_path, db_path=db_path, enforce_detection=False, model_name="VGG-Face", silent=True)
        except ValueError:
            # DeepFace raises ValueError if no face detected even with enforce_detection=False sometimes
             return Response({"detail": "No face detected in the image."}, status=status.HTTP_400_BAD_REQUEST)

        # DeepFace.find returns a list of DataFrames
        if len(results) > 0 and not results[0].empty:
            df = results[0]
            # Get best match
            matched_path = df.iloc[0]['identity']
            
            # Extract filename to match against DB
            filename = os.path.basename(matched_path)
            
            try:
                # Find the user profile that uses this photo
                # Use Q objects if needed, but icontains is a good heuristic for standard file uploads
                profile = UserProfile.objects.get(photo__icontains=filename) 
                user = profile.user
                
                # Check for Pass
                passes = Pass.objects.filter(user=user, is_active=True)
                pass_info = [p.event.name for p in passes]

                return Response({
                    "valid": True,
                    "message": f"IDENTIFIED: {user.username}",
                    "user_details": {
                        "name": user.username,
                        "role": profile.role,
                        "student_type": profile.student_type,
                        "college_name": profile.college_name,
                        "photo_url": profile.photo.url,
                        "passes": pass_info
                    }
                })

            except UserProfile.DoesNotExist:
                 return Response({"detail": f"Face matched ({filename}) but User record not found."}, status=status.HTTP_404_NOT_FOUND)
            except Exception as e:
                 return Response({"detail": f"Error linking face to user: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                 
        return Response({"detail": "No match found in database."}, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        print(f"Face Recog Error: {e}")
        return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    finally:
        # Cleanup
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

from .models import Complaint
from .serializers import ComplaintSerializer

class ComplaintListCreateView(generics.ListCreateAPIView):
    queryset = Complaint.objects.all().order_by('-created_at')
    serializer_class = ComplaintSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Determine accused user from username provided
        username = self.request.data.get('username')
        try:
             user = User.objects.get(username=username)
             serializer.save(reporter=self.request.user, user=user)
        except User.DoesNotExist:
             raise serializers.ValidationError("User not found.")

    def get_queryset(self):
        # Admins see all, others only see what they filed (or nothing if we want strict privacy)
        if self.request.user.is_staff:
            return Complaint.objects.all().order_by('-created_at')
        return Complaint.objects.filter(reporter=self.request.user).order_by('-created_at')

@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def delete_complaint(request):
    complaint_id = request.data.get('id')
    try:
        complaint = Complaint.objects.get(id=complaint_id)
        complaint.delete()
        return Response({"message": "Complaint deleted successfully."}, status=status.HTTP_200_OK)
    except Complaint.DoesNotExist:
        return Response({"detail": "Complaint not found."}, status=status.HTTP_404_NOT_FOUND)
