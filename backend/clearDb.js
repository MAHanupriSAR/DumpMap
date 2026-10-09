const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = 'dumpmap-backend-dev-reports';

async function clearTable() {
  try {
    console.log(`Scanning table ${TABLE_NAME}...`);
    const scanResponse = await docClient.send(new ScanCommand({ TableName: TABLE_NAME }));
    
    const items = scanResponse.Items;
    if (!items || items.length === 0) {
      console.log('Database is already empty.');
      return;
    }

    console.log(`Found ${items.length} items. Deleting...`);
    
    for (const item of items) {
      await docClient.send(new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { id: item.id }
      }));
      console.log(`Deleted item with id: ${item.id}`);
    }
    
    console.log('Database cleared successfully!');
  } catch (error) {
    console.error('Error clearing database:', error);
  }
}

clearTable();
