import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, MapPin, Building2, CheckCircle, XCircle, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

interface Appointment {
  id: number;
  apartment_id: number;
  renter_id: number;
  owner_id: number;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  title: string;
  location: string;
  price: number;
  owner_name?: string;
  owner_email?: string;
  renter_name?: string;
  renter_email?: string;
  image?: string;
  created_at: string;
  updated_at: string;
}

const AppointmentsPage = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);
   const handleApartmentConfirmed = useCallback((apartmentId: number) => {
    // Dispatch a custom event for ApartmentsPage to listen
    window.dispatchEvent(new CustomEvent('apartmentConfirmed', { detail: { apartmentId } }));
  }, []);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.get('/appointments');
        setAppointments(response.data);
      } catch (error: any) {
        console.error('Error fetching appointments:', error);
        setError(error.response?.data?.message || 'Failed to load appointments');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchAppointments();
    }
  }, [user]);

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/appointments/${id}`, { status });

      // If confirmed, notify ApartmentsPage to update apartment status
      if (status === 'confirmed') {
        const appointment = appointments.find(a => a.id === id);
        if (appointment) {
          handleApartmentConfirmed(appointment.apartment_id);
        }
      }

      // Update local state
      setAppointments(prevAppointments =>
        prevAppointments.map((appointment) =>
          appointment.id === id ? { ...appointment, status: status as any } : appointment
        )
      );
    } catch (error: any) {
      console.error('Error updating appointment status:', error);
      setError(error.response?.data?.message || 'Failed to update appointment status');
    }
  };

  const handleDeleteAppointment = async (id: number) => {
    try {
      await api.delete(`/appointments/${id}`);
      
      // Remove from local state
      setAppointments(prevAppointments => 
        prevAppointments.filter((appointment) => appointment.id !== id)
      );
    } catch (error: any) {
      console.error('Error deleting appointment:', error);
      setError(error.response?.data?.message || 'Failed to delete appointment');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Add to your component state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleId, setRescheduleId] = useState<number | null>(null);
  const [rescheduleError, setRescheduleError] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelAppointmentId, setCancelAppointmentId] = useState<number | null>(null);
  const filteredAppointments = appointments.filter((appointment) => 
    filter === 'all' || appointment.status === filter
  );

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-600">Please log in to view appointments.</p>
      </div>
    );
  }

return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Appointments</h1>
        <p className="text-gray-600">
          {user?.role === 'owner' 
            ? 'Manage apartment viewing appointments and requests.' 
            : 'Track your scheduled property visits and requests.'}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800 text-sm mt-2"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'pending' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('confirmed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'confirmed' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Confirmed
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'completed' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'cancelled' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cancelled
          </button>
        </div>
      </div>
      
    {showCancelModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg w-full max-w-md p-6 relative">
          <button
            onClick={() => setShowCancelModal(false)}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            <XCircle size={24} />
          </button>
          <h2 className="text-xl font-bold mb-4">Cancel Appointment</h2>
          <p className="text-gray-600 mb-6">
            Are you sure you want to cancel this appointment? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowCancelModal(false)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              No, Keep It
            </button>
            <button
              onClick={async () => {
                if (cancelAppointmentId) {
                  await handleUpdateStatus(cancelAppointmentId, 'cancelled');
                  setShowCancelModal(false);
                  setCancelAppointmentId(null);
                }
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Yes, Cancel It
            </button>
          </div>
        </div>
      </div>
    )}

    {showRescheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 relative">
            <button
              onClick={() => {
                setShowRescheduleModal(false);
                setRescheduleError('');
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <XCircle size={24} />
            </button>
            <h2 className="text-xl font-bold mb-4">Reschedule Appointment</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setRescheduleError('');
                try {
                  await api.patch(`/appointments/${rescheduleId}`, { date: rescheduleDate });
                  setAppointments(prev =>
                    prev.map(app =>
                      app.id === rescheduleId ? { ...app, date: rescheduleDate } : app
                    )
                  );
                  setShowRescheduleModal(false);
                  setRescheduleDate('');
                  setRescheduleId(null);
                } catch (error: any) {
                  setRescheduleError(error.response?.data?.message || 'Failed to reschedule appointment.');
                }
              }}
            >
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">New Date</label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                  value={rescheduleDate}
                  onChange={e => setRescheduleDate(e.target.value)}
                />
              </div>
              {rescheduleError && (
                <div className="text-red-500 text-sm mb-2">{rescheduleError}</div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRescheduleModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {filteredAppointments.length > 0 ? (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => (
                <div key={appointment.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="md:flex">
                    {appointment.image && (
                      <div className="md:w-1/6 items-center justify-center bg-gray-100 p-4">
                        <img
                            src={appointment.image}
                            alt={appointment.title}
                            className="w-full h-full object-cover rounded-lg aspect-square"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://images.pexels.com/photos/1918291/pexels-photo-1918291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';
                            }}
                          />
                      </div>
                    )}
                    
                    <div className={`p-6 ${appointment.image ? 'md:w-3/4' : 'w-full'}`}>
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{appointment.title}</h3>
                          <div className="flex items-center text-gray-500 mt-1">
                            <MapPin size={16} className="mr-1" />
                            <span className="text-sm">{appointment.location}</span>
                          </div>
                          <div className="flex items-center text-gray-500 mt-1">
                            <Building2 size={16} className="mr-1" />
                            <span className="text-sm font-medium">₱{appointment.price}/month</span>
                          </div>
                        </div>
                        
                        <div className={`rounded-full px-4 py-1 text-xs font-medium self-start ${getStatusBadgeClass(appointment.status)}`}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center">
                          <Calendar size={18} className="mr-2 text-blue-500" />
                          <div>
                            <p className="text-sm text-gray-500">Date</p>
                            <p className="font-medium">{formatDate(appointment.date)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <Clock size={18} className="mr-2 text-blue-500" />
                          <div>
                            <p className="text-sm text-gray-500">Time</p>
                            <p className="font-medium">{formatTime(appointment.time)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <User size={18} className="mr-2 text-blue-500" />
                          <div>
                            <p className="text-sm text-gray-500">
                              {user?.role === 'owner' ? 'Renter' : 'Owner'}
                            </p>
                            <p className="font-medium">
                              {user?.role === 'owner' ? appointment.renter_name : appointment.owner_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {user?.role === 'owner' ? appointment.renter_email : appointment.owner_email}
                            </p>
                          </div>
                        </div>
                      </div>

                      {appointment.notes && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">
                            <strong>Notes:</strong> {appointment.notes}
                          </p>
                        </div>
                      )}
                      
                      {/* Action buttons based on status and user role */}
                      {appointment.status === 'pending' && (
                      <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
                        {user?.role === 'owner' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(appointment.id, 'confirmed')}
                              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:ring-2 focus:ring-green-300 flex items-center gap-2 transition-colors"
                            >
                              <CheckCircle size={18} />
                              Confirm
                            </button>
                            <button
                              onClick={() => {
                                setCancelAppointmentId(appointment.id);
                                setShowCancelModal(true);
                              }}
                              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:ring-2 focus:ring-red-300 flex items-center gap-2 transition-colors"
                            >
                              <XCircle size={18} />
                              Cancel
                            </button>
                          </>
                        )}

                        {user?.role === 'renter' && (
                          <>
                            <button
                              onClick={() => {
                                setCancelAppointmentId(appointment.id);
                                setShowCancelModal(true);
                              }}
                              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:ring-2 focus:ring-red-300 flex items-center gap-2 transition-colors"
                            >
                              <XCircle size={18} />
                              Cancel Request
                            </button>
                            <button
                              onClick={() => {
                                setRescheduleId(appointment.id);
                                setRescheduleDate(appointment.date);
                                setShowRescheduleModal(true);
                              }}
                              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 focus:ring-2 focus:ring-yellow-300 flex items-center gap-2 transition-colors"
                            >
                              <Calendar size={18} />
                              Reschedule
                            </button>
                          </>
                        )}
                      </div>
                    )}
                      
                      {appointment.status === 'confirmed' && user?.role === 'owner' && (
                        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
                          <button
                            onClick={() => handleUpdateStatus(appointment.id, 'completed')}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-300 flex items-center gap-2 transition-colors"
                          >
                            <CheckCircle size={18} />
                            Mark as Completed
                          </button>
                          <button
                            onClick={() => {
                              setCancelAppointmentId(appointment.id);
                              setShowCancelModal(true);
                            }}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:ring-2 focus:ring-red-300 flex items-center gap-2 transition-colors"
                          >
                            <XCircle size={18} />
                            Cancel
                        </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="mb-4">
                <Calendar size={48} className="mx-auto text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No appointments found</h3>
              <p className="text-gray-600 mb-6">
                {filter !== 'all'
                  ? `You don't have any ${filter} appointments.`
                  : user?.role === 'owner'
                  ? 'You don\'t have any viewing requests or appointments scheduled yet.'
                  : 'You haven\'t scheduled any apartment viewings yet.'}
              </p>
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Show All Appointments
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AppointmentsPage;