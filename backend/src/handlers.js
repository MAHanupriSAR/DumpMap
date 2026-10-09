const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

const REPORTS_TABLE = process.env.REPORTS_TABLE;
const UPLOAD_BUCKET = process.env.UPLOAD_BUCKET;

// Helper for CORS response
const createResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
  },
  body: JSON.stringify(body),
});

module.exports.getUploadUrl = async (event) => {
  try {
    const filename = event.queryStringParameters?.filename;
    const filetype = event.queryStringParameters?.filetype;

    if (!filename || !filetype) {
      return createResponse(400, { error: 'Missing filename or filetype' });
    }

    const key = `uploads/${uuidv4()}-${filename}`;

    const command = new PutObjectCommand({
      Bucket: UPLOAD_BUCKET,
      Key: key,
      ContentType: filetype,
    });

    // Create a pre-signed URL valid for 5 minutes
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    return createResponse(200, { 
      uploadUrl,
      key,
      fileUrl: `https://${UPLOAD_BUCKET}.s3.amazonaws.com/${key}`
    });
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    return createResponse(500, { error: 'Failed to generate upload URL' });
  }
};

module.exports.createReport = async (event) => {
  try {
    const data = JSON.parse(event.body);
    const reportId = `WS-${Math.floor(10000 + Math.random() * 90000)}`;
    
    const newReport = {
      id: reportId,
      location: data.location,
      lat: data.lat,
      lng: data.lng,
      type: data.type,
      severity: data.severity,
      description: data.description,
      photoUrl: data.photoUrl,
      status: 'pending',
      timeline: [
        { status: 'Reported', completed: true, timestamp: new Date().toISOString() },
        { status: 'Verified', completed: false },
        { status: 'Cleanup assigned', completed: false },
        { status: 'Resolved', completed: false }
      ],
      createdAt: new Date().toISOString(),
      // In production, grab userId from authorizer context
      userId: data.userId || 'anonymous'
    };

    const command = new PutCommand({
      TableName: REPORTS_TABLE,
      Item: newReport,
    });

    await docClient.send(command);

    return createResponse(201, { message: 'Report created successfully', report: newReport });
  } catch (error) {
    console.error('Error creating report:', error);
    return createResponse(500, { error: 'Failed to create report' });
  }
};

module.exports.getReports = async (event) => {
  try {
    const userId = event.queryStringParameters?.userId;
    
    let commandParams = {
      TableName: REPORTS_TABLE,
    };
    
    if (userId) {
      commandParams.FilterExpression = "userId = :uid";
      commandParams.ExpressionAttributeValues = {
        ":uid": userId
      };
    }

    const command = new ScanCommand(commandParams);
    const response = await docClient.send(command);

    return createResponse(200, { reports: response.Items });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return createResponse(500, { error: 'Failed to fetch reports' });
  }
};
