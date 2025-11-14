// Test script to verify clearAllUsers and createFreshAdmin functions
const { openDB, clearAllUsers, createFreshAdmin, getAllUsers } = require('./app/lib/database.refactor');
const { hashPassword } = require('./app/lib/auth');

async function testClearAndCreateAdmin() {
    console.log('🧪 Testing clearAllUsers and createFreshAdmin functions...\n');
    
    try {
        // Open database
        console.log('1. Opening database...');
        const db = await openDB();
        console.log('   ✅ Database opened successfully');
        
        // Show current users
        console.log('\n2. Current users in database:');
        const currentUsers = await getAllUsers(db);
        console.log('   Users found:', currentUsers.length);
        currentUsers.forEach(user => {
            console.log(`   - ${user.username} (${user.is_admin ? 'admin' : 'user'}) ID: ${user.id}`);
        });
        
        // Clear all users
        console.log('\n3. Clearing all users...');
        const deletedCount = await clearAllUsers(db);
        console.log(`   ✅ Deleted ${deletedCount} users`);
        
        // Verify no users remain
        console.log('\n4. Verifying users were cleared...');
        const afterClear = await getAllUsers(db);
        console.log('   Users remaining:', afterClear.length);
        
        // Create fresh admin
        console.log('\n5. Creating fresh admin user...');
        const hashedPassword = hashPassword('Admin123');
        const adminId = await createFreshAdmin(db, 'admin', hashedPassword);
        console.log(`   ✅ Created admin with ID: ${adminId}`);
        
        // Verify admin was created
        console.log('\n6. Verifying admin was created...');
        const finalUsers = await getAllUsers(db);
        console.log('   Final users count:', finalUsers.length);
        finalUsers.forEach(user => {
            console.log(`   - ${user.username} (${user.is_admin ? 'admin' : 'user'}) ID: ${user.id}`);
        });
        
        console.log('\n🎉 Test completed successfully!');
        console.log('👤 You can now login with:');
        console.log('   Username: admin');
        console.log('   Password: Admin123');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack:', error.stack);
    }
}

testClearAndCreateAdmin();