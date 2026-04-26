import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../config/app_config.dart';

class ScannerScreen extends StatefulWidget {
  const ScannerScreen({super.key});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  final _tokenController = TextEditingController();
  bool _isProcessing = false;
  bool _showManualEntry = false;

  @override
  void dispose() {
    _tokenController.dispose();
    super.dispose();
  }

  Future<void> _validateTicket(String token) async {
    if (token.isEmpty) return;

    setState(() => _isProcessing = true);

    try {
      final result = await _validateWithBackend(token);

      if (!mounted) return;

      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: Row(
            children: [
              Icon(
                result['valid'] == true ? Icons.check_circle : Icons.cancel,
                color: result['valid'] == true
                    ? AppConfig.successColor
                    : AppConfig.errorColor,
              ),
              const SizedBox(width: 8),
              Text(result['valid'] == true ? 'Valid Ticket' : 'Invalid Ticket'),
            ],
          ),
          content: result['valid'] == true
              ? Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (result['attendeeName'] != null)
                      Text('Attendee: ${result['attendeeName']}'),
                    if (result['ticketType'] != null)
                      Text('Ticket Type: ${result['ticketType']}'),
                    if (result['quantity'] != null)
                      Text('Quantity: ${result['quantity']}'),
                    const SizedBox(height: 16),
                    QrImageView(
                      data: token,
                      version: QrVersions.auto,
                      size: 150,
                    ),
                  ],
                )
              : Text(result['message'] ?? 'Ticket not found'),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                _tokenController.clear();
                setState(() => _isProcessing = false);
              },
              child: const Text('Close'),
            ),
          ],
        ),
      );
    } catch (e) {
      setState(() => _isProcessing = false);
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString()}'),
          backgroundColor: AppConfig.errorColor,
        ),
      );
    }
  }

  Future<Map<String, dynamic>> _validateWithBackend(String token) async {
    try {
      return await _apiValidate(token);
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> _apiValidate(String token) async {
    await Future.delayed(const Duration(milliseconds: 500));
    return {
      'valid': true,
      'attendeeName': 'Guest User',
      'ticketType': 'Standard',
      'quantity': 2,
    };
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Ticket Scanner'),
        actions: [
          IconButton(
            icon: Icon(_showManualEntry ? Icons.qr_code : Icons.keyboard),
            onPressed: () {
              setState(() => _showManualEntry = !_showManualEntry);
            },
            tooltip: _showManualEntry ? 'Use QR Scanner' : 'Enter Manually',
          ),
        ],
      ),
      body: _showManualEntry ? _buildManualEntry() : _buildScannerPlaceholder(),
    );
  }

  Widget _buildScannerPlaceholder() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 280,
              height: 280,
              decoration: BoxDecoration(
                border: Border.all(color: AppConfig.primaryColor, width: 3),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: Icon(
                  Icons.qr_code_scanner,
                  size: 100,
                  color: AppConfig.primaryColor.withValues(alpha: 0.5),
                ),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'QR Scanner',
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Position the QR code within the frame to scan',
              style: TextStyle(color: Colors.grey[600]),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () {
                setState(() => _showManualEntry = true);
              },
              icon: const Icon(Icons.keyboard),
              label: const Text('Enter Code Manually'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildManualEntry() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.confirmation_number,
            size: 80,
            color: AppConfig.primaryColor,
          ),
          const SizedBox(height: 24),
          Text(
            'Enter Ticket Token',
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'Enter the ticket token to validate',
            style: TextStyle(color: Colors.grey[600]),
          ),
          const SizedBox(height: 32),
          TextField(
            controller: _tokenController,
            decoration: InputDecoration(
              labelText: 'Ticket Token',
              hintText: 'Enter ticket token',
              prefixIcon: const Icon(Icons.token),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isProcessing
                  ? null
                  : () => _validateTicket(_tokenController.text.trim()),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppConfig.primaryColor,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: _isProcessing
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text('Validate Ticket'),
            ),
          ),
          const SizedBox(height: 16),
          TextButton(
            onPressed: () {
              setState(() => _showManualEntry = false);
            },
            child: const Text('Use QR Scanner'),
          ),
        ],
      ),
    );
  }
}
