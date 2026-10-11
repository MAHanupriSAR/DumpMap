/**
 * cleanup-db.js
 * Scans and deletes ALL items from the ReportsTable.
 * Run with: node cleanup-db.js
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'dumpmap-backend-dev-reports';

async function cleanDatabase() {
  console.log(`Scanning ${TABLE_NAME}...`);

  let lastKey = undefined;
  let totalDeleted = 0;

  do {
    const scanResult = await docClient.send(new ScanCommand({
      TableName: TABLE_NAME,
      ExclusiveStartKey: lastKey,
    }));

    const items = scanResult.Items || [];
    console.log(`Found ${items.length} items to delete...`);

    for (const item of items) {
      await docClient.send(new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { id: item.id },
      }));
      totalDeleted++;
      process.stdout.write(`\rDeleted ${totalDeleted} items...`);
    }

    lastKey = scanResult.LastEvaluatedKey;
  } while (lastKey);

  console.log(`\n✅ Done! Deleted ${totalDeleted} items from ${TABLE_NAME}.`);
}

cleanDatabase().catch(console.error);
