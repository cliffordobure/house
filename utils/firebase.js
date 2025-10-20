const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  try {
    // Check if already initialized
    if (admin.apps.length === 0) {
      // You can either use a service account JSON file or environment variables
      if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
        const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else {
        // Use environment variables
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          }),
        });
      }
      console.log('Firebase Admin SDK initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error.message);
    console.log('Push notifications will not be available');
  }
};

// Send notification to a single device
const sendNotificationToDevice = async (fcmToken, title, body, data = {}) => {
  try {
    if (admin.apps.length === 0) {
      console.log('Firebase not initialized, skipping notification');
      return null;
    }

    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      token: fcmToken,
    };

    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    return response;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

// Send notification to multiple devices
const sendNotificationToMultipleDevices = async (fcmTokens, title, body, data = {}) => {
  try {
    if (admin.apps.length === 0) {
      console.log('Firebase not initialized, skipping notification');
      return null;
    }

    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      tokens: fcmTokens,
    };

    const response = await admin.messaging().sendMulticast(message);
    console.log(`Successfully sent ${response.successCount} messages`);
    
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`Error sending to token ${fcmTokens[idx]}:`, resp.error);
        }
      });
    }
    
    return response;
  } catch (error) {
    console.error('Error sending notifications:', error);
    throw error;
  }
};

// Send notification to topic
const sendNotificationToTopic = async (topic, title, body, data = {}) => {
  try {
    if (admin.apps.length === 0) {
      console.log('Firebase not initialized, skipping notification');
      return null;
    }

    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      topic: topic,
    };

    const response = await admin.messaging().send(message);
    console.log('Successfully sent message to topic:', response);
    return response;
  } catch (error) {
    console.error('Error sending notification to topic:', error);
    throw error;
  }
};

module.exports = {
  initializeFirebase,
  sendNotificationToDevice,
  sendNotificationToMultipleDevices,
  sendNotificationToTopic,
};

