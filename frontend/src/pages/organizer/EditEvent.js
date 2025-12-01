import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsAPI } from '../../services/api';

const EditEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    venue_id: '',
    category_id: '',
    status: 'active'
  });
  const [coverImage, setCoverImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [venues, setVenues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEventData();
    fetchVenuesAndCategories();
  }, [id]);

  const fetchEventData = async () => {
    try {
      const response = await eventsAPI.getById(id);
      const event = response.data.event;
      
      setFormData({
        title: event.title,
        description: event.description,
        start_date: formatDateForInput(event.start_date),
        end_date: formatDateForInput(event.end_date),
        venue_id: event.venue_id,
        category_id: event.category_id,
        status: event.status
      });

      if (event.cover_image) {
        setCoverImage(event.cover_image);
        setImagePreview(event.cover_image);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching event:', error);
      setError('Failed to load event');
      setLoading(false);
    }
  };

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
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
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
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid image file (JPEG, PNG, or WebP)');
        e.target.value = null;
        return;
      }

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const updateData = {
        ...formData,
        cover_image: coverImage
      };

      await eventsAPI.update(id, updateData);
      alert('Event updated successfully!');
      navigate('/organizer-dashboard');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update event');
      console.error('Update event error:', error);
    } finally {
      setSaving(false);
    }
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Edit Event</h1>
          <p className="text-gray-600">Update your event details</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card">
          {/* Event Title */}
          <div className="mb-6">
            <label htmlFor="title" className="form-label">
              Event Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label htmlFor="description" className="form-label">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="form-input"
              required
            />
          </div>

          {/* Cover Image */}
          <div className="mb-6">
            <label htmlFor="cover-image" className="form-label">
              Cover Image
            </label>
            <div className="mt-2">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Cover preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
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
                        className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500"
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
                    <p className="text-xs text-gray-500">PNG, JPG, WebP</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="start_date" className="form-label">
                Start Date & Time *
              </label>
              <input
                type="datetime-local"
                id="start_date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            <div>
              <label htmlFor="end_date" className="form-label">
                End Date & Time *
              </label>
              <input
                type="datetime-local"
                id="end_date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
          </div>

          {/* Venue & Category */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="venue_id" className="form-label">
                Venue *
              </label>
              <select
                id="venue_id"
                name="venue_id"
                value={formData.venue_id}
                onChange={handleChange}
                className="form-input"
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
              <label htmlFor="category_id" className="form-label">
                Category *
              </label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="form-input"
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

          {/* Status */}
          <div className="mb-6">
            <label htmlFor="status" className="form-label">
              Status *
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/organizer-dashboard')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Update Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEvent;
