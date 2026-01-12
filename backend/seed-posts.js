const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env file - try multiple locations
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config(); // Also try current directory

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedPosts() {
  console.log('Starting post seeding...');
  console.log('Note: Make sure to run the migration first: supabase/migrations/20260108000000_add_post_approval.sql\n');

  try {

    // Step 2: Get or create admin user
    console.log('Step 2: Getting or creating admin user...');
    const ADMIN_EMAIL = 'admin@umarapp.com';
    const ADMIN_PASSWORD = 'admin123';
    
    let adminUser;
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const adminExists = existingUsers?.users?.some(u => u.email === ADMIN_EMAIL);
    
    if (adminExists) {
      adminUser = existingUsers.users.find(u => u.email === ADMIN_EMAIL);
      console.log(`Admin user found: ${adminUser.id}`);
      
      // Ensure profile exists and is_admin is true
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', adminUser.id)
        .single();
      
      if (!adminProfile) {
        await supabase.from('profiles').insert({
          id: adminUser.id,
          email: ADMIN_EMAIL,
          full_name: 'Admin User',
          is_admin: true,
        });
      } else if (!adminProfile.is_admin) {
        await supabase.from('profiles').update({ is_admin: true }).eq('id', adminUser.id);
      }
    } else {
      // Create admin user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
      });
      
      if (authError) throw authError;
      adminUser = authData.user;
      
      // Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: adminUser.id,
        email: ADMIN_EMAIL,
        full_name: 'Admin User',
        is_admin: true,
      });
      
      if (profileError) throw profileError;
      console.log(`Admin user created: ${adminUser.id}`);
    }

    // Step 3: Get or create test user
    console.log('Step 3: Getting or creating test user...');
    const TEST_EMAIL = 'testuser@example.com';
    const TEST_PASSWORD = 'test123456';
    
    let testUser;
    const testExists = existingUsers?.users?.some(u => u.email === TEST_EMAIL);
    
    if (testExists) {
      testUser = existingUsers.users.find(u => u.email === TEST_EMAIL);
      console.log(`Test user found: ${testUser.id}`);
    } else {
      // Create test user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        email_confirm: true,
      });
      
      if (authError) throw authError;
      testUser = authData.user;
      
      // Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: testUser.id,
        email: TEST_EMAIL,
        full_name: 'Test User',
        is_admin: false,
        gender: 'male',
      });
      
      if (profileError) throw profileError;
      console.log(`Test user created: ${testUser.id}`);
    }

    // Step 4: Create admin post
    console.log('Step 4: Creating admin post...');
    const adminPostData = {
      user_id: adminUser.id,
      content: 'Welcome to UmarApp! This is an important community announcement. We are here to support each other and strengthen our community bonds.',
      type: 'general',
      metadata: {},
    };
    
    // Try with is_approved first, fallback if column doesn't exist
    const { data: adminPost, error: adminPostError } = await supabase
      .from('posts')
      .insert({ ...adminPostData, is_approved: true })
      .select()
      .single();
    
    if (adminPostError && adminPostError.message?.includes('is_approved')) {
      // Column doesn't exist, create without it
      const { data: adminPost2, error: adminPostError2 } = await supabase
        .from('posts')
        .insert(adminPostData)
        .select()
        .single();
      
      if (adminPostError2) throw adminPostError2;
      console.log('Admin post created:', adminPost2.id);
    } else if (adminPostError) {
      throw adminPostError;
    } else {
      console.log('Admin post created:', adminPost.id);
    }

    // Step 5: Create janaza post from test user
    console.log('Step 5: Creating janaza post from test user...');
    const janazaMetadata = {
      deceasedName: 'Ahmad Al-Mahmoud',
      deceasedGender: 'male',
      mosqueName: 'Grande Mosquée de Paris',
      prayerTime: 'Après Dhuhr (13h30)',
      mosqueLocation: {
        lat: 48.8419, // Grande Mosquée de Paris
        lng: 2.3551
      },
      cemeteryName: 'Cimetière de Thiais',
      cemeteryAddress: '261 Route de Fontainebleau, 94320 Thiais',
      isRepatriation: false
    };

    const janazaPostData = {
      user_id: testUser.id,
      content: 'Inna lillahi wa inna ilayhi raji\'un. Nous annonçons avec tristesse le décès de notre frère bien-aimé Ahmad Al-Mahmoud. La prière funéraire (Janaza) aura lieu à la Grande Mosquée de Paris après la prière de Dhuhr. Qu\'Allah lui accorde le Paradis et donne patience à sa famille.',
      type: 'janaza',
      metadata: janazaMetadata,
    };

    // Try with is_approved first, fallback if column doesn't exist
    const { data: janazaPost, error: janazaPostError } = await supabase
      .from('posts')
      .insert({ ...janazaPostData, is_approved: false })
      .select()
      .single();
    
    let finalJanazaPostId;
    if (janazaPostError && janazaPostError.message?.includes('is_approved')) {
      // Column doesn't exist, create without it
      const { data: janazaPost2, error: janazaPostError2 } = await supabase
        .from('posts')
        .insert(janazaPostData)
        .select()
        .single();
      
      if (janazaPostError2) throw janazaPostError2;
      finalJanazaPostId = janazaPost2.id;
      console.log('Janaza post created:', finalJanazaPostId);
    } else if (janazaPostError) {
      throw janazaPostError;
    } else {
      finalJanazaPostId = janazaPost.id;
      console.log('Janaza post created:', finalJanazaPostId);
    }
    
    // Step 6: Approve the janaza post
    console.log('Step 6: Approving janaza post...');
    const { error: updateError } = await supabase
      .from('posts')
      .update({ is_approved: true })
      .eq('id', finalJanazaPostId);
    
    if (updateError && updateError.message?.includes('is_approved')) {
      console.log('Note: is_approved column does not exist. Please run the migration first.');
    } else if (updateError) {
      throw updateError;
    } else {
      console.log('Janaza post approved successfully!');
    }

    console.log('\n✅ Seeding completed successfully!');
    console.log('\nSummary:');
    console.log(`- Admin user: ${ADMIN_EMAIL} (ID: ${adminUser.id})`);
    console.log(`- Test user: ${TEST_EMAIL} (ID: ${testUser.id})`);
    console.log(`- Admin post created`);
    console.log(`- Janaza post created and approved`);
    console.log('\nYou can now view these posts in the app!');

  } catch (error) {
    console.error('Error seeding posts:', error);
    process.exit(1);
  }
}

// Run the seed function
seedPosts();
