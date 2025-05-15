'use client';

import React, { useState, useEffect, useCallback } from 'react';
import bcrypt from 'bcryptjs';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface User {
  id: string;
  name: string | null;
  username: string;
  password: string;
  role: {
    id: string;
    name: string;
  };
  roleId: string;
  createdAt: Date;
  updatedAt: Date;
}

const UsersPage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [manageMessage, setManageMessage] = useState<string | null>(null);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.role !== 'admin' && session?.user?.role !== '749ba017-4ab7-47a0-928e-efcf6d1c343f') {
      router.push('/dashboard');
    }
  }, [session?.user?.role, router]);

  const fetchUsers = useCallback(async () => {
    const response = await fetch('/api/users');
    const users = await response.json();
    setUsers(users);
  }, []);

  const fetchRoles = useCallback(async () => {
    const response = await fetch('/api/roles');
    const roles = await response.json();
    setRoles(roles);
  }, []);

  useEffect(() => {
    fetchRoles();
    fetchUsers();
  }, [fetchRoles, fetchUsers]);

  // Helper function to get role name
  const getRoleName = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) {
      return roleId;
    }
    return role.name;
  };

  // Helper function to get role ID from name
  const getRoleId = (roleName: string) => {
    const role = roles.find(r => r.name === roleName);
    if (!role) {
      return roleName;
    }
    return role.id;
  };

  const createUser = useCallback(async () => {
    setCreateMessage(null);

    // Validation: username longer than 4 characters and not only numbers
    if (username.length <= 4) {
      setCreateMessage('Username must be longer than 4 characters.');
      return;
    }
    if (/^\d+$/.test(username)) {
      setCreateMessage('Username cannot be only numbers.');
      return;
    }

    // Validation: password longer than 6 characters
    if (password.length <= 6) {
      setCreateMessage('Password must be longer than 6 characters.');
      return;
    }

    // Validation: role must be selected
    if (!selectedRole) {
      setCreateMessage('Please select a role.');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password, roleId: selectedRole }),
    });
    setLoading(false);
    if (res.ok) {
      setCreateMessage('User created successfully!');
      setUsername('');
      setPassword('');
      await fetchUsers();
    } else {
      const err = await res.json();
      if (err.error === 'User already exists') {
        setCreateMessage('User already exists.');
      } else {
        setCreateMessage(err.error || 'Failed to create user');
      }
    }
  }, [username, password, selectedRole, fetchUsers]);

  const deleteUser = async (userId: string) => {
    setManageMessage(null);
    setLoading(true);
    const res = await fetch(`/api/users?id=${userId}`, {
      method: 'DELETE',
    });
    setLoading(false);
    if (res.ok) {
      setManageMessage('User deleted successfully!');
      await fetchUsers();
    } else {
      setManageMessage('Failed to delete user');
    }
  };

  const changeUserRole = async (userId: string, newRoleId: string) => {
    setManageMessage(null);
    setLoading(true);
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roleId: newRoleId }),
    });
    setLoading(false);
    if (res.ok) {
      setManageMessage('Role updated successfully!');
      await fetchUsers();
    } else {
      const err = await res.json();
      setManageMessage(err.error || 'Failed to update role');
    }
  };

  const changeUserPassword = async (userId: string) => {
    const newPassword = prompt('Enter new password:');
    if (!newPassword) return;

    setManageMessage(null);
    setLoading(true);
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: newPassword }),
    });
    setLoading(false);
    if (res.ok) {
      setManageMessage('Password updated successfully!');
    } else {
      const err = await res.json();
      setManageMessage(err.error || 'Failed to update password');
    }
  };

  const deleteRole = async (roleId: string) => {
    setManageMessage(null);
    setLoading(true);
    const res = await fetch(`/api/roles/${roleId}`, {
      method: 'DELETE',
    });
    setLoading(false);
    if (res.ok) {
      setManageMessage('Role deleted successfully!');
      await fetchRoles();
      await fetchUsers();
    } else {
      setManageMessage('Failed to delete role');
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto' }}>
      <h1>Manage Users</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {users.map((user) => {
          const roleName = getRoleName(user.roleId);
          return (
            <div key={user.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{user.username}</div>
                <div style={{ color: '#888', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>Role: {roleName}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                <select
                  value={user.roleId}
                  onChange={e => changeUserRole(user.id, e.target.value)}
                  style={{ padding: '0.3rem 0.7rem', borderRadius: 6 }}
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
                <button className="btn btn-delete" style={{ minWidth: '120px' }} onClick={() => deleteUser(user.id)} disabled={loading}>
                  Delete User
                </button>
                <button className="btn" style={{ minWidth: '120px' }} onClick={() => changeUserPassword(user.id)} disabled={loading}>
                  Change Password
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {manageMessage && (
        <div style={{
          marginTop: '1rem',
          color: manageMessage.includes('success') ? '#009846' : '#e53935',
          fontSize: '0.95rem',
          textAlign: 'center'
        }}>
          {manageMessage}
        </div>
      )}
      <h1>Create User</h1>
      <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '2rem' }}>
          <label htmlFor="username" style={{ color: '#333', fontWeight: 500 }}>Username</label>
          <input
            id="username"
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input-field"
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '2rem' }}>
          <label htmlFor="password" style={{ color: '#333', fontWeight: 500 }}>Password</label>
          <input
            id="password"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="role" style={{ color: '#333', fontWeight: 500 }}>Role</label>
          <select
            id="role"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="input-field"
          >
            <option value="">Select a role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
        <button
          className="btn"
          onClick={createUser}
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create User'}
        </button>
        {createMessage && (
          <div style={{
            marginTop: '0.5rem',
            color: createMessage.includes('success') ? '#009846' : '#e53935',
            fontSize: '0.95rem',
            textAlign: 'center'
          }}>
            {createMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
