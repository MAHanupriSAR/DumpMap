const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});
const { RekognitionClient, DetectLabelsCommand } = require('@aws-sdk/client-rekognition');
const rekognitionClient = new RekognitionClient({});

const REPORTS_TABLE = process.env.REPORTS_TABLE;
const WORKERS_TABLE = process.env.WORKERS_TABLE;
const UPLOAD_BUCKET = process.env.UPLOAD_BUCKET;
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || 'ap-south-1_igoGrvGIP';
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID || '55dht6jg5ta3c3heobhneh5na8';
const COGNITO_REGION = process.env.COGNITO_REGION || 'ap-south-1';

const {
  CognitoIdentityProviderClient,
  AdminInitiateAuthCommand,
  AdminListGroupsForUserCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

const cognitoClient = new CognitoIdentityProviderClient({ region: COGNITO_REGION });

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
        { status: 'Accepted', completed: false },
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

module.exports.updateReportStatus = async (event) => {
  try {
    const reportId = event.pathParameters?.id;
    const data = JSON.parse(event.body || '{}');
    const action = data.action; // 'accept' or 'resolve'
    const userId = data.userId || 'anonymous-staff';

    // First, fetch the current report to get its timeline
    const getCommand = new ScanCommand({
      TableName: REPORTS_TABLE,
      FilterExpression: "id = :id",
      ExpressionAttributeValues: { ":id": reportId }
    });
    const getResponse = await docClient.send(getCommand);
    if (!getResponse.Items || getResponse.Items.length === 0) {
      return createResponse(404, { error: 'Report not found' });
    }
    const report = getResponse.Items[0];
    const currentTimeline = report.timeline || [];

    let updateExpression = '';
    let expressionAttributeNames = { '#status': 'status' };
    let expressionAttributeValues = { ':t': currentTimeline };

    if (action === 'accept') {
      currentTimeline[2].completed = true;
      currentTimeline[2].timestamp = new Date().toISOString();
      updateExpression = 'set #status = :s, timeline = :t, assignedTo = :u';
      expressionAttributeValues[':s'] = 'accepted';
      expressionAttributeValues[':u'] = userId;
    } else if (action === 'resolve') {
      const now = new Date().toISOString();
      if (currentTimeline[3]) {
        currentTimeline[3].completed = true;
        currentTimeline[3].timestamp = now;
      }
      
      let expr = 'set #status = :s, timeline = :t, resolvedAt = :ra, resolvedBy = :rb';
      expressionAttributeValues[':s'] = 'resolved';
      expressionAttributeValues[':ra'] = data.resolvedAt || now;
      expressionAttributeValues[':rb'] = data.workerName || userId;

      if (data.proofPhotoUrl) {
        expr += ', proofPhotoUrl = :ppu';
        expressionAttributeValues[':ppu'] = data.proofPhotoUrl;
      }
      if (data.proofDescription && data.proofDescription.trim()) {
        expr += ', proofDescription = :pd';
        expressionAttributeValues[':pd'] = data.proofDescription.trim();
      }
      updateExpression = expr;
    } else {
      return createResponse(400, { error: 'Invalid action' });
    }

    const updateCommand = new UpdateCommand({
      TableName: REPORTS_TABLE,
      Key: { id: reportId },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues
    });

    await docClient.send(updateCommand);
    return createResponse(200, { message: `Report ${action}ed successfully` });
  } catch (error) {
    console.error('Error updating report status:', error);
    return createResponse(500, { error: 'Failed to update report status' });
  }
};

// Worker login: Authenticates credentials directly with AWS Cognito User Pool
// Enforces that only authorized municipal workers (in 'Workers' group or WorkersTable) can access.
// Workers have NO self-registration / sign-up — accounts are provisioned by the municipality.
module.exports.verifyWorker = async (event) => {
  try {
    const { email, password } = JSON.parse(event.body || '{}');

    if (!email || !password) {
      return createResponse(400, { error: 'Email and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Authenticate with AWS Cognito User Pool
    let authResult;
    try {
      const authCommand = new AdminInitiateAuthCommand({
        UserPoolId: COGNITO_USER_POOL_ID,
        ClientId: COGNITO_CLIENT_ID,
        AuthFlow: 'ADMIN_NO_SRP_AUTH',
        AuthParameters: {
          USERNAME: cleanEmail,
          PASSWORD: password,
        },
      });
      const authRes = await cognitoClient.send(authCommand);
      authResult = authRes.AuthenticationResult;
    } catch (authErr) {
      console.warn('Cognito authentication failed for:', cleanEmail, authErr.name, authErr.message);
      if (authErr.name === 'NotAuthorizedException' || authErr.name === 'UserNotFoundException') {
        return createResponse(401, { valid: false, error: 'Invalid work email or password.' });
      }
      if (authErr.name === 'UserNotConfirmedException') {
        return createResponse(403, { valid: false, error: 'Worker account is not confirmed in Cognito.' });
      }
      return createResponse(400, { valid: false, error: authErr.message || 'Authentication failed.' });
    }

    if (!authResult || !authResult.IdToken) {
      return createResponse(401, { valid: false, error: 'Authentication failed. Please verify credentials.' });
    }

    // 2. Verify authorization / RBAC
    // Check if user is in 'Workers' group in Cognito
    let isWorkerGroup = false;
    try {
      const groupsRes = await cognitoClient.send(new AdminListGroupsForUserCommand({
        UserPoolId: COGNITO_USER_POOL_ID,
        Username: cleanEmail,
      }));
      const groupNames = (groupsRes.Groups || []).map(g => g.GroupName);
      isWorkerGroup = groupNames.includes('Workers') || groupNames.includes('Staff');
    } catch (groupErr) {
      console.warn('Could not verify Cognito groups:', groupErr);
    }

    // Check DynamoDB WorkersTable for metadata (name, zone, workerId)
    const dbResult = await docClient.send(new GetCommand({
      TableName: WORKERS_TABLE,
      Key: { email: cleanEmail },
    }));

    const workerItem = dbResult.Item;

    // Must be either in Workers group or in WorkersTable
    if (!isWorkerGroup && !workerItem) {
      return createResponse(403, {
        valid: false,
        error: 'Access denied: This account is not registered as municipal staff.',
      });
    }

    const workerProfile = {
      name: (workerItem && workerItem.name) || cleanEmail.split('@')[0],
      workerId: (workerItem && workerItem.workerId) || 'STAFF-' + cleanEmail.split('@')[0],
      zone: (workerItem && workerItem.zone) || 'Municipal Zone',
      email: cleanEmail,
    };

    return createResponse(200, {
      valid: true,
      role: 'staff',
      name: workerProfile.name,
      workerId: workerProfile.workerId,
      zone: workerProfile.zone,
      email: workerProfile.email,
      tokens: {
        idToken: authResult.IdToken,
        accessToken: authResult.AccessToken,
        refreshToken: authResult.RefreshToken,
        expiresIn: authResult.ExpiresIn,
      },
    });
  } catch (error) {
    console.error('Error during worker login:', error);
    return createResponse(500, { error: 'Worker login failed. Please try again.' });
  }
};
