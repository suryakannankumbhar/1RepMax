import {
    collection,
    addDoc,
    serverTimestamp,
    query,
    orderBy,
    getDocs,
    doc,
    getDoc,
    setDoc,
    deleteDoc, // <-- Added deleteDoc import
} from 'firebase/firestore';
import { db } from '../config/firebase';

export async function getUserProfile(userId) {
    try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
    } catch (e) {
        console.error('Error fetching profile: ', e);
        return null;
    }
}

export async function saveUserProfile(userId, profileData) {
    try {
        const docRef = doc(db, 'users', userId);
        await setDoc(
            docRef,
            {
                ...profileData,
                updatedAt: serverTimestamp(),
            },
            { merge: true },
        );
        console.log('Profile saved for user:', userId);
    } catch (e) {
        console.error('Error saving profile: ', e);
        throw e;
    }
}

export async function saveWorkout(userId, workoutData) {
    try {
        const userWorkoutsRef = collection(db, 'users', userId, 'workouts');
        const docRef = await addDoc(userWorkoutsRef, {
            ...workoutData,
            endTime: serverTimestamp(),
            totalVolume: calculateVolume(workoutData.exercises),
        });
        console.log('Workout saved for user:', userId);
        return docRef.id;
    } catch (e) {
        console.error('Error saving workout: ', e);
        throw e;
    }
}

export async function getUserWorkouts(userId) {
    try {
        const workoutsRef = collection(db, 'users', userId, 'workouts');
        const q = query(workoutsRef, orderBy('endTime', 'desc'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (e) {
        console.error('Error fetching workouts: ', e);
        throw e;
    }
}

// --- NEW: Delete Workout Function ---
export async function deleteWorkout(userId, workoutId) {
    try {
        const docRef = doc(db, 'users', userId, 'workouts', workoutId);
        await deleteDoc(docRef);
    } catch (e) {
        console.error('Error deleting workout: ', e);
        throw e;
    }
}

// Helper function to crunch the numbers
function calculateVolume(exercises) {
    let volume = 0;
    exercises.forEach(ex => {
        ex.sets.forEach(set => {
            if (set.completed && set.weight && set.reps) {
                volume += parseFloat(set.weight) * parseInt(set.reps, 10);
            }
        });
    });
    return volume;
}
