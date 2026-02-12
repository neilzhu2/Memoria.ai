/**
 * Setup Supabase Storage bucket for audio recordings
 * Run with: node scripts/setup-storage.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorage() {
  console.log('Setting up Supabase Storage...\n');
  console.log('Supabase URL:', supabaseUrl);

  // Check if bucket exists by trying to list files
  console.log('\n1. Checking if "recordings" bucket exists...');
  const { data: files, error: listError } = await supabase.storage
    .from('recordings')
    .list('', { limit: 1 });

  if (listError) {
    if (listError.message.includes('not found') || listError.message.includes('Bucket not found')) {
      console.log('   Bucket does not exist. Attempting to create...');

      // Try to create the bucket
      const { data, error: createError } = await supabase.storage.createBucket('recordings', {
        public: true,
        fileSizeLimit: 52428800, // 50MB limit
        allowedMimeTypes: ['audio/*']
      });

      if (createError) {
        console.error('\n   ERROR: Could not create bucket:', createError.message);
        console.log('\n   This usually means the anon key lacks admin permissions.');
        console.log('   Please create the bucket manually in Supabase Dashboard:');
        console.log('   1. Go to https://supabase.com/dashboard');
        console.log('   2. Select your project');
        console.log('   3. Go to Storage in the left sidebar');
        console.log('   4. Click "New bucket"');
        console.log('   5. Name it "recordings"');
        console.log('   6. Enable "Public bucket"');
        console.log('   7. Click "Create bucket"');
        return false;
      }

      console.log('   SUCCESS: Bucket created!', data);
    } else {
      console.error('   Error checking bucket:', listError.message);
      return false;
    }
  } else {
    console.log('   Bucket exists! Found', files?.length || 0, 'files.');
  }

  // Test upload capability
  console.log('\n2. Testing upload capability...');
  const testData = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
  const testFileName = `test-${Date.now()}.bin`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('recordings')
    .upload(testFileName, testData, {
      contentType: 'application/octet-stream',
      upsert: true
    });

  if (uploadError) {
    console.error('   Upload test failed:', uploadError.message);
    console.log('\n   You may need to update the bucket policies in Supabase Dashboard.');
    return false;
  }

  console.log('   Upload test successful!');

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('recordings')
    .getPublicUrl(testFileName);

  console.log('   Public URL:', urlData.publicUrl);

  // Clean up test file
  console.log('\n3. Cleaning up test file...');
  const { error: deleteError } = await supabase.storage
    .from('recordings')
    .remove([testFileName]);

  if (deleteError) {
    console.log('   Warning: Could not delete test file:', deleteError.message);
  } else {
    console.log('   Test file deleted.');
  }

  console.log('\n=== Storage setup complete! ===');
  console.log('Audio recordings will be stored at:');
  console.log(`${supabaseUrl}/storage/v1/object/public/recordings/`);
  return true;
}

setupStorage().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
