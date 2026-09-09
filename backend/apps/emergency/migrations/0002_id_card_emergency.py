from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('emergency', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='emergencyaccesslog',
            name='scanned_qr_token',
            field=models.UUIDField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='emergencyaccesslog',
            name='scanned_id_number',
            field=models.CharField(blank=True, max_length=50),
        ),
    ]
