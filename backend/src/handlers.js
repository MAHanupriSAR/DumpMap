const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});
const { RekognitionClient, DetectLabelsCommand } = require('@aws-sdk/client-rekognition');
const rekognitionClient = new RekognitionClient({});

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
    const reportId = uuidv4();
    
    const newReport = {
      id: reportId,
      displayId: `WS-${reportId.substring(0, 8).toUpperCase()}`,
      location: data.location,
      lat: data.lat,
      lng: data.lng,
      type: data.type,
      amount: data.amount,
      severity: data.severity,
      criticality: data.criticality || 'low',
      description: data.description,
      photoUrl: data.photoUrl,
      status: 'pending',
      timeline: [
        { status: 'Reported', completed: true, timestamp: new Date().toISOString() },
        { status: 'Verified', completed: false },
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

module.exports.verifyImage = async (event) => {
  for (const record of event.Records) {
    if (record.eventName !== 'INSERT') continue;

    const newImage = record.dynamodb.NewImage;
    if (!newImage || !newImage.photoUrl || !newImage.photoUrl.S) {
      console.log('No photoUrl found, skipping verification.');
      continue;
    }

    const reportId = newImage.id.S;
    const photoUrl = newImage.photoUrl.S;

    try {
      console.log(`Verifying image for report ${reportId}`);
      // Parse the S3 key from the photoUrl
      // URL format: https://bucket.s3.amazonaws.com/uploads/...
      const bucketUrlPrefix = `https://${UPLOAD_BUCKET}.s3.amazonaws.com/`;
      let s3Key = null;
      if (photoUrl.startsWith(bucketUrlPrefix)) {
        s3Key = photoUrl.replace(bucketUrlPrefix, '');
      }

      if (!s3Key) {
        console.log('Image not stored in our S3 bucket, skipping Rekognition.');
        continue;
      }

      const detectCommand = new DetectLabelsCommand({
        Image: {
          S3Object: {
            Bucket: UPLOAD_BUCKET,
            Name: s3Key
          }
        },
        MaxLabels: 15,
        MinConfidence: 60
      });

      const response = await rekognitionClient.send(detectCommand);
      const labels = response.Labels.map(l => l.Name.toLowerCase());
      console.log('Detected labels:', labels);

      const garbageKeywords = ['trash', 'garbage', 'waste', 'rubbish', 'plastic', 'dump', 'cardboard', 'debris', 'litter', 'pollution', 'construction', 'wood', 'plant', 'soil', 'ground', 'puddle', 'tire', 'electronics', 'furniture'];
      const isGarbage = labels.some(label => garbageKeywords.includes(label));

      // Reconstruct the timeline array from DynamoDB Stream format
      const currentTimeline = newImage.timeline.L.map(item => ({
        status: item.M.status.S,
        completed: item.M.completed.BOOL,
        ...(item.M.timestamp ? { timestamp: item.M.timestamp.S } : {})
      }));

      // Update Verification step (index 1)
      currentTimeline[1].completed = true;
      currentTimeline[1].timestamp = new Date().toISOString();
      if (!isGarbage) {
        currentTimeline[1].status = 'Rejected (No Waste Detected)';
        currentTimeline[1].failed = true;
      }

      const newStatus = isGarbage ? 'active' : 'rejected';

      const updateCommand = new UpdateCommand({
        TableName: REPORTS_TABLE,
        Key: { id: reportId },
        UpdateExpression: 'set #status = :s, timeline = :t',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':s': newStatus,
          ':t': currentTimeline
        }
      });

      await docClient.send(updateCommand);
      console.log(`Successfully verified report ${reportId}: isGarbage=${isGarbage}`);
    } catch (err) {
      console.error('Error verifying image for report', reportId, err);
    }
  }
};
