import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.lostfound.serializers import LostFoundItemSerializer
from apps.accounts.models import User

user = User.objects.first()

data = {
    "item_status": "LOST",
    "title": "Test Title",
    "description": "Test Desc",
    "category": "Electronics",
    "location": ""
}

class DummyRequest:
    def __init__(self, user):
        self.user = user

serializer = LostFoundItemSerializer(data=data, context={'request': DummyRequest(user)})
if serializer.is_valid():
    print("VALID")
    try:
        serializer.save()
        print("SAVED SUCCESSFULLY")
    except Exception as e:
        print("ERROR ON SAVE:", e)
else:
    print("INVALID", serializer.errors)
