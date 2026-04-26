import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config/app_config.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class BookingDetailsScreen extends StatefulWidget {
  final String bookingId;
  const BookingDetailsScreen({super.key, required this.bookingId});

  @override
  State<BookingDetailsScreen> createState() => _BookingDetailsScreenState();
}

class _BookingDetailsScreenState extends State<BookingDetailsScreen> {
  Booking? _booking;
  bool _isLoading = true;
  bool _isCancelling = false;

  @override
  void initState() {
    super.initState();
    _loadBooking();
  }

  Future<void> _loadBooking() async {
    try {
      final bookings = await apiService.getUserBookings();
      final booking = bookings.firstWhere(
        (b) => b.bookingId == widget.bookingId,
        orElse: () => throw Exception('Booking not found'),
      );
      setState(() {
        _booking = booking;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _cancelBooking() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel Booking'),
        content: const Text(
          'Are you sure you want to cancel this booking? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Keep Booking'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppConfig.errorColor,
              foregroundColor: Colors.white,
            ),
            child: const Text('Cancel Booking'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isCancelling = true);
    try {
      await apiService.cancelBooking(widget.bookingId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Booking cancelled successfully')),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      setState(() => _isCancelling = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to cancel: ${e.toString()}')),
        );
      }
    }
  }

  Future<void> _shareTicket() async {
    if (_booking?.pdfURL != null) {
      await Share.share(
        'My ticket for ${_booking!.event?.titre ?? "Event"}\n'
        'Date: ${_booking!.event != null ? DateFormat('MMM d, yyyy').format(_booking!.event!.dateDebut) : ""}\n'
        'Booking ID: ${_booking!.bookingId}',
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Booking Details')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_booking == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Booking Details')),
        body: const Center(child: Text('Booking not found')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Booking Details'),
        actions: [
          if (_booking!.isConfirmed)
            IconButton(icon: const Icon(Icons.share), onPressed: _shareTicket),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildStatusCard(),
            const SizedBox(height: 16),
            if (_booking!.isConfirmed) ...[
              _buildTicketCard(),
              const SizedBox(height: 16),
            ],
            _buildEventCard(),
            const SizedBox(height: 16),
            _buildDetailsCard(),
            const SizedBox(height: 24),
            if (_booking!.isConfirmed || _booking!.isPending)
              _buildCancelButton(),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusCard() {
    Color statusColor;
    String statusText;
    IconData statusIcon;

    if (_booking!.isConfirmed) {
      statusColor = AppConfig.successColor;
      statusText = 'Booking Confirmed';
      statusIcon = Icons.check_circle;
    } else if (_booking!.isPending) {
      statusColor = AppConfig.warningColor;
      statusText = 'Payment Pending';
      statusIcon = Icons.schedule;
    } else if (_booking!.isCancelled) {
      statusColor = AppConfig.errorColor;
      statusText = 'Booking Cancelled';
      statusIcon = Icons.cancel;
    } else {
      statusColor = Colors.grey;
      statusText = 'Booking Used';
      statusIcon = Icons.done_all;
    }

    return Card(
      color: statusColor.withValues(alpha: 0.1),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(statusIcon, color: statusColor, size: 40),
            const SizedBox(width: 16),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  statusText,
                  style: TextStyle(
                    color: statusColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                  ),
                ),
                if (_booking!.isPending)
                  const Text(
                    'Complete payment to confirm',
                    style: TextStyle(color: Colors.grey),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTicketCard() {
    return Card(
      child: Column(
        children: [
          if (_booking!.qrCodeURL != null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              color: Colors.white,
              child: CachedNetworkImage(
                imageUrl: _booking!.qrCodeURL!,
                fit: BoxFit.contain,
                placeholder: (_, __) =>
                    const Center(child: CircularProgressIndicator()),
                errorWidget: (_, __, ___) =>
                    const Icon(Icons.qr_code, size: 200, color: Colors.grey),
              ),
            ),
          const Divider(height: 1),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _booking!.pdfURL != null
                        ? () async {
                            final url = Uri.parse(_booking!.pdfURL!);
                            if (await canLaunchUrl(url)) {
                              await launchUrl(url);
                            }
                          }
                        : null,
                    icon: const Icon(Icons.picture_as_pdf),
                    label: const Text('Download PDF'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      Navigator.pushNamed(
                        context,
                        '/ticket',
                        arguments: _booking!.bookingId,
                      );
                    },
                    icon: const Icon(Icons.fullscreen),
                    label: const Text('Full Screen'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEventCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _booking!.event?.titre ?? 'Event',
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            if (_booking!.event != null) ...[
              _buildInfoRow(
                Icons.calendar_today,
                DateFormat(
                  'EEEE, MMMM d, yyyy',
                ).format(_booking!.event!.dateDebut),
              ),
              const SizedBox(height: 8),
              _buildInfoRow(
                Icons.access_time,
                '${DateFormat('h:mm a').format(_booking!.event!.dateDebut)} - ${DateFormat('h:mm a').format(_booking!.event!.dateFin)}',
              ),
              const SizedBox(height: 8),
              _buildInfoRow(Icons.location_on, _booking!.event!.lieu),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 20, color: Colors.grey[600]),
        const SizedBox(width: 8),
        Expanded(child: Text(text)),
      ],
    );
  }

  Widget _buildDetailsCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Booking Details',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            _buildDetailRow('Booking ID', _booking!.bookingId),
            _buildDetailRow(
              'Ticket Type',
              _booking!.ticket?.typeDisplay ?? 'Standard',
            ),
            _buildDetailRow(
              'Quantity',
              '${_booking!.quantite} ticket${_booking!.quantite > 1 ? 's' : ''}',
            ),
            _buildDetailRow(
              'Total Amount',
              '${AppConfig.currencySymbol}${_booking!.montantTotal.toStringAsFixed(2)}',
            ),
            _buildDetailRow(
              'Booked On',
              DateFormat('MMM d, yyyy').format(_booking!.dateReservation),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey[600])),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _buildCancelButton() {
    final canCancel =
        _booking!.event != null &&
        _booking!.event!.dateDebut.isAfter(
          DateTime.now().add(const Duration(hours: 24)),
        );

    return SizedBox(
      width: double.infinity,
      child: OutlinedButton(
        onPressed: _isCancelling
            ? null
            : canCancel
            ? _cancelBooking
            : () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Cannot cancel within 24 hours of event'),
                  ),
                );
              },
        style: OutlinedButton.styleFrom(
          foregroundColor: AppConfig.errorColor,
          side: const BorderSide(color: AppConfig.errorColor),
          padding: const EdgeInsets.symmetric(vertical: 16),
        ),
        child: _isCancelling
            ? const SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : const Text('Cancel Booking'),
      ),
    );
  }
}
