from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from apps.accounts.models import CollegeID

User = get_user_model()


class IDCardEmergencyTests(APITestCase):
    def test_endpoint_rejects_without_image(self):
        response = self.client.post('/api/emergency/id-card-login/', {})
        self.assertEqual(response.status_code, 400)

    def test_registered_card_exists(self):
        user = User.objects.create_user(
            username='stud1',
            password='pass1234',
            first_name='Test',
            last_name='Student',
            role='STUDENT',
            is_validated=True,
        )
        card = CollegeID.objects.create(user=user, id_number='CS-101')
        self.assertEqual(card.id_number, 'CS-101')
