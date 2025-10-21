# Mobile UI Guide - B2B Disbursement Features

This guide outlines the mobile UI components and screens needed to support the new automated disbursement system.

---

## 📱 UI Components by User Role

### 🏠 Property Owner Views (PRIORITY)

Property owners need the most UI updates since they're receiving disbursements.

---

## 1. Owner Dashboard - Disbursement Summary Card

**Location:** Owner home screen / dashboard

**Purpose:** Quick overview of disbursements

**Design:**
```
┌─────────────────────────────────────────────────┐
│  💰 Disbursements This Month                    │
├─────────────────────────────────────────────────┤
│                                                 │
│   Total Received        KES 285,000             │
│   Pending               KES 19,500 (2)          │
│   Platform Fees         KES 15,000              │
│                                                 │
│   [View All Disbursements →]                    │
└─────────────────────────────────────────────────┘
```

**API Call:**
```javascript
GET /api/payments/disbursements/owner

// Response includes summary object:
{
  "summary": {
    "totalDisbursed": 285000,
    "totalPlatformFees": 15000,
    "pendingDisbursements": 2,
    "failedDisbursements": 0
  }
}
```

**Implementation (React Native Example):**
```jsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const DisbursementSummaryCard = ({ navigation }) => {
  const [summary, setSummary] = useState(null);
  
  useEffect(() => {
    fetchDisbursementSummary();
  }, []);
  
  const fetchDisbursementSummary = async () => {
    const response = await api.get('/payments/disbursements/owner');
    setSummary(response.data.summary);
  };
  
  return (
    <View style={styles.card}>
      <Text style={styles.title}>💰 Disbursements This Month</Text>
      
      <View style={styles.row}>
        <Text style={styles.label}>Total Received</Text>
        <Text style={styles.amount}>KES {summary?.totalDisbursed?.toLocaleString()}</Text>
      </View>
      
      {summary?.pendingDisbursements > 0 && (
        <View style={styles.row}>
          <Text style={styles.label}>Pending</Text>
          <Text style={styles.pending}>
            ({summary.pendingDisbursements}) processing
          </Text>
        </View>
      )}
      
      <View style={styles.row}>
        <Text style={styles.label}>Platform Fees</Text>
        <Text style={styles.fee}>KES {summary?.totalPlatformFees?.toLocaleString()}</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('DisbursementHistory')}
      >
        <Text style={styles.buttonText}>View All Disbursements →</Text>
      </TouchableOpacity>
    </View>
  );
};
```

---

## 2. Owner - Disbursement History Screen

**Location:** New screen (Owner menu → Disbursements)

**Purpose:** View all disbursement transactions

**Design:**
```
┌─────────────────────────────────────────────────┐
│  ← Disbursement History                         │
├─────────────────────────────────────────────────┤
│  Filter: [All ▼] [This Month ▼]                │
├─────────────────────────────────────────────────┤
│                                                 │
│  ✅ Sunset Apartments - Unit 12                 │
│     John Doe                                    │
│     Dec 15, 2023 10:30 AM                      │
│     KES 9,500 (Fee: KES 500)                   │
│     Txn: QAB123456                             │
│     To: Paybill 123456 - ACC PROP001           │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  ⏳ Palm View Estate - Unit 5                   │
│     Jane Smith                                  │
│     Dec 15, 2023 11:45 AM                      │
│     KES 14,250 (Fee: KES 750)                  │
│     Status: Processing...                       │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  ❌ Marina Towers - Unit 8                      │
│     Bob Johnson                                 │
│     Dec 14, 2023 03:20 PM                      │
│     KES 19,000 (Fee: KES 1,000)                │
│     Failed: Invalid paybill                     │
│     [Retry Disbursement]                        │
│                                                 │
└─────────────────────────────────────────────────┘
```

**API Call:**
```javascript
GET /api/payments/disbursements/owner
```

