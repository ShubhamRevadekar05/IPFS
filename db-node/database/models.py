from django.db import models
import hashlib
import binascii

# Create your models here.
class Users(models.Model):
    user_id = models.CharField(max_length=16, unique=True, primary_key=True)
    username = models.CharField(max_length=25, unique=True)
    fname = models.CharField(max_length=15)
    lname = models.CharField(max_length=15)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=64)

    def save(self, *args, **kwargs):
        hasher = hashlib.sha256()
        hasher.update((str(self.password) + str(self.user_id)).encode())
        self.password = binascii.hexlify(hasher.digest()).decode()
        super(Users, self).save(*args, **kwargs)
    
    def authenticate(self, email, password, *args, **kwargs):
        hasher = hashlib.sha256()
        hasher.update((str(password) + str(self.user_id)).encode())
        binascii.hexlify(hasher.digest()).decode()
        if self.email == email and self.password == binascii.hexlify(hasher.digest()).decode():
            return True
        else:
            return False

class Files(models.Model):
    owner = models.ForeignKey(Users, on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=100)
    url = models.CharField(max_length=100)
    is_public = models.BooleanField(False)
    public_id = models.CharField(max_length=100)

class Group(models.Model):
    owner = models.ForeignKey(Users, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)

class GroupMembers(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    member = models.ForeignKey(Users, on_delete=models.CASCADE)

class Shared(models.Model):
    owner = models.ForeignKey(Users, on_delete=models.CASCADE)
    on = models.ForeignKey(Group, on_delete=models.CASCADE)
    file = models.ForeignKey(Files, on_delete=models.CASCADE)