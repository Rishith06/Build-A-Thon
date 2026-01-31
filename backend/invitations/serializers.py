from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Pass, Event, Complaint

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    pass_event_names = serializers.SerializerMethodField()
    is_suspended = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    photo = serializers.ImageField(write_only=True, required=False)
    photo_url = serializers.SerializerMethodField()
    student_type = serializers.SerializerMethodField()
    college_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'pass_event_names', 'is_suspended', 'role', 'student_type', 'college_name', 'photo', 'photo_url')

    def get_photo_url(self, obj):
        if hasattr(obj, 'profile') and obj.profile.photo:
            return obj.profile.photo.url
        return None

    def get_pass_event_names(self, obj):
        # Return list of event names for which the user has a pass
        return list(Pass.objects.filter(user=obj).values_list('event__name', flat=True))

    def get_is_suspended(self, obj):
        return hasattr(obj, 'profile') and obj.profile.is_suspended

    def get_role(self, obj):
        return obj.profile.role if hasattr(obj, 'profile') else 'unknown'

    def get_student_type(self, obj):
        return obj.profile.student_type if hasattr(obj, 'profile') else 'internal'

    def get_college_name(self, obj):
        return obj.profile.college_name if hasattr(obj, 'profile') else None

    def create(self, validated_data):
        role_input = self.initial_data.get('role', 'student') 
        student_type_input = self.initial_data.get('student_type', 'internal')
        college_name_input = self.initial_data.get('college_name', '')
        photo_input = self.initial_data.get('photo')
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        
        # Auto-create profile
        from .models import UserProfile
        if not hasattr(user, 'profile'):
            UserProfile.objects.create(
                user=user, 
                role=role_input, 
                student_type=student_type_input,
                college_name=college_name_input,
                photo=photo_input
            )
        return user

class ComplaintSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    reporter_name = serializers.ReadOnlyField(source='reporter.username')

    class Meta:
        model = Complaint
        fields = '__all__'
        read_only_fields = ('reporter', 'created_at', 'status', 'user')

class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = '__all__'

class PassSerializer(serializers.ModelSerializer):
    event = EventSerializer(read_only=True)
    class Meta:
        model = Pass
        fields = '__all__'
