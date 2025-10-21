# Tenant Unlink & Kick-Out Flow Diagrams

Visual representations of the complete flow for both operations.

---

## 🔄 Tenant Unlink Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         TENANT UNLINK FLOW                       │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│ Tenant App   │
│ (Mobile)     │
└──────┬───────┘
       │
       │ POST /api/tenants/unlink
       │ { reason: "Moving out" }
       │ Bearer Token (Tenant)
       ↓
┌──────────────────────────────────────────────────────────────────┐
│ 1. AUTHENTICATION & AUTHORIZATION                                │
├──────────────────────────────────────────────────────────────────┤
│ ✓ JWT token validated                                            │
│ ✓ User role = 'tenant' verified                                 │
│ ✓ User exists in database                                        │
└──────────────────────────────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────────────────────┐
│ 2. VALIDATION                                                    │
├──────────────────────────────────────────────────────────────────┤
│ ✓ Check user.linkedProperty exists                              │
│ ✗ If null → Return 400 "Not linked to any property"            │
└──────────────────────────────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────────────────────┐
│ 3. GET PROPERTY DETAILS                                          │
├──────────────────────────────────────────────────────────────────┤
│ • Fetch property by linkedProperty ID                            │
│ • Populate ownerId for notifications                             │
└──────────────────────────────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────────────────────┐
│ 4. UPDATE PROPERTY                                               │
├──────────────────────────────────────────────────────────────────┤
│ • Remove tenant from property.tenants array                      │
│ • Add to property.tenantRemovalHistory:                          │
│   - tenantId                                                     │
│   - tenantName                                                   │
│   - action: "unlink"                                             │
│   - reason                                                       │
│   - timestamp                                                    │
│   - initiatedBy: userId                                          │
│ • Save property                                                  │
└──────────────────────────────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────────────────────┐
│ 5. UPDATE USER                                                   │
├──────────────────────────────────────────────────────────────────┤
│ • Set user.linkedProperty = null                                 │
│ • Add to user.unlinkHistory:                                     │
│   - propertyId                                                   │
│   - propertyName                                                 │
│   - action: "unlink"                                             │
│   - reason                                                       │
│   - timestamp                                                    │
│   - initiatedBy: "tenant"                                        │
│ • Save user                                                      │
└──────────────────────────────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────────────────────┐
│ 6. SEND NOTIFICATION                                             │
├──────────────────────────────────────────────────────────────────┤
│ TO: Property Owner (if fcmToken exists)                          │
│ TITLE: "Tenant Unlinked"                                         │
│ BODY: "[Name] has unlinked from [Property]. Reason: [Reason]"   │
│ DATA:                                                            │
│   - type: "tenant_unlinked"                                      │
│   - tenantId, propertyId                                         │
│   - tenantName, propertyName                                     │
│ NOTE: Failure doesn't block operation                            │
└──────────────────────────────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────────────────────┐
│ 7. RETURN SUCCESS RESPONSE                                       │
├──────────────────────────────────────────────────────────────────┤
│ {                                                                │
│   "success": true,                                               │
│   "message": "Successfully unlinked from property",              │
│   "data": {                                                      │
│     "userId": "...",                                             │
│     "propertyId": "...",                                         │
│     "propertyName": "...",                                       │
│     "unlinkedAt": "2023-12-15T10:30:00.000Z",                   │
│     "reason": "Moving out"                                       │
│   }                                                              │
│ }                                                                │
└──────────────────────────────────────────────────────────────────┘
       │
       ↓
┌──────────────┐
│ Mobile App   │
│ - Show success message                                           │
│ - Navigate to setup screen                                       │
│ - Clear cached property data                                     │
└──────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ OWNER'S PHONE                                                    │
├──────────────────────────────────────────────────────────────────┤
│ 🔔 Notification: "Tenant Unlinked"                              │
│    John Doe has unlinked from Sunset Apartments.                │
│    Reason: Moving out                                            │
│                                                                  │
│    [Tap to view property details]                               │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🚫 Owner Kick-Out Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      OWNER KICK-OUT FLOW                         │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│ Owner App    │
│ (Mobile)     │
└──────┬───────┘
       │
       │ POST /api/tenants/kick-out
       │ {
       │   tenantId: "...",
       │   propertyId: "...",
       │   reason: "Lease violation"
       │ }
       │ Bearer Token (Owner)
       ↓
