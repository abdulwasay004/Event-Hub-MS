import React, { useState, useEffect } from 'react';
import { eventsAPI, refundsAPI } from '../../services/api';

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingEvent, setEditingEvent] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedEventForRefund, setSelectedEventForRefund] = useState(null);
  const [refundStatus, setRefundStatus] = useState({});
  const [initiatingRefund, setInitiatingRefund] = useState(false);

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      // Fetch all events including completed and cancelled
      const response = await eventsAPI.getAll({ status: '' });
      // Sort events by start_date descending (newest first)
      const sortedEvents = response.data.events.sort((a, b) => 
        new Date(b.start_date) - new Date(a.start_date)
      );
      setEvents(sortedEvents);
      
      // Load refund status for all events
      sortedEvents.forEach(event => {
        checkRefundStatus(event.event_id);
      });
    } catch (error) {
      setError('Failed to fetch events');
      console.error('Fetch events error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkRefundStatus = async (eventId) => {
    try {
      const response = await refundsAPI.getStatus(eventId);
      if (response.data.success) {
        setRefundStatus(prev => ({
          ...prev,
          [eventId]: response.data.data
        }));
      }
    } catch (error) {
      // Silently fail - refund status not critical
      console.log('Refund status check skipped for event:', eventId);
    }
  };

  const openRefundModal = (event) => {
    setSelectedEventForRefund(event);
    setRefundModalOpen(true);
  };

  const handleInitiateRefund = async () => {
    if (!selectedEventForRefund) return;

    try {
      setInitiatingRefund(true);
      const response = await refundsAPI.initiate(selectedEventForRefund.event_id);
      
      if (response.data.success) {
        alert(`✅ Refund process initiated successfully!\n\n` +
              `• Emails sent to ${response.data.data.totalAttendees} attendees\n` +
              `• Total bookings: ${response.data.data.totalBookings}\n` +
              `• Total refund amount: $${response.data.data.totalRefundAmount.toFixed(2)}\n\n` +
              `Accounts team has been notified.`);
        
        setRefundModalOpen(false);
        setSelectedEventForRefund(null);
        
        // Refresh refund status
        checkRefundStatus(selectedEventForRefund.event_id);
      }
    } catch (error) {
      console.error('Error initiating refund:', error);
      alert(error.response?.data?.error || 'Failed to initiate refund process');
    } finally {
      setInitiatingRefund(false);
    }
  };

  const handleStatusUpdate = async (eventId, newStatus) => {
    try {
      // Fetch the full event details first
      const response = await fetch(`http://localhost:5000/api/events/${eventId}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error('Failed to fetch event details');
      }
      
      const event = data.event;
      
      // Update the event with new status
      const updateResponse = await fetch(`http://localhost:5000/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: event.title,
          description: event.description,
          start_date: event.start_date,
          end_date: event.end_date,
          venue_id: event.venue_id,
          category_id: event.category_id,
          status: newStatus
        })
      });
      
      const updateData = await updateResponse.json();
      
      if (!updateData.success) {
        throw new Error(updateData.message || 'Failed to update event status');
      }
      
      // Update local state
      setEvents(events.map(e => 
        e.event_id === eventId ? { ...e, status: newStatus } : e
      ));
      setEditingEvent(null);
      
      alert('Event status updated successfully!');
    } catch (error) {
      setError('Failed to update event status');
      console.error('Update status error:', error);
      alert('Failed to update event status: ' + error.message);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await eventsAPI.delete(eventId);
      setEvents(events.filter(event => event.event_id !== eventId));
      setShowDeleteModal(null);
    } catch (error) {
      setError('Failed to delete event');
      console.error('Delete event error:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Event Management</h1>
        <p className="text-gray-600">Monitor and manage all events on the platform</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">All Events ({events.length})</h2>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No events found</p>
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
                      Organizer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Min Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {events.map(event => (
                    <tr key={event.event_id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{event.title}</div>
                          <div className="text-sm text-gray-500">{event.category_name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{event.organizer_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(event.start_date)}</div>
                        <div className="text-sm text-gray-500">to {formatDate(event.end_date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">
                          {event.min_price ? formatCurrency(event.min_price) : 'Free'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingEvent === event.event_id ? (
                          <select
                            value={event.status}
                            onChange={(e) => handleStatusUpdate(event.event_id, e.target.value)}
                            className="text-sm border-gray-300 rounded-md"
                          >
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(event.status)}`}>
                            {event.status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col space-y-2">
                          <div className="flex space-x-2">
                            {editingEvent === event.event_id ? (
                              <button
                                onClick={() => setEditingEvent(null)}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                Cancel
                              </button>
                            ) : (
                              <button
                                onClick={() => setEditingEvent(event.event_id)}
                                className="text-primary-600 hover:text-primary-900"
                              >
                                Edit Status
                              </button>
                            )}
                            <button
                              onClick={() => setShowDeleteModal(event.event_id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                          {refundStatus[event.event_id]?.refund_initiated ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Refund Initiated
                            </span>
                          ) : (
                            <button
                              onClick={() => openRefundModal(event)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                            >
                              💰 Initiate Refund
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this event? This action cannot be undone and will affect all associated bookings.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteEvent(showDeleteModal)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Confirmation Modal */}
      {refundModalOpen && selectedEventForRefund && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Initiate Refund Process</h2>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Warning:</strong> You are about to initiate the refund process for:
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">{selectedEventForRefund.title}</h3>
              <p className="text-sm text-gray-600">
                <strong>Date:</strong> {new Date(selectedEventForRefund.start_date).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Venue:</strong> {selectedEventForRefund.venue_name}
              </p>
            </div>
            
            <div className="mb-4">
              <p className="font-medium text-gray-900 mb-2">This will:</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Send refund eligibility emails to all confirmed attendees
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Request bank account details from each attendee
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Notify the accounts department with attendee list
                </li>
              </ul>
            </div>
            
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Attendees will need to reply to accounts@eventhub.com with their bank details for processing.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setRefundModalOpen(false);
                  setSelectedEventForRefund(null);
                }}
                disabled={initiatingRefund}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleInitiateRefund}
                disabled={initiatingRefund}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {initiatingRefund ? 'Sending Emails...' : 'Confirm & Send Emails'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventManagement;