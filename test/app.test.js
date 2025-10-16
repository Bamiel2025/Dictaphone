// Simple test to verify the application works correctly

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Test the server is running
async function testServer() {
  try {
    const response = await fetch('http://localhost:5001');
    const text = await response.text();
    
    if (text.includes('<title>Ticnote - Audio Transcription & Synthesis</title>')) {
      console.log('✓ Server is running correctly and serving the frontend');
      return true;
    } else {
      console.log('✗ Server is not returning expected HTML response');
      return false;
    }
  } catch (error) {
    console.log('✗ Server is not accessible:', error.message);
    return false;
  }
}

// Test upload endpoint (without authentication since we removed it)
async function testUploadEndpoint() {
  try {
    const response = await fetch('http://localhost:5001/upload', {
      method: 'POST',
    });
    
    // Now that authentication is removed, we expect a different response
    if (response.status === 400) {
      console.log('✓ Upload endpoint works correctly (no file uploaded)');
      return true;
    } else {
      console.log('✗ Upload endpoint should return 400 when no file is uploaded');
      return false;
    }
  } catch (error) {
    console.log('✗ Upload endpoint error:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('Running Ticnote application tests...\n');
  
  // Test 1: Server running
  const serverOk = await testServer();
  if (!serverOk) {
    console.log('\nTests failed: Server is not running properly');
    return;
  }
  
  // Test 2: Upload endpoint
  const uploadOk = await testUploadEndpoint();
  if (!uploadOk) {
    console.log('\nTests failed: Upload endpoint not working correctly');
    return;
  }
  
  console.log('\n✓ All tests passed! The application is working correctly.');
  console.log('\nYou can now access the application at http://localhost:5001');
  console.log('The application no longer requires authentication for personal use.');
}

// Run the tests
runTests();