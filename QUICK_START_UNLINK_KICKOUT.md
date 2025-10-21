# Quick Start: Tenant Unlink & Kick-Out

## ✅ Implementation Complete!

The tenant unlink and owner kick-out functionality is now fully implemented and ready to use.

---

## 🚀 Quick Test

### 1. Start Your Server
```bash
npm start
```

### 2. Test Tenant Unlink

**Request:**
```bash
curl -X POST http://localhost:5000/api/tenants/unlink \
  -H "Authorization: Bearer YOUR_TENANT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Moving out"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Successfully unlinked from property",
  "data": {
    "userId": "...",
    "propertyId": "...",
    "propertyName": "...",
    "unlinkedAt": "2023-12-15T10:30:00.000Z",
    "reason": "Moving out"
  }
}
```

### 3. Test Owner Kick Out

**Request:**
```bash
curl -X POST http://localhost:5000/api/tenants/kick-out \
  -H "Authorization: Bearer YOUR_OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "TENANT_ID",
    "propertyId": "PROPERTY_ID",
    "reason": "Lease violation"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Successfully removed tenant from property",
  "data": {
    "tenantId": "...",
    "propertyId": "...",
    "tenantName": "John Doe",
    "propertyName": "Sunset Apartments",
    "removedAt": "2023-12-15T10:30:00.000Z",
    "reason": "Lease violation"
  }
}
```

---

## 📱 Mobile App Usage

### Tenant Unlink (Flutter)

```dart
// In your property service
Future<void> unlinkProperty(String reason) async {
  final response = await http.post(
    Uri.parse('$baseUrl/tenants/unlink'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({'reason': reason}),
  );
  
  if (response.statusCode == 200) {
    // Success - navigate to setup screen
    print('Successfully unlinked');
  } else {
    // Handle error
    throw Exception(jsonDecode(response.body)['message']);
  }
}
```

### Owner Kick Out (Flutter)

```dart
// In your property service
Future<void> kickOutTenant({
  required String tenantId,
  required String propertyId,
  required String reason,
}) async {
  final response = await http.post(
    Uri.parse('$baseUrl/tenants/kick-out'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'tenantId': tenantId,
      'propertyId': propertyId,
      'reason': reason,
    }),
  );
  
  if (response.statusCode == 200) {
    // Success - refresh tenant list
    print('Tenant removed successfully');
  } else {
    // Handle error
    throw Exception(jsonDecode(response.body)['message']);
  }
}
```

---

## 🧪 Run Automated Tests

```bash
# Run the test script
node scripts/testUnlinkKickOut.js
```

**Expected Output:**
```
🧪 Starting Tenant Unlink & Kick-Out Tests
==================================================
...
📊 Test Summary
==================================================
✅ Test 1: Tenant Unlink Property
✅ Test 2: Tenant Unlink When Not Linked
✅ Test 3: Owner Kick Out Tenant
✅ Test 4: Owner Kick Out Without Reason
✅ Test 5: Non-Owner Try to Kick Out

Passed: 5/5
🎉 All tests passed!
```

---

## 📋 API Endpoints

| Endpoint | Method | Auth | Role | Description |
|----------|--------|------|------|-------------|
| `/api/tenants/unlink` | POST | Required | Tenant | Tenant unlinks from property |
| `/api/tenants/kick-out` | POST | Required | Owner/Admin | Owner removes tenant |

---

## 🔍 Check Database Changes

### View Tenant's Unlink History

```javascript
// In MongoDB shell or Compass
db.users.findOne({ email: "tenant@test.com" }, { unlinkHistory: 1 })
```

**Result:**
```json
{
  "unlinkHistory": [
    {
      "propertyId": "64abc123...",
      "propertyName": "Sunset Apartments",
      "action": "unlink",
      "reason": "Moving out",
      "timestamp": "2023-12-15T10:30:00.000Z",
      "initiatedBy": "tenant"
    }
  ]
}
```

### View Property's Removal History

```javascript
// In MongoDB shell or Compass
db.properties.findOne({ name: "Sunset Apartments" }, { tenantRemovalHistory: 1 })
```

**Result:**
```json
{
  "tenantRemovalHistory": [
    {
      "tenantId": "64abc123...",
      "tenantName": "John Doe",
      "action": "kick_out",
      "reason": "Lease violation",
      "timestamp": "2023-12-15T10:30:00.000Z",
      "initiatedBy": "64def456..."
    }
  ]
}
```

---

## 🔔 Push Notifications

Both actions automatically send push notifications:

### Tenant Unlinks
- **To:** Property Owner
- **Title:** "Tenant Unlinked"
- **Body:** "[Tenant Name] has unlinked from [Property Name]. Reason: [Reason]"

### Owner Kicks Out
- **To:** Removed Tenant
- **Title:** "Removed from Property"
- **Body:** "You have been removed from [Property Name] by the property owner. Reason: [Reason]"

---

## ⚠️ Important Notes

1. **Reason is optional** for tenant unlink
2. **Reason is required** for owner kick-out
3. **Audit trail** is maintained in both User and Property documents
4. **linkedProperty** is automatically cleared for the tenant
5. **Tenant is removed** from property's tenants array
6. **Notifications** are sent but don't block the operation if they fail

---

## 🐛 Common Errors

### "User is not linked to any property"
- Tenant is trying to unlink when not linked
- Check: User's `linkedProperty` field

### "Tenant not found in this property"
- Tenant doesn't exist in property's tenants array
- Check: Property's `tenants` array

### "Reason for removal is required"
- Owner didn't provide reason for kick-out
- Fix: Add `reason` field to request body

### "Property not found or you do not own this property"
- Owner trying to kick out from property they don't own
- Check: Property's `ownerId` matches authenticated user

---

## 📚 Full Documentation

For complete details, see:
- **`TENANT_UNLINK_KICKOUT_API.md`** - Complete API documentation
- **`scripts/testUnlinkKickOut.js`** - Test script with all scenarios

---

## ✅ Implementation Status

- [x] Database models updated
- [x] Controller functions created
- [x] Routes configured
- [x] Authorization implemented
- [x] Validation added
- [x] Notifications integrated
- [x] Test script created
- [x] Documentation completed
- [x] No linter errors
- [x] Ready for production

---

## 🎉 You're All Set!

The backend is ready. Your mobile app can now call these endpoints to:
- Allow tenants to unlink from properties
- Allow owners to remove tenants
- Track complete history of all tenant movements

**Happy coding! 🚀**

