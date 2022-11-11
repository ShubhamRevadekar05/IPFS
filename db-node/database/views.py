from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Users, Files, Group, GroupMembers, Shared
import string
import random

# Create your views here.
def HomeView(request):
    return JsonResponse({})

class UserDetailsView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        data = {}
        user = Users.objects.filter(user_id=request.GET.get("user_id", None)).first()
        if user:
            data["user_id"] = user.user_id
            data["username"] = user.username
            data["fname"] = user.fname
            data["lname"] = user.lname
            data["email"] = user.email
            return Response(data, 200)
        else:
            return Response(data, 400)
    
    def post(self, request):
        data = {}
        if not Users.objects.filter(username=request.data["username"]).exists():
            if not Users.objects.filter(email=request.data["email"]).exists():
                user = Users.objects.create(user_id="".join(random.choices(string.ascii_letters + string.digits, k = 16)),username=request.data["username"], fname=request.data["fname"], lname=request.data["lname"], email=request.data["email"], password=request.data["password"])
                return Response(data)
            else:
                data["error"] = "emailExists"
                return Response(data, 409)
        else:
            data["error"] = "usernameExists"
            return Response(data, 409)
    
    def put(self, request):
        data = {}
        user = Users.objects.filter(user_id=request.data["user_id"]).first()
        if user:
            if user.username == request.data["username"] or not Users.objects.filter(username=request.data["username"]).exists():
                if user.email == request.data["email"] or not Users.objects.filter(email=request.data["email"]).exists():
                    user.username = request.data["username"]
                    user.email = request.data["email"]
                    user.fname = request.data["fname"]
                    user.lname = request.data["lname"]
                    user.password = request.data["password"]
                    user.save()
                    return Response(data)
                else:
                    data["error"] = "emailExists"
                    return Response(data, 409)
            else:
                data["error"] = "usernameExists"
                return Response(data, 409)
        else:
            return Response(data, 400)
    
    def delete(self, request):
        data = {}
        user = Users.objects.filter(user_id=request.data["user_id"]).first()
        user.delete()
        return Response(data)

class SearchUsersView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        if request.GET.get("username"):
            users = Users.objects.raw(f'select * from database_users where username like "{request.GET.get("username")}%"')
            data = [{"user_id": user.user_id, "username": user.username, "fname": user.fname, "lname": user.lname} for user in users]
            return Response(data, 200)
        else:
            return Response([], 200)

class AuthenticateUserView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        data = {}
        user = Users.objects.filter(email=request.data["email"]).first()
        if user and user.authenticate(email=request.data["email"], password=request.data["password"]):
            data["user_id"] = user.user_id
            return Response(data, 200)
        else:
            return Response(data, 400)

class UserFilesView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        data = []
        user = Users.objects.filter(user_id=request.GET.get("user_id", None)).first()
        if user:
            files = Files.objects.filter(owner=user).order_by('-id')
            data = [{"id": x.id,"name": x.name, "url": x.url, "is_public": x.is_public, "public_id": x.public_id} for x in files]
            return Response(data, 200)
        else:
            return Response(data, 400)
    
    def post(self, request):
        data = {}
        user = Users.objects.filter(user_id=request.data["user_id"]).first()
        if user:
            file = Files.objects.create(owner=user, name=request.data["name"], url=request.data["url"], is_public=request.data["is_public"], public_id=request.data["public_id"])
            data["username"] = file.owner.username
            data["file_id"] = file.id
            return Response(data, 200)
        return Response(data, 400)

    def put(self, request):
        data = {}
        file = Files.objects.filter(id=request.data["id"]).first()
        if file:
            file.is_public = request.data["is_public"]
            file.public_id = request.data["public_id"]
            file.save()
            return Response(data, 200)
        else:
            return Response(data, 400)
    
    def delete(self, request):
        data = {}
        file = Files.objects.filter(id=request.data["id"]).first()
        if file:
            file.delete()
            return Response(data, 200)
        else:
            return Response(data, 400)

class UserGroupsView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        data = []
        user = Users.objects.filter(user_id=request.GET.get("user_id", None)).first()
        if user:
            groups = GroupMembers.objects.filter(member=user)
            data = [{"id": x.group.id, "name": x.group.name, "owner": x.group.owner.username} for x in groups]
            return Response(data, 200)
        else:
            return Response(data, 400)
    
    def post(self, request):
        data = {}
        user = Users.objects.filter(user_id=request.data["user_id"]).first()
        if user:
            group = Group.objects.create(owner=user, name=request.data["name"])
            GroupMembers.objects.create(group=group, member=user)
            for i in request.data["members"]:
                member_user = Users.objects.filter(user_id=i).first()
                if member_user and member_user.user_id != user.user_id:
                    GroupMembers.objects.create(group=group, member=member_user)
            return Response(data, 200)
        else:
            return Response(data, 400)
    
    def put(self, request):
        data = {}
        user = Users.objects.filter(user_id=request.data["user_id"]).first()
        group = Group.objects.filter(id=request.data["group_id"]).first()
        if group and user:
            if group.owner.user_id == user.user_id:
                group.name = request.data["name"]
                group.save()
                for i in request.data["add_members"]:
                    member_user = Users.objects.filter(user_id=i).first()
                    if member_user and member_user.user_id != user.user_id:
                        GroupMembers.objects.create(group=group, member=member_user)
                for i in request.data["remove_members"]:
                    member_user = Users.objects.filter(user_id=i).first()
                    if member_user:
                        group_member = GroupMembers.objects.filter(group=group, member=member_user).first()
                        if group_member:
                            group_member.delete()
                return Response(data, 200)
            else:
                return Response(data, 401)
        else:
            return Response(data, 400)
    
    def delete(self, request):
        data = {}
        user = Users.objects.filter(user_id=request.data["user_id"]).first()
        group = Group.objects.filter(id=request.data["group_id"]).first()
        if group and user:
            if group.owner.user_id == user.user_id:
                group.delete()
                return Response(data, 200)
            else:
                return Response(data, 401)
        else:
            return Response(data, 400)

class GroupMembersView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        data = []
        group = Group.objects.filter(id=request.GET.get("group_id", None)).first()
        if group:
            group_members = GroupMembers.objects.filter(group=group)
            data = [{"user_id": x.member.user_id, "username": x.member.username, "fname": x.member.fname, "lname": x.member.lname} for x in group_members]
            return Response(data, 200)
        else:
            return Response(data, 400)

class SharedFilesView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        data = []
        group = Group.objects.filter(id=request.GET.get("group_id", None)).first()
        if group:
            shared_files = Shared.objects.filter(on=group).order_by('-id')
            data = [{"shared_id": x.id, "file_id": x.file.id, "owner": x.owner.username, "name": x.file.name, "url": x.file.url} for x in shared_files]
            return Response(data, 200)
        else:
            return Response(data, 400)
    
    def post(self, request):
        data = {}
        user = Users.objects.filter(user_id=request.data["user_id"]).first()
        group = Group.objects.filter(id=request.data["group_id"]).first()
        file = Files.objects.filter(id=request.data["file_id"]).first()
        print(user, group, file)
        if user and group and file:
            Shared.objects.create(owner=user, on=group, file=file)
            return Response(data, 200)
        else:
            return Response(data, 400)

    def delete(self, request):
        data = {}
        shared_file = Shared.objects.filter(id=request.data["id"]).first()
        if shared_file:
            shared_file.delete()
            return Response(data, 200)
        else:
            return Response(data, 400)