import 'package:flutter/material.dart';
import '../config/app_config.dart';
import '../config/routes.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<AppNotification> _notifications = [];
  bool _isLoading = true;
  int _unreadCount = 0;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    setState(() => _isLoading = true);
    try {
      final result = await apiService.getUserNotifications();
      setState(() {
        _notifications = result['notifications'] as List<AppNotification>;
        _unreadCount = result['unreadCount'] ?? 0;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _markAllRead() async {
    try {
      await apiService.markAllNotificationsRead();
      setState(() {
        _notifications = _notifications
            .map(
              (n) => AppNotification(
                notifId: n.notifId,
                userId: n.userId,
                titre: n.titre,
                corps: n.corps,
                type: n.type,
                data: n.data,
                lue: true,
                envoyeAt: n.envoyeAt,
              ),
            )
            .toList();
        _unreadCount = 0;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to mark all as read')),
      );
    }
  }

  IconData _getNotificationIcon(String type) {
    switch (type) {
      case 'booking_confirmed':
        return Icons.check_circle;
      case 'event_reminder':
        return Icons.alarm;
      case 'ticket_ready':
        return Icons.confirmation_number;
      case 'cancellation':
        return Icons.cancel;
      case 'promotion':
        return Icons.local_offer;
      default:
        return Icons.notifications;
    }
  }

  Color _getNotificationColor(String type) {
    switch (type) {
      case 'booking_confirmed':
        return AppConfig.successColor;
      case 'event_reminder':
        return AppConfig.primaryColor;
      case 'ticket_ready':
        return AppConfig.secondaryColor;
      case 'cancellation':
        return AppConfig.errorColor;
      case 'promotion':
        return AppConfig.warningColor;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (_unreadCount > 0)
            TextButton(
              onPressed: _markAllRead,
              child: const Text('Mark All Read'),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _notifications.isEmpty
          ? _buildEmptyState()
          : RefreshIndicator(
              onRefresh: _loadNotifications,
              child: ListView.builder(
                itemCount: _notifications.length,
                itemBuilder: (context, index) {
                  return _NotificationTile(
                    notification: _notifications[index],
                    icon: _getNotificationIcon(_notifications[index].type),
                    color: _getNotificationColor(_notifications[index].type),
                    onTap: () =>
                        _handleNotificationTap(context, _notifications[index]),
                  );
                },
              ),
            ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.notifications_none, size: 80, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text(
            'No notifications',
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(color: Colors.grey[600]),
          ),
          const SizedBox(height: 8),
          Text(
            'You\'ll see notifications here',
            style: TextStyle(color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${date.day}/${date.month}/${date.year}';
  }

  void _handleNotificationTap(
    BuildContext context,
    AppNotification notification,
  ) async {
    try {
      await apiService.markNotificationRead(notification.notifId);
    } catch (e) {
      // Continue navigation even if marking as read fails
    }

    final eventId = notification.data['eventId'];
    final bookingId = notification.data['bookingId'];

    switch (notification.type) {
      case 'booking_confirmed':
      case 'ticket_ready':
        if (bookingId != null) {
          Navigator.pushNamed(
            context,
            AppRoutes.bookingDetails,
            arguments: bookingId,
          );
        }
        break;
      case 'event_reminder':
        if (eventId != null) {
          Navigator.pushNamed(
            context,
            AppRoutes.eventDetails,
            arguments: eventId,
          );
        }
        break;
      case 'cancellation':
        if (eventId != null) {
          Navigator.pushNamed(
            context,
            AppRoutes.eventDetails,
            arguments: eventId,
          );
        }
        break;
      default:
        break;
    }
  }
}

class _NotificationTile extends StatelessWidget {
  final AppNotification notification;
  final IconData icon;
  final Color color;
  final VoidCallback? onTap;

  const _NotificationTile({
    required this.notification,
    required this.icon,
    required this.color,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: color.withValues(alpha: 0.1),
        child: Icon(icon, color: color, size: 20),
      ),
      title: Text(
        notification.titre,
        style: TextStyle(
          fontWeight: notification.isRead ? FontWeight.normal : FontWeight.bold,
        ),
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            notification.corps,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Text(
            _formatTime(notification.envoyeAt),
            style: TextStyle(fontSize: 12, color: Colors.grey[500]),
          ),
        ],
      ),
      trailing: notification.isRead
          ? null
          : Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(color: color, shape: BoxShape.circle),
            ),
      onTap: onTap,
    );
  }

  String _formatTime(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${date.day}/${date.month}/${date.year}';
  }
}
