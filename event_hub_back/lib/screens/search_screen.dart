import 'package:flutter/material.dart';
import '../config/app_config.dart';
import '../config/routes.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../widgets/event_card.dart';
import '../widgets/shimmer_loading.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  List<Event> _results = [];
  bool _isLoading = false;
  bool _isLoadingMore = false;
  bool _hasMore = true;
  bool _hasSearched = false;
  String? _cursor;
  String _selectedCategory = 'All';
  final List<String> _categories = [
    'All',
    'Music',
    'Sports',
    'Tech',
    'Art',
    'Food',
    'Business',
    'Health',
  ];

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    _loadUpcoming();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
            _scrollController.position.maxScrollExtent - 200 &&
        !_isLoadingMore &&
        _hasMore) {
      _loadMore();
    }
  }

  Future<void> _search() async {
    if (_searchController.text.trim().isEmpty) return;

    setState(() {
      _isLoading = true;
      _hasSearched = true;
      _cursor = null;
      _hasMore = false;
    });

    try {
      final results = await apiService.searchEvents(
        query: _searchController.text.trim(),
        limit: 20,
      );
      setState(() {
        _results = results;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Search failed')));
      }
    }
  }

  Future<void> _loadUpcoming() async {
    setState(() {
      _isLoading = true;
      _hasSearched = false;
      _cursor = null;
      _hasMore = true;
    });

    try {
      final result = await apiService.getUpcomingEvents(
        categorie: _selectedCategory == 'All' ? null : _selectedCategory,
        limit: 20,
      );
      setState(() {
        _results = result['events'] as List<Event>;
        _cursor = result['nextCursor'];
        _hasMore = _cursor != null;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _loadMore() async {
    if (_cursor == null || _isLoadingMore || !_hasMore) return;

    setState(() => _isLoadingMore = true);

    try {
      List<Event> newResults;
      if (_hasSearched) {
        newResults = await apiService.searchEvents(
          query: _searchController.text.trim(),
          limit: 20,
        );
      } else {
        final result = await apiService.getUpcomingEvents(
          categorie: _selectedCategory == 'All' ? null : _selectedCategory,
          limit: 20,
          cursor: _cursor,
        );
        newResults = result['events'] as List<Event>;
        _cursor = result['nextCursor'];
      }
      setState(() {
        _results.addAll(newResults);
        _hasMore = _cursor != null || _hasSearched;
        _isLoadingMore = false;
      });
    } catch (e) {
      setState(() => _isLoadingMore = false);
    }
  }

  Future<void> _onCategoryChanged(String category) async {
    setState(() => _selectedCategory = category);
    _cursor = null;
    _hasMore = true;
    await _loadUpcoming();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Search')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search events...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          _loadUpcoming();
                        },
                      )
                    : null,
                filled: true,
                fillColor: Colors.grey[100],
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
              onSubmitted: (_) => _search(),
              onChanged: (value) => setState(() {}),
            ),
          ),
          SizedBox(
            height: 40,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _categories.length,
              itemBuilder: (context, index) {
                final category = _categories[index];
                final isSelected = _selectedCategory == category;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(category),
                    selected: isSelected,
                    onSelected: (selected) {
                      if (selected) {
                        _onCategoryChanged(category);
                      }
                    },
                    selectedColor: AppConfig.primaryColor.withValues(
                      alpha: 0.2,
                    ),
                    checkmarkColor: AppConfig.primaryColor,
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: _isLoading
                ? _buildLoadingState()
                : _results.isEmpty
                ? _buildEmptyState()
                : _buildResultsList(),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingState() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 5,
      itemBuilder: (context, index) => const Padding(
        padding: EdgeInsets.only(bottom: 16),
        child: EventCardShimmer(),
      ),
    );
  }

  Widget _buildResultsList() {
    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.all(16),
      itemCount: _results.length + (_isLoadingMore ? 1 : 0),
      itemBuilder: (context, index) {
        if (index >= _results.length) {
          return const Padding(
            padding: EdgeInsets.all(16),
            child: Center(child: CircularProgressIndicator()),
          );
        }
        final event = _results[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: EventCard(
            event: event,
            onTap: () => Navigator.pushNamed(
              context,
              AppRoutes.eventDetails,
              arguments: event.eventId,
            ),
          ),
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search_off, size: 80, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text(
            _hasSearched ? 'No results found' : 'No events available',
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(color: Colors.grey[600]),
          ),
          const SizedBox(height: 8),
          Text(
            _hasSearched
                ? 'Try a different search term'
                : 'Check back later for new events',
            style: TextStyle(color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }
}