**Implementation:**
```jsx
const DisbursementHistoryScreen = () => {
  const [disbursements, setDisbursements] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchDisbursements();
  }, []);
  
  const fetchDisbursements = async () => {
    const response = await api.get('/payments/disbursements/owner');
    setDisbursements(response.data.disbursements);
    setLoading(false);
  };
  
  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': return '✅';
      case 'processing': return '⏳';
      case 'failed': return '❌';
      case 'pending': return '⏸️';
      default: return '•';
    }
  };
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return '#4CAF50';
      case 'processing': return '#FF9800';
      case 'failed': return '#F44336';
      case 'pending': return '#2196F3';
      default: return '#9E9E9E';
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <FlatList
        data={disbursements}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <DisbursementItem 
            item={item}
            onRetry={handleRetry}
          />
        )}
      />
    </ScrollView>
  );
};

const DisbursementItem = ({ item, onRetry }) => {
  return (
    <View style={styles.item}>
      <View style={styles.header}>
        <Text style={styles.statusIcon}>
          {getStatusIcon(item.disbursementStatus)}
        </Text>
        <View style={styles.details}>
          <Text style={styles.property}>{item.propertyName}</Text>
          <Text style={styles.tenant}>{item.tenantName}</Text>
          <Text style={styles.date}>
            {new Date(item.disbursementDate).toLocaleString()}
          </Text>
        </View>
      </View>
      
      <View style={styles.amounts}>
        <Text style={styles.amount}>
          KES {item.disbursementAmount?.toLocaleString()}
        </Text>
        <Text style={styles.fee}>
          (Fee: KES {item.platformFee?.toLocaleString()})
        </Text>
      </View>
      
      {item.disbursementStatus === 'completed' && (
        <Text style={styles.txnId}>Txn: {item.disbursementTransactionId}</Text>
      )}
      
      {item.disbursementStatus === 'processing' && (
        <Text style={styles.processing}>Status: Processing...</Text>
      )}
      
      {item.disbursementStatus === 'failed' && (
        <>
          <Text style={styles.error}>
            Failed: {item.disbursementFailureReason}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => onRetry(item._id)}
          >
            <Text style={styles.retryText}>Retry Disbursement</Text>
          </TouchableOpacity>
        </>
      )}
      
      <Text style={styles.paybillInfo}>
        To: Paybill {item.ownerPaybill} - ACC {item.ownerAccountNumber}
      </Text>
    </View>
  );
};
```

---

## 3. Owner - Payment Detail Screen (Enhanced)

**Location:** When owner clicks on a payment from their property

**Purpose:** Show disbursement status for a specific payment

**Enhancement:**
```
┌─────────────────────────────────────────────────┐
│  ← Payment Details                              │
├─────────────────────────────────────────────────┤
│                                                 │
│  Payment Information                            │
│  ─────────────────────────────────────────      │
│  Tenant: John Doe                               │
│  Property: Sunset Apartments                    │
│  Amount Paid: KES 10,000                        │
│  Date: Dec 15, 2023 10:15 AM                   │
│  Payment Status: ✅ Successful                  │
│  Txn ID: QAB987654                             │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  💰 Disbursement Information                    │
│  ─────────────────────────────────────────      │
│  Status: ✅ Completed                           │
│  Amount Received: KES 9,500                     │
│  Platform Fee: KES 500 (5%)                    │
│  Disbursed On: Dec 15, 2023 10:30 AM          │
│  Disbursement Txn: QAB123456                   │
│                                                 │
│  Sent to:                                       │
│  Paybill: 123456                               │
│  Account: PROP001                              │
│                                                 │
└─────────────────────────────────────────────────┘
```

**API Call:**
```javascript
GET /api/payments/disbursement-status/:paymentId
```

**Implementation:**
```jsx
const PaymentDetailScreen = ({ route }) => {
  const { paymentId } = route.params;
  const [disbursement, setDisbursement] = useState(null);
  
  useEffect(() => {
    fetchDisbursementStatus();
  }, []);
  
  const fetchDisbursementStatus = async () => {
    const response = await api.get(`/payments/disbursement-status/${paymentId}`);
    setDisbursement(response.data.disbursement);
  };
  
  return (
    <ScrollView style={styles.container}>
      {/* ... Payment Information section ... */}
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💰 Disbursement Information</Text>
        
        <InfoRow 
          label="Status" 
          value={getStatusDisplay(disbursement.status)}
          valueColor={getStatusColor(disbursement.status)}
        />
        
        <InfoRow 
          label="Amount Received" 
          value={`KES ${disbursement.disbursementAmount?.toLocaleString()}`}
          highlight
        />
        
        <InfoRow 
          label="Platform Fee" 
          value={`KES ${disbursement.platformFee?.toLocaleString()} (5%)`}
        />
        
        {disbursement.status === 'completed' && (
          <>
            <InfoRow 
              label="Disbursed On" 
              value={new Date(disbursement.date).toLocaleString()}
            />
            <InfoRow 
              label="Disbursement Txn" 
              value={disbursement.transactionId}
            />
          </>
        )}
        
        <View style={styles.paybillBox}>
          <Text style={styles.paybillLabel}>Sent to:</Text>
          <Text style={styles.paybillValue}>
            Paybill: {disbursement.ownerPaybill}
          </Text>
          <Text style={styles.paybillValue}>
            Account: {disbursement.ownerAccountNumber}
          </Text>
        </View>
        
        {disbursement.status === 'failed' && (
          <>
            <Text style={styles.error}>
              Error: {disbursement.failureReason}
            </Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={handleRetry}
            >
              <Text style={styles.retryText}>Retry Disbursement</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
};
```

