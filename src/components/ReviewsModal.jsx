import React, { useEffect, useState } from 'react';
import { X, Star } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const ReviewsModal = ({ isOpen, onClose, targetId, type }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && targetId) {
      fetchReviews();
    }
  }, [isOpen, targetId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin-token');
      const url = type === 'user' 
        ? `${API_BASE_URL}/bookings/user/${targetId}/reviews`
        : `${API_BASE_URL}/bookings/driver/${targetId}/reviews`;
        
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setReviews(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Ratings & Reviews</h3>
            <p className="text-xs text-gray-500">
              {type === 'user' ? 'Reviews given by drivers to this user' : 'Reviews given by users to this driver'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Star size={32} className="mx-auto mb-3 opacity-20" />
              <p>No reviews found yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((r, i) => (
                <div key={i} className="bg-gray-50 border border-gray-100 p-4 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs font-bold text-gray-900">
                        {type === 'user' 
                          ? r.assignedDriver?.name || 'Unknown Driver' 
                          : r.user?.name || 'Unknown User'}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {new Date(r.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold bg-yellow-50 px-2 py-1 rounded-full">
                      <Star size={12} className="fill-current" />
                      {type === 'user' ? r.userRating : r.driverRating}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 italic bg-white p-3 rounded-lg border border-gray-100 mt-2">
                    "{(type === 'user' ? r.userReview : r.driverReview) || 'No text review provided.'}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewsModal;
