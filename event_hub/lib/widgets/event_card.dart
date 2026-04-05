import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../models/event.dart';
import '../config/app_config.dart';

class EventCard extends StatelessWidget {
  final Event event;
  final VoidCallback? onTap;
  final bool isCompact;
  final VoidCallback? onFavoriteToggle;
  final bool showFavoriteButton;

  const EventCard({
    super.key,
    required this.event,
    this.onTap,
    this.isCompact = false,
    this.onFavoriteToggle,
    this.showFavoriteButton = false,
  });

  @override
  Widget build(BuildContext context) {
    if (isCompact) {
      return _buildCompactCard(context);
    }
    return _buildFullCard(context);
  }

  Widget _buildFullCard(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(aspectRatio: 16 / 9, child: _buildImage()),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: AppConfig.primaryColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          event.categorie,
                          style: TextStyle(
                            color: AppConfig.primaryColor,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                      const Spacer(),
                      if (showFavoriteButton && onFavoriteToggle != null)
                        IconButton(
                          icon: const Icon(Icons.favorite_border),
                          color: Colors.red,
                          onPressed: onFavoriteToggle,
                        ),
                      if (event.averageRating != null &&
                          event.averageRating! > 0)
                        Row(
                          children: [
                            const Icon(
                              Icons.star,
                              size: 16,
                              color: Colors.amber,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              event.averageRating!.toStringAsFixed(1),
                              style: const TextStyle(
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    event.titre,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(
                        Icons.calendar_today,
                        size: 16,
                        color: Colors.grey[600],
                      ),
                      const SizedBox(width: 4),
                      Text(
                        DateFormat(
                          'MMM d, yyyy • h:mm a',
                        ).format(event.dateDebut),
                        style: TextStyle(color: Colors.grey[600], fontSize: 14),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                        Icons.location_on,
                        size: 16,
                        color: Colors.grey[600],
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          event.lieu,
                          style: TextStyle(
                            color: Colors.grey[600],
                            fontSize: 14,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildAvailabilityBadge(),
                      if (event.placesRestantes > 0)
                        Text(
                          '${event.placesRestantes} seats left',
                          style: TextStyle(
                            color: event.placesRestantes < 10
                                ? AppConfig.warningColor
                                : Colors.grey[600],
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCompactCard(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        child: Row(
          children: [
            SizedBox(width: 100, height: 100, child: _buildImage()),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      event.titre,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      DateFormat('MMM d').format(event.dateDebut),
                      style: TextStyle(color: Colors.grey[600], fontSize: 12),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      event.lieu,
                      style: TextStyle(color: Colors.grey[600], fontSize: 12),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImage() {
    if (event.imageURL.isEmpty) {
      return Container(
        color: AppConfig.primaryColor.withOpacity(0.1),
        child: Center(
          child: Icon(
            Icons.event,
            size: 48,
            color: AppConfig.primaryColor.withOpacity(0.5),
          ),
        ),
      );
    }

    return CachedNetworkImage(
      imageUrl: event.imageURL,
      fit: BoxFit.cover,
      placeholder: (context, url) => Container(
        color: Colors.grey[200],
        child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
      ),
      errorWidget: (context, url, error) => Container(
        color: AppConfig.primaryColor.withOpacity(0.1),
        child: Center(
          child: Icon(
            Icons.event,
            size: 48,
            color: AppConfig.primaryColor.withOpacity(0.5),
          ),
        ),
      ),
    );
  }

  Widget _buildAvailabilityBadge() {
    if (event.isSoldOut) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: AppConfig.errorColor.withOpacity(0.1),
          borderRadius: BorderRadius.circular(4),
        ),
        child: const Text(
          'SOLD OUT',
          style: TextStyle(
            color: AppConfig.errorColor,
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
      );
    }

    if (event.occupancyRate > 80) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: AppConfig.warningColor.withOpacity(0.1),
          borderRadius: BorderRadius.circular(4),
        ),
        child: const Text(
          'ALMOST FULL',
          style: TextStyle(
            color: AppConfig.warningColor,
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
      );
    }

    return const SizedBox.shrink();
  }
}