---

## 4. Owner - Settings Screen (Enhanced)

**Location:** Owner Settings / Profile

**Purpose:** Show and manage paybill information

**Addition:**
```
┌─────────────────────────────────────────────────┐
│  ← Settings                                     │
├─────────────────────────────────────────────────┤
│                                                 │
│  Payment Settings                               │
│  ─────────────────────────────────────────      │
│                                                 │
│  Your Paybill Information                       │
│  (Used for rent disbursements)                  │
│                                                 │
│  Paybill Number: 123456                        │
│  Account Number: PROP001                        │
│                                                 │
│  ℹ️ Rent payments are automatically sent to     │
│     this paybill after deducting 5% platform   │
│     fee. Update paybill details when adding    │
│     new properties.                             │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 5. Property Creation/Edit (Enhanced for Owner)

**Location:** Add/Edit Property screen

**Purpose:** Owner enters their paybill for disbursements

**Enhancement:**
```
┌─────────────────────────────────────────────────┐
│  ← Add New Property                             │
├─────────────────────────────────────────────────┤
│                                                 │
│  Property Name                                  │
│  [_____________________]                        │
│                                                 │
│  Location                                       │
│  [_____________________]                        │
│                                                 │
│  Monthly Rent (KES)                            │
│  [_____________________]                        │
│                                                 │
│  💳 Payment Details (Required)                  │
│  ─────────────────────────────────────────      │
│                                                 │
│  Your Paybill Number *                         │
│  [_____________________]                        │
│  Where rent payments will be sent              │
│                                                 │
│  Your Account Number *                         │
│  [_____________________]                        │
│  Account reference for this property            │
│                                                 │
│  ℹ️ Tenants pay to the platform, then we       │
│     automatically send 95% to your paybill.    │
│     (5% platform fee)                           │
│                                                 │
│  Property Code                                  │
│  [_____________________]                        │
│                                                 │
│  [Save Property]                                │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Validation:**
```javascript
const validatePropertyForm = (formData) => {
  const errors = {};
  
  if (!formData.paybill) {
    errors.paybill = 'Paybill number is required';
  } else if (!/^\d{5,7}$/.test(formData.paybill)) {
    errors.paybill = 'Paybill must be 5-7 digits';
  }
  
  if (!formData.accountNumber) {
    errors.accountNumber = 'Account number is required';
  } else if (formData.accountNumber.length < 3) {
    errors.accountNumber = 'Account number must be at least 3 characters';
  }
  
  return errors;
};
```

---

## 6. Tenant Payment Screen (Optional Enhancement)

**Location:** Tenant payment confirmation screen

**Purpose:** Show payment breakdown transparency

