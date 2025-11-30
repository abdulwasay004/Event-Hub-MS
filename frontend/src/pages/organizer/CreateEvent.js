import React, { useState, useEffect } from 'react';
// import { useAuth } from '../../context/AuthContext';
import { eventsAPI } from '../../services/api';

const CreateEvent = () => {
  // const { } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    venue_id: '',
    category_id: '',
    status: 'active'
  });
  const [ticketTypes, setTicketTypes] = useState([
    { category: 'General', price: '', max_quantity: '' }
  ]);
  const [coverImage, setCoverImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [venues, setVenues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchVenuesAndCategories();
  }, []);

  const fetchVenuesAndCategories = async () => {
    try {
      const { venuesAPI, categoriesAPI } = await import('../../services/api');
      
      const [venuesResponse, categoriesResponse] = await Promise.all([
        venuesAPI.getAll(),
        categoriesAPI.getAll()
      ]);
      
      setVenues(venuesResponse.data.venues || []);
      setCategories(categoriesResponse.data || []);
    } catch (error) {
      console.error('Error fetching venues and categories:', error);
      setError('Failed to load venues and categories');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 2MB)
      const maxSize = 2 * 1024 * 1024; // 2MB in bytes
      if (file.size > maxSize) {
        setError('Image size must be less than 2MB');
        e.target.value = null;
        return;
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid image file (JPEG, PNG, or WebP)');
        e.target.value = null;
        return;
      }

      // Convert to base64 for preview and storage
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImage(reader.result);
        setImagePreview(reader.result);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setCoverImage(null);
    setImagePreview(null);
    const fileInput = document.getElementById('cover-image');
    if (fileInput) fileInput.value = null;
  };

  const handleTicketChange = (index, field, value) => {
    const newTicketTypes = [...ticketTypes];
    newTicketTypes[index][field] = value;
    setTicketTypes(newTicketTypes);
  };

  const addTicketType = () => {
    setTicketTypes([...ticketTypes, { category: '', price: '', max_quantity: '' }]);
  };

  const removeTicketType = (index) => {
    if (ticketTypes.length > 1) {
      setTicketTypes(ticketTypes.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Event title is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Event description is required');
      return false;
    }
    if (!formData.start_date) {
      setError('Start date is required');
      return false;
    }
    if (!formData.end_date) {
      setError('End date is required');
      return false;
    }
    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      setError('End date must be after start date');
      return false;
    }
    if (!formData.venue_id) {
      setError('Please select a venue');
      return false;
    }
    if (!formData.category_id) {
      setError('Please select a category');
      return false;
    }
    // Validate ticket types
    if (ticketTypes.length === 0) {
      setError('Please add at least one ticket type');
      return false;
    }
    for (let i = 0; i < ticketTypes.length; i++) {
      const ticket = ticketTypes[i];
      if (!ticket.category.trim()) {
        setError(`Ticket type ${i + 1}: Category is required`);
        return false;
      }
      if (!ticket.price || parseFloat(ticket.price) < 0) {
        setError(`Ticket type ${i + 1}: Valid price is required`);
        return false;
      }
      if (!ticket.max_quantity || parseInt(ticket.max_quantity) < 1) {
        setError(`Ticket type ${i + 1}: Valid quantity is required`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const eventData = {
        ...formData,
        venue_id: parseInt(formData.venue_id),
        category_id: parseInt(formData.category_id),
        cover_image: coverImage || null,
        tickets: ticketTypes.map(ticket => ({
          category: ticket.category,
          price: parseFloat(ticket.price),
          max_quantity: parseInt(ticket.max_quantity)
        }))
      };

      await eventsAPI.create(eventData);
      setSuccess('Event created successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        venue_id: '',
        category_id: '',
        status: 'active'
      });
      setTicketTypes([{ category: 'General', price: '', max_quantity: '' }]);
      setCoverImage(null);
      setImagePreview(null);

    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Create New Event</h1>
          <p className="text-gray-600">Fill in the details to create a new event</p>
        </div>

        <div className="card">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter event title"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="input-field"
                  placeholder="Describe your event..."
                  required
                />
              </div>

              {/* Cover Image Upload */}
              <div>
                <label htmlFor="cover-image" className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Image (Max 2MB)
                </label>
                <div className="mt-1">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Cover preview"
                        className="w-full h-48 object-cover rounded-lg border-2 border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-primary-400 transition-colors">
                      <div className="space-y-1 text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="cover-image"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none"
                          >
                            <span>Upload a file</span>
                            <input
                              id="cover-image"
                              name="cover-image"
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/webp"
                              onChange={handleImageChange}
                              className="sr-only"
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 2MB</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  id="start_date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date & Time *
                </label>
                <input
                  type="datetime-local"
                  id="end_date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
            </div>

            {/* Venue and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="venue_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Venue *
                </label>
                <select
                  id="venue_id"
                  name="venue_id"
                  value={formData.venue_id}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="">Select a venue</option>
                  {venues.map(venue => (
                    <option key={venue.venue_id} value={venue.venue_id}>
                      {venue.name} - {venue.city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  id="category_id"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.category_id} value={category.category_id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ticket Types */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Ticket Types *
                </label>
                <button
                  type="button"
                  onClick={addTicketType}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
                >
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Ticket Type
                </button>
              </div>
              
              <div className="space-y-4">
                {ticketTypes.map((ticket, index) => (
                  <div key={index} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-700">Ticket Type {index + 1}</h4>
                      {ticketTypes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTicketType(index)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category Name *
                        </label>
                        <input
                          type="text"
                          value={ticket.category}
                          onChange={(e) => handleTicketChange(index, 'category', e.target.value)}
                          className="input-field"
                          placeholder="e.g., VIP, General, Student"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Price ($) *
                        </label>
                        <input
                          type="number"
                          value={ticket.price}
                          onChange={(e) => handleTicketChange(index, 'price', e.target.value)}
                          className="input-field"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Max Quantity *
                        </label>
                        <input
                          type="number"
                          value={ticket.max_quantity}
                          onChange={(e) => handleTicketChange(index, 'max_quantity', e.target.value)}
                          className="input-field"
                          placeholder="100"
                          min="1"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Event Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="input-field"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Active events will be visible to attendees immediately
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Event...
                  </div>
                ) : (
                  'Create Event'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Tips Section */}
        <div className="mt-8 card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Creation Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Title & Description</h4>
              <ul className="space-y-1">
                <li>• Use clear, descriptive titles</li>
                <li>• Include key details in description</li>
                <li>• Mention special requirements or dress codes</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Pricing & Capacity</h4>
              <ul className="space-y-1">
                <li>• Set competitive prices for your market</li>
                <li>• Consider venue capacity limits</li>
                <li>• Free events can be set to $0.00</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;