import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../config/app_config.dart';
import '../services/api_service.dart';

class CreateEventScreen extends StatefulWidget {
  const CreateEventScreen({super.key});

  @override
  State<CreateEventScreen> createState() => _CreateEventScreenState();
}

class _CreateEventScreenState extends State<CreateEventScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titreController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _lieuController = TextEditingController();
  final _capaciteController = TextEditingController();
  final _tagsController = TextEditingController();

  String _selectedCategory = 'Concert';
  bool _isLoading = false;
  DateTime _dateDebut = DateTime.now().add(const Duration(days: 7));
  DateTime _dateFin = DateTime.now().add(const Duration(days: 7, hours: 3));

  final List<String> _categories = [
    'Concert',
    'Conference',
    'Sports',
    'Theater',
    'Festival',
    'Workshop',
    'Exhibition',
    'Party',
    'Other',
  ];

  @override
  void dispose() {
    _titreController.dispose();
    _descriptionController.dispose();
    _lieuController.dispose();
    _capaciteController.dispose();
    _tagsController.dispose();
    super.dispose();
  }

  Future<void> _selectDate(bool isStartDate) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: isStartDate ? _dateDebut : _dateFin,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );

    if (picked != null) {
      final TimeOfDay? time = await showTimePicker(
        context: context,
        initialTime: TimeOfDay.fromDateTime(
          isStartDate ? _dateDebut : _dateFin,
        ),
      );

      if (time != null) {
        setState(() {
          final newDate = DateTime(
            picked.year,
            picked.month,
            picked.day,
            time.hour,
            time.minute,
          );

          if (isStartDate) {
            _dateDebut = newDate;
            if (_dateFin.isBefore(_dateDebut)) {
              _dateFin = _dateDebut.add(const Duration(hours: 2));
            }
          } else {
            _dateFin = newDate;
          }
        });
      }
    }
  }

  Future<void> _createEvent() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final tags = _tagsController.text
          .split(',')
          .map((t) => t.trim())
          .where((t) => t.isNotEmpty)
          .toList();

      final eventId = await apiService.createEvent(
        titre: _titreController.text.trim(),
        description: _descriptionController.text.trim(),
        categorie: _selectedCategory,
        lieu: _lieuController.text.trim(),
        dateDebut: _dateDebut,
        dateFin: _dateFin,
        capaciteTotale: int.parse(_capaciteController.text),
        tags: tags,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Event created! Add tickets to publish.'),
          ),
        );
        Navigator.pop(context, eventId);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed: ${e.toString()}')));
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create Event')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _titreController,
              decoration: const InputDecoration(
                labelText: 'Event Title *',
                hintText: 'Enter event title',
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter a title';
                }
                if (value.length < 3) {
                  return 'Title must be at least 3 characters';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _selectedCategory,
              decoration: const InputDecoration(labelText: 'Category *'),
              items: _categories.map((category) {
                return DropdownMenuItem(value: category, child: Text(category));
              }).toList(),
              onChanged: (value) {
                setState(() => _selectedCategory = value!);
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _descriptionController,
              decoration: const InputDecoration(
                labelText: 'Description *',
                hintText: 'Describe your event',
                alignLabelWithHint: true,
              ),
              maxLines: 5,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter a description';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _lieuController,
              decoration: const InputDecoration(
                labelText: 'Venue *',
                hintText: 'Event location',
                prefixIcon: Icon(Icons.location_on),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter a venue';
                }
                return null;
              },
            ),
            const SizedBox(height: 24),
            Text(
              'Date & Time',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: _DateTimeCard(
                    label: 'Start',
                    date: _dateDebut,
                    onTap: () => _selectDate(true),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _DateTimeCard(
                    label: 'End',
                    date: _dateFin,
                    onTap: () => _selectDate(false),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            TextFormField(
              controller: _capaciteController,
              decoration: const InputDecoration(
                labelText: 'Total Capacity *',
                hintText: 'Maximum attendees',
                prefixIcon: Icon(Icons.people),
              ),
              keyboardType: TextInputType.number,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter capacity';
                }
                final capacity = int.tryParse(value);
                if (capacity == null || capacity < 1) {
                  return 'Enter a valid number';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _tagsController,
              decoration: const InputDecoration(
                labelText: 'Tags (optional)',
                hintText: 'music, outdoor, family (comma separated)',
                prefixIcon: Icon(Icons.tag),
              ),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: _isLoading ? null : _createEvent,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppConfig.primaryColor,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: _isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text('Create Event'),
            ),
            const SizedBox(height: 16),
            Text(
              'Note: You\'ll be able to add tickets after creating the event.',
              style: TextStyle(color: Colors.grey[600], fontSize: 12),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _DateTimeCard extends StatelessWidget {
  final String label;
  final DateTime date;
  final VoidCallback onTap;

  const _DateTimeCard({
    required this.label,
    required this.date,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey[300]!),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(color: Colors.grey[600], fontSize: 12),
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(Icons.calendar_today, size: 16),
                const SizedBox(width: 4),
                Text(
                  DateFormat('MMM d').format(date),
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
              ],
            ),
            Row(
              children: [
                const Icon(Icons.access_time, size: 16),
                const SizedBox(width: 4),
                Text(
                  DateFormat('h:mm a').format(date),
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
