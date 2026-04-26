import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;
import '../config/app_config.dart';
import '../config/routes.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import '../models/user.dart' as models;

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  firebase_auth.User? _currentUser;
  models.User? _userProfile;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    setState(() => _isLoading = true);
    _currentUser = firebase_auth.FirebaseAuth.instance.currentUser;
    try {
      _userProfile = await apiService.getUserProfile();
    } catch (e) {
      // Handle error
    }
    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () {
              Navigator.pushNamed(context, AppRoutes.settings);
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadProfile,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    _buildProfileHeader(),
                    const SizedBox(height: 24),
                    _buildMenuSection(),
                    const SizedBox(height: 24),
                    _buildSignOutButton(),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildProfileHeader() {
    return Column(
      children: [
        CircleAvatar(
          radius: 50,
          backgroundColor: AppConfig.primaryColor.withOpacity(0.1),
          backgroundImage: _currentUser?.photoURL != null
              ? NetworkImage(_currentUser!.photoURL!)
              : null,
          child: _currentUser?.photoURL == null
              ? Text(
                  _getInitials(),
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: AppConfig.primaryColor,
                  ),
                )
              : null,
        ),
        const SizedBox(height: 16),
        Text(
          _currentUser?.displayName ?? 'User',
          style: Theme.of(
            context,
          ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 4),
        Text(
          _currentUser?.email ?? '',
          style: TextStyle(color: Colors.grey[600], fontSize: 16),
        ),
        const SizedBox(height: 12),
        if (_userProfile != null && (_userProfile as dynamic).role != 'user')
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: AppConfig.primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.verified, size: 16, color: AppConfig.primaryColor),
                const SizedBox(width: 4),
                Text(
                  'Organizer',
                  style: TextStyle(
                    color: AppConfig.primaryColor,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildMenuSection() {
    return Column(
      children: [
        _buildMenuItem(
          icon: Icons.confirmation_number_outlined,
          title: 'My Bookings',
          subtitle: 'View all your bookings',
          onTap: () => Navigator.pushNamed(context, AppRoutes.bookings),
        ),
        _buildMenuItem(
          icon: Icons.favorite_outline,
          title: 'Favorites',
          subtitle: 'Events you saved',
          onTap: () => Navigator.pushNamed(context, AppRoutes.favorites),
        ),
        _buildMenuItem(
          icon: Icons.star_outline,
          title: 'My Reviews',
          subtitle: 'Reviews you have written',
          onTap: () => _showComingSoonDialog(),
        ),
        _buildMenuItem(
          icon: Icons.notifications_outlined,
          title: 'Notifications',
          subtitle: 'Manage notification preferences',
          onTap: () => Navigator.pushNamed(context, AppRoutes.notifications),
        ),
        _buildMenuItem(
          icon: Icons.payment_outlined,
          title: 'Payment Methods',
          subtitle: 'Manage your payment options',
          onTap: () => _showComingSoonDialog(),
        ),
        _buildMenuItem(
          icon: Icons.help_outline,
          title: 'Help & Support',
          subtitle: 'Get help with EventHub',
          onTap: () => _showComingSoonDialog(),
        ),
        _buildMenuItem(
          icon: Icons.info_outline,
          title: 'About',
          subtitle: 'App version and info',
          onTap: () => _showAboutDialog(),
        ),
      ],
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppConfig.primaryColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: AppConfig.primaryColor),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w500)),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }

  Widget _buildSignOutButton() {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: () async {
          final confirmed = await showDialog<bool>(
            context: context,
            builder: (context) => AlertDialog(
              title: const Text('Sign Out'),
              content: const Text('Are you sure you want to sign out?'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context, false),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: () => Navigator.pop(context, true),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppConfig.errorColor,
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Sign Out'),
                ),
              ],
            ),
          );

          if (confirmed == true) {
            await authService.signOut();
            if (mounted) {
              Navigator.pushNamedAndRemoveUntil(
                context,
                AppRoutes.login,
                (route) => false,
              );
            }
          }
        },
        icon: const Icon(Icons.logout, color: AppConfig.errorColor),
        label: const Text(
          'Sign Out',
          style: TextStyle(color: AppConfig.errorColor),
        ),
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: AppConfig.errorColor),
          padding: const EdgeInsets.symmetric(vertical: 12),
        ),
      ),
    );
  }

  String _getInitials() {
    final name = _currentUser?.displayName ?? 'U';
    final parts = name.split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name.isNotEmpty ? name[0].toUpperCase() : 'U';
  }

  void _showComingSoonDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Coming Soon'),
        content: const Text(
          'This feature will be available in a future update.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  void _showAboutDialog() {
    showAboutDialog(
      context: context,
      applicationName: 'EventHub',
      applicationVersion: '1.0.0',
      applicationIcon: Icon(
        Icons.event,
        size: 50,
        color: AppConfig.primaryColor,
      ),
      children: const [
        Text(
          'EventHub is your go-to platform for discovering and booking tickets to amazing events.',
        ),
      ],
    );
  }
}
