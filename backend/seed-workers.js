/**
 * seed-workers.js
 * Pre-loads authorized municipal workers into DynamoDB WorkersTable.
 * Authentication credentials (email & password) are securely handled by AWS Cognito.
 *
 * Run with: node seed-workers.js
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, DeleteCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'dumpmap-backend-dev-workers';

const WORKERS = [
  {
    email: 'worker1@dumpmap.gov',
    name: 'Ramesh Kumar',
    workerId: 'STAFF-001',
    zone: 'North Delhi',
    role: 'staff',
  },
  {
    email: 'worker2@dumpmap.gov',
    name: 'Suresh Sharma',
    workerId: 'STAFF-002',
    zone: 'South Delhi',
    role: 'staff',
  },
  {
    email: 'worker3@dumpmap.gov',
    name: 'Priya Verma',
    workerId: 'STAFF-003',
    zone: 'East Delhi',
    role: 'staff',
  },
];

async function seedWorkers() {
  console.log(`Cleaning old entries and seeding ${WORKERS.length} workers into ${TABLE_NAME}...`);

  // Scan and clean old items
  const scanResult = await docClient.send(new ScanCommand({ TableName: TABLE_NAME }));
  if (scanResult.Items && scanResult.Items.length > 0) {
    for (const item of scanResult.Items) {
      await docClient.send(new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { email: item.email },
      }));
    }
    console.log(`🧹 Cleaned ${scanResult.Items.length} old worker entries.`);
  }

  // Seed authorized workers
  for (const worker of WORKERS) {
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        ...worker,
        updatedAt: new Date().toISOString(),
      },
    }));
    console.log(`✅ Seeded: ${worker.name} (${worker.email}) - Zone: ${worker.zone}`);
  }

  console.log('\n🎉 Workers seeded successfully! All workers authenticate securely via AWS Cognito.');
}

seedWorkers().catch(console.error);
