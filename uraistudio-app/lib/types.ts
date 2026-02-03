export interface StudioUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
}

export interface Project {
  projectId: string;
  ownerUid: string;
  name: string;
  createdAt: any;
  updatedAt: any;
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  disabled: boolean;
  metadata: {
    creationTime?: string;
    lastSignInTime?: string;
  };
  role?: 'owner' | 'admin' | 'editor' | 'viewer';
  createdAt?: any; 
  updatedAt?: any;
}

