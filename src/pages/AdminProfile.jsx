import { useState, useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { useAuth } from "../context/AuthContext";
import { getAdminProfile, updateAdminProfile, getBulkSettings, updateBulkSettings, getAppSettings, toggleShareRide } from "../apis/admin";
import {
  User, Mail, Lock, Camera, Save, Shield, CheckCircle,
  AlertCircle, Bell, Key, Edit2, LogOut, Settings,
  Globe, Phone, MapPin, Calendar, Award, Star
} from 'lucide-react';
import { Toaster, toast } from "sonner";

export default function AdminProfile() {
  const { themeColors, theme } = useTheme();
  const { currentFont } = useFont();
  const { admin, setLoginData } = useAuth();

  const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '');

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http") || path.startsWith("data:")) return path;
    return `${BASE_URL}/uploads/${path}`;
  };

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    profileImage: "",
    phone: "",
    location: "",
    bio: "",
    joinDate: new Date().toLocaleDateString()
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    securityAlerts: true,
    marketingEmails: false
  });

  const [bulkSettings, setBulkSettings] = useState({
    defaultCommission: 10,
    userBulkAdvancePct: 25,
    userPayViaBank: true,
    agentBulkAdvancePct: 5,
    agentPayViaBank: false,
    vendorBulkAdvancePct: 15,
    vendorPayViaBank: true,
    adminBulkAdvancePct: 0,
    adminPayViaBank: false,
    fleetBulkSecurityPct: 20,
    fleetSecurityPayViaBank: true,
    maxNegativeWalletLimit: 3000,
    agentLeadAdminProfitPct: 10
  });

  const [appSettings, setAppSettings] = useState({
    isShareRideEnabled: true
  });

  const fileInputRef = useRef(null);

  // Theme-based colors
  const cardBg = theme === 'dark' ? '#1F2937' : '#FFFFFF';
  const inputBg = theme === 'dark' ? '#374151' : '#F9FAFB';
  const textMain = theme === 'dark' ? '#F9FAFB' : '#111827';
  const textDim = theme === 'dark' ? '#9CA3AF' : '#6B7280';
  const borderColor = theme === 'dark' ? '#374151' : '#E5E7EB';

  useEffect(() => {
    fetchProfile();
    if (admin?.role === 'SuperAdmin') {
      fetchBulkSettings();
      fetchAppSettings();
    }
  }, []);

  const fetchBulkSettings = async () => {
    try {
      const res = await getBulkSettings();
      if (res.success && res.settings) {
        setBulkSettings(res.settings);
      }
    } catch (err) { console.error(err); }
  };

  const fetchAppSettings = async () => {
    try {
      const res = await getAppSettings();
      if (res.success && res.settings) {
        setAppSettings(res.settings);
      }
    } catch (err) { console.error(err); }
  };

  const handleShareRideToggle = async (e) => {
    const newValue = e.target.checked;
    setAppSettings({ ...appSettings, isShareRideEnabled: newValue });
    try {
      const res = await toggleShareRide(newValue);
      if (res.success) {
        toast.success(res.message || "Share Ride feature toggled");
      } else {
        toast.error("Failed to update setting");
        setAppSettings({ ...appSettings, isShareRideEnabled: !newValue }); // revert
      }
    } catch (err) {
      toast.error("API error");
      setAppSettings({ ...appSettings, isShareRideEnabled: !newValue }); // revert
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await getAdminProfile();
      if (res.success) {
        setProfile({
          name: res.admin.name || "",
          email: res.admin.email || "",
          profileImage: res.admin.image || res.admin.profileImage || "",
          phone: res.admin.phone || "+91 98765 43210",
          location: res.admin.location || "Mumbai, India",
          bio: res.admin.bio || "Platform Administrator",
          joinDate: res.admin.joinDate || new Date().toLocaleDateString()
        });
      }
    } catch (error) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleInfoUpdate = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      const formData = new FormData();
      formData.append("name", profile.name);
      formData.append("email", profile.email);
      formData.append("phone", profile.phone);

      const res = await updateAdminProfile(formData);

      if (res.success) {
        toast.success("Profile updated successfully");
        setProfile(prev => ({
          ...prev,
          name: res.admin.name || prev.name,
          email: res.admin.email || prev.email,
          phone: res.admin.phone || prev.phone,
        }));
        if (admin) {
          setLoginData({ ...admin, name: res.admin.name, email: res.admin.email, phone: res.admin.phone });
        }
      } else {
        toast.error(res.message || "Update failed");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error("Passwords do not match");
    }
    if (passwordForm.newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    try {
      setUpdating(true);
      const res = await updateAdminProfile({
        password: passwordForm.newPassword,
      });

      if (res.success) {
        toast.success("Password changed successfully");
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Password update failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      return toast.error("Please upload an image file");
    }
    if (file.size > 5 * 1024 * 1024) {
      return toast.error("Image size should be less than 5MB");
    }

    try {
      setUpdating(true);
      const formData = new FormData();
      formData.append("image", file);

      const res = await updateAdminProfile(formData);
      if (res.success) {
        const updatedImage = res.admin.image || res.admin.profileImage;
        setProfile(prev => ({ ...prev, profileImage: updatedImage }));
        toast.success("Profile image updated");
        if (admin) {
          setLoginData({ ...admin, image: updatedImage, profileImage: updatedImage });
        }
      }
    } catch (error) {
      toast.error("Image upload failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleBulkSettingsUpdate = async (e) => {
    e.preventDefault();

    // Validation: ensure no value is less than 1 (except defaultCommission which can be 0)
    const keysToCheck = [
      "userBulkAdvancePct", "agentBulkAdvancePct", "vendorBulkAdvancePct",
      "adminBulkAdvancePct", "fleetBulkSecurityPct", "maxNegativeWalletLimit"
    ];
    for (let key of keysToCheck) {
      if (bulkSettings[key] === '' || bulkSettings[key] < 1) {
        return toast.error(`${key} must be 1 or greater.`);
      }
    }
    if (bulkSettings.defaultCommission === '' || bulkSettings.defaultCommission < 0) {
      return toast.error("Default Commission cannot be negative.");
    }

    try {
      setUpdating(true);
      const res = await updateBulkSettings(bulkSettings);
      if (res.success) {
        toast.success("Bulk Settings updated");
      }
    } catch (error) {
      toast.error("Update failed");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme === 'dark' ? '#111827' : '#F9FAFB' }}>
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <User className="text-blue-600" size={24} />
            </div>
          </div>
          <p className="mt-4 text-sm font-medium" style={{ color: textMain }}>Loading Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme === 'dark' ? '#111827' : '#F9FAFB' }}>
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div className="border-b" style={{ backgroundColor: cardBg, borderColor }}>
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold" style={{ color: textMain }}>Profile Settings</h1>
            <p className="text-sm mt-1" style={{ color: textDim }}>Manage your account preferences and security</p>
          </div>

          {/* Tabs */}
          <div className="flex space-x-8">
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'security', label: 'Security', icon: Shield },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              ...(admin?.role === 'SuperAdmin' ? [{ id: 'settings', label: 'Global Settings', icon: Settings }] : [])
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-1 flex items-center space-x-2 text-sm font-medium transition-colors relative ${activeTab === tab.id
                  ? 'text-blue-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor }}>
              {/* Cover Photo */}
              <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-600"></div>

              {/* Profile Image */}
              <div className="relative px-6 pb-6">
                <div className="flex justify-center">
                  <div className="relative -mt-12">
                    <div className="w-24 h-24 rounded-full border-4 overflow-hidden" style={{ borderColor: cardBg, backgroundColor: inputBg }}>
                      {profile.profileImage ? (
                        <img src={getImageUrl(profile.profileImage)} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User size={32} style={{ color: textDim }} />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                      style={{ backgroundColor: '#3B82F6', color: 'white' }}
                    >
                      <Camera size={14} />
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      className="hidden"
                      accept="image/*"
                    />
                  </div>
                </div>

                <div className="text-center mt-4">
                  <h2 className="text-xl font-bold" style={{ color: textMain }}>{profile.name}</h2>
                  <p className="text-sm mt-1" style={{ color: textDim }}>Administrator</p>

                  <div className="flex items-center justify-center gap-1 mt-2">
                    <Shield size={14} className="text-green-500" />
                    <span className="text-xs font-medium text-green-500">Verified Account</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t" style={{ borderColor }}>
                  <div className="text-center">
                    <p className="text-2xl font-bold" style={{ color: textMain }}>49</p>
                    <p className="text-xs" style={{ color: textDim }}>Total Users</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold" style={{ color: textMain }}>₹96</p>
                    <p className="text-xs" style={{ color: textDim }}>Earnings</p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail size={16} style={{ color: textDim }} />
                    <span className="text-sm" style={{ color: textMain }}>{profile.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone size={16} style={{ color: textDim }} />
                    <span className="text-sm" style={{ color: textMain }}>{profile.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin size={16} style={{ color: textDim }} />
                    <span className="text-sm" style={{ color: textMain }}>{profile.location}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar size={16} style={{ color: textDim }} />
                    <span className="text-sm" style={{ color: textMain }}>Joined {profile.joinDate}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Forms */}
          <div className="lg:col-span-2 space-y-6">

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor }}>
                <div className="p-6 border-b" style={{ borderColor }}>
                  <h3 className="text-lg font-semibold" style={{ color: textMain }}>Personal Information</h3>
                  <p className="text-sm mt-1" style={{ color: textDim }}>Update your personal details</p>
                </div>

                <form onSubmit={handleInfoUpdate} className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: textDim }}>Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: textDim }} />
                        <input
                          type="text"
                          value={profile.name}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                          style={{ backgroundColor: inputBg, borderColor, color: textMain }}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: textDim }}>Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: textDim }} />
                        <input
                          type="email"
                          value={profile.email}
                          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                          style={{ backgroundColor: inputBg, borderColor, color: textMain }}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: textDim }}>Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: textDim }} />
                        <input
                          type="text"
                          value={profile.phone}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                          style={{ backgroundColor: inputBg, borderColor, color: textMain }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: textDim }}>Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: textDim }} />
                        <input
                          type="text"
                          value={profile.location}
                          onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                          style={{ backgroundColor: inputBg, borderColor, color: textMain }}
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2" style={{ color: textDim }}>Bio</label>
                      <textarea
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        rows="3"
                        className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        style={{ backgroundColor: inputBg, borderColor, color: textMain }}
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t" style={{ borderColor }}>
                    <button
                      type="submit"
                      disabled={updating}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Save size={18} />
                      {updating ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor }}>
                <div className="p-6 border-b" style={{ borderColor }}>
                  <h3 className="text-lg font-semibold" style={{ color: textMain }}>Security Settings</h3>
                  <p className="text-sm mt-1" style={{ color: textDim }}>Update your password and security preferences</p>
                </div>

                <form onSubmit={handlePasswordUpdate} className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: textDim }}>Current Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: textDim }} />
                        <input
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                          style={{ backgroundColor: inputBg, borderColor, color: textMain }}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: textDim }}>New Password</label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: textDim }} />
                        <input
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                          style={{ backgroundColor: inputBg, borderColor, color: textMain }}
                          required
                        />
                      </div>
                      <p className="text-xs mt-1" style={{ color: textDim }}>Must be at least 6 characters</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: textDim }}>Confirm New Password</label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: textDim }} />
                        <input
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                          style={{ backgroundColor: inputBg, borderColor, color: textMain }}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Security Tips */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">Password Requirements:</h4>
                    <ul className="space-y-1 text-xs text-blue-600 dark:text-blue-400">
                      <li className="flex items-center gap-2">
                        <CheckCircle size={12} />
                        At least 6 characters long
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle size={12} />
                        Include numbers and letters
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle size={12} />
                        Don't use common passwords
                      </li>
                    </ul>
                  </div>

                  <div className="flex justify-end pt-4 border-t" style={{ borderColor }}>
                    <button
                      type="submit"
                      disabled={updating}
                      className="px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Lock size={18} />
                      {updating ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor }}>
                <div className="p-6 border-b" style={{ borderColor }}>
                  <h3 className="text-lg font-semibold" style={{ color: textMain }}>Notification Preferences</h3>
                  <p className="text-sm mt-1" style={{ color: textDim }}>Choose what updates you want to receive</p>
                </div>

                <div className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: inputBg }}>
                      <div className="flex items-center gap-3">
                        <Bell size={20} className="text-blue-600" />
                        <div>
                          <p className="font-medium" style={{ color: textMain }}>Email Updates</p>
                          <p className="text-xs" style={{ color: textDim }}>Receive updates about your account</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.emailUpdates}
                          onChange={(e) => setNotifications({ ...notifications, emailUpdates: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: inputBg }}>
                      <div className="flex items-center gap-3">
                        <Shield size={20} className="text-green-600" />
                        <div>
                          <p className="font-medium" style={{ color: textMain }}>Security Alerts</p>
                          <p className="text-xs" style={{ color: textDim }}>Get notified about security events</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.securityAlerts}
                          onChange={(e) => setNotifications({ ...notifications, securityAlerts: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: inputBg }}>
                      <div className="flex items-center gap-3">
                        <Mail size={20} className="text-purple-600" />
                        <div>
                          <p className="font-medium" style={{ color: textMain }}>Marketing Emails</p>
                          <p className="text-xs" style={{ color: textDim }}>Receive promotional content</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.marketingEmails}
                          onChange={(e) => setNotifications({ ...notifications, marketingEmails: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t" style={{ borderColor }}>
                    <button
                      onClick={() => toast.success('Notification preferences saved')}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Save size={18} />
                      Save Preferences
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Global Settings Tab */}
            {activeTab === 'settings' && admin?.role === 'SuperAdmin' && (
              <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor }}>
                <div className="p-6 border-b" style={{ borderColor }}>
                  <h3 className="text-lg font-semibold" style={{ color: textMain }}>Global Bulk Settings</h3>
                  <p className="text-sm mt-1" style={{ color: textDim }}>Configure platform-wide bulk booking payment rules</p>
                </div>

                <form onSubmit={handleBulkSettingsUpdate} className="p-6 space-y-6">
                  <div className="space-y-6">
                    {/* Normal Trip Default Commission */}
                    <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-900/10">
                      <h4 className="text-sm font-bold text-indigo-700 dark:text-indigo-400 mb-3 uppercase tracking-wider">Normal Trips Settings</h4>
                      <label className="block text-sm font-medium mb-2" style={{ color: textDim }}>Global Default Commission (%)</label>
                      <div className="relative md:w-1/2">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                          <Settings size={18} style={{ color: textDim }} />
                        </div>
                        <input
                          type="number"
                          value={bulkSettings.defaultCommission === '' ? '' : bulkSettings.defaultCommission}
                          onChange={(e) => setBulkSettings({ ...bulkSettings, defaultCommission: e.target.value === '' ? '' : Number(e.target.value) })}
                          className="w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                          style={{ backgroundColor: inputBg, borderColor, color: textMain }}
                          min="0" max="100"
                        />
                      </div>
                      <p className="text-xs mt-2" style={{ color: textDim }}>This is the platform fee % charged on standard individual trips.</p>
                    </div>

                    {/* App Features Toggles */}
                    <div className="p-4 rounded-xl border border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10">
                      <h4 className="text-sm font-bold text-green-700 dark:text-green-400 mb-3 uppercase tracking-wider">App Features Settings</h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium mb-1" style={{ color: textMain }}>Enable Share Ride Option</label>
                          <p className="text-xs" style={{ color: textDim }}>Toggle whether customers can see and select the "Share" car category.</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={appSettings.isShareRideEnabled}
                              onChange={handleShareRideToggle}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                          </label>
                          <span className="text-sm font-bold" style={{ color: appSettings.isShareRideEnabled ? '#16A34A' : '#DC2626' }}>
                            {appSettings.isShareRideEnabled ? "ON" : "OFF"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold mt-8 mb-4 uppercase tracking-wider" style={{ color: textDim }}>Bulk Booking Settings</h4>
                    {/* Reusable Setting Row component-like structure */}
                    {[
                      { label: "User Advance", pctKey: "userBulkAdvancePct", bankKey: "userPayViaBank" },
                      { label: "Agent Advance", pctKey: "agentBulkAdvancePct", bankKey: "agentPayViaBank" },
                      { label: "Vendor Advance", pctKey: "vendorBulkAdvancePct", bankKey: "vendorPayViaBank" },
                      { label: "Admin/SubAdmin Advance", pctKey: "adminBulkAdvancePct", bankKey: "adminPayViaBank" },
                      { label: "Fleet Security", pctKey: "fleetBulkSecurityPct", bankKey: "fleetSecurityPayViaBank" }
                    ].map((role) => (
                      <div key={role.pctKey} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border" style={{ borderColor, backgroundColor: inputBg }}>
                        {/* Percentage Input */}
                        <div>
                          <label className="block text-sm font-medium mb-2" style={{ color: textDim }}>{role.label} (%)</label>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                              <Settings size={18} style={{ color: textDim }} />
                            </div>
                            <input
                              type="number"
                              value={bulkSettings[role.pctKey] === '' ? '' : bulkSettings[role.pctKey]}
                              onChange={(e) => setBulkSettings({ ...bulkSettings, [role.pctKey]: e.target.value === '' ? '' : Number(e.target.value) })}
                              className="w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                              style={{ backgroundColor: inputBg, borderColor, color: textMain }}
                              min="1" max="100"
                            />
                          </div>
                        </div>

                        {/* Pay Via Bank Toggle */}
                        <div className="flex flex-col justify-center">
                          <label className="block text-sm font-medium mb-2" style={{ color: textDim }}>Pay Via Bank Gateway</label>
                          <div className="flex items-center gap-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={bulkSettings[role.bankKey]}
                                onChange={(e) => setBulkSettings({ ...bulkSettings, [role.bankKey]: e.target.checked })}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                            <span className="text-sm font-medium" style={{ color: bulkSettings[role.bankKey] ? '#10B981' : '#EF4444' }}>
                              {bulkSettings[role.bankKey] ? "ON (Bank)" : "OFF (Wallet Deduction)"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Max Negative Limit */}
                    <div className="p-4 rounded-xl border" style={{ borderColor, backgroundColor: inputBg }}>
                      <label className="block text-sm font-medium mb-2" style={{ color: textDim }}>Maximum Wallet Negative Limit (₹)</label>
                      <div className="relative md:w-1/2">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                          <Shield size={18} style={{ color: textDim }} />
                        </div>
                        <input
                          type="number"
                          value={bulkSettings.maxNegativeWalletLimit === '' ? '' : bulkSettings.maxNegativeWalletLimit}
                          onChange={(e) => setBulkSettings({ ...bulkSettings, maxNegativeWalletLimit: e.target.value === '' ? '' : Number(e.target.value) })}
                          className="w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                          style={{ backgroundColor: inputBg, borderColor, color: textMain }}
                          min="1"
                        />
                      </div>
                      <p className="text-xs mt-2" style={{ color: textDim }}>If 'Pay Via Bank' is OFF, users can owe up to this amount before their bookings are blocked.</p>
                    </div>

                    {/* Agent Lead Marketplace Profit */}
                    <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/10">
                      <h4 className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-3 uppercase tracking-wider">Agent Lead Marketplace</h4>
                      <label className="block text-sm font-medium mb-2" style={{ color: textDim }}>Admin Profit Cut (%)</label>
                      <div className="relative md:w-1/2">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                          <Settings size={18} style={{ color: textDim }} />
                        </div>
                        <input
                          type="number"
                          value={bulkSettings.agentLeadAdminProfitPct === '' ? '' : bulkSettings.agentLeadAdminProfitPct}
                          onChange={(e) => setBulkSettings({ ...bulkSettings, agentLeadAdminProfitPct: e.target.value === '' ? '' : Number(e.target.value) })}
                          className="w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                          style={{ backgroundColor: inputBg, borderColor, color: textMain }}
                          min="0" max="100"
                        />
                      </div>
                      <p className="text-xs mt-2" style={{ color: textDim }}>The percentage Admin deducts from the Agent's Commission when a lead is completed.</p>
                    </div>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="text-yellow-600 shrink-0" size={18} />
                    <p className="text-xs text-yellow-700 dark:text-yellow-400">
                      <strong>Note:</strong> Changes will apply to all NEW bulk bookings created after this update. Existing bookings will maintain their original calculation.
                    </p>
                  </div>

                  <div className="flex justify-end pt-4 border-t" style={{ borderColor }}>
                    <button
                      type="submit"
                      disabled={updating}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Save size={18} />
                      {updating ? 'Updating...' : 'Save Global Rules'}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}