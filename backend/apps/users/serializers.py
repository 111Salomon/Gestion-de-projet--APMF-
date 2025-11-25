from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer pour le modèle User.
    Transforme les instances User en JSON et vice-versa.
    
    Utilisé pour:
        - Afficher les informations utilisateur dans l'API
        - Créer et modifier des utilisateurs
    """
    
    # Champ calculé (read-only)
    full_name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField() 
    
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'role',
            'avatar',
            'avatar_url',
            'phone',
            'bio',
            'is_active',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_full_name(self, obj):
        """Retourne le nom complet de l'utilisateur."""
        return obj.get_full_name()

        # ✅ AJOUT DE CETTE MÉTHODE
    def get_avatar_url(self, obj):
        """URL complète de l'avatar ou None."""
        if obj.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Serializer pour la création d'utilisateurs.
    Gère le hachage du mot de passe.
    """
    
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        help_text='Mot de passe (minimum 8 caractères)'
    )
    
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        help_text='Confirmation du mot de passe'
    )
    
    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'password',
            'password_confirm',
            'first_name',
            'last_name',
            'role'
        ]
    
    def validate(self, attrs):
        """Valide que les deux mots de passe correspondent."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                "password": "Les mots de passe ne correspondent pas."
            })
        return attrs
    
    def create(self, validated_data):
        """Crée un utilisateur avec mot de passe haché."""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        user = User.objects.create(**validated_data)
        user.set_password(password)  # Hash le mot de passe
        user.save()
        
        return user


class UserMinimalSerializer(serializers.ModelSerializer):
    """
    Serializer minimal pour afficher juste les infos de base.
    Utilisé dans les relations (assigned_to, owner, etc.)
    """
    
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'email', 'role', 'avatar']
    
    def get_full_name(self, obj):
        return obj.get_full_name()
