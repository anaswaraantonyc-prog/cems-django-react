import apps.accounts.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_registrationauditlog'),
    ]

    operations = [
        migrations.RenameField(
            model_name='collegeid',
            old_name='id_number',
            new_name='id_year',
        ),
        migrations.AlterField(
            model_name='collegeid',
            name='id_year',
            field=models.CharField(
                blank=True,
                default='',
                max_length=50,
                validators=[apps.accounts.validators.validate_id_year],
                verbose_name='ID Year',
            ),
        ),
        migrations.RenameField(
            model_name='registrationauditlog',
            old_name='id_number',
            new_name='id_year',
        ),
        migrations.AlterField(
            model_name='registrationauditlog',
            name='id_year',
            field=models.CharField(blank=True, max_length=50, verbose_name='ID Year'),
        ),
    ]
