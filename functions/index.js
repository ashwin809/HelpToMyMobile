const admin = require('firebase-admin');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { logger } = require('firebase-functions');

admin.initializeApp();
const firestore = admin.firestore();
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

async function deliverExpoPush(userId, notification, data = {}) {
  const tokenSnapshot = await firestore
    .collection('users')
    .doc(userId)
    .collection('pushTokens')
    .get();

  const tokens = tokenSnapshot.docs
    .map((tokenDoc) => ({ ref: tokenDoc.ref, token: tokenDoc.get('token') }))
    .filter(({ token }) => typeof token === 'string' &&
      (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[')));

  for (let start = 0; start < tokens.length; start += 100) {
    const batch = tokens.slice(start, start + 100);
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batch.map(({ token }) => ({
        to: token,
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data,
      }))),
    });

    if (!response.ok) throw new Error(`Expo Push API returned HTTP ${response.status}`);
    const result = await response.json();
    for (const [index, ticket] of (result.data || []).entries()) {
      if (ticket.status === 'error') {
        logger.warn('Expo push delivery failed', { userId, details: ticket.details, message: ticket.message });
        if (ticket.details?.error === 'DeviceNotRegistered') {
          await batch[index].ref.delete();
        }
      }
    }
  }
}

exports.sendPushForNotification = onDocumentCreated(
  { document: 'notifications/{notificationId}', retry: true },
  async (event) => {
    const notification = event.data?.data();
    if (!notification?.userId) return;

    const payloadData = { type: notification.type || 'SYSTEM' };
    if (notification.type === 'MESSAGE' && notification.relatedId) {
      payloadData.threadId = notification.relatedId;
      if (notification.senderName) payloadData.participantName = notification.senderName;
    }

    await deliverExpoPush(notification.userId, {
      title: notification.title || 'HelpToYou',
      body: notification.body || 'You have a new update.',
    }, payloadData);
  },
);

exports.createMessageNotification = onDocumentCreated(
  { document: 'chatThreads/{threadId}/messages/{messageId}', retry: true },
  async (event) => {
    const message = event.data?.data();
    if (!message?.senderId) return;

    const threadSnapshot = await firestore.collection('chatThreads').doc(event.params.threadId).get();
    if (!threadSnapshot.exists) return;

    const participants = threadSnapshot.get('participants') || [];
    const senderId = message.senderId;
    const senderSnapshot = await firestore.collection('users').doc(senderId).get();
    const senderProfile = senderSnapshot.data() || {};
    const senderName = `${senderProfile.firstName || ''} ${senderProfile.lastName || ''}`.trim() || 'Someone';

    for (const recipientId of participants.filter((id) => id !== senderId)) {
      const senderBlocked = await firestore
        .collection('users').doc(recipientId).collection('blockedUsers').doc(encodeURIComponent(senderId)).get();
      const recipientBlocked = await firestore
        .collection('users').doc(senderId).collection('blockedUsers').doc(encodeURIComponent(recipientId)).get();
      if (senderBlocked.exists || recipientBlocked.exists) continue;

      const notificationRef = firestore.collection('notifications').doc(`${event.params.messageId}_${recipientId}`);
      try {
        await notificationRef.create({
          userId: recipientId,
          title: `New message from ${senderName}`,
          body: String(message.text || 'You have a new message.').slice(0, 160),
          type: 'MESSAGE',
          relatedId: event.params.threadId,
          senderName,
          isRead: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (error) {
        if (error.code !== 6 && error.code !== 'already-exists') throw error;
      }
    }
  },
);
