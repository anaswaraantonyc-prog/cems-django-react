import django, os, sys
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

user = User.objects.get(username='admin')
user.set_password('Admin@1234')
user.role = 'ADMIN'
user.is_validated = True
user.is_active = True
user.save()
print("Password reset OK")
print("username : admin")
print("password : Admin@1234")
print("role     : ADMIN")
print("validated:", user.is_validated)
