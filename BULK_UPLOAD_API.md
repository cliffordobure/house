# Bulk Property Creation - API Documentation

## 🚀 New Endpoint: Bulk Property Creation

### Endpoint
```
POST /api/properties/bulk-create
```

### Description
Create multiple properties at once using a template. Perfect for creating multiple rooms in an apartment building or hotel.

### Authentication
- **Required**: Bearer token
- **Role**: Owner only

### Request Body
```json
{
  "propertyTemplate": {
    "name": "Sunset Apartments",
    "location": "Westlands, Nairobi",
    "rentAmount": 25000,
    "paybill": "4032786",
    "accountNumber": "ACC001",
    "description": "Modern apartment",
    "propertyType": "apartment",
    "numberOfRooms": 1,
    "photos": []
  },
  "numberOfRooms": 90,
  "roomPrefix": "Room",
  "startingNumber": 1
}
```

### Request Parameters

#### propertyTemplate (Object, Required)
- **name** (string, required): Base property name
- **location** (string, required): Property location
- **rentAmount** (number, required): Monthly rent amount
- **paybill** (string, required): M-Pesa paybill number
- **accountNumber** (string, required): Account number
- **description** (string, optional): Property description
- **propertyType** (string, optional): Type of property (default: "apartment")
- **numberOfRooms** (number, optional): Number of rooms per property (default: 1)
- **photos** (array, optional): Array of photo URLs

#### numberOfRooms (Number, Required)
- Range: 1-200
- Number of properties to create

#### roomPrefix (String, Required)
- Length: 1-20 characters
- Prefix for room naming (e.g., "Room", "Unit", "Suite")

#### startingNumber (Number, Required)
- Minimum: 1
- Starting room number

### Response

#### Success Response (201)
```json
{
  "success": true,
  "message": "Successfully created 90 properties",
  "count": 90,
  "properties": [
    {
      "_id": "64a5f8b9c2e4f1a2b3c4d5e7",
      "name": "Sunset Apartments - Room 1",
      "code": "SUN-001",
      "location": "Westlands, Nairobi",
      "rentAmount": 25000
    },
    {
      "_id": "64a5f8b9c2e4f1a2b3c4d5e8",
      "name": "Sunset Apartments - Room 2",
      "code": "SUN-002",
      "location": "Westlands, Nairobi",
      "rentAmount": 25000
    }
    // ... more properties
  ]
}
```

#### Error Responses

**400 Bad Request - Missing Fields**
```json
{
  "success": false,
  "message": "propertyTemplate, numberOfRooms, roomPrefix, and startingNumber are required"
}
```

**400 Bad Request - Invalid Range**
```json
{
  "success": false,
  "message": "numberOfRooms must be between 1 and 200"
}
```

**400 Bad Request - Duplicate Codes**
```json
{
  "success": false,
  "message": "Some house codes already exist: SUN-001, SUN-002"
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "message": "Not authorized, no token"
}
```

**403 Forbidden**
```json
{
  "success": false,
  "message": "User role tenant is not authorized to access this route"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "Failed to create properties",
  "error": "Error details in development mode"
}
```

---

## 🏠 House Code Generation

The system automatically generates unique house codes using this pattern:

### Format
```
[ABBREVIATION]-[ROOM_NUMBER][-SUFFIX]
```

### Examples
- **Input**: "Sunset Apartments", Room 1 → **Output**: "SUN-001"
- **Input**: "Palm View Estate", Room 15 → **Output**: "PVE-015"
- **Input**: "Modern Complex", Room 100 → **Output**: "MOD-100"

### Rules
1. Takes first 3 characters from property name words
2. Room number padded to 3 digits with leading zeros
3. If code already exists, adds suffix (-1, -2, etc.)
4. All codes are uppercase

---

## 📱 Usage Examples

### cURL Example
```bash
curl -X POST http://localhost:5000/api/properties/bulk-create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_OWNER_TOKEN" \
  -d '{
    "propertyTemplate": {
      "name": "Sunset Apartments",
      "location": "Westlands, Nairobi",
      "rentAmount": 25000,
      "paybill": "4032786",
      "accountNumber": "ACC001",
      "description": "Modern apartment",
      "propertyType": "apartment",
      "numberOfRooms": 1,
      "photos": []
    },
    "numberOfRooms": 10,
    "roomPrefix": "Room",
    "startingNumber": 1
  }'
```

### JavaScript Example
```javascript
const response = await fetch('/api/properties/bulk-create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    propertyTemplate: {
      name: "Sunset Apartments",
      location: "Westlands, Nairobi",
      rentAmount: 25000,
      paybill: "4032786",
      accountNumber: "ACC001",
      description: "Modern apartment",
      propertyType: "apartment",
      numberOfRooms: 1,
      photos: []
    },
    numberOfRooms: 90,
    roomPrefix: "Room",
    startingNumber: 1
  })
});

const result = await response.json();
console.log(`Created ${result.count} properties`);
```

---

## ⚡ Performance Benefits

### Before (Individual Creation)
- **90 API calls** for 90 rooms
- **~30-45 seconds** total time
- **High server load**
- **Potential failures** (some succeed, some fail)

### After (Bulk Creation)
- **1 API call** for 90 rooms
- **~2-3 seconds** total time
- **Low server load**
- **Atomic operation** (all succeed or all fail)

---

## 🔒 Security Features

- ✅ **Authentication Required**: JWT token validation
- ✅ **Role Authorization**: Owner role only
- ✅ **Input Validation**: Comprehensive request validation
- ✅ **Rate Limiting**: Protected by API rate limits
- ✅ **Duplicate Prevention**: Checks for existing codes
- ✅ **Error Handling**: Graceful error responses

---

## 🧪 Testing

### Test with Sample Data
```bash
# First, login as owner to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@test.com",
    "password": "password123"
  }'

# Use the token from response, then create bulk properties
curl -X POST http://localhost:5000/api/properties/bulk-create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "propertyTemplate": {
      "name": "Test Apartments",
      "location": "Nairobi",
      "rentAmount": 20000,
      "paybill": "4032786",
      "accountNumber": "TEST001",
      "description": "Test property"
    },
    "numberOfRooms": 5,
    "roomPrefix": "Unit",
    "startingNumber": 1
  }'
```

### Expected Result
```json
{
  "success": true,
  "message": "Successfully created 5 properties",
  "count": 5,
  "properties": [
    {
      "_id": "...",
      "name": "Test Apartments - Unit 1",
      "code": "TES-001",
      "location": "Nairobi",
      "rentAmount": 20000
    },
    // ... 4 more properties
  ]
}
```

---

## 🎯 Use Cases

### Perfect For:
- **Apartment Buildings**: Create 50+ units at once
- **Hotel Rooms**: Bulk create room inventory
- **Student Hostels**: Create multiple dorm rooms
- **Office Buildings**: Create multiple office spaces
- **Shopping Centers**: Create multiple shop units

### Example Scenarios:
1. **90-Room Hotel**: Create all rooms in 2-3 seconds
2. **50-Unit Apartment**: Bulk create with different room types
3. **Student Hostel**: Create 200+ rooms efficiently
4. **Office Complex**: Create multiple office spaces

---

## 🔄 Integration with Flutter App

The Flutter app can now use this endpoint for much faster property creation:

```dart
// Old way (90 individual calls)
for (int i = 1; i <= 90; i++) {
  await createProperty(propertyData);
}

// New way (1 bulk call)
await bulkCreateProperties(
  propertyTemplate: propertyTemplate,
  numberOfRooms: 90,
  roomPrefix: "Room",
  startingNumber: 1,
);
```

---

**Ready to create properties at scale! 🚀**

