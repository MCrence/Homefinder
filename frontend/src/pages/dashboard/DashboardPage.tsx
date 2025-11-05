import React from 'react';
import { useState, useEffect } from 'react';
import { Calendar, Building2, Clock, Users, Heart, Search, Bookmark, Home, MapPin, Bed, Square, Bath } from 'lucide-react'; // Add Home icon
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    appointments: 0,
    apartments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    savedApartments: 0,
    viewedApartments: 0,
    totalApartments: 0,
  });
  const [popularApartments, setPopularApartments] = useState([]);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/dashboard');
        setStats(response.data.stats);
        setRecentAppointments(response.data.recentAppointments || []);
        if (user?.role === 'renter') {
          // Fetch popular/recently rented apartments for renters
          const popRes = await api.get('/apartments/popular');
          setPopularApartments(popRes.data || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

    // Guard against undefined user
    if (!user) {
      return (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">User data is not available. Please log in again.</p>
        </div>
      );
    }

  // Owner dashboard cards
  const ownerStatsCards = [
    {
      title: 'Total Apartments',
      value: stats.apartments || 0,
      icon: <Home className="h-8 w-8 text-blue-500" />,
      color: 'bg-blue-50 text-blue-700',
    },
    {
      title: 'Total Appointments',
      value: stats.appointments || 0,
      icon: <Calendar className="h-8 w-8 text-primary-500" />,
      color: 'bg-blue-50 text-blue-700',
    },
    {
      title: 'Upcoming Appointments',
      value: stats.upcomingAppointments || 0,
      icon: <Clock className="h-8 w-8 text-amber-500" />,
      color: 'bg-amber-50 text-amber-700',
    },
    {
      title: 'Total Visitors',
      value: stats.completedAppointments || 0,
      icon: <Users className="h-8 w-8 text-violet-500" />,
      color: 'bg-violet-50 text-violet-700',
    },
  ];

  // Renter dashboard cards (no total apartments)
  const renterStatsCards = [
    {
      title: 'Scheduled Visits',
      value: stats.appointments || 0,
      icon: <Calendar className="h-8 w-8 text-primary-500" />,
      color: 'bg-blue-50 text-blue-700',
    },
    {
      title: 'Saved Apartments',
      value: stats.savedApartments || 0,
      icon: <Heart className="h-8 w-8 text-pink-500" />,
      color: 'bg-pink-50 text-pink-700',
    },
    {
      title: 'Recently Viewed',
      value: stats.viewedApartments || 0,
      icon: <Search className="h-8 w-8 text-amber-500" />,
      color: 'bg-amber-50 text-amber-700',
    },
    {
      title: 'Completed Visits',
      value: stats.completedAppointments || 0,
      icon: <Bookmark className="h-8 w-8 text-violet-500" />,
      color: 'bg-violet-50 text-violet-700',
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, {user?.name}! Here's what's happening with your{' '}
          {user?.role === 'owner' ? 'properties' : 'apartment hunt'}.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <>
          {/* Owner Dashboard */}
          {user?.role === 'owner' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {ownerStatsCards.map((card, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm p-6 transition-transform hover:transform hover:scale-105">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-500 text-sm">{card.title}</p>
                        <p className="text-3xl font-bold mt-2">{card.value}</p>
                      </div>
                      <div className={`p-3 rounded-full ${card.color.split(' ')[0]}`}>
                        {card.icon}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
                  <div className="space-y-4">
                    {recentAppointments.length > 0 ? (
                      recentAppointments.map((appointment: any, index: number) => (
                        <div key={index} className="flex items-start p-3 border-b last:border-0">
                          <div className="bg-primary-100 text-primary-700 p-2 rounded-full mr-4">
                            <Calendar size={20} />
                          </div>
                          <div>
                            <p className="font-medium">{appointment.title}</p>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <Clock size={14} className="mr-1" />
                              <span>{appointment.date} • {appointment.time}</span>
                            </div>
                          </div>
                          <div className={`ml-auto rounded-full px-3 py-1 text-xs font-medium ${
                            appointment.status === 'confirmed' 
                              ? 'bg-green-100 text-green-700' 
                              : appointment.status === 'pending' 
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        No recent activities found.
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                  <div className="space-y-3">
                    <button className="w-full bg-primary-500 text-white rounded-md py-3 font-medium hover:bg-primary-600 transition-colors">
                      Add New Property
                    </button>
                    <button className="w-full bg-white border border-gray-300 text-gray-700 rounded-md py-3 font-medium hover:bg-gray-50 transition-colors">
                      Manage Appointments
                    </button>
                    <button className="w-full bg-white border border-gray-300 text-gray-700 rounded-md py-3 font-medium hover:bg-gray-50 transition-colors">
                      View Analytics
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Renter Dashboard */}
          {user?.role === 'renter' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {renterStatsCards.map((card, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm p-6 transition-transform hover:transform hover:scale-105">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-500 text-sm">{card.title}</p>
                        <p className="text-3xl font-bold mt-2">{card.value}</p>
                      </div>
                      <div className={`p-3 rounded-full ${card.color.split(' ')[0]}`}>
                        {card.icon}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold mb-4">Recent Visits & Bookings</h2>
                  <div className="space-y-4">
                    {recentAppointments.length > 0 ? (
                      recentAppointments.map((appointment: any, index: number) => (
                        <div key={index} className="flex items-start p-3 border-b last:border-0">
                          <div className="bg-primary-100 text-primary-700 p-2 rounded-full mr-4">
                            <Calendar size={20} />
                          </div>
                          <div>
                            <p className="font-medium">{appointment.title}</p>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <Clock size={14} className="mr-1" />
                              <span>{appointment.date} • {appointment.time}</span>
                            </div>
                          </div>
                          <div className={`ml-auto rounded-full px-3 py-1 text-xs font-medium ${
                            appointment.status === 'confirmed' 
                              ? 'bg-green-100 text-green-700' 
                              : appointment.status === 'pending' 
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        No recent visits or bookings found.
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                  <div className="space-y-3">
                    {user?.role === 'owner' ? (
                      // Quick Actions for Owners
                      <>
                        <button className="w-full flex items-center justify-between bg-primary-500 text-white rounded-md py-3 px-4 font-medium hover:bg-primary-600 transition-colors">
                          <span>Add New Property</span>
                          <Home className="h-5 w-5" />
                        </button>
                        <button className="w-full flex items-center justify-between bg-white border border-gray-300 text-gray-700 rounded-md py-3 px-4 font-medium hover:bg-gray-50 transition-colors">
                          <span>Manage Appointments</span>
                          <Calendar className="h-5 w-5" />
                        </button>
                        <button className="w-full flex items-center justify-between bg-white border border-gray-300 text-gray-700 rounded-md py-3 px-4 font-medium hover:bg-gray-50 transition-colors">
                          <span>View Analytics</span>
                          <Users className="h-5 w-5" />
                        </button>
                      </>
                    ) : (
                      // Quick Actions for Renters
                      <>
                        <button className="w-full flex items-center justify-between bg-primary-500 text-white rounded-md py-3 px-4 font-medium hover:bg-primary-600 transition-colors">
                          <span>Browse Apartments</span>
                          <Search className="h-5 w-5" />
                        </button>
                        <button className="w-full flex items-center justify-between bg-white border border-gray-300 text-gray-700 rounded-md py-3 px-4 font-medium hover:bg-gray-50 transition-colors">
                          <span>Schedule a Visit</span>
                          <Clock className="h-5 w-5" />
                        </button>
                        <button className="w-full flex items-center justify-between bg-white border border-gray-300 text-gray-700 rounded-md py-3 px-4 font-medium hover:bg-gray-50 transition-colors">
                          <span>Saved Apartments</span>
                          <Heart className="h-5 w-5" />
                        </button>
                        <button className="w-full flex items-center justify-between bg-white border border-gray-300 text-gray-700 rounded-md py-3 px-4 font-medium hover:bg-gray-50 transition-colors">
                          <span>Recently Viewed</span>
                          <Bookmark className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {/* Popular/Recently Rented Apartments */}
              <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
                <h2 className="text-lg font-semibold mb-4">Popular Apartments Rented</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {popularApartments.length > 0 ? (
                    popularApartments.map((apt) => (
                      <div key={apt.id} className="border rounded-lg shadow hover:shadow-md transition p-4 flex flex-col">
                        <img
                          src={apt.primary_image || 'https://images.pexels.com/photos/1918291/pexels-photo-1918291.jpeg?auto=compress&cs=tinysrgb&w=600'}
                          alt={apt.title}
                          className="w-full h-40 object-cover rounded mb-3"
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
                        <span className="inline-block bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full mb-2">
                          Rented {apt.rented_count || 1}x
                        </span>
                        <span className="font-bold text-blue-700">₱{apt.price}/month</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 col-span-3 text-center py-8">
                      No popular apartments found yet.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default DashboardPage;