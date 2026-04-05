import 'package:flutter/material.dart';
import '../config/app_config.dart';
import '../config/routes.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../widgets/event_card.dart';
import '../widgets/shimmer_loading.dart';

class FavoritesScreen extends StatefulWidget {
  const FavoritesScreen({super.key});

  @override
  State<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends State<FavoritesScreen> {
  List<Event> _favorites = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadFavorites();
  }

  Future<void> _loadFavorites() async {
    setState(() => _isLoading = true);
    try {
      final favorites = await apiService.getFavorites();
      setState(() {
        _favorites = favorites;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to load favorites')),
        );
      }
    }
  }

  Future<void> _removeFavorite(String eventId) async {
    try {
      await apiService.removeFromFavorites(eventId);
      setState(() {
        _favorites.removeWhere((e) => e.eventId == eventId);
      });
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Removed from favorites')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to remove from favorites')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Favorites')),
      body: _isLoading
          ? ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: 3,
              itemBuilder: (context, index) => const Padding(
                padding: EdgeInsets.only(bottom: 16),
                child: EventCardShimmer(),
              ),
            )
          : _favorites.isEmpty
          ? _buildEmptyState()
          : RefreshIndicator(
              onRefresh: _loadFavorites,
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _favorites.length,
                itemBuilder: (context, index) {
                  final event = _favorites[index];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: EventCard(
                      event: event,
                      onTap: () => Navigator.pushNamed(
                        context,
                        AppRoutes.eventDetails,
                        arguments: event.eventId,
                      ),
                      onFavoriteToggle: () => _removeFavorite(event.eventId),
                      showFavoriteButton: true,
                    ),
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
          Icon(Icons.favorite_outline, size: 80, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text(
            'No favorites yet',
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(color: Colors.grey[600]),
          ),
          const SizedBox(height: 8),
          Text(
            'Save events to see them here',
            style: TextStyle(color: Colors.grey[500]),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppConfig.primaryColor,
              foregroundColor: Colors.white,
            ),
            child: const Text('Browse Events'),
          ),
        ],
      ),
    );
  }
}
