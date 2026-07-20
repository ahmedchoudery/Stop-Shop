const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

async function run() {
  await mongoose.connect(uri);
  const db = mongoose.connection.useDb('stopshop');

  // 1. Find product
  const product = await db.db.collection('products').findOne({ name: { $regex: 'Hollister', $options: 'i' } });
  console.log('--- PRODUCT ---');
  console.log(JSON.stringify(product, null, 2));

  if (product) {
    // 2. Find notifications
    const notifications = await db.db.collection('productnotifications').find({ productId: { $in: [product.id, product._id.toString()] } }).toArray();
    console.log('\n--- NOTIFICATIONS ---');
    notifications.forEach(n => console.log(JSON.stringify(n)));

    // 3. Find outbox emails
    const outbox = await db.db.collection('email_outbox').find({ to: 'ahmedgotguts1@gmail.com' }).toArray();
    console.log('\n--- OUTBOX EMAILS for ahmedgotguts1@gmail.com ---');
    outbox.forEach(o => console.log(JSON.stringify(o)));

    // 4. Find all outbox emails
    const allOutbox = await db.db.collection('email_outbox').find({}).sort({ createdAt: -1 }).limit(5).toArray();
    console.log('\n--- LAST 5 OUTBOX EMAILS ---');
    allOutbox.forEach(o => console.log(JSON.stringify(o)));
  } else {
    console.log('No Hollister product found!');
    const allProds = await db.db.collection('products').find({}).toArray();
    console.log('\nAll products:');
    allProds.forEach(p => console.log(`- [${p.id}] ${p.name}`));
  }

  await mongoose.disconnect();
}

run().catch(console.error);
