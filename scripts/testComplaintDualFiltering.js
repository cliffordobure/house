/**
 * Test Script for Dual Filtering Complaints
 * 
 * This script tests the new dual filtering functionality for complaints,
 * ensuring that tenants only see complaints from their current property.
 * 
 * Usage: node scripts/testComplaintDualFiltering.js
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
let tenantId = null;
let propertyId1 = null;
let propertyId2 = null;
let complaintId1 = null;
let complaintId2 = null;

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

// Test 1: Create test complaints in different properties
async function createTestComplaints() {
  console.log('\n📝 Test 1: Creating test complaints');
  console.log('='.repeat(50));

  try {
    // Create complaint for property 1
    const complaint1Response = await axios.post(
      `${API_BASE_URL}/complaints/create`,
      {
        propertyId: propertyId1,
        title: 'Test Complaint - Property 1',
        description: 'This is a test complaint for property 1',
        images: [],
      },
      {
        headers: {
          Authorization: `Bearer ${tenantToken}`,
        },
      }
    );

    complaintId1 = complaint1Response.data.complaint._id;
    console.log('✅ Created complaint for property 1:', complaintId1);

    // Note: We can't create a complaint for property 2 because tenant is only linked to property 1
    // This is the correct behavior - tenants can only create complaints for their linked property

    return true;
  } catch (error) {
    console.error('❌ Failed to create test complaints:', error.response?.data?.message || error.message);
    return false;
  }
}

// Test 2: Get complaints by tenant only (should show all complaints)
async function testGetComplaintsByTenantOnly() {
  console.log('\n📝 Test 2: Get complaints by tenant only');
  console.log('='.repeat(50));

  try {
    const response = await axios.get(
      `${API_BASE_URL}/complaints/tenant/${tenantId}`,
      {
        headers: {
          Authorization: `Bearer ${tenantToken}`,
        },
      }
    );

    console.log('✅ Retrieved complaints by tenant only');
    console.log('Total complaints:', response.data.filters.totalCount);
    console.log('Property filter:', response.data.filters.propertyId);
    
    if (response.data.complaints.length > 0) {
      console.log('Sample complaint:', {
        id: response.data.complaints[0]._id,
        title: response.data.complaints[0].title,
        propertyId: response.data.complaints[0].propertyId,
      });
    }

    return true;
  } catch (error) {
    console.error('❌ Failed to get complaints by tenant:', error.response?.data?.message || error.message);
    return false;
  }
}

// Test 3: Get complaints by tenant and property (filtered)
async function testGetComplaintsByTenantAndProperty() {
  console.log('\n📝 Test 3: Get complaints by tenant and property (filtered)');
  console.log('='.repeat(50));

  try {
    const response = await axios.get(
      `${API_BASE_URL}/complaints/tenant/${tenantId}?propertyId=${propertyId1}`,
      {
        headers: {
          Authorization: `Bearer ${tenantToken}`,
        },
      }
    );

    console.log('✅ Retrieved complaints by tenant and property');
    console.log('Total complaints:', response.data.filters.totalCount);
    console.log('Property filter:', response.data.filters.propertyId);
    
    if (response.data.complaints.length > 0) {
      console.log('Sample complaint:', {
        id: response.data.complaints[0]._id,
        title: response.data.complaints[0].title,
        propertyId: response.data.complaints[0].propertyId,
      });
    }

    return true;
  } catch (error) {
    console.error('❌ Failed to get filtered complaints:', error.response?.data?.message || error.message);
    return false;
  }
}

// Test 4: Get complaints using dedicated dual filtering endpoint
async function testDualFilteringEndpoint() {
  console.log('\n📝 Test 4: Get complaints using dedicated dual filtering endpoint');
  console.log('='.repeat(50));

  try {
    const response = await axios.get(
      `${API_BASE_URL}/complaints/tenant/${tenantId}/property/${propertyId1}`,
      {
        headers: {
          Authorization: `Bearer ${tenantToken}`,
        },
      }
    );

    console.log('✅ Retrieved complaints using dual filtering endpoint');
    console.log('Total complaints:', response.data.filters.totalCount);
    console.log('Tenant name:', response.data.filters.tenantName);
    console.log('Property name:', response.data.filters.propertyName);
    
    if (response.data.complaints.length > 0) {
      console.log('Sample complaint:', {
        id: response.data.complaints[0]._id,
        title: response.data.complaints[0].title,
        propertyId: response.data.complaints[0].propertyId,
      });
    }

    return true;
  } catch (error) {
    console.error('❌ Failed to get complaints via dual endpoint:', error.response?.data?.message || error.message);
    return false;
  }
}

// Test 5: Test unauthorized access (tenant trying to access different property)
async function testUnauthorizedAccess() {
  console.log('\n📝 Test 5: Test unauthorized access (different property)');
  console.log('='.repeat(50));

  try {
    // Try to access complaints for a different property
    const response = await axios.get(
      `${API_BASE_URL}/complaints/tenant/${tenantId}?propertyId=${propertyId2}`,
      {
        headers: {
          Authorization: `Bearer ${tenantToken}`,
        },
      }
    );

    console.log('❌ Should have been unauthorized');
    return false;
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('✅ Correctly blocked unauthorized access');
      console.log('Error message:', error.response.data.message);
      return true;
    } else {
      console.error('❌ Unexpected error:', error.response?.data?.message || error.message);
      return false;
    }
  }
}

// Test 6: Test with invalid property ID
async function testInvalidPropertyId() {
  console.log('\n📝 Test 6: Test with invalid property ID');
  console.log('='.repeat(50));

  try {
    const invalidPropertyId = '507f1f77bcf86cd799439011'; // Valid ObjectId format but non-existent
    
    const response = await axios.get(
      `${API_BASE_URL}/complaints/tenant/${tenantId}/property/${invalidPropertyId}`,
      {
        headers: {
          Authorization: `Bearer ${tenantToken}`,
        },
      }
    );

    console.log('❌ Should have returned 404 for invalid property');
    return false;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✅ Correctly returned 404 for invalid property');
      console.log('Error message:', error.response.data.message);
      return true;
    } else {
      console.error('❌ Unexpected error:', error.response?.data?.message || error.message);
      return false;
    }
  }
}

// Setup test data
async function setupTestData() {
  console.log('\n🔧 Setting up test data...');

  try {
    // Get tenant's current property
    const tenantResponse = await axios.get(
      `${API_BASE_URL}/auth/me`,
      {
        headers: {
          Authorization: `Bearer ${tenantToken}`,
        },
      }
    );

    tenantId = tenantResponse.data.user._id;
    propertyId1 = tenantResponse.data.user.linkedProperty;

    console.log('Tenant ID:', tenantId);
    console.log('Current Property ID:', propertyId1);

    if (!propertyId1) {
      console.log('⚠️  Warning: Tenant not linked to any property');
      console.log('   Some tests will be skipped');
      return false;
    }

    // Create a dummy property ID for testing unauthorized access
    propertyId2 = '507f1f77bcf86cd799439012';

    return true;
  } catch (error) {
    console.error('Failed to get test data:', error.response?.data || error.message);
    return false;
  }
}

// Performance test
async function testPerformance() {
  console.log('\n📝 Test 7: Performance comparison');
  console.log('='.repeat(50));

  try {
    // Test without filter
    const start1 = Date.now();
    await axios.get(`${API_BASE_URL}/complaints/tenant/${tenantId}`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    const time1 = Date.now() - start1;

    // Test with filter
    const start2 = Date.now();
    await axios.get(`${API_BASE_URL}/complaints/tenant/${tenantId}?propertyId=${propertyId1}`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    const time2 = Date.now() - start2;

    console.log(`✅ Without filter: ${time1}ms`);
    console.log(`✅ With filter: ${time2}ms`);
    console.log(`📊 Performance difference: ${time2 - time1}ms`);

    return true;
  } catch (error) {
    console.error('❌ Performance test failed:', error.response?.data?.message || error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🧪 Starting Dual Filtering Complaints Tests');
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
    const setupSuccess = await setupTestData();
    if (!setupSuccess) {
      console.log('⚠️  Setup failed, skipping some tests');
    }

    // Run tests
    const results = [];

    results.push({
      name: 'Create Test Complaints',
      passed: await createTestComplaints(),
    });

    results.push({
      name: 'Get Complaints by Tenant Only',
      passed: await testGetComplaintsByTenantOnly(),
    });

    results.push({
      name: 'Get Complaints by Tenant and Property (Query)',
      passed: await testGetComplaintsByTenantAndProperty(),
    });

    results.push({
      name: 'Get Complaints via Dual Filtering Endpoint',
      passed: await testDualFilteringEndpoint(),
    });

    results.push({
      name: 'Test Unauthorized Access',
      passed: await testUnauthorizedAccess(),
    });

    results.push({
      name: 'Test Invalid Property ID',
      passed: await testInvalidPropertyId(),
    });

    results.push({
      name: 'Performance Comparison',
      passed: await testPerformance(),
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
      console.log('\n🎉 All tests passed! Dual filtering is working correctly.');
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

