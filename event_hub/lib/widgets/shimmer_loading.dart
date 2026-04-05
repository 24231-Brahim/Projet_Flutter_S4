import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../config/app_config.dart';

class ShimmerLoading extends StatelessWidget {
  final Widget child;

  const ShimmerLoading({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: child,
    );
  }
}

class EventCardShimmer extends StatelessWidget {
  final bool isCompact;

  const EventCardShimmer({super.key, this.isCompact = false});

  @override
  Widget build(BuildContext context) {
    if (isCompact) {
      return Card(
        child: ShimmerLoading(
          child: Row(
            children: [
              Container(width: 100, height: 100, color: Colors.white),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        height: 16,
                        width: double.infinity,
                        color: Colors.white,
                      ),
                      const SizedBox(height: 8),
                      Container(height: 12, width: 80, color: Colors.white),
                      const SizedBox(height: 8),
                      Container(height: 12, width: 60, color: Colors.white),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Card(
      clipBehavior: Clip.antiAlias,
      child: ShimmerLoading(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(height: 180, color: Colors.white),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(height: 12, width: 80, color: Colors.white),
                  const SizedBox(height: 12),
                  Container(
                    height: 20,
                    width: double.infinity,
                    color: Colors.white,
                  ),
                  const SizedBox(height: 8),
                  Container(height: 16, width: 200, color: Colors.white),
                  const SizedBox(height: 12),
                  Container(height: 14, width: 150, color: Colors.white),
                  const SizedBox(height: 8),
                  Container(height: 14, width: 120, color: Colors.white),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class BookingCardShimmer extends StatelessWidget {
  const BookingCardShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ShimmerLoading(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      height: 16,
                      width: double.infinity,
                      color: Colors.white,
                    ),
                    const SizedBox(height: 8),
                    Container(height: 14, width: 120, color: Colors.white),
                    const SizedBox(height: 8),
                    Container(height: 14, width: 80, color: Colors.white),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class ProfileShimmer extends StatelessWidget {
  const ProfileShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return ShimmerLoading(
      child: Column(
        children: [
          const SizedBox(height: 32),
          Container(
            width: 100,
            height: 100,
            decoration: const BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(height: 16),
          Container(height: 24, width: 150, color: Colors.white),
          const SizedBox(height: 8),
          Container(height: 16, width: 200, color: Colors.white),
          const SizedBox(height: 32),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: List.generate(
                4,
                (index) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Container(
                    height: 60,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class ListTileShimmer extends StatelessWidget {
  final int itemCount;

  const ListTileShimmer({super.key, this.itemCount = 5});

  @override
  Widget build(BuildContext context) {
    return ShimmerLoading(
      child: Column(
        children: List.generate(
          itemCount,
          (index) => ListTile(
            leading: Container(
              width: 40,
              height: 40,
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
            ),
            title: Container(
              height: 16,
              width: double.infinity,
              color: Colors.white,
            ),
            subtitle: Container(
              height: 12,
              width: 150,
              margin: const EdgeInsets.only(top: 4),
              color: Colors.white,
            ),
          ),
        ),
      ),
    );
  }
}
