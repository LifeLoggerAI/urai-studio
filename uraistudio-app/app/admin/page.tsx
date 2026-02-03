'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { AppUser } from '@/lib/types';

// Placeholder for a toast component
const useToast = () => {
  const toast = ({ title, description, variant }: { title: string, description: string, variant?: 'destructive' | 'default' }) => {
    alert(`${title}: ${description}`);
  }
  return { toast };
}

const listUsers = httpsCallable(getFunctions(), 'listUsers');
const updateUserRole = httpsCallable(getFunctions(), 'updateUserRole');
const setUserDisabledStatus = httpsCallable(getFunctions(), 'setUserDisabledStatus');

function UserTable({ users, refreshUsers }: { users: AppUser[], refreshUsers: () => void }) {
  const { toast } = useToast();
  const { studioUser } = useAuth();

  const handleRoleChange = async (targetUid: string, newRole: string) => {
    try {
      await updateUserRole({ targetUid, newRole });
      toast({ title: "Success", description: "User role updated successfully." });
      refreshUsers();
    } catch (error: any) {
      console.error(error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDisableToggle = async (targetUid: string, disabled: boolean) => {
    try {
      await setUserDisabledStatus({ targetUid, disabled });
      toast({ title: "Success", description: `User ${disabled ? 'disabled' : 'enabled'} successfully.` });
      refreshUsers();
    } catch (error: any) {
      console.error(error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.uid}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <img className="h-10 w-10 rounded-full" src={user.photoURL || ''} alt="" />
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{user.displayName}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <select 
                  defaultValue={user.role}
                  onChange={(e) => handleRoleChange(user.uid, e.target.value)}
                  disabled={studioUser?.uid === user.uid || (user.role === 'owner' && studioUser?.role !== 'owner')}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                  {studioUser?.role === 'owner' && <option value="owner">Owner</option>}
                </select>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.disabled ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {user.disabled ? 'Disabled' : 'Active'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button 
                  onClick={() => handleDisableToggle(user.uid, !user.disabled)}
                  disabled={studioUser?.uid === user.uid}
                  className="text-indigo-600 hover:text-indigo-900 disabled:text-gray-400"
                >
                  {user.disabled ? 'Enable' : 'Disable'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminPage() {
  const { user, studioUser, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await listUsers();
      setUsers(result.data as AppUser[]);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && user) {
        if (studioUser?.role === 'owner' || studioUser?.role === 'admin') {
            fetchUsers();
        } else {
            setIsLoading(false);
        }
    }
  }, [user, studioUser, loading]);

  if (loading || isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  if (studioUser?.role !== 'owner' && studioUser?.role !== 'admin') {
    return (
      <div>
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button onClick={fetchUsers} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            Refresh Users
        </button>
      </div>
      {error && <p className="text-red-500">Error: {error}</p>}
      <UserTable users={users} refreshUsers={fetchUsers} />
    </div>
  );
}
