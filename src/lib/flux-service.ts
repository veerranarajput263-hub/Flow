import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp,
  increment,
  addDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const fluxService = {
  // User profile
  async ensureUser() {
    const user = auth.currentUser;
    if (!user) return;

    const userDoc = doc(db, 'users', user.uid);
    const snap = await getDoc(userDoc);
    
    if (!snap.exists()) {
      try {
        await setDoc(userDoc, {
          displayName: user.displayName || 'Creator',
          photoURL: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
          bio: 'Welcome to Flux!',
          followersCount: 0,
          followingCount: 0,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      }
    }
  },

  // Posts
  async createPost(post: { type: string, contentUrl: string, title: string, description: string, prompt?: string, tags: string[] }) {
    const user = auth.currentUser;
    if (!user) throw new Error('Unauthorized');

    try {
      await addDoc(collection(db, 'posts'), {
        ...post,
        creatorId: user.uid,
        creatorName: user.displayName,
        creatorPhoto: user.photoURL,
        likesCount: 0,
        remixCount: 0,
        forkCount: 0,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'posts');
    }
  },

  subscribeToFeed(callback: (posts: any[]) => void) {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
    return onSnapshot(q, (snap) => {
      const posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(posts);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'posts');
    });
  },

  async likePost(postId: string) {
    const user = auth.currentUser;
    if (!user) return;

    const likeId = `${user.uid}_${postId}`;
    const likeDoc = doc(db, 'likes', likeId);
    const postDoc = doc(db, 'posts', postId);

    try {
      const likeSnap = await getDoc(likeDoc);
      if (!likeSnap.exists()) {
        await setDoc(likeDoc, { userId: user.uid, postId, createdAt: serverTimestamp() });
        await updateDoc(postDoc, { likesCount: increment(1) });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `likes/${likeId}`);
    }
  },

  async forkPost(postId: string) {
    // Increment fork count
    const postDoc = doc(db, 'posts', postId);
    try {
      await updateDoc(postDoc, { forkCount: increment(1) });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `posts/${postId}`);
    }
  }
};