**Enhancement (Optional):**
```
┌─────────────────────────────────────────────────┐
│  ← Confirm Payment                              │
├─────────────────────────────────────────────────┤
│                                                 │
│  Property: Sunset Apartments                    │
│  Rent Amount: KES 10,000                        │
│  Phone: 0712345678                             │
│                                                 │
│  💡 Payment Breakdown                           │
│  ─────────────────────────────────────────      │
│  Total Payment:        KES 10,000               │
│  To Landlord:          KES 9,500                │
│  Platform Fee:         KES 500 (5%)             │
│                                                 │
│  ℹ️ Your landlord receives 95% automatically   │
│                                                 │
│  [Confirm & Pay]                                │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Note:** This is optional - showing fee breakdown to tenants for transparency.

---

## 7. Admin Dashboard (New)

**Location:** Admin panel

**Purpose:** Monitor disbursement health

**Design:**
```
┌─────────────────────────────────────────────────┐
│  Admin Dashboard                                │
├─────────────────────────────────────────────────┤
│                                                 │
│  📊 Disbursement Health                         │
│  ─────────────────────────────────────────      │
│  Success Rate: 98.5%                           │
│  Avg Time: 2m 15s                              │
│  Failed Today: 2                               │
│  Pending: 5                                     │
│                                                 │
│  [Retry Failed Disbursements]                   │
│  [View All Disbursements]                       │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  💰 Platform Revenue                            │
│  ─────────────────────────────────────────      │
│  Today:        KES 15,500                       │
│  This Week:    KES 87,000                       │
│  This Month:   KES 340,000                      │
│                                                 │
└─────────────────────────────────────────────────┘
```

**API Call:**
```javascript
// You'll need to create this endpoint
GET /api/admin/disbursement-stats
```

---

## 🔔 Push Notifications

### For Property Owners

**1. Disbursement Successful**
```json
{
  "title": "💰 Payment Received",
  "body": "KES 9,500 sent to your paybill for John Doe's rent",
  "data": {
    "type": "disbursement_received",
    "paymentId": "...",
    "amount": "9500"
  }
}
```

**2. Disbursement Failed**
```json
{
  "title": "⚠️ Disbursement Failed",
  "body": "Payment from Jane Smith couldn't be sent to your paybill. Tap to retry.",
  "data": {
    "type": "disbursement_failed",
    "paymentId": "...",
    "reason": "..."
  }
}
```

**Implementation:**
```javascript
// Handle notification tap
const handleNotificationPress = (notification) => {
  if (notification.data.type === 'disbursement_received') {
    navigation.navigate('PaymentDetail', { 
      paymentId: notification.data.paymentId 
    });
  } else if (notification.data.type === 'disbursement_failed') {
    navigation.navigate('PaymentDetail', { 
      paymentId: notification.data.paymentId,
      showRetry: true
    });
  }
};
```

---

## 📱 Additional UI Components

### Status Badge Component

```jsx
const StatusBadge = ({ status }) => {
  const config = {
    completed: { icon: '✅', text: 'Completed', color: '#4CAF50' },
    processing: { icon: '⏳', text: 'Processing', color: '#FF9800' },
    failed: { icon: '❌', text: 'Failed', color: '#F44336' },
    pending: { icon: '⏸️', text: 'Pending', color: '#2196F3' },
  };
  
  const { icon, text, color } = config[status] || config.pending;
  
  return (
    <View style={[styles.badge, { backgroundColor: color + '20' }]}>
      <Text style={styles.badgeIcon}>{icon}</Text>
      <Text style={[styles.badgeText, { color }]}>{text}</Text>
    </View>
  );
};
```

### Retry Button Component

```jsx
const RetryDisbursementButton = ({ paymentId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  
  const handleRetry = async () => {
    setLoading(true);
    try {
      await api.post(`/payments/disburse/${paymentId}`);
      Alert.alert('Success', 'Disbursement retry initiated');
      onSuccess?.();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <TouchableOpacity 
      style={styles.retryButton}
      onPress={handleRetry}
      disabled={loading}
    >
      <Text style={styles.retryText}>
        {loading ? 'Retrying...' : 'Retry Disbursement'}
      </Text>
    </TouchableOpacity>
  );
};
```

---

## 🎨 Styling Recommendations

```javascript
const styles = StyleSheet.create({
  // Disbursement card
  disbursementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Status colors
  statusCompleted: '#4CAF50',
  statusProcessing: '#FF9800',
  statusFailed: '#F44336',
  statusPending: '#2196F3',
  
  // Amount displays
  amountLarge: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  
  feeText: {
    fontSize: 14,
    color: '#7F8C8D',
    fontStyle: 'italic',
  },
  
  // Retry button
  retryButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
  },
  
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
});
```

---

## 🔄 Real-time Updates

### Polling for Status Updates

```javascript
const useDisbursementPolling = (paymentId) => {
  const [status, setStatus] = useState(null);
  
  useEffect(() => {
    if (!paymentId) return;
    
    const pollStatus = async () => {
      const response = await api.get(`/payments/disbursement-status/${paymentId}`);
      setStatus(response.data.disbursement.status);
      
      // Stop polling once completed or failed
      if (['completed', 'failed'].includes(response.data.disbursement.status)) {
        clearInterval(interval);
      }
    };
    
    // Poll every 10 seconds for processing status
    const interval = setInterval(pollStatus, 10000);
    pollStatus(); // Initial call
    
    return () => clearInterval(interval);
  }, [paymentId]);
  
  return status;
};

// Usage
const PaymentDetailScreen = ({ paymentId }) => {
  const disbursementStatus = useDisbursementPolling(paymentId);
  
  return (
    <View>
      <StatusBadge status={disbursementStatus} />
      {disbursementStatus === 'processing' && (
        <Text>Your disbursement is being processed...</Text>
      )}
    </View>
  );
};
```

---

## 📋 UI Implementation Checklist

### Priority 1 (Essential for Owners)
- [ ] Owner Dashboard - Disbursement Summary Card
- [ ] Owner - Disbursement History Screen
- [ ] Owner - Enhanced Payment Detail with disbursement info
- [ ] Owner - Property creation with paybill/account fields
- [ ] Status Badge Component
- [ ] Retry Disbursement Button
- [ ] Push notifications for disbursement success/failure

### Priority 2 (Nice to Have)
- [ ] Owner Settings - Paybill management
- [ ] Tenant - Payment breakdown display (transparency)
- [ ] Real-time status polling
- [ ] Filter/search in disbursement history
- [ ] Export disbursement statement (PDF/CSV)

### Priority 3 (Admin Only)
- [ ] Admin Dashboard - Disbursement health monitoring
- [ ] Admin - Bulk retry failed disbursements
- [ ] Admin - Platform revenue analytics

---

## 🚀 Implementation Strategy

### Phase 1: Core Owner Features (Week 1)
1. Add paybill/account fields to property creation
2. Create disbursement history screen
3. Add status badges and basic styling
4. Implement push notifications

### Phase 2: Enhanced Details (Week 2)
5. Enhance payment detail screen with disbursement info
6. Add retry functionality
7. Implement real-time status updates
8. Add disbursement summary to dashboard

### Phase 3: Polish & Admin (Week 3)
9. Add filters and search
10. Create admin monitoring dashboard
11. Implement export functionality
12. Add tenant payment breakdown (optional)

---

## 💡 UX Best Practices

1. **Clear Status Indicators**
   - Use colors consistently (green = success, orange = processing, red = failed)
   - Show icons for quick visual recognition
   - Display timestamps for all status changes

2. **Transparency**
   - Always show platform fee clearly
   - Show where money is going (paybill + account)
   - Display transaction IDs for reference

3. **Error Handling**
   - Make retry buttons prominent for failed disbursements
   - Explain why disbursement failed in plain language
   - Provide support contact for persistent issues

4. **Performance**
   - Paginate disbursement history (20-50 per page)
   - Cache summary data locally
   - Use pull-to-refresh for updates

5. **Accessibility**
   - Use semantic labels for screen readers
   - Ensure sufficient color contrast
   - Support large text sizes

---

## 📞 Support Integration

Add a support contact option for disbursement issues:

```jsx
const DisbursementHelpButton = () => {
  const handleContactSupport = () => {
    Alert.alert(
      'Disbursement Support',
      'How would you like to get help?',
      [
        { text: 'Call Support', onPress: () => Linking.openURL('tel:+254700000000') },
        { text: 'Email Support', onPress: () => Linking.openURL('mailto:support@yourapp.com') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };
  
  return (
    <TouchableOpacity onPress={handleContactSupport}>
      <Text>Need help with disbursements?</Text>
    </TouchableOpacity>
  );
};
```

---

## ✅ Summary

**Key UI Additions Needed:**

1. **For Owners (Essential):**
   - Disbursement history screen
   - Summary dashboard widget
   - Enhanced payment details
   - Paybill entry in property creation
   - Retry failed disbursements button

2. **For All Users:**
   - Push notification handling
   - Status indicators/badges
   - Real-time status updates

3. **Optional/Nice to Have:**
   - Payment breakdown for tenants
   - Admin monitoring dashboard
   - Export functionality

**Estimated Development Time:** 2-3 weeks for all features

Start with Priority 1 items to get the core functionality working, then add enhancements based on user feedback!