┌──────────────────────────────────────────────────────────────────┐
│ 1. AUTHENTICATION & AUTHORIZATION                                │
├──────────────────────────────────────────────────────────────────┤
│ ✓ JWT token validated                                            │
│ ✓ User role = 'owner' or 'admin' verified                       │
│ ✓ User exists in database                                        │
└──────────────────────────────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────────────────────┐
│ 2. INPUT VALIDATION                                              │
├──────────────────────────────────────────────────────────────────┤
│ ✓ tenantId provided                                              │
│ ✓ propertyId provided                                            │
│ ✓ reason provided and not empty                                  │
│ ✓ ObjectId formats valid                                         │
│ ✗ If validation fails → Return 400 error                        │
└──────────────────────────────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────────────────────┐
│ 3. VERIFY PROPERTY OWNERSHIP                                     │
├──────────────────────────────────────────────────────────────────┤
│ • Query: Property.findOne({                                      │
│     _id: propertyId,                                             │
│     ownerId: authenticatedUserId                                 │
│   })                                                             │
│ ✗ If not found → Return 403 "Not authorized"                    │
└──────────────────────────────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────────────────────┐
│ 4. VERIFY TENANT IN PROPERTY                                     │
├──────────────────────────────────────────────────────────────────┤
│ • Check if tenantId exists in property.tenants array             │
│ ✗ If not found → Return 400 "Tenant not found in property"      │
└──────────────────────────────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────────────────────┐
│ 5. GET TENANT DETAILS                                            │
├──────────────────────────────────────────────────────────────────┤
│ • Fetch User by tenantId                                         │
│ • Get tenant name for notifications and logging                  │
└──────────────────────────────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────────────────────┐
│ 6. UPDATE PROPERTY                                               │
├──────────────────────────────────────────────────────────────────┤
│ • Remove tenant from property.tenants array                      │
│ • Add to property.tenantRemovalHistory:                          │
│   - tenantId                                                     │
│   - tenantName                                                   │
│   - action: "kick_out"                                           │
│   - reason                                                       │
│   - timestamp                                                    │
│   - initiatedBy: ownerId                                         │
│ • Save property                                                  │
└──────────────────────────────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────────────────────┐
│ 7. UPDATE TENANT                                                 │
├──────────────────────────────────────────────────────────────────┤
│ • Set tenant.linkedProperty = null                               │
│ • Add to tenant.unlinkHistory:                                   │
│   - propertyId                                                   │
│   - propertyName                                                 │
│   - action: "kick_out"                                           │
│   - reason                                                       │
│   - timestamp                                                    │
│   - initiatedBy: "owner"                                         │
│ • Save tenant                                                    │
└──────────────────────────────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────────────────────┐
│ 8. SEND NOTIFICATION                                             │
├──────────────────────────────────────────────────────────────────┤
│ TO: Removed Tenant (if fcmToken exists)                          │
│ TITLE: "Removed from Property"                                   │
│ BODY: "You have been removed from [Property] by the property    │
│        owner. Reason: [Reason]"                                  │
│ DATA:                                                            │
│   - type: "tenant_kicked_out"                                    │
│   - propertyId, propertyName                                     │
│   - reason                                                       │
│ NOTE: Failure doesn't block operation                            │
└──────────────────────────────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────────────────────┐
│ 9. RETURN SUCCESS RESPONSE                                       │
├──────────────────────────────────────────────────────────────────┤
│ {                                                                │
│   "success": true,                                               │
│   "message": "Successfully removed tenant from property",        │
│   "data": {                                                      │
│     "tenantId": "...",                                           │
│     "propertyId": "...",                                         │
│     "tenantName": "John Doe",                                    │
│     "propertyName": "Sunset Apartments",                         │
│     "removedAt": "2023-12-15T10:30:00.000Z",                    │
│     "reason": "Lease violation"                                  │
│   }                                                              │
│ }                                                                │
└──────────────────────────────────────────────────────────────────┘
       │
       ↓
┌──────────────┐
│ Owner App    │
│ - Show success message                                           │
│ - Refresh tenant list                                            │
│ - Update property stats                                          │
└──────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ TENANT'S PHONE                                                   │
├──────────────────────────────────────────────────────────────────┤
│ 🔔 Notification: "Removed from Property"                        │
│    You have been removed from Sunset Apartments by the          │
│    property owner.                                               │
│    Reason: Lease violation                                       │
│                                                                  │
│    [Tap to find new property]                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📊 Database State Changes

### Before Operation

