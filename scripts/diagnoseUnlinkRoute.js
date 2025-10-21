/**
 * Diagnostic Script for Tenant Unlink Route Issue
 * 
 * This script helps diagnose why the mobile app is getting "Route not found"
 * when trying to unlink from a property.
 * 
 * Usage: node scripts/diagnoseUnlinkRoute.js
 */

const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

console.log('🔍 Diagnosing Tenant Unlink Route Issue');
console.log('='.repeat(50));

// Test 1: Check if server is running
async function testServerHealth() {
  console.log('\n1. Testing server health...');
  try {
    const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/`);
    console.log('✅ Server is running');
    console.log('Response:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Server is not running or not accessible');
    console.log('Error:', error.message);
    console.log('URL tried:', `${API_BASE_URL.replace('/api', '')}/`);
    return false;
  }
}

// Test 2: Check if tenant routes are accessible
async function testTenantRoutes() {
  console.log('\n2. Testing tenant routes accessibility...');
  
  try {
    // Test without authentication (should get 401)
    const response = await axios.post(`${API_BASE_URL}/tenants/unlink`, {
      reason: 'test'
    });
    console.log('❌ Route should require authentication');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Route exists and requires authentication');
      console.log('Status:', error.response.status);
      console.log('Message:', error.response.data.message);
      return true;
    } else if (error.response?.status === 404) {
      console.log('❌ Route not found (404)');
      console.log('This means the route is not properly registered');
      return false;
    } else {
      console.log('⚠️ Unexpected error:', error.response?.status);
      console.log('Error:', error.response?.data);
      return false;
    }
  }
}

// Test 3: Check route registration
async function testRouteRegistration() {
  console.log('\n3. Testing route registration...');
  
  const routes = [
    '/api/tenants/unlink',
    '/api/tenants/kick-out',
    '/api/tenants/property/test',
    '/api/tenants/user-property/test',
    '/api/tenants/test'
  ];
  
  for (const route of routes) {
    try {
      const response = await axios.get(`${API_BASE_URL.replace('/api', '')}${route}`);
      console.log(`✅ ${route} - accessible`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log(`✅ ${route} - exists (requires auth)`);
      } else if (error.response?.status === 404) {
        console.log(`❌ ${route} - not found`);
      } else {
        console.log(`⚠️ ${route} - status: ${error.response?.status}`);
      }
    }
  }
}

// Test 4: Check with valid authentication
async function testWithAuth() {
  console.log('\n4. Testing with authentication...');
  
  // You need to provide a valid tenant token here
  const tenantToken = process.env.TEST_TENANT_TOKEN;
  
  if (!tenantToken) {
    console.log('⚠️ No TEST_TENANT_TOKEN provided in .env');
    console.log('To test with auth, add TEST_TENANT_TOKEN=your_token to .env');
    return false;
  }
  
  try {
    const response = await axios.post(`${API_BASE_URL}/tenants/unlink`, {
      reason: 'Diagnostic test'
    }, {
      headers: {
        'Authorization': `Bearer ${tenantToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Unlink request successful');
    console.log('Response:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Unlink request failed');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data);
    return false;
  }
}

// Test 5: Check mobile app URL format
function checkMobileAppURL() {
  console.log('\n5. Checking mobile app URL format...');
  
  console.log('Expected mobile app URLs:');
  console.log('✅ POST /api/tenants/unlink');
  console.log('✅ POST /api/tenants/kick-out');
  
  console.log('\nCommon mobile app mistakes:');
  console.log('❌ POST /api/properties/unlink (wrong - this doesn\'t exist)');
  console.log('❌ POST /api/tenant/unlink (wrong - missing \'s\')');
  console.log('❌ GET /api/tenants/unlink (wrong - should be POST)');
  console.log('❌ POST /tenants/unlink (wrong - missing /api)');
  
  console.log('\nCheck your mobile app code for:');
  console.log('- Base URL configuration');
  console.log('- Endpoint path');
  console.log('- HTTP method (POST)');
  console.log('- Authorization header');
}

// Main diagnostic function
async function runDiagnostics() {
  console.log(`Testing against: ${API_BASE_URL}`);
  
  const results = [];
  
  results.push({
    test: 'Server Health',
    passed: await testServerHealth()
  });
  
  results.push({
    test: 'Tenant Routes',
    passed: await testTenantRoutes()
  });
  
  await testRouteRegistration();
  
  results.push({
    test: 'With Authentication',
    passed: await testWithAuth()
  });
  
  checkMobileAppURL();
  
  // Summary
  console.log('\n📊 Diagnostic Summary');
  console.log('='.repeat(50));
  
  results.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} Test ${index + 1}: ${result.test}`);
  });
  
  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  
  console.log(`\nPassed: ${passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! The issue is likely in the mobile app configuration.');
    console.log('\nNext steps:');
    console.log('1. Check mobile app base URL');
    console.log('2. Verify endpoint path: /api/tenants/unlink');
    console.log('3. Ensure HTTP method is POST');
    console.log('4. Check Authorization header format');
  } else {
    console.log('\n⚠️ Some tests failed. Check server configuration.');
  }
}

// Run diagnostics
runDiagnostics().catch(console.error);


