import { Link } from 'react-router-dom';
import { Search, Filter, PlusCircle, MapPin, Bed, Bath, Square, ArrowUpDown, Building2, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import React, { useState, useEffect, useMemo,useCallback } from 'react';

const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return [debouncedValue];
};

const ApartmentsPage = () => {
  const { user } = useAuth();
  const [apartments, setApartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const handleAppointmentConfirmed = useCallback((apartmentId) => {
  setApartments(prev =>
    prev.map(apartment =>
      apartment.id === apartmentId
        ? { ...apartment, status: 'unavailable', is_available: false }
        : apartment
    )
  );
}, []);

  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    bathrooms: '',
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newApartment, setNewApartment] = useState({
    title: '',
    description: '',
    location: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    images: []
  });
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedApartment, setSelectedApartment] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [editingApartment, setEditingApartment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsApartment, setDetailsApartment] = useState(null);
 
  useEffect(() => {
    if (showBookingModal) {
      setBookingDate('');
      setNotes('');
      setBookingError('');
    }
  }, [showBookingModal, selectedApartment]);


  useEffect(() => {
    const fetchApartments = async () => {
      try {
        setIsLoading(true);
        setError('');
        const endpoint = user?.role === 'owner' ? '/apartments/owner/properties' : '/apartments';
        const response = await api.get(endpoint);

        if (response.data && Array.isArray(response.data)) {
          setApartments(response.data);
        }
      } catch (error) {
        console.error('Error fetching apartments:', error);
        setError('Failed to load apartments. Please try again later.');
        setApartments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApartments();
  }, [user?.role]);
  
  useEffect(() => {
    const listener = (e: any) => {
      if (e.detail?.apartmentId) {
        handleAppointmentConfirmed(e.detail.apartmentId);
      }
    };
    window.addEventListener('apartmentConfirmed', listener);
    return () => window.removeEventListener('apartmentConfirmed', listener);
  }, [handleAppointmentConfirmed]);


  // Filter and sort apartments
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  const filteredApartments = useMemo(() => {
    return apartments
      .filter((apartment) => {
        const matchesSearch = !debouncedSearchTerm || 
          apartment.title?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          apartment.location?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
        const matchesMinPrice = !filters.minPrice || apartment.price >= parseInt(filters.minPrice);
        const matchesMaxPrice = !filters.maxPrice || apartment.price <= parseInt(filters.maxPrice);
        const matchesBedrooms = !filters.bedrooms || apartment.bedrooms >= parseInt(filters.bedrooms);
        const matchesBathrooms = !filters.bathrooms || apartment.bathrooms >= parseInt(filters.bathrooms);
        return matchesSearch && matchesMinPrice && matchesMaxPrice && matchesBedrooms && matchesBathrooms;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'price-asc':
            return a.price - b.price;
          case 'price-desc':
            return b.price - a.price;
          case 'newest':
            return new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime();
          default:
            return 0;
        }
      });
  }, [apartments, debouncedSearchTerm, filters, sortBy]);

console.log('Filtered Apartments:', filteredApartments); // Log filtered apartments

  const handleAddApartment = async (e) => {
    e.preventDefault();
    setFormError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', newApartment.title);
      formData.append('description', newApartment.description);
      formData.append('location', newApartment.location);
      formData.append('price', newApartment.price);
      formData.append('bedrooms', newApartment.bedrooms);
      formData.append('bathrooms', newApartment.bathrooms);
      formData.append('area', newApartment.area);
      newApartment.images.forEach((image) => {
        formData.append('images', image);
      });

      await api.post('/apartments', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const response = await api.get('/apartments');
      setApartments(response.data);
      setShowAddModal(false);
      setNewApartment({
        title: '',
        description: '',
        location: '',
        price: '',
        bedrooms: '',
        bathrooms: '',
        area: '',
        images: []
      });
    } catch (error) {
      setFormError(error.response?.data?.message || 'Failed to add apartment. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setNewApartment({ ...newApartment, images: files });
  };

  const handleDeleteApartment = async (apartmentId) => {
    if (!window.confirm('Are you sure you want to delete this apartment?')) return;
    try {
      await api.delete(`/apartments/${apartmentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      // Refresh list
      const endpoint = user?.role === 'owner' ? '/apartments/owner/properties' : '/apartments';
      const response = await api.get(endpoint);
      setApartments(response.data);
    } catch (err) {
      setError('Failed to delete apartment. Please try again.');
    }
  };
  
  const handleToggleAvailability = async (apartmentId, isAvailable) => {
    try {
      await api.put(
        `/apartments/${apartmentId}`,
        { is_available: isAvailable },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      const endpoint = user?.role === 'owner' ? '/apartments/owner/properties' : '/apartments';
      const response = await api.get(endpoint);
      setApartments(response.data);
    } catch (error) {
      setError('Failed to update availability. Please try again.');
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setBookingError('');
    try {
      await api.post('/appointments', {
        apartment_id: selectedApartment,
        date: bookingDate,
        notes: notes,
        user_id: user.id
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        }
      });
      setShowBookingModal(false);
      setBookingDate('');
      setNotes('');
      alert('Appointment booked successfully!');
    } catch (error) {
      setBookingError(error.response?.data?.message || 'Failed to book appointment. Please try again.');
    }
  };


  const clearFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      bathrooms: '',
    });
    setSearchTerm('');
  };

  const getApartmentImage = (apartment) => {
    const fallback = `${import.meta.env.VITE_API_URL}/uploads/apartments/default-apartment.jpg`;

      if (apartment?.primary_image?.startsWith('http')) {
      return apartment.primary_image;
    }

    // Otherwise, construct the URL using the base URL
    if (!apartment?.primary_image || apartment.primary_image === 'default-apartment.jpg') {
      return fallback;
    }

    return `${import.meta.env.VITE_API_URL}/uploads/apartments/${apartment.primary_image}`;
  };

  // Add Apartment Modal
  const AddApartmentModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-lg p-6 relative">
        <button
          onClick={() => setShowAddModal(false)}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold mb-4">Add New Apartment</h2>
        <form onSubmit={handleAddApartment}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border rounded-lg"
                value={newApartment.title}
                onChange={(e) => setNewApartment({ ...newApartment, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                required
                className="w-full px-3 py-2 border rounded-lg"
                value={newApartment.description}
                onChange={(e) => setNewApartment({ ...newApartment, description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border rounded-lg"
                value={newApartment.location}
                onChange={(e) => setNewApartment({ ...newApartment, location: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Price (₱/month)</label>
                <input
                  type="number"
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                  value={newApartment.price}
                  onChange={(e) => setNewApartment({ ...newApartment, price: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Area (sq ft)</label>
                <input
                  type="number"
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                  value={newApartment.area}
                  onChange={(e) => setNewApartment({ ...newApartment, area: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Bedrooms</label>
                <input
                  type="number"
                  required
                  min="0"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={newApartment.bedrooms}
                  onChange={(e) => setNewApartment({ ...newApartment, bedrooms: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bathrooms</label>
                <input
                  type="number"
                  required
                  min="0"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={newApartment.bathrooms}
                  onChange={(e) => setNewApartment({ ...newApartment, bathrooms: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Images</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <p className="text-sm text-gray-500 mt-1">Upload up to 10 images</p>
            </div>
            {formError && (
              <div className="text-red-500 text-sm mt-2">{formError}</div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                disabled={uploading}
              >
                {uploading ? 'Saving...' : 'Save Apartment'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  // Edit Apartment Modal
  const EditApartmentModal = ({ apartment, onClose, onUpdate }) => {
    const [editedApartment, setEditedApartment] = useState(apartment);
    const [newImages, setNewImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [formError, setFormError] = useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      setFormError('');
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('title', editedApartment.title ?? null);
        formData.append('description', editedApartment.description ?? null);
        formData.append('location', editedApartment.location ?? null);
        formData.append('price', editedApartment.price ?? null);
        formData.append('bedrooms', editedApartment.bedrooms ?? null);
        formData.append('bathrooms', editedApartment.bathrooms ?? null);
        formData.append('area', editedApartment.area ?? null);
        formData.append('is_available', editedApartment.is_available ?? null);
        newImages.forEach((image) => {
          formData.append('images', image);
        });
        await api.put(`/apartments/${apartment.id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        onUpdate();
        onClose();
      } catch (error) {
        setFormError(error.response?.data?.message || 'Failed to update apartment.');
      } finally {
        setUploading(false);
      }
    };

    const handleFileChange = (e) => {
      const files = Array.from(e.target.files);
      setNewImages(files);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg w-full max-w-lg p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
          <h2 className="text-2xl font-bold mb-4">Edit Apartment</h2>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* All fields, pre-filled */}
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                  value={editedApartment.title}
                  onChange={(e) => setEditedApartment({ ...editedApartment, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                  value={editedApartment.description}
                  onChange={(e) => setEditedApartment({ ...editedApartment, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                  value={editedApartment.location}
                  onChange={(e) => setEditedApartment({ ...editedApartment, location: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price (₱/month)</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                    value={editedApartment.price}
                    onChange={(e) => setEditedApartment({ ...editedApartment, price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Area (sq ft)</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                    value={editedApartment.area}
                    onChange={(e) => setEditedApartment({ ...editedApartment, area: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Bedrooms</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full px-3 py-2 border rounded-lg"
                    value={editedApartment.bedrooms}
                    onChange={(e) => setEditedApartment({ ...editedApartment, bedrooms: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bathrooms</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full px-3 py-2 border rounded-lg"
                    value={editedApartment.bathrooms}
                    onChange={(e) => setEditedApartment({ ...editedApartment, bathrooms: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Add New Images</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <p className="text-sm text-gray-500 mt-1">Select additional images to upload</p>
              </div>
              {formError && <div className="text-red-500 text-sm">{formError}</div>}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  disabled={uploading}
                >
                  {uploading ? 'Updating...' : 'Update Apartment'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  };
  const ApartmentDetailsModal = ({ apartment, onClose }) => {
    if (!apartment) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-0 relative overflow-hidden animate-fade-in">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-3xl z-10 transition-colors"
            aria-label="Close"
          >
            &times;
          </button>
          <div className="w-full h-64 bg-gray-100 relative">
            <img
              src={getApartmentImage(apartment)}
              alt={apartment.title || 'Apartment'}
              className="w-full h-full object-cover rounded-t-2xl"
            />
            <span className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs shadow">
              ₱{apartment.price}/month
            </span>
          </div>
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-2 text-gray-800">{apartment.title}</h2>
            <div className="flex items-center text-gray-500 mb-4">
              <MapPin size={18} className="mr-2" />
              <span className="text-base">{apartment.location}</span>
            </div>
            <p className="text-gray-700 mb-6 leading-relaxed border-l-4 border-blue-100 pl-4 italic">
              {apartment.description}
            </p>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="flex flex-col items-center">
                <Bed size={24} className="text-blue-500 mb-1" />
                <span className="text-sm text-gray-600">{apartment.bedrooms === 0 ? 'Studio' : `${apartment.bedrooms} Bed`}</span>
              </div>
              <div className="flex flex-col items-center">
                <Bath size={24} className="text-blue-500 mb-1" />
                <span className="text-sm text-gray-600">{apartment.bathrooms} Bath</span>
              </div>
              <div className="flex flex-col items-center">
                <Square size={24} className="text-blue-500 mb-1" />
                <span className="text-sm text-gray-600">{apartment.area} sq ft</span>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  // Booking Modal
  const BookingModal = () => {
    const apartment = apartments.find(a => a.id === selectedApartment);

    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-100/80 via-white/90 to-blue-200/80 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-0 relative overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-blue-400">
            <div className="bg-white rounded-full p-2 shadow">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10m-9 4h6m-7 4h8" />
              </svg>
            </div>
            <span className="text-white text-lg font-semibold tracking-wide">Book an Appointment</span>
            <button
              onClick={() => {
                setShowBookingModal(false);
                setBookingError('');
              }}
              className="ml-auto text-white hover:text-red-200 text-2xl font-bold transition-colors"
              aria-label="Close"
            >
              <X size={28} />
            </button>
          </div>
          {/* Apartment summary */}
          {apartment && (
            <div className="flex items-center gap-4 px-6 py-4 border-b bg-blue-50">
              <img
                src={getApartmentImage(apartment)}
                alt={apartment.title || 'Apartment'}
                className="w-16 h-16 object-cover rounded-lg border"
              />
              <div>
                <div className="font-semibold text-blue-900">{apartment.title}</div>
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <MapPin size={14} /> {apartment.location}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  ₱{apartment.price}/month &bull; {apartment.bedrooms === 0 ? 'Studio' : `${apartment.bedrooms} Bed`} &bull; {apartment.bathrooms} Bath
                </div>
              </div>
            </div>
          )}
          {/* Form */}
          <form
            className="px-6 py-6"
            onSubmit={async (e) => {
              e.preventDefault();
              setBookingError('');
              try {
                await api.post('/appointments', {
                  apartment_id: selectedApartment,
                  date: bookingDate,
                  notes: notes,
                });
                setShowBookingModal(false);
                setBookingDate('');
                setNotes('');
                alert('Appointment booked successfully!');
              } catch (error) {
                setBookingError(error.response?.data?.message || 'Failed to book appointment. Please try again.');
              }
            }}
          >
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1 text-blue-900">Date <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition pl-10"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-blue-900">Notes</label>
                <textarea
                  className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition resize-none"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes for the owner"
                  rows={3}
                  maxLength={300}
                />
                <div className="text-xs text-gray-400 text-right mt-1">{notes.length}/300</div>
              </div>
              {bookingError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                  {bookingError}
                </div>
              )}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-5 py-2 border border-blue-300 rounded-lg bg-white text-blue-700 hover:bg-blue-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-semibold shadow hover:from-blue-700 hover:to-blue-600 transition"
                >
                  Book Appointment
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">Apartments</h1>
          <p className="text-gray-600">
            {user?.role === 'owner'
              ? 'Manage your property listings and view inquiries.'
              : 'Browse available apartments and schedule visits.'}
          </p>
        </div>
        {user?.role === 'owner' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            <PlusCircle size={18} />
            <span>Add New Apartment</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search by title or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="newest">Newest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
              <ArrowUpDown size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <Filter size={18} />
              <span>Filters</span>
            </button>
          </div>
        </div>
        {showFilters && (
          <div className="mt-4 pt-4 border-t">
            {/* ...filter fields as in your code... */}
            {/* ... */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredApartments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">        
            {filteredApartments.map((apartment) => (
                <div key={apartment.id}>
                  <div
                     onClick={() => {
                        setDetailsApartment(apartment);
                        setShowDetailsModal(true);
                      }}
                      className="group cursor-pointer h-(520px)"
                    >
                    <div className="w-full h-full flex flex-col bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 group-hover:shadow-md group-hover:transform group-hover:translate-y1">
                      <img
                        src={getApartmentImage(apartment)}
                        alt={apartment.title || 'Apartment'}
                        className="w-30 h-60 object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          console.error('Image failed to load:', target.src); // Log the failed URL
                          if (!target.src.includes('default-apartments.jpg')) {
                            target.src = `https://images.pexels.com/photos/1918291/pexels-photo-1918291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1`;
                          }
                        }}
                      />
                      {user?.role === 'owner' && (
                        <div className="p-4 border-b">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">Status:</span>
                                <select
                                  onClick={e => e.stopPropagation()}
                                  className={`
                                    border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-400
                                    ${apartment.status === 'available' && 'bg-green-50 border-green-400 text-green-700'}
                                    ${apartment.status === 'unavailable' && 'bg-red-50 border-red-400 text-red-700'}
                                    ${apartment.status === 'maintenance' && 'bg-yellow-50 border-yellow-400 text-yellow-700'}
                                  `}
                                  value={apartment.status || 'available'}
                                  onChange={async (e) => {
                                    const newStatus = e.target.value;
                                    try {
                                      await api.patch(
                                        `/apartments/${apartment.id}/status`,
                                        { status: newStatus },
                                        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
                                      );
                                      // Refresh the apartment list
                                      const response = await api.get('/apartments/owner/properties');
                                      setApartments(response.data);
                                    } catch (err) {
                                      alert('Failed to update status.');
                                    }
                                  }}
                                >
                                  <option value="available">Available</option>
                                  <option value="unavailable">Unavailable</option>
                                  <option value="maintenance">Maintenance</option>
                                </select>
                                <span
                                  onClick={e => e.stopPropagation()}
                                  className={`
                                    ml-2 px-2 py-0.5 rounded-full text-xs font-semibold
                                    ${apartment.status === 'available' && 'bg-green-100 text-green-700'}
                                    ${apartment.status === 'unavailable' && 'bg-red-100 text-red-700'}
                                    ${apartment.status === 'maintenance' && 'bg-yellow-100 text-yellow-700'}
                                  `}
                                >
                                  {apartment.status ? apartment.status.charAt(0).toUpperCase() + apartment.status.slice(1) : 'Available'}
                                </span>
                            </div>
                          </div>
                          <div className="flex justify-end gap-3 mt-4">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setEditingApartment(apartment);
                              }}
                              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold shadow hover:from-blue-600 hover:to-blue-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2h6" />
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm('Are you sure you want to delete this apartment?')) {
                                  try {
                                    await api.delete(`/apartments/${apartment.id}`, {
                                      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                                    });
                                    alert('Apartment deleted successfully!');
                                    // Refresh the apartment list
                                    const response = await api.get('/apartments/owner/properties');
                                    setApartments(response.data);
                                  } catch (error) {
                                    console.error('Error deleting apartment:', error);
                                    alert('Failed to delete apartment. Please try again.');
                                  }
                                }
                              }}
                              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-red-500 to-red-700 text-white font-semibold shadow hover:from-red-600 hover:to-red-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Delete
                            </button>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            Appointments: {apartment.appointment_count || 0}
                          </div>
                        </div>
                      )}
                        <div className="p-4">
                          <h3 className="font-semibold text-lg mb-2">{apartment.title}</h3>
                          <div className="flex items-center text-gray-500 mb-3">
                            <MapPin size={16} className="mr-1" />
                            <span className="text-sm">{apartment.location}</span>
                          </div>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {apartment.description}
                          </p>
                          <div className="flex items-center justify-between border-t pt-3">
                            <div className="flex items-center text-sm text-gray-600">
                              <Bed size={16} className="mr-1" />
                              <span>
                                {apartment.bedrooms === 0 ? 'Studio' : `${apartment.bedrooms} Bed`}
                              </span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Bath size={16} className="mr-1" />
                              <span>{apartment.bathrooms} Bath</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Square size={16} className="mr-1" />
                              <span>{apartment.area} sq ft</span>
                            </div>
                          </div>
                        </div>
                    </div>
                  </div>
                  {/* Book Appointment button for renters, OUTSIDE the Link */}
                  {user?.role === 'renter' && (
                    <button
                      className={`w-full mt-2 px-5 py-2 rounded-full font-semibold shadow transition-all duration-200 ${
                        apartment.status === 'unavailable' || !apartment.is_available
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:from-blue-600 hover:to-blue-800'
                      }`}
                      onClick={() => {
                        if (apartment.status !== 'unavailable' && apartment.is_available) {
                          setSelectedApartment(apartment.id);
                          setShowBookingModal(true);
                        }
                      }}
                      disabled={apartment.status === 'unavailable' || !apartment.is_available}
                    >
                      {apartment.status === 'unavailable' || !apartment.is_available ? 'Already Rented' : (
                        <span className="inline-flex items-center gap-2">
                          {/* ... */}
                          Book Appointment
                        </span>
                      )}
                    </button>
                  )}
              </div>
            ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="mb-4">
            <Building2 size={48} className="mx-auto text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No apartments found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || Object.values(filters).some(Boolean)
              ? 'No apartments match your current filters. Try adjusting your search criteria.'
              : user?.role === 'owner'
                ? "You haven't added any apartments yet. Start by adding your first property listing."
                : 'There are no apartments available at the moment. Please check back later.'}
          </p>
          {(searchTerm || Object.values(filters).some(Boolean)) ? (
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Clear All Filters
            </button>
          ) : user?.role === 'owner' ? (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              <PlusCircle size={18} />
              <span>Add New Apartment</span>
            </button>
          ) : null}
        </div>
      )}

      {/* Modals */}
      {showDetailsModal && detailsApartment && (
        <ApartmentDetailsModal
          apartment={detailsApartment}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
      {showAddModal && <AddApartmentModal />}
      {showBookingModal && <BookingModal />}
      {editingApartment && (
        <EditApartmentModal
          apartment={editingApartment}
          onClose={() => setEditingApartment(null)}
          onUpdate={async () => {
            const endpoint = user?.role === 'owner' ? '/apartments/owner/properties' : '/apartments';
            const response = await api.get(endpoint);
            setApartments(response.data);
          }}
        />
      )}
    </div>
  );
};

export default ApartmentsPage;