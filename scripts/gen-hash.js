const bcrypt = require('bcryptjs');

async function generateHashes() {
    const adminHash = await bcrypt.hash('admin123', 10);
    const userHash = await bcrypt.hash('user123', 10);

    console.log('ADMIN hash:', adminHash);
    console.log('USER hash:', userHash);
}

generateHashes();
