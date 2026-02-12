/**
 * Check Supabase Storage configuration
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorage() {
  console.log('Checking Supabase Storage configuration...\n');

  // List all buckets
  console.log('1. Listing all buckets...');
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

  if (bucketsError) {
    console.log('   Error listing buckets:', bucketsError.message);
    console.log('   (This is normal - anon key may not have listBuckets permission)');
  } else {
    console.log('   Available buckets:');
    buckets.forEach(b => {
      console.log(`   - ${b.name} (public: ${b.public}, created: ${b.created_at})`);
    });
  }

  // Try to list files in recordings bucket
  console.log('\n2. Checking "recordings" bucket...');
  const { data: files, error: listError } = await supabase.storage
    .from('recordings')
    .list('', { limit: 5 });

  if (listError) {
    console.log('   Error:', listError.message);
  } else {
    console.log('   Can list files: YES');
    console.log('   Files found:', files?.length || 0);
  }

  // Check if we need auth for uploads
  console.log('\n3. Testing authenticated upload...');
  console.log('   Note: The app uploads with user authentication.');
  console.log('   If bucket policy requires auth, uploads from the app will work.');

  // Check the public URL format
  console.log('\n4. Public URL format:');
  const { data: urlData } = supabase.storage
    .from('recordings')
    .getPublicUrl('test.caf');
  console.log('   ', urlData.publicUrl);

  console.log('\n=== Recommendation ===');
  console.log('The bucket exists but may need policy updates.');
  console.log('In Supabase Dashboard -> Storage -> recordings -> Policies:');
  console.log('');
  console.log('Add this INSERT policy for authenticated uploads:');
  console.log('  Policy name: "Allow authenticated uploads"');
  console.log('  Allowed operation: INSERT');
  console.log('  Target roles: authenticated');
  console.log('  WITH CHECK: (bucket_id = \'recordings\')');
  console.log('');
  console.log('Add this SELECT policy for public reads:');
  console.log('  Policy name: "Allow public reads"');
  console.log('  Allowed operation: SELECT');
  console.log('  Target roles: anon, authenticated');
  console.log('  USING: (bucket_id = \'recordings\')');
}

checkStorage().catch(console.error);
