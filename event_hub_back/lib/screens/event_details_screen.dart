import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import 'package:share_plus/share_plus.dart';
import '../config/app_config.dart';
import '../config/routes.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class EventDetailsScreen extends StatefulWidget {
  final String eventId;
  const EventDetailsScreen({super.key, required this.eventId});

  @override
  State<EventDetailsScreen> createState() => _EventDetailsScreenState();
}

class _EventDetailsScreenState extends State<EventDetailsScreen> {
  Event? _event;
  List<Ticket> _tickets = [];
  List<Review> _reviews = [];
  bool _isLoading = true;
  bool _isFavorite = false;
  double _averageRating = 0;
  Ticket? _selectedTicket;
  int _quantity = 1;

  @override
  void initState() {
    super.initState();
    _loadEventDetails();
  }

  Future<void> _loadEventDetails() async {
    setState(() => _isLoading = true);
    try {
      final result = await apiService.getEventDetails(widget.eventId);
      setState(() {
        _event = result['event'] as Event;
        _tickets = result['tickets'] as List<Ticket>;
        _reviews = result['reviews'] as List<Review>;
        _averageRating = (result['averageRating'] ?? 0).toDouble();
        _isFavorite = result['isFavorite'] ?? false;
        if (_tickets.isNotEmpty) {
          _selectedTicket = _tickets.first;
        }
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to load event details')),
        );
      }
    }
  }

