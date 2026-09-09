"""
FILE: apps/accounts/migrations/0002_add_field_validators.py
PURPOSE: State-only migration recording the new validators attached to
         User.phone_number and CollegeID.id_number (apps/accounts/models.py).
         No schema/column change — CharField validators are enforced in
         Python at save()/full_clean() time, not in the database.
"""
import apps.accounts.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='phone_number',
            field=models.CharField(
                blank=True, max_length=15,
                validators=[apps.accounts.validators.validate_phone_number],
            ),
        ),
        migrations.AlterField(
            model_name='collegeid',
            name='id_number',
            field=models.CharField(
                max_length=50, unique=True,
                validators=[apps.accounts.validators.validate_college_id_number],
            ),
        ),
    ]
