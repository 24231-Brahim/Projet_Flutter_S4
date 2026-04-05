import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../config/app_config.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../config/routes.dart';
import '../widgets/shimmer_loading.dart';

class BookingsScreen extends StatefulWidget {
  const BookingsScreen({super.key});

  @override
  State<BookingsScreen> createState() => _BookingsScreenState();
}

class _BookingsScreenState extends State<BookingsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Booking> _upcomingBookings = [];
  List<Booking> _pastBookings = [];
  bool _isLoading = true;
  final DateFormat _dateFormat = DateFormat('MMM d, yyyy • h:mm a');

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadBookings();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadBookings() async {
    setState(() => _isLoading = true);
    try {
      final allBookings = await apiService.getUserBookings();
      setState(() {
        _upcomingBookings = allBookings
            .where((b) => b.isConfirmed && !b.isPastEvent)
            .toList();
        _pastBookings = allBookings
            .where(
              (b) => b.isCancelled || b.isRefunded || b.isPastEvent || b.isUsed,
            )
            .toList();
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Bookings'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Upcoming'),
            Tab(text: 'Past'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildBookingsList(_upcomingBookings, isUpcoming: true),
          _buildBookingsList(_pastBookings, isUpcoming: false),
        ],
      ),
    );
  }

  Widget _buildBookingsList(
    List<Booking> bookings, {
    required bool isUpcoming,
  }) {
    if (_isLoading) {
      return ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: 3,
        itemBuilder: (context, index) => const Padding(
          padding: EdgeInsets.only(bottom: 12),
          child: BookingCardShimmer(),
        ),
      );
    }

    if (bookings.isEmpty) {
      return _buildEmptyState(isUpcoming);
    }

    return RefreshIndicator(
      onRefresh: _loadBookings,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: bookings.length,
        itemBuilder: (context, index) {
          final booking = bookings[index];
          return _BookingCard(
            booking: booking,
            dateFormat: _dateFormat,
            onTap: () {
              Navigator.pushNamed(
                context,
                AppRoutes.bookingDetails,
                arguments: booking.bookingId,
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildEmptyState(bool isUpcoming) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            isUpcoming ? Icons.event_available : Icons.history,
            size: 80,
            color: Colors.grey[300],
          ),
          const SizedBox(height: 16),
          Text(
            isUpcoming ? 'No upcoming bookings' : 'No past bookings',
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(color: Colors.grey[600]),
          ),
          const SizedBox(height: 8),
          Text(
            isUpcoming
                ? 'Book an event to see it here'
                : 'Your booking history will appear here',
            style: TextStyle(color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }
}

class _BookingCard extends StatelessWidget {
  final Booking booking;
  final VoidCallback? onTap;
  final DateFormat dateFormat;

  const _BookingCard({
    required this.booking,
    this.onTap,
    required this.dateFormat,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  _buildStatusBadge(),
                  const Spacer(),
                  Text(
                    '${booking.quantite} ticket${booking.quantite > 1 ? 's' : ''}',
                    style: TextStyle(color: Colors.grey[600], fontSize: 14),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                booking.event?.titre ?? 'Event',
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 8),
              if (booking.event != null) ...[
                Row(
                  children: [
                    Icon(
                      Icons.calendar_today,
                      size: 16,
                      color: Colors.grey[600],
                    ),
                    const SizedBox(width: 4),
                    Text(
                      dateFormat.format(booking.event!.dateDebut),
                      style: TextStyle(color: Colors.grey[600]),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(Icons.location_on, size: 16, color: Colors.grey[600]),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        booking.event!.lieu,
                        style: TextStyle(color: Colors.grey[600]),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${AppConfig.currencySymbol}${booking.montantTotal.toStringAsFixed(2)}',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: AppConfig.primaryColor,
                    ),
                  ),
                  if (booking.isConfirmed)
                    TextButton.icon(
                      onPressed: onTap,
                      icon: const Icon(Icons.qr_code, size: 18),
                      label: const Text('View Ticket'),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusBadge() {
    Color color;
    String text;
    IconData icon;

    if (booking.isConfirmed) {
      color = AppConfig.successColor;
      text = 'Confirmed';
      icon = Icons.check_circle;
    } else if (booking.isPending) {
      color = AppConfig.warningColor;
      text = 'Pending';
      icon = Icons.schedule;
    } else if (booking.isCancelled) {
      color = AppConfig.errorColor;
      text = 'Cancelled';
      icon = Icons.cancel;
    } else if (booking.isRefunded) {
      color = Colors.grey;
      text = 'Refunded';
      icon = Icons.undo;
    } else {
      color = Colors.grey;
      text = 'Used';
      icon = Icons.done_all;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            text,
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

extension on Booking {
  bool get isPastEvent {
    return event?.dateFin.isBefore(DateTime.now()) ?? false;
  }
}