  Future<void> _toggleFavorite() async {
    try {
      if (_isFavorite) {
        await apiService.removeFromFavorites(widget.eventId);
      } else {
        await apiService.addToFavorites(widget.eventId);
      }
      setState(() => _isFavorite = !_isFavorite);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to update favorites')),
      );
    }
  }

  Future<void> _bookTicket() async {
    if (_selectedTicket == null) return;

    try {
      final result = await apiService.createBooking(
        eventId: widget.eventId,
        ticketId: _selectedTicket!.ticketId,
        quantite: _quantity,
      );

      Navigator.pushNamed(
        context,
        AppRoutes.bookingDetails,
        arguments: result.bookingId,
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Booking failed: ${e.toString()}')),
      );
    }
  }

  Future<void> _shareEvent() async {
    final event = _event;
    if (event == null) return;

    final shareText =
        '''
${event.titre}

📅 ${DateFormat('EEEE, MMMM d, yyyy').format(event.dateDebut)}
📍 ${event.lieu}
💰 From ${AppConfig.currencySymbol}${_tickets.isNotEmpty ? _tickets.map((t) => t.prix).reduce((a, b) => a < b ? a : b).toStringAsFixed(2) : '0.00'}

Book your tickets now on EventHub!
''';

    await Share.share(shareText);
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_event == null) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: Text('Event not found')),
      );
    }

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          _buildAppBar(),
          SliverToBoxAdapter(child: _buildContent()),
        ],
      ),
      bottomNavigationBar: _event!.isAvailable ? _buildBottomBar() : null,
    );
  }

  Widget _buildAppBar() {
    return SliverAppBar(
      expandedHeight: 250,
      pinned: true,
      flexibleSpace: FlexibleSpaceBar(
        background: _event!.imageURL.isNotEmpty
            ? CachedNetworkImage(
                imageUrl: _event!.imageURL,
                fit: BoxFit.cover,
                placeholder: (_, __) => Container(color: Colors.grey[300]),
                errorWidget: (_, __, ___) => _buildPlaceholderImage(),
              )
            : _buildPlaceholderImage(),
      ),
      actions: [
        IconButton(
          icon: Icon(
            _isFavorite ? Icons.favorite : Icons.favorite_border,
            color: _isFavorite ? Colors.red : Colors.white,
          ),
          onPressed: _toggleFavorite,
        ),
        IconButton(
          icon: const Icon(Icons.share),
          onPressed: () => _shareEvent(),
        ),
      ],
    );
  }

  Widget _buildPlaceholderImage() {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppConfig.primaryColor, AppConfig.secondaryColor],
        ),
      ),
      child: Center(
        child: Icon(
          Icons.event,
          size: 80,
          color: Colors.white.withValues(alpha: 0.5),
        ),
      ),
    );
  }

  Widget _buildContent() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildCategoryBadge(),
          const SizedBox(height: 12),
          Text(
            _event!.titre,
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          if (_averageRating > 0) _buildRatingRow(),
          const SizedBox(height: 16),
          _buildInfoRow(
            Icons.calendar_today,
            DateFormat('EEEE, MMMM d, yyyy').format(_event!.dateDebut),
          ),
          const SizedBox(height: 8),
          _buildInfoRow(
            Icons.access_time,
            '${DateFormat('h:mm a').format(_event!.dateDebut)} - ${DateFormat('h:mm a').format(_event!.dateFin)}',
          ),
          const SizedBox(height: 8),
          _buildInfoRow(Icons.location_on, _event!.lieu),
          const SizedBox(height: 8),
          _buildInfoRow(
            Icons.people,
            '${_event!.placesRestantes} seats available',
          ),
          const SizedBox(height: 24),
          Text(
            'About',
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            _event!.description,
            style: TextStyle(color: Colors.grey[700], height: 1.5),
          ),
          if (_event!.tags.isNotEmpty) ...[
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _event!.tags
                  .map(
                    (tag) => Chip(
                      label: Text(tag, style: const TextStyle(fontSize: 12)),
                      backgroundColor: AppConfig.primaryColor.withValues(
                        alpha: 0.1,
                      ),
                    ),
                  )
                  .toList(),
            ),
          ],
          if (_tickets.isNotEmpty) ...[
            const SizedBox(height: 24),
            Text(
              'Tickets',
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            ..._tickets.map((ticket) => _buildTicketCard(ticket)),
          ],
          if (_reviews.isNotEmpty) ...[
            const SizedBox(height: 24),
            _buildReviewsSection(),
          ],
          const SizedBox(height: 100),
        ],
      ),
    );
  }

  Widget _buildCategoryBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: AppConfig.primaryColor.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        _event!.categorie,
        style: TextStyle(
          color: AppConfig.primaryColor,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  Widget _buildRatingRow() {
    return Row(
      children: [
        Row(
          children: List.generate(
            5,
            (index) => Icon(
              index < _averageRating.floor()
                  ? Icons.star
                  : (index < _averageRating
                        ? Icons.star_half
                        : Icons.star_border),
              color: Colors.amber,
              size: 20,
            ),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          _averageRating.toStringAsFixed(1),
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
      ],
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 20, color: Colors.grey[600]),
        const SizedBox(width: 8),
        Expanded(
          child: Text(text, style: TextStyle(color: Colors.grey[700])),
        ),
      ],
    );
  }

  Widget _buildTicketCard(Ticket ticket) {
    final isSelected = _selectedTicket?.ticketId == ticket.ticketId;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isSelected ? AppConfig.primaryColor : Colors.transparent,
          width: 2,
        ),
      ),
      child: InkWell(
        onTap: ticket.isAvailable
            ? () {
                setState(() => _selectedTicket = ticket);
              }
            : null,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      ticket.typeDisplay,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    if (ticket.description.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        ticket.description,
                        style: TextStyle(color: Colors.grey[600], fontSize: 13),
                      ),
                    ],
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '${AppConfig.currencySymbol}${ticket.prix.toStringAsFixed(2)}',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                      color: AppConfig.primaryColor,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    ticket.isAvailable
                        ? '${ticket.quantiteDisponible} left'
                        : 'Sold out',
                    style: TextStyle(
                      color: ticket.isAvailable ? Colors.grey[600] : Colors.red,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
              if (isSelected) ...[
                const SizedBox(width: 8),
                Icon(Icons.check_circle, color: AppConfig.primaryColor),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildReviewsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Reviews',
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
            ),
            TextButton(
              onPressed: () {
                // TODO: Navigate to all reviews screen
              },
              child: const Text('See All'),
            ),
          ],
        ),
        ..._reviews.take(3).map((review) => _buildReviewCard(review)),
      ],
    );
  }

  Widget _buildReviewCard(Review review) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 16,
                  backgroundColor: AppConfig.primaryColor.withValues(
                    alpha: 0.2,
                  ),
                  child: Text(
                    (review.userNom ?? 'U')[0].toUpperCase(),
                    style: TextStyle(
                      color: AppConfig.primaryColor,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        review.userNom ?? 'Anonymous',
                        style: const TextStyle(fontWeight: FontWeight.w500),
                      ),
                      Row(
                        children: List.generate(
                          5,
                          (i) => Icon(
                            i < review.note ? Icons.star : Icons.star_border,
                            size: 14,
                            color: Colors.amber,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            if (review.commentaire.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(review.commentaire),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildBottomBar() {
    if (_selectedTicket == null) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${AppConfig.currencySymbol}${(_selectedTicket!.prix * _quantity).toStringAsFixed(2)}',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppConfig.primaryColor,
                  ),
                ),
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.remove_circle_outline),
                      onPressed: _quantity > 1
                          ? () => setState(() => _quantity--)
                          : null,
                    ),
                    Text('$_quantity', style: const TextStyle(fontSize: 18)),
                    IconButton(
                      icon: const Icon(Icons.add_circle_outline),
                      onPressed:
                          _quantity < _selectedTicket!.quantiteDisponible &&
                              _quantity < AppConfig.maxBookingQuantity
                          ? () => setState(() => _quantity++)
                          : null,
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(width: 16),
            Expanded(
              child: ElevatedButton(
                onPressed: _bookTicket,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppConfig.primaryColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: const Text(
                  'Book Now',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
