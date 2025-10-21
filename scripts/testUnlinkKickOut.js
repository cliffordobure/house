/**
 * Test Script for Tenant Unlink & Owner Kick-Out Functionality
 * 
 * This script tests the following scenarios:
 * 1. Tenant successfully unlinks from property
 * 2. Owner successfully kicks out tenant
 * 3. Error cases and validation
 * 
 * Usage: node scripts/testUnlinkKickOut.js
 */

const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

// Test credentials (update these with actual test accounts)
const testCredentials = {
  tenant: {
    email: 'tenant@test.com',
    password: 'password123',
  },
  owner: {
    email: 'owner@test.com',
    password: 'password123',
  },
};

let tenantToken = null;
let ownerToken = null;
let propertyId = null;
let tenantId = null;

// Helper function to login
async function login(email, password) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password,
    });
    return response.data.token;
  } catch (error) {
    console.error(`Login failed for ${email}:`, error.response?.data?.message || error.message);
    throw error;
  }
}

// Test 1: Tenant Unlink Property
async function testTenantUnlink() {
  console.log('\n📝 Test 1: Tenant Unlink Property');
  console.log('='.repeat(50));

  try {
    const response = await axios.post(
      `${API_BASE_URL}/tenants/unlink`,
      {
        reason: 'Moving to a new apartment',
      },
      {
        headers: {
          Authorization: `Bearer ${tenantToken}`,
        },
      }
    );

    console.log('✅ Test Passed: Tenant successfully unlinked');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Test Failed:', error.response?.data?.message || error.message);
    console.error('Error details:', error.response?.data);
    return false;
  }
}

// Test 2: Tenant Unlink When Not Linked
async function testTenantUnlinkWhenNotLinked() {
  console.log('\n📝 Test 2: Tenant Unlink When Not Linked (Expected to Fail)');
  console.log('='.repeat(50));

  try {
    const response = await axios.post(
      `${API_BASE_URL}/tenants/unlink`,
      {
        reason: 'Testing error case',
      },
      {
        headers: {
          Authorization: `Bearer ${tenantToken}`,
        },
      }
    );

    console.log('❌ Test Failed: Should have received error');
    return false;
  } catch (error) {
    if (error.response?.data?.error === 'NO_LINKED_PROPERTY') {
      console.log('✅ Test Passed: Correct error returned');
      console.log('Error message:', error.response.data.message);
      return true;
    } else {
      console.error('❌ Test Failed: Wrong error type');
      console.error('Error:', error.response?.data);
      return false;
    }
  }
}

// Test 3: Owner Kick Out Tenant
async function testOwnerKickOut() {
  console.log('\n📝 Test 3: Owner Kick Out Tenant');
  console.log('='.repeat(50));

  if (!propertyId || !tenantId) {
    console.log('⏭️  Skipping: propertyId or tenantId not available');
    return false;
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/tenants/kick-out`,
      {
        tenantId: tenantId,
        propertyId: propertyId,
        reason: 'Lease violation - non-payment of rent',
      },
      {
        headers: {
          Authorization: `Bearer ${ownerToken}`,
        },
      }
    );

    console.log('✅ Test Passed: Tenant successfully kicked out');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Test Failed:', error.response?.data?.message || error.message);
    console.error('Error details:', error.response?.data);
    return false;
  }
}

// Test 4: Owner Kick Out Without Reason (Expected to Fail)
async function testOwnerKickOutNoReason() {
  console.log('\n📝 Test 4: Owner Kick Out Without Reason (Expected to Fail)');
  console.log('='.repeat(50));

  if (!propertyId || !tenantId) {
    console.log('⏭️  Skipping: propertyId or tenantId not available');
    return false;
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/tenants/kick-out`,
      {
        tenantId: tenantId,
        propertyId: propertyId,
        // No reason provided
      },
      {
        headers: {
          Authorization: `Bearer ${ownerToken}`,
        },
      }
    );

    console.log('❌ Test Failed: Should have required reason');
    return false;
  } catch (error) {
    if (error.response?.data?.message?.includes('required')) {
      console.log('✅ Test Passed: Correct validation error');
      console.log('Error message:', error.response.data.message);
      return true;
    } else {
      console.error('❌ Test Failed: Wrong error type');
      console.error('Error:', error.response?.data);
      return false;
    }
  }
}

