const { MongoClient } = require('mongodb');
const path = require('path');
const readline = require('readline');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env.local');
    process.exit(1);
}

if (!DB_NAME) {
    console.error('Please define the DB_NAME environment variable inside .env.local');
    process.exit(1);
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function clearDatabase() {
    const client = new MongoClient(MONGODB_URI);

    try {
        // Confirmation prompt
        console.log('\n⚠️  WARNING: This will DELETE ALL DATA from the database!');
        console.log('This action cannot be undone.\n');
        
        const answer = await askQuestion('Type "DELETE ALL" to confirm: ');
        
        if (answer !== 'DELETE ALL') {
            console.log('Operation cancelled. No data was deleted.');
            rl.close();
            return;
        }

        await client.connect();
        console.log('\nConnected to MongoDB');
        console.log(`Using database: ${DB_NAME}`);
        console.log('Starting data deletion...\n');

        const db = client.db(DB_NAME);

        // List of all collections to clear
        const collections = [
            'users',
            'labs',
            'categories',
            'items',
            'usagelogs',
            'orders'
        ];

        const results = {};

        // Delete all documents from each collection
        for (const collectionName of collections) {
            try {
                const collection = db.collection(collectionName);
                const count = await collection.countDocuments();
                const result = await collection.deleteMany({});
                results[collectionName] = {
                    deleted: result.deletedCount,
                    existed: count
                };
                console.log(`✓ ${collectionName}: Deleted ${result.deletedCount} document(s)`);
            } catch (error) {
                console.error(`✗ Error deleting ${collectionName}:`, error.message);
                results[collectionName] = {
                    error: error.message
                };
            }
        }

        // Summary
        console.log('\n' + '='.repeat(50));
        console.log('Deletion Summary:');
        console.log('='.repeat(50));
        
        let totalDeleted = 0;
        for (const [collectionName, result] of Object.entries(results)) {
            if (result.error) {
                console.log(`${collectionName}: ERROR - ${result.error}`);
            } else {
                console.log(`${collectionName}: ${result.deleted} document(s) deleted`);
                totalDeleted += result.deleted;
            }
        }
        
        console.log('='.repeat(50));
        console.log(`Total documents deleted: ${totalDeleted}`);
        console.log('='.repeat(50));
        console.log('\n✅ Database cleared successfully!\n');

    } catch (error) {
        console.error('\n❌ Error clearing database:', error);
        process.exit(1);
    } finally {
        await client.close();
        rl.close();
    }
}

clearDatabase();