```
┌─────────────────────────────────────────────────────────────┐
│ USER (Tenant)                                               │
├─────────────────────────────────────────────────────────────┤
│ _id: "64abc123..."                                          │
│ name: "John Doe"                                            │
│ role: "tenant"                                              │
│ linkedProperty: "64def456..."  ← Linked to property        │
│ unlinkHistory: []              ← Empty                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PROPERTY                                                    │
├─────────────────────────────────────────────────────────────┤
│ _id: "64def456..."                                          │
│ name: "Sunset Apartments"                                   │
│ ownerId: "64ghi789..."                                      │
│ tenants: ["64abc123..."]       ← Contains tenant            │
│ tenantRemovalHistory: []       ← Empty                      │
└─────────────────────────────────────────────────────────────┘
```

### After Unlink/Kick-Out

```
┌─────────────────────────────────────────────────────────────┐
│ USER (Tenant)                                               │
├─────────────────────────────────────────────────────────────┤
│ _id: "64abc123..."                                          │
│ name: "John Doe"                                            │
│ role: "tenant"                                              │
│ linkedProperty: null           ← Cleared                    │
│ unlinkHistory: [{              ← New entry added            │
│   propertyId: "64def456...",                                │
│   propertyName: "Sunset Apartments",                        │
│   action: "unlink",                                         │
│   reason: "Moving out",                                     │
│   timestamp: "2023-12-15T10:30:00.000Z",                   │
│   initiatedBy: "tenant"                                     │
│ }]                                                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PROPERTY                                                    │
├─────────────────────────────────────────────────────────────┤
│ _id: "64def456..."                                          │
│ name: "Sunset Apartments"                                   │
│ ownerId: "64ghi789..."                                      │
│ tenants: []                    ← Tenant removed             │
│ tenantRemovalHistory: [{       ← New entry added            │
│   tenantId: "64abc123...",                                  │
│   tenantName: "John Doe",                                   │
│   action: "unlink",                                         │
│   reason: "Moving out",                                     │
│   timestamp: "2023-12-15T10:30:00.000Z",                   │
│   initiatedBy: "64abc123..."                                │
│ }]                                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔒 Security Checkpoints

```
┌─────────────────────────────────────────────────────────────┐
│ TENANT UNLINK - SECURITY CHECKS                             │
├─────────────────────────────────────────────────────────────┤
│ ✓ JWT Token Valid?                                          │
│ ✓ User Role = 'tenant'?                                     │
│ ✓ User Linked to Property?                                  │
│ ✓ Property Exists?                                          │
│                                                             │
│ If any check fails → 400/403/404 error                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ OWNER KICK-OUT - SECURITY CHECKS                            │
├─────────────────────────────────────────────────────────────┤
│ ✓ JWT Token Valid?                                          │
│ ✓ User Role = 'owner' or 'admin'?                          │
│ ✓ TenantId, PropertyId, Reason Provided?                   │
│ ✓ ObjectId Formats Valid?                                   │
│ ✓ Owner Owns the Property?                                  │
│ ✓ Tenant Exists in Property?                               │
│ ✓ Tenant User Exists?                                       │
│                                                             │
│ If any check fails → 400/403/404 error                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Success Criteria

### Operation Considered Successful When:

1. ✅ Tenant removed from property.tenants array
2. ✅ Tenant's linkedProperty cleared
3. ✅ Entry added to user.unlinkHistory
4. ✅ Entry added to property.tenantRemovalHistory
5. ✅ Both documents saved successfully
6. ✅ Success response returned to client
7. ⚠️ Notification sent (optional - doesn't block on failure)

---

## 🔄 Error Recovery

### What Happens If Operation Fails?

**Scenario 1: Property update fails**
- User update won't happen
- Transaction rolled back (if using transactions)
- Error returned to client
- No notification sent

**Scenario 2: User update fails**
- Property already updated
- Data inconsistency (tenant removed from property but still linked)
- Error returned to client
- ⚠️ Manual intervention may be needed

**Scenario 3: Notification fails**
- Operation still succeeds
- Error logged but not returned to client
- Notification can be resent manually

**Recommendation:** Implement MongoDB transactions for production to ensure atomicity.

---

## 📈 Performance Metrics

### Expected Response Times

| Operation | Database Queries | Expected Time |
|-----------|-----------------|---------------|
| Tenant Unlink | 3 (1 read, 2 writes) | < 200ms |
| Owner Kick-Out | 4 (2 reads, 2 writes) | < 250ms |

### Optimizations Applied
- ✅ Using array filters instead of full document replacement
- ✅ Single query for property ownership verification
- ✅ Notifications sent asynchronously (don't block response)
- ✅ Indexed fields used for queries (userId, propertyId)

---

**This flow diagram provides a complete visual understanding of the implementation.**

