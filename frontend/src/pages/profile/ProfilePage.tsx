import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Building2, MapPin, Bed, Bath, Square, Edit } from 'lucide-react';

const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(user);
  const [editing, setEditing] = useState(false);
  const [recentRented, setRecentRented] = useState([]);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {

    // Fetch user profile on mount
    const fetchProfile = async () => {
        const res = await api.get('/auth/profile', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setProfile(res.data);
    };
    // Fetch recent rented apartments for this renter
    const fetchRecentRented = async () => {
      try {
        const res = await api.get('/apartments/rented-by-me', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setRecentRented(res.data || []);
      } catch (err) {
        setRecentRented([]);
      }
    };
    if (user?.role === 'renter') fetchRecentRented();
  }, [user]);

  // For updating profile
    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setSuccessMsg('');
        try {
            const res = await api.put('/auth/profile', profile, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setUser(res.data);
            setSuccessMsg('Profile updated successfully!');
            setEditing(false);
        } catch (err: any) {
            setFormError(err.response?.data?.message || 'Failed to update profile.');
        }
    };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">My Profile</h1>
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="flex items-center gap-4">
            <div>
              <div className="font-semibold text-lg">{profile?.name}</div>
              <div className="text-gray-500">{profile?.email}</div>
              <div className="text-gray-400 text-sm capitalize">{profile?.role}</div>
            </div>
            <button
              type="button"
              className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              onClick={() => setEditing((v) => !v)}
            >
              <Edit size={16} className="inline mr-1" />
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>
          {editing && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={profile.name}
                  onChange={e => setProfile({ ...profile, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={profile.email}
                  onChange={e => setProfile({ ...profile, email: e.target.value })}
                  required
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Save Changes
              </button>
              {formError && <div className="text-red-500 text-sm mt-2">{formError}</div>}
              {successMsg && <div className="text-green-600 text-sm mt-2">{successMsg}</div>}
            </>
          )}
        </form>
      </div>

      {user?.role === 'renter' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Recently Rented Apartments</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {recentRented.length > 0 ? recentRented.map((apt: any) => (
              <div key={apt.id} className="border rounded-lg shadow p-4 flex flex-col">
                <img
                  src={apt.primary_image || 'https://images.pexels.com/photos/1918291/pexels-photo-1918291.jpeg?auto=compress&cs=tinysrgb&w=600'}
                  alt={apt.title}
                  className="w-full h-32 object-cover rounded mb-3"
                />
                <h3 className="font-semibold text-lg mb-1">{apt.title}</h3>
                <div className="flex items-center text-gray-500 mb-2">
                  <MapPin size={16} className="mr-1" />
                  <span className="text-sm">{apt.location}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                  <Bed size={16} /> {apt.bedrooms} Bed
                  <Bath size={16} /> {apt.bathrooms} Bath
                  <Square size={16} /> {apt.area} sq ft
                </div>
                <span className="font-bold text-blue-700">₱{apt.price}/month</span>
              </div>
            )) : (
              <div className="text-gray-500 col-span-2 text-center py-8">
                No apartments rented yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;