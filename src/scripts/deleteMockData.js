import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

export const deleteMockData = async (userId) => {
  try {
    // Get all predictions for the current user
    const predictionsQuery = query(collection(db, 'predictions'), where('userId', '==', userId));
    const querySnapshot = await getDocs(predictionsQuery);
    
    // Delete each prediction document
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    // Reset the counter
    await deleteDoc(doc(db, 'metadata', 'counters'));
    
    console.log('Successfully deleted all mock data!');
    return true;
  } catch (error) {
    console.error('Error deleting mock data:', error);
    return false;
  }
}; 