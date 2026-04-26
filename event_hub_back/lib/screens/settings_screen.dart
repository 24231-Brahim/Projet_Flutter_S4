import 'package:flutter/material.dart';
import '../config/app_config.dart';
import '../services/auth_service.dart';
import '../config/routes.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _notificationsEnabled = true;
  bool _emailNotifications = true;
  bool _pushNotifications = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          const SizedBox(height: 8),
          _buildSectionHeader('Notifications'),
          _buildSwitchTile(
            title: 'Push Notifications',
            subtitle: 'Receive event reminders and updates',
            value: _pushNotifications,
            onChanged: (value) {
              setState(() => _pushNotifications = value);
            },
          ),
          _buildSwitchTile(
            title: 'Email Notifications',
            subtitle: 'Receive newsletters and promotions',
            value: _emailNotifications,
            onChanged: (value) {
              setState(() => _emailNotifications = value);
            },
          ),
          const Divider(),
          _buildSectionHeader('Account'),
          _buildNavigationTile(
            icon: Icons.help_outline,
            title: 'Help & Support',
            onTap: () => _showHelpDialog(),
          ),
          _buildNavigationTile(
            icon: Icons.privacy_tip_outlined,
            title: 'Privacy Policy',
            onTap: () {},
          ),
          _buildNavigationTile(
            icon: Icons.description_outlined,
            title: 'Terms of Service',
            onTap: () {},
          ),
          _buildNavigationTile(
            icon: Icons.info_outline,
            title: 'About',
            onTap: () => _showAboutDialog(),
          ),
          const Divider(),
          _buildSectionHeader('Danger Zone'),
          _buildDangerTile(
            icon: Icons.delete_forever,
            title: 'Delete Account',
            subtitle: 'Permanently delete your account and data',
            onTap: () => _showDeleteAccountDialog(),
          ),
          const SizedBox(height: 24),
          Center(
            child: Text(
              'Version ${AppConfig.appVersion}',
              style: TextStyle(color: Colors.grey[500]),
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Text(
        title,
        style: TextStyle(
          color: AppConfig.primaryColor,
          fontWeight: FontWeight.bold,
          fontSize: 14,
        ),
      ),
    );
  }

  Widget _buildSwitchTile({
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return SwitchListTile(
      title: Text(title),
      subtitle: Text(subtitle),
      value: value,
      onChanged: onChanged,
      activeColor: AppConfig.primaryColor,
    );
  }

  Widget _buildNavigationTile({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: Colors.grey[600]),
      title: Text(title),
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }

  Widget _buildDangerTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: AppConfig.errorColor),
      title: Text(title, style: TextStyle(color: AppConfig.errorColor)),
      subtitle: Text(subtitle),
      onTap: onTap,
    );
  }

  void _showHelpDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Help & Support'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('For assistance, please contact us at:'),
            SizedBox(height: 8),
            Text('support@eventhub.com'),
            SizedBox(height: 16),
            Text('Or visit our FAQ page for common questions.'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  void _showAboutDialog() {
    showAboutDialog(
      context: context,
      applicationName: AppConfig.appName,
      applicationVersion: AppConfig.appVersion,
      applicationIcon: Icon(
        Icons.event,
        size: 50,
        color: AppConfig.primaryColor,
      ),
      children: [
        const Text(
          'EventHub is your go-to platform for discovering and booking tickets to amazing events.',
        ),
      ],
    );
  }

  void _showDeleteAccountDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Account'),
        content: const Text(
          'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              ScaffoldMessenger.of(this.context).showSnackBar(
                const SnackBar(
                  content: Text(
                    'Please contact support to delete your account',
                  ),
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppConfig.errorColor,
              foregroundColor: Colors.white,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}
