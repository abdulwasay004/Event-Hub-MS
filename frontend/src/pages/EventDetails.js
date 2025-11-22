import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { eventsAPI, bookingsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const EventDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const response = await eventsAPI.getById(id);
      setEvent(response.data.event);
    } catch (error) {
      setError('Failed to fetch event details');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!user) {
      setError('Please login to book this event');
      return;
    }

    setBooking(true);
    setError('');
    setSuccess('');

    try {
      await bookingsAPI.create({
        event_id: event.event_id,
        quantity: 1
      });
      setSuccess('Event booked successfully!');
    } catch (error) {
      setError(error.response?.data?.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
          <p className="text-gray-600">The event you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                {success}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Details</h2>
                <div className="space-y-3">
                  <p><span className="font-medium">Date:</span> {new Date(event.start_date).toLocaleDateString()}</p>
                  <p><span className="font-medium">Time:</span> {new Date(event.start_date).toLocaleTimeString()}</p>
                  <p><span className="font-medium">Venue:</span> {event.venue_name}</p>
                  <p><span className="font-medium">Capacity:</span> {event.capacity} people</p>
                  <p><span className="font-medium">Price:</span> ${event.ticket_price}</p>
                  <p><span className="font-medium">Organizer:</span> {event.organizer_name}</p>
                </div>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 leading-relaxed">{event.description}</p>
                
                <div className="mt-6">
                  {user && user.role === 'attendee' ? (
                    <button
                      onClick={handleBooking}
                      disabled={booking}
                      className="btn-primary disabled:opacity-50 w-full"
                    >
                      {booking ? 'Booking...' : `Book Now - $${event.ticket_price}`}
                    </button>
                  ) : !user ? (
                    <div className="text-center">
                      <p className="text-gray-600 mb-4">Please login to book this event</p>
                      <a href="/login" className="btn-primary inline-block">
                        Login to Book
                      </a>
                    </div>
                  ) : (
                    <p className="text-gray-600 text-center">Available for attendees only</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;