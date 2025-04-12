const crypto = require('crypto');

const PASSWORD = '大漠孤烟直，长河落日圆。';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(PASSWORD).digest();

const supabaseConfig = {
    SUPABASE_URL: '',
    SUPABASE_KEY: ''
};

const algorithm = 'aes-256-cbc';
const iv = crypto.randomBytes(16);

function encrypt(data) {
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

const encryptedConfig = encrypt(supabaseConfig);
const fs = require('fs');
fs.writeFileSync('supabase-config.json', JSON.stringify({
    encrypted: encryptedConfig,
    iv: iv.toString('hex')
}));
console.log('The encrypted configuration has been saved to supabase-config.json');
