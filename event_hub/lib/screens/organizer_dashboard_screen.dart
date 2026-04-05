import 'package:flutter/material.dart';
import '../config/app_config.dart';
import '../config/routes.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../widgets/shimmer_loading.dart';

class OrganizerDashboardScreen extends StatefulWidget {
  const OrganizerDashboardScreen({super.key});

  @override
  State<OrganizerDashboardScreen> createState() =>
      _OrganizerDashboardScreenState();
}

class _OrganizerDashboardScreenState extends State<OrganizerDashboardScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Event> _events = [];
  bool _isLoading = true;
  String? _selectedFilter;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadEvents();
  }

  Future<void> _loadEvents({String? statut}) async {
    setState(() {
      _isLoading = true;
      _selectedFilter = statut;
    });
    try {
      final events = await apiService.getOrganizerEvents(statut: statut);
      setState(() {
        _events = events;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Failed to load events')));
      }
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Organizer Dashboard'),
        bottom: TabBar(
          controller: _tabController,
          onTap: (index) {
            String? filter;
            switch (index) {
              case 0:
                filter = null;
                break;
              case 1:
                filter = 'published';
                break;
              case 2:
                filter = 'draft';
                break;
            }
            _loadEvents(statut: filter);
          },
          tabs: const [
            Tab(text: 'All'),
            Tab(text: 'Published'),
            Tab(text: 'Drafts'),
          ],
        ),
      ),
      body: _isLoading
          ? ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: 3,
              itemBuilder: (context, index) => const Padding(
                padding: EdgeInsets.only(bottom: 16),
                child: EventCardShimmer(),
              ),
            )
          : _events.isEmpty
          ? _buildEmptyState()
          : RefreshIndicator(
              onRefresh: () => _loadEvents(statut: _selectedFilter),
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _events.length,
                itemBuilder: (context, index) {
                  return _buildEventCard(_events[index]);
                },
              ),
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.pushNamed(context, AppRoutes.createEvent),
        icon: const Icon(Icons.add),
        label: const Text('Create Event'),
        backgroundColor: AppConfig.primaryColor,
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.event_busy, size: 80, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text(
            'No events yet',
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(color: Colors.grey[600]),
          ),
          const SizedBox(height: 8),
          Text(
            'Create your first event to get started',
            style: TextStyle(color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }

  Widget _buildEventCard(Event event) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () => Navigator.pushNamed(
          context,
          AppRoutes.eventDetails,
          arguments: event.eventId,
        ),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  _buildStatusBadge(event.statut),
                  const Spacer(),
                  if (event.isPublished)
                    Icon(Icons.visibility, size: 16, color: Colors.grey[600]),
                  if (event.isPublished) const SizedBox(width: 4),
                  Text(
                    event.isPublished ? 'Published' : 'Draft',
                    style: TextStyle(color: Colors.grey[600], fontSize: 12),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                event.titre,
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(Icons.calendar_today, size: 14, color: Colors.grey[600]),
                  const SizedBox(width: 4),
                  Text(
                    _formatDate(event.dateDebut),
                    style: TextStyle(color: Colors.grey[600], fontSize: 13),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  Icon(Icons.location_on, size: 14, color: Colors.grey[600]),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      event.lieu,
                      style: TextStyle(color: Colors.grey[600], fontSize: 13),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Divider(height: 1),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildStat(
                    Icons.people,
                    '${event.placesRestantes}/${event.capaciteTotale}',
                    'Available',
                  ),
                  _buildStat(
                    Icons.confirmation_number,
                    '${event.capaciteTotale - event.placesRestantes}',
                    'Sold',
                  ),
                  if (event.averageRating != null && event.averageRating! > 0)
                    _buildStat(
                      Icons.star,
                      event.averageRating!.toStringAsFixed(1),
                      'Rating',
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String statut) {
    Color color;
    String label;
    switch (statut) {
      case 'published':
        color = AppConfig.successColor;
        label = 'Published';
        break;
      case 'cancelled':
        color = AppConfig.errorColor;
        label = 'Cancelled';
        break;
      case 'completed':
        color = Colors.grey;
        label = 'Completed';
        break;
      default:
        color = AppConfig.warningColor;
        label = 'Draft';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  Widget _buildStat(IconData icon, String value, String label) {
    return Row(
      children: [
        Icon(icon, size: 14, color: Colors.grey[600]),
        const SizedBox(width: 4),
        Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
      ],
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
