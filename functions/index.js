const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.deleteUserData = functions.auth.user().onDelete(async (user) => {
  const uid = user.uid;
  const db = admin.firestore();

  // Delete user profile document
  const userDocRef = db.collection('users').doc(uid);
  await userDocRef.delete();

  // Delete all predictions for this user
  const predictionsQuery = db.collection('predictions').where('userId', '==', uid);
  const predictionsSnapshot = await predictionsQuery.get();
  const batch = db.batch();
  predictionsSnapshot.forEach(doc => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  // Add more collections as needed

  console.log(`Deleted data for user: ${uid}`);
}); 