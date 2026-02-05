"""
Custom JWT authentication middleware for WebSocket
"""
import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from urllib.parse import parse_qs

User = get_user_model()

@database_sync_to_async
def get_user_from_token(token):
    """Get user from JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        user_id = payload.get('user_id')
        if user_id:
            return User.objects.get(id=user_id)
    except (jwt.ExpiredSignatureError, jwt.DecodeError, User.DoesNotExist):
        pass
    return None

class JWTAuthMiddleware(BaseMiddleware):
    """Middleware to authenticate WebSocket connections using JWT"""
    
    async def __call__(self, scope, receive, send):
        # Get token from query string
        query_string = scope.get('query_string', b'').decode('utf-8')
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]
        
        print(f"🔍 JWT Middleware - Token: {token[:20] if token else 'NONE'}")
        
        if token:
            user = await get_user_from_token(token)
            if user:
                print(f"✅ User authenticated: {user.email}")
                scope['user'] = user
            else:
                print(f"❌ Invalid token")
                from django.contrib.auth.models import AnonymousUser
                scope['user'] = AnonymousUser()
        else:
            print(f"❌ No token provided")
            from django.contrib.auth.models import AnonymousUser
            scope['user'] = AnonymousUser()
        
        return await super().__call__(scope, receive, send)