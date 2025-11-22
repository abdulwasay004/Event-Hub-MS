import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { organizerAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const RegisteredAttendees = () => {
  const location = useLocation();
  const [attendees, setAttendees] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('all');
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [attendeesResponse, eventsResponse] = await Promise.all([
        organizerAPI.getAttendees(user.user_id),
        organizerAPI.getEvents(user.user_id)
      ]);
      
      setAttendees(attendeesResponse.data.attendees);
      setEvents(eventsResponse.data.events);
      
      // Auto-select event if passed from navigation state
      if (location.state?.eventId) {
        setSelectedEvent(location.state.eventId.toString());
      }
    } catch (error) {
      setError('Failed to fetch attendee data');
      console.error('Fetch attendees error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'refunded':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredAttendees = selectedEvent === 'all' 
    ? attendees 
    : attendees.filter(attendee => attendee.event_id === parseInt(selectedEvent));

  const exportToCSV = () => {
    const headers = [
      'Event Name',
      'Attendee Name',
      'Email',
      'Phone',
      'Ticket Type',
      'Quantity',
      'Booking Date',
      'Payment Status',
      'Payment Method',
      'Total Amount'
    ];

    const csvData = filteredAttendees.map(attendee => [
      attendee.event_title,
      attendee.attendee_name,
      attendee.attendee_email,
      attendee.attendee_phone || '',
      attendee.ticket_type,
      attendee.quantity,
      formatDate(attendee.booking_date),
      attendee.payment_status,
      attendee.payment_method,
      attendee.total_amount
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendees_${selectedEvent === 'all' ? 'all_events' : 'event_' + selectedEvent}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Registered Attendees</h1>
          <p className="text-gray-600">View and manage attendees for your events</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Filters and Actions */}
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div>
                <label htmlFor="eventFilter" className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Event
                </label>
                <select
                  id="eventFilter"
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                  className="form-input"
                >
                  <option value="all">All Events</option>
                  {events.map(event => (
                    <option key={event.event_id} value={event.event_id}>
                      {event.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-sm text-gray-600 pt-6">
                Showing {filteredAttendees.length} attendees
              </div>
            </div>
            
            <button
              onClick={exportToCSV}
              disabled={filteredAttendees.length === 0}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        {/* Attendees Table */}
        <div className="card">
          {filteredAttendees.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-24 w-24 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No attendees found</h3>
              <p className="text-gray-600">
                {selectedEvent === 'all' 
                  ? 'No one has registered for your events yet.' 
                  : 'No one has registered for this event yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ticket Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booking Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAttendees.map((attendee, index) => (
                    <tr key={`${attendee.event_id}-${attendee.attendee_email}-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {attendee.event_title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(attendee.start_date)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {attendee.attendee_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {attendee.attendee_email}
                        </div>
                        {attendee.attendee_phone && (
                          <div className="text-sm text-gray-500">
                            {attendee.attendee_phone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {attendee.ticket_type}
                        </div>
                        <div className="text-sm text-gray-500">
                          Qty: {attendee.quantity}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(attendee.booking_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPaymentStatusColor(attendee.payment_status)}`}>
                          {attendee.payment_status}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {attendee.payment_method}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatCurrency(attendee.total_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {filteredAttendees.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="card">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {filteredAttendees.length}
                </div>
                <div className="text-sm text-gray-500">Total Attendees</div>
              </div>
            </div>
            <div className="card">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {filteredAttendees.reduce((sum, attendee) => sum + attendee.quantity, 0)}
                </div>
                <div className="text-sm text-gray-500">Total Tickets</div>
              </div>
            </div>
            <div className="card">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(filteredAttendees.reduce((sum, attendee) => sum + parseFloat(attendee.total_amount), 0))}
                </div>
                <div className="text-sm text-gray-500">Total Revenue</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisteredAttendees;