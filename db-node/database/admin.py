from django.contrib import admin
from .models import Users, Files, Group, GroupMembers, Shared

# Register your models here.
admin.site.register(Users)
admin.site.register(Files)
admin.site.register(Group)
admin.site.register(GroupMembers)
admin.site.register(Shared)