// Test 5: Non-Owner Try to Kick Out Tenant (Expected to Fail)
async function testNonOwnerKickOut() {
  console.log('\n📝 Test 5: Non-Owner Try to Kick Out Tenant (Expected to Fail)');
  console.log('='.repeat(50));

  if (!propertyId || !tenantId) {
    console.log('⏭️  Skipping: propertyId or tenantId not available');
    return false;
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/tenants/kick-out`,
      {
        tenantId: tenantId,
        propertyId: propertyId,
        reason: 'Testing authorization',
      },
      {
        headers: {
          Authorization: `Bearer ${tenantToken}`,
        },
      }
    );

    console.log('❌ Test Failed: Tenant should not be able to kick out');
    return false;
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('✅ Test Passed: Authorization correctly denied');
      console.log('Error message:', error.response.data.message);
      return true;
    } else {
      console.error('❌ Test Failed: Wrong error type');
      console.error('Error:', error.response?.data);
      return false;
    }
  }
}

// Get property and tenant info for tests
async function setupTestData() {
  console.log('\n🔧 Setting up test data...');

  try {
    // Get tenant's property
    const tenantResponse = await axios.get(
      `${API_BASE_URL}/auth/me`,
      {
        headers: {
          Authorization: `Bearer ${tenantToken}`,
        },
      }
    );

    tenantId = tenantResponse.data.user._id;
    propertyId = tenantResponse.data.user.linkedProperty;

    console.log('Tenant ID:', tenantId);
    console.log('Property ID:', propertyId);

    if (!propertyId) {
      console.log('⚠️  Warning: Tenant not linked to any property');
      console.log('   Some tests will be skipped');
    }

    return true;
  } catch (error) {
    console.error('Failed to get test data:', error.response?.data || error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🧪 Starting Tenant Unlink & Kick-Out Tests');
  console.log('='.repeat(50));

  try {
    // Login as tenant
    console.log('\n🔐 Logging in as tenant...');
    tenantToken = await login(testCredentials.tenant.email, testCredentials.tenant.password);
    console.log('✅ Tenant logged in');

    // Login as owner
    console.log('\n🔐 Logging in as owner...');
    ownerToken = await login(testCredentials.owner.email, testCredentials.owner.password);
    console.log('✅ Owner logged in');

    // Setup test data
    await setupTestData();

    // Run tests
    const results = [];

    results.push({
      name: 'Tenant Unlink Property',
      passed: await testTenantUnlink(),
    });

    results.push({
      name: 'Tenant Unlink When Not Linked',
      passed: await testTenantUnlinkWhenNotLinked(),
    });

    results.push({
      name: 'Owner Kick Out Tenant',
      passed: await testOwnerKickOut(),
    });

    results.push({
      name: 'Owner Kick Out Without Reason',
      passed: await testOwnerKickOutNoReason(),
    });

    results.push({
      name: 'Non-Owner Try to Kick Out',
      passed: await testNonOwnerKickOut(),
    });

    // Print summary
    console.log('\n📊 Test Summary');
    console.log('='.repeat(50));

    const passedTests = results.filter((r) => r.passed).length;
    const totalTests = results.length;

    results.forEach((result, index) => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} Test ${index + 1}: ${result.name}`);
    });

    console.log('\n' + '='.repeat(50));
    console.log(`Passed: ${passedTests}/${totalTests}`);
    console.log(`Failed: ${totalTests - passedTests}/${totalTests}`);

    if (passedTests === totalTests) {
      console.log('\n🎉 All tests passed!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some tests failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests();

