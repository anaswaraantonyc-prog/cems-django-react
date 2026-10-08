from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('emergency', '0004_medicalstaff_education'),
    ]

    operations = [
        migrations.RenameField(
            model_name='emergencyaccesslog',
            old_name='scanned_id_number',
            new_name='scanned_id_year',
        ),
        migrations.AlterField(
            model_name='emergencyaccesslog',
            name='scanned_id_year',
            field=models.CharField(blank=True, max_length=50, verbose_name='Scanned ID Year'),
        ),
    ]
