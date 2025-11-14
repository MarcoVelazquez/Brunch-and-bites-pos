// Script para debuggear usuarios y contraseñas
const { openDB, getUserByUsername, getAllUsers, createUserWithAllPermissions, seedAdminUser, insertInitialPermissions } = require('./app/lib/database.refactor');
const { hashPassword, verifyPassword } = require('./app/lib/auth');

async function debugAuth() {
    console.log('🔍 Debuggeando autenticación...\n');
    
    try {
        // Abrir base de datos
        console.log('1. Abriendo base de datos...');
        const db = await openDB();
        console.log('   ✅ Base de datos abierta');
        
        // Asegurar permisos
        await insertInitialPermissions(db);
        console.log('   ✅ Permisos inicializados');
        
        // Ver todos los usuarios actuales
        console.log('\n2. Usuarios actuales en la base de datos:');
        const users = await getAllUsers(db);
        if (users.length === 0) {
            console.log('   ⚠️ No hay usuarios en la base de datos');
        } else {
            users.forEach(user => {
                console.log(`   - ${user.username} (${user.is_admin ? 'admin' : 'user'}) ID: ${user.id}`);
                console.log(`     Hash: ${user.password_hash.substring(0, 20)}...`);
            });
        }
        
        // Verificar admin
        console.log('\n3. Verificando usuario admin...');
        let adminUser = await getUserByUsername(db, 'admin');
        if (!adminUser) {
            console.log('   ⚠️ No existe admin, creándolo...');
            await seedAdminUser(db, 'admin', hashPassword('Admin123'));
            adminUser = await getUserByUsername(db, 'admin');
            console.log('   ✅ Admin creado');
        }
        
        if (adminUser) {
            console.log('   📝 Probando contraseña Admin123...');
            const adminPasswordCheck = verifyPassword('Admin123', adminUser.password_hash);
            console.log(`   ${adminPasswordCheck ? '✅' : '❌'} Contraseña Admin123: ${adminPasswordCheck ? 'CORRECTA' : 'INCORRECTA'}`);
        }
        
        // Verificar Gina
        console.log('\n4. Verificando usuario Gina...');
        let ginaUser = await getUserByUsername(db, 'Gina');
        if (!ginaUser) {
            console.log('   ⚠️ No existe Gina, creándola...');
            await createUserWithAllPermissions(db, 'Gina', hashPassword('Marco123'));
            ginaUser = await getUserByUsername(db, 'Gina');
            console.log('   ✅ Gina creada');
        }
        
        if (ginaUser) {
            console.log('   📝 Probando contraseña Marco123...');
            const ginaPasswordCheck = verifyPassword('Marco123', ginaUser.password_hash);
            console.log(`   ${ginaPasswordCheck ? '✅' : '❌'} Contraseña Marco123: ${ginaPasswordCheck ? 'CORRECTA' : 'INCORRECTA'}`);
        }
        
        // Hash de prueba para verificar función
        console.log('\n5. Verificando función de hash:');
        const testHash1 = hashPassword('Admin123');
        const testHash2 = hashPassword('Admin123');
        const testHash3 = hashPassword('Marco123');
        console.log(`   Hash Admin123 (1): ${testHash1}`);
        console.log(`   Hash Admin123 (2): ${testHash2}`);
        console.log(`   Hash Marco123:      ${testHash3}`);
        console.log(`   ¿Los hash de Admin123 son iguales? ${testHash1 === testHash2 ? '✅ Sí' : '❌ No'}`);
        
        console.log('\n🎯 Credenciales para login:');
        console.log('   👤 Usuario: admin    | 🔑 Contraseña: Admin123');
        console.log('   👤 Usuario: Gina     | 🔑 Contraseña: Marco123');
        
    } catch (error) {
        console.error('❌ Error:', error);
        console.error('Stack:', error.stack);
    }
}

debugAuth();