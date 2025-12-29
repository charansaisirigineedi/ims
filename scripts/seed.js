const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env.local');
    process.exit(1);
}

async function seed() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db();

        // Clear existing data
        await db.collection('users').deleteMany({});
        await db.collection('labs').deleteMany({});
        await db.collection('categories').deleteMany({});
        await db.collection('items').deleteMany({});
        await db.collection('usagelogs').deleteMany({});
        await db.collection('orders').deleteMany({});

        // Create Admin and User
        const hashedPassword = await bcrypt.hash('password123', 10);
        const adminId = new ObjectId();
        const userId = new ObjectId();

        await db.collection('users').insertMany([
            { _id: adminId, name: 'Admin User', email: 'admin@lab.com', password: hashedPassword, role: 'admin', createdAt: new Date() },
            { _id: userId, name: 'Research Assistant', email: 'user@lab.com', password: hashedPassword, role: 'user', createdAt: new Date() }
        ]);

        // Create Labs
        const labs = [
            { _id: new ObjectId(), name: 'Molecular Biology Lab', description: 'Genomics and proteomics research', createdAt: new Date() },
            { _id: new ObjectId(), name: 'Organic Chemistry Lab', description: 'Advanced synthesis and catalysis', createdAt: new Date() },
            { _id: new ObjectId(), name: 'Quantum Physics Wing', description: 'Precision measurements and optics', createdAt: new Date() },
            { _id: new ObjectId(), name: 'Biochemistry Suite', description: 'Enzyme studies and metabolic pathways', createdAt: new Date() }
        ];
        await db.collection('labs').insertMany(labs);

        // Create Categories
        const categories = [
            { _id: new ObjectId(), name: 'Reagents & Chemicals', createdAt: new Date() },
            { _id: new ObjectId(), name: 'Glassware', createdAt: new Date() },
            { _id: new ObjectId(), name: 'Personal Protective Equipment', createdAt: new Date() },
            { _id: new ObjectId(), name: 'Electronic Components', createdAt: new Date() },
            { _id: new ObjectId(), name: 'Surgical Tools', createdAt: new Date() }
        ];
        await db.collection('categories').insertMany(categories);

        // Create Items (60+ items to test pagination across 10-per-page)
        const items = [];
        const units = ['units', 'ml', 'g', 'kg', 'boxes', 'rolls'];

        for (let i = 1; i <= 65; i++) {
            const lab = labs[i % labs.length];
            const cat = categories[i % categories.length];
            const qty = Math.floor(Math.random() * 200);
            const min = Math.floor(Math.random() * 50) + 10;

            items.push({
                _id: new ObjectId(),
                name: `Item ${i}: ${cat.name.split(' ')[0]} ${['Alpha', 'Beta', 'Gamma', 'Delta'][i % 4]}`,
                lab_id: lab._id,
                category_id: cat._id,
                quantity: qty,
                unit: units[i % units.length],
                minStock: min,
                status: 'active',
                expiryDate: i % 5 === 0 ? new Date(Date.now() + i * 86400000) : null,
                createdAt: new Date(Date.now() - i * 3600000) // Staggered creation for sort testing
            });
        }
        await db.collection('items').insertMany(items);

        // Create some sample logs for the first 5 items
        const logs = [];
        for (let i = 0; i < 15; i++) {
            const item = items[i % 5];
            logs.push({
                item_id: item._id,
                user_id: userId,
                quantity: Math.floor(Math.random() * 5) + 1,
                type: i % 2 === 0 ? 'subtract' : 'add',
                reason: i % 4 === 0 ? 'PHYSICAL_AUDIT' : (i % 2 === 0 ? 'BATCH_USAGE' : 'DIRECT_RESTOCK'),
                status: i % 3 === 0 ? 'pending' : 'approved',
                approved_by: i % 3 === 0 ? null : adminId,
                createdAt: new Date(Date.now() - i * 7200000)
            });
        }
        // Create Sample Orders
        const sampleOrders = [
            {
                user_id: adminId,
                type: 'purchase',
                status: 'requested',
                reason: 'Standard Monthly Buffer Replenishment',
                items: [
                    { item_id: items[0]._id, requested_qty: 50, current_stock: items[0].quantity },
                    { item_id: items[1]._id, requested_qty: 25, current_stock: items[1].quantity }
                ],
                createdAt: new Date()
            },
            {
                user_id: userId,
                type: 'audit',
                status: 'pending',
                reason: 'Annual Q4 Inventory Audit',
                items: [
                    { item_id: items[5]._id, requested_qty: items[5].quantity + 2, current_stock: items[5].quantity },
                    { item_id: items[6]._id, requested_qty: items[6].quantity - 1, current_stock: items[6].quantity }
                ],
                createdAt: new Date()
            }
        ];
        await db.collection('orders').insertMany(sampleOrders);

        console.log(`Database seeded successfully with:
        - 2 Users (Admin & regular)
        - ${labs.length} Laboratories
        - ${categories.length} Categories
        - ${items.length} Inventory Items
        - ${logs.length} Usage Logs
        - ${sampleOrders.length} Batch Transactions`);
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await client.close();
    }
}

seed();
