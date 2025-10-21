# Fix: "Route not found" Error for Tenant Unlink

## 🚨 Problem
Mobile app shows: **"Exception: Network error: Exception: Route not found"** when trying to unlink from property.

## 🔍 Quick Diagnosis

Run this diagnostic script:
```bash
node scripts/diagnoseUnlinkRoute.js
```

## 🛠️ Common Solutions

### 1. **Check Mobile App Base URL**

**❌ Wrong:**
```dart
// In your mobile app constants
const String baseUrl = 'https://yourapi.com';  // Missing /api
```

**✅ Correct:**
```dart
// In your mobile app constants
const String baseUrl = 'https://yourapi.com/api';  // Include /api
```

### 2. **Check Endpoint Path**

**❌ Wrong:**
```dart
// Wrong endpoint paths
final response = await http.post('$baseUrl/properties/unlink');  // Wrong
final response = await http.post('$baseUrl/tenant/unlink');      // Missing 's'
final response = await http.post('$baseUrl/unlink');            // Missing path
```

**✅ Correct:**
```dart
// Correct endpoint path
final response = await http.post('$baseUrl/tenants/unlink');
```

### 3. **Check HTTP Method**

**❌ Wrong:**
```dart
// Wrong HTTP method
final response = await http.get('$baseUrl/tenants/unlink');  // Should be POST
```

**✅ Correct:**
```dart
// Correct HTTP method
final response = await http.post('$baseUrl/tenants/unlink');
```

### 4. **Check Authorization Header**

**❌ Wrong:**
```dart
// Missing or wrong authorization
headers: {
  'Content-Type': 'application/json',
  // Missing Authorization header
}
```

**✅ Correct:**
```dart
// Correct authorization
headers: {
  'Authorization': 'Bearer $token',  // Include Bearer prefix
  'Content-Type': 'application/json',
}
```

### 5. **Check Server is Running**

**Test server health:**
```bash
curl http://localhost:5000/
```

**Expected response:**
```json
{
  "success": true,
  "message": "PropertyHub API is running",
  "version": "1.0.0"
}
```

### 6. **Check Route Registration**

**Test if route exists:**
```bash
curl -X POST http://localhost:5000/api/tenants/unlink
```

**Expected response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

If you get 404, the route isn't registered properly.

## 🔧 Step-by-Step Fix

### Step 1: Verify Server Routes

1. **Start your server:**
   ```bash
   npm start
   ```

2. **Test the route directly:**
   ```bash
   curl -X POST http://localhost:5000/api/tenants/unlink \
     -H "Content-Type: application/json" \
     -d '{"reason": "test"}'
   ```

3. **Expected response:**
   ```json
   {
     "success": false,
     "message": "Access denied. No token provided."
   }
   ```

### Step 2: Check Mobile App Configuration

1. **Find your mobile app's API configuration file**
   - Usually in `lib/utils/constants.dart` or similar

2. **Verify base URL:**
   ```dart
   static const String baseUrl = 'https://yourapi.com/api';
   ```

3. **Verify endpoint:**
   ```dart
   static const String unlinkPropertyEndpoint = '/tenants/unlink';
   ```

### Step 3: Test with Valid Token

1. **Get a valid tenant token** (from login response)

2. **Test with curl:**
   ```bash
   curl -X POST http://localhost:5000/api/tenants/unlink \
     -H "Authorization: Bearer YOUR_TENANT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"reason": "test unlink"}'
   ```

3. **Expected response:**
   ```json
   {
     "success": true,
     "message": "Successfully unlinked from property",
     "data": {
       "userId": "...",
       "propertyId": "...",
       "propertyName": "...",
       "unlinkedAt": "2023-12-15T10:30:00.000Z",
       "reason": "test unlink"
     }
   }
   ```

## 📱 Mobile App Code Example

Here's the correct implementation for Flutter/Dart:

```dart
class PropertyService {
  static const String baseUrl = 'https://yourapi.com/api';
  
  Future<Map<String, dynamic>> unlinkProperty(String reason) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/tenants/unlink'),  // Correct endpoint
        headers: {
          'Authorization': 'Bearer $token',      // Correct auth header
          'Content-Type': 'application/json',   // Correct content type
        },
        body: jsonEncode({
          'reason': reason,                    // Correct body format
        }),
      );
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to unlink: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }
}
```

## 🐛 Debugging Steps

### 1. Enable Network Logging

Add logging to see the exact request:

```dart
print('Making request to: $baseUrl/tenants/unlink');
print('Headers: $headers');
print('Body: $body');
```

### 2. Check Network Tab

In your mobile app debugger, check the Network tab to see:
- What URL is being called
- What headers are sent
- What response is received

### 3. Test with Postman

Test the exact same request in Postman:
- URL: `https://yourapi.com/api/tenants/unlink`
- Method: POST
- Headers: `Authorization: Bearer YOUR_TOKEN`
- Body: `{"reason": "test"}`

## ⚡ Quick Fix Checklist

- [ ] Server is running (`npm start`)
- [ ] Mobile app base URL includes `/api`
- [ ] Endpoint path is `/tenants/unlink` (not `/properties/unlink`)
- [ ] HTTP method is POST (not GET)
- [ ] Authorization header includes `Bearer ` prefix
- [ ] Content-Type is `application/json`
- [ ] Request body is valid JSON
- [ ] Token is valid and not expired

## 🆘 Still Not Working?

If the issue persists:

1. **Run the diagnostic script:**
   ```bash
   node scripts/diagnoseUnlinkRoute.js
   ```

2. **Check server logs:**
   ```bash
   # Look for incoming requests
   tail -f logs/access.log
   ```

3. **Test with curl:**
   ```bash
   curl -v -X POST http://localhost:5000/api/tenants/unlink \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"reason": "test"}'
   ```

4. **Check mobile app network configuration:**
   - Verify no proxy settings
   - Check if HTTPS is required
   - Ensure no certificate issues

## 📞 Need Help?

If you're still stuck, provide:
1. The exact URL your mobile app is calling
2. The headers being sent
3. The server logs when the request is made
4. The result of running `node scripts/diagnoseUnlinkRoute.js`

---

**Most likely cause:** Mobile app is calling `/api/properties/unlink` instead of `/api/tenants/unlink`

