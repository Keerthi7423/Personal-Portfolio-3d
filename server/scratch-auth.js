const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const runAuthExperiment = async () => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔐 EXPERIMENT 1: BCRYPT PASSWORD HASHING & COMPARISON');
    console.log('═══════════════════════════════════════════════════════════');

    const rawPassword = 'DoomMasterPassword2026!';
    console.log(`1. Raw Password: "${rawPassword}"`);

    // Generate Salt & Hash
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    console.log(`2. Generated Salt: ${salt}`);
    console.log(`3. Hashed Password: ${hashedPassword}`);
    console.log(`   (Notice: The hash is 60 characters and starts with $2a$10$)`);

    // Test 1: Compare with correct password
    const isMatchCorrect = await bcrypt.compare(rawPassword, hashedPassword);
    console.log(`4. Compare with CORRECT password: ${isMatchCorrect ? '✅ MATCH (Login Allowed)' : '❌ DENIED'}`);

    // Test 2: Compare with wrong password
    const isMatchWrong = await bcrypt.compare('WrongPassword123', hashedPassword);
    console.log(`5. Compare with WRONG password:   ${isMatchWrong ? '✅ MATCH (Login Allowed)' : '❌ DENIED (Invalid Credentials)'}\n`);

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎫 EXPERIMENT 2: JSON WEB TOKEN (JWT) SIGN & VERIFY');
    console.log('═══════════════════════════════════════════════════════════');

    const fakeUserId = '673892a0912fbc1200112233';
    const secretKey = 'my_super_secret_key';

    // 1. Sign Token
    const token = jwt.sign(
        { id: fakeUserId, role: 'admin' },
        secretKey,
        { expiresIn: '30d' }
    );
    console.log(`1. Generated JWT Token:\n   ${token}\n`);

    // 2. Decode payload (anyone can read this!)
    const decodedPayload = jwt.decode(token);
    console.log('2. Decoded Payload (Readable without secret):', decodedPayload);

    // 3. Verify with the correct secret
    try {
        const verified = jwt.verify(token, secretKey);
        console.log(`3. Verify with CORRECT secret: ✅ Verified! User ID is: ${verified.id}`);
    } catch (err) {
        console.error('3. Verify failed:', err.message);
    }

    // 4. Simulate a hacker tampering with the token
    console.log('\n4. Simulating Hacker Tampering:');
    const tamperedToken = token.slice(0, -5) + 'AAAAA'; // Changing last 5 letters
    try {
        jwt.verify(tamperedToken, secretKey);
        console.log('   Hacked token accepted! ❌ (Should never happen)');
    } catch (err) {
        console.log(`   Hacked token caught! 🛡️  Error: "${err.message}" (Request Rejected!)`);
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🎉 EXPERIMENT COMPLETE: Security concepts verified!');
    console.log('═══════════════════════════════════════════════════════════');
};

runAuthExperiment();