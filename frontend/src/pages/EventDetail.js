import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsAPI, ticketsAPI, bookingsAPI, reviewsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [event, setEvent] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');

  useEffect(() => {
    fetchEventDetails();
    fetchReviews();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await eventsAPI.getById(id);
      setEvent(response.data.event);
    } catch (error) {
      setError('Failed to fetch event details');
      console.error('Fetch event error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await reviewsAPI.getByEvent(id);
      setReviews(response.data.reviews);
    } catch (error) {
      console.error('Fetch reviews error:', error);
    }
  };

  const handleBooking = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!selectedTicket) {
      setError('Please select a ticket type');
      return;
    }

    try {
      setBookingLoading(true);
      setError('');

      const bookingData = {
        event_id: parseInt(id),
        items: [{
          category: selectedTicket.category,
          quantity: parseInt(quantity)
        }],
        payment_method: paymentMethod,
      };

      const response = await bookingsAPI.create(bookingData);
      
      if (response.data.success) {
        alert('Booking successful! Check your bookings page for details.');
        navigate('/bookings');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatReviewDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isEventPast = () => {
    return new Date(event?.end_date) < new Date();
  };

  const canBook = () => {
    return event?.status === 'active' && !isEventPast();
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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Event not found</h1>
          <button
            onClick={() => navigate('/events')}
            className="btn-primary"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="card mb-8">
              <div className="mb-4">
                <span className="inline-block bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full uppercase tracking-wide font-semibold">
                  {event.category_name}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>
              
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m0 0V7a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V9a2 2 0 012-2m8 0V9a2 2 0 00-2-2H8a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2V9z" />
                  </svg>
                  <div>
                    <div className="font-medium">Start:</div>
                    <div>{formatDate(event.start_date)}</div>
                  </div>
                </div>
                <div className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m0 0V7a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V9a2 2 0 012-2m8 0V9a2 2 0 00-2-2H8a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2V9z" />
                  </svg>
                  <div>
                    <div className="font-medium">End:</div>
                    <div>{formatDate(event.end_date)}</div>
                  </div>
                </div>
                <div className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <div className="font-medium">Venue:</div>
                    <div>{event.venue_name}</div>
                    <div className="text-sm">{event.venue_address}, {event.venue_city}</div>
                  </div>
                </div>
                <div className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div>
                    <div className="font-medium">Organizer:</div>
                    <div>{event.organizer_name}</div>
                    <div className="text-sm">{event.organizer_email}</div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">About This Event</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
              </div>

              {event.avg_rating > 0 && (
                <div className="flex items-center mb-6">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${i < Math.floor(event.avg_rating) ? 'text-yellow-500' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    ))}
                    <span className="ml-2 text-gray-600">
                      {parseFloat(event.avg_rating).toFixed(1)} ({event.review_count} reviews)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Reviews Section */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Reviews</h2>
              {reviews.length === 0 ? (
                <p className="text-gray-600">No reviews yet.</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map(review => (
                    <div key={review.review_id} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900">{review.reviewer_name}</span>
                          <div className="flex items-center ml-2">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${i < review.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">{formatReviewDate(review.review_date)}</span>
                      </div>
                      {review.comment && (
                        <p className="text-gray-700">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="card sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Book Tickets</h2>
              
              {!canBook() && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                  {isEventPast() ? 'This event has ended' : 'Booking is not available for this event'}
                </div>
              )}

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              {!isAuthenticated && canBook() && (
                <div className="text-center">
                  <div className="mb-4">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Login Required</h3>
                    <p className="text-gray-600 mb-4">
                      You need to be logged in to book tickets for this event.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full btn-primary mb-3"
                  >
                    Login to Book Tickets
                  </button>
                  <p className="text-sm text-gray-500">
                    Don't have an account?{' '}
                    <button
                      onClick={() => navigate('/register')}
                      className="text-primary-600 hover:text-primary-500 font-medium"
                    >
                      Sign up here
                    </button>
                  </p>
                </div>
              )}

              {isAuthenticated && canBook() && (
                <>
                  <div className="mb-4">
                    <label className="form-label">Select Ticket Type</label>
                    <div className="space-y-2">
                      {event.tickets.map(ticket => (
                        <div
                          key={ticket.ticket_id}
                          className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                            selectedTicket?.ticket_id === ticket.ticket_id
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium">{ticket.category}</div>
                              <div className="text-sm text-gray-600">
                                {ticket.available_quantity} available
                              </div>
                            </div>
                            <div className="text-lg font-semibold text-green-600">
                              ${ticket.price}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedTicket && (
                    <>
                      <div className="mb-4">
                        <label htmlFor="quantity" className="form-label">
                          Quantity
                        </label>
                        <select
                          id="quantity"
                          className="form-input"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                        >
                          {selectedTicket.available_quantity > 0 ? (
                            [...Array(Math.min(10, parseInt(selectedTicket.available_quantity)))].map((_, i) => (
                              <option key={i + 1} value={i + 1}>{i + 1}</option>
                            ))
                          ) : (
                            <option value="0">Sold Out</option>
                          )}
                        </select>
                      </div>

                      <div className="mb-4">
                        <label htmlFor="paymentMethod" className="form-label">
                          Payment Method
                        </label>
                        <select
                          id="paymentMethod"
                          className="form-input"
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                          <option value="Credit Card">Credit Card</option>
                          <option value="Debit Card">Debit Card</option>
                          <option value="PayPal">PayPal</option>
                        </select>
                      </div>

                      <div className="border-t pt-4 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Total:</span>
                          <span className="text-xl font-bold text-green-600">
                            ${(selectedTicket.price * quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handleBooking}
                        disabled={bookingLoading}
                        className="w-full btn-primary disabled:opacity-50"
                      >
                        {bookingLoading ? 'Processing...' : 'Book Now'}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;