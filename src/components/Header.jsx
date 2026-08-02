// src/components/Header.jsx
import { memo, useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  FaCog,
  FaSun,
  FaMoon,
  FaPalette,
  FaFont,
  FaTimes,
  FaBriefcase,
  FaStar,
  FaGem,
  FaSquare,
  FaUserCircle,
  FaExpand,
  FaCompress
} from "react-icons/fa";

const SettingsModal = ({
  isOpen,
  onClose,
  themeColors,
  palette,
  changePalette,
  toggleTheme,
  availablePalettes
}) => {
  // Use FontContext directly in SettingsModal
  const { currentFont, premiumFonts, changeFont } = useFont();

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Palette display names and icons
  const paletteInfo = {
    corporate: { label: "Professional", icon: FaBriefcase, desc: "Clean & formal" },
    luxury: { label: "Luxury", icon: FaStar, desc: "Premium & elegant" },
    modern: { label: "Modern", icon: FaGem, desc: "Fresh & vibrant" },
    minimal: { label: "Minimal", icon: FaSquare, desc: "Simple & clean" }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      style={{
        backgroundColor: themeColors.mode === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm mx-auto p-4 rounded-xl shadow-2xl border max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
          boxShadow: `0 10px 25px -5px ${themeColors.mode === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.15)'}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button - Circular */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center hover:rotate-90 transition-all duration-300 border"
          style={{
            color: themeColors.textSecondary,
            backgroundColor: themeColors.background,
            borderColor: themeColors.mode === 'light' ? themeColors.primary : themeColors.border,
          }}
          aria-label="Close settings"
        >
          <FaTimes className="text-sm" />
        </button>

        {/* Modal Header */}
        <div className="mb-4 pr-6">
          <div className="flex items-center gap-2 mb-1">
            <FaCog className="text-lg" style={{ color: themeColors.primary }} />
            <h3
              className="text-lg font-semibold"
              style={{ color: themeColors.text }}
            >
              Settings
            </h3>
          </div>
          <p
            className="text-xs"
            style={{ color: themeColors.textSecondary }}
          >
            Customize your workspace
          </p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-4">
          {/* Theme Section */}
          <div>
            <label
              className="flex items-center gap-2 text-xs font-medium mb-2"
              style={{ color: themeColors.text }}
            >
              <FaPalette className="text-sm" />
              Theme
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={toggleTheme}
                className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border transition-all duration-200 ${themeColors.mode === 'light' ? 'ring-1' : ''
                  }`}
                style={{
                  backgroundColor: themeColors.mode === 'light' ? themeColors.primary : themeColors.background,
                  borderColor: themeColors.mode === 'light' ? themeColors.primary : themeColors.border,
                  color: themeColors.mode === 'light' ? themeColors.onPrimary : themeColors.text,
                  ringColor: themeColors.primary,
                }}
              >
                <FaSun className="text-sm" />
                <span className="text-xs font-medium">Light</span>
              </button>
              <button
                onClick={toggleTheme}
                className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border transition-all duration-200 ${themeColors.mode === 'dark' ? 'ring-1' : ''
                  }`}
                style={{
                  backgroundColor: themeColors.mode === 'dark' ? themeColors.primary : themeColors.background,
                  borderColor: themeColors.mode === 'dark' ? themeColors.primary : themeColors.border,
                  color: themeColors.mode === 'dark' ? themeColors.onPrimary : themeColors.text,
                  ringColor: themeColors.primary,
                }}
              >
                <FaMoon className="text-sm" />
                <span className="text-xs font-medium">Dark</span>
              </button>
            </div>
          </div>

          {/* Font Section */}
          <div>
            <label
              className="flex items-center gap-2 text-xs font-medium mb-2"
              style={{ color: themeColors.text }}
            >
              <FaFont className="text-sm" />
              Font
            </label>
            <div className="relative">
              <select
                value={currentFont.key}
                onChange={(e) => changeFont(e.target.value)}
                className="w-full p-2 rounded-lg border focus:outline-none focus:ring-1 transition-all duration-200 text-xs appearance-none cursor-pointer"
                style={{
                  backgroundColor: themeColors.background,
                  color: themeColors.text,
                  borderColor: themeColors.border,
                  focusRingColor: themeColors.primary
                }}
              >
                {Object.values(premiumFonts).map((font) => (
                  <option
                    key={font.key}
                    value={font.key}
                    style={{
                      backgroundColor: themeColors.background,
                      color: themeColors.text
                    }}
                  >
                    {font.label}
                  </option>
                ))}
              </select>
              <div
                className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none"
                style={{ color: themeColors.textSecondary }}
              >
                <span className="text-xs">▼</span>
              </div>
            </div>
          </div>

          {/* Color Palette Section */}
          <div>
            <label
              className="flex items-center gap-2 text-xs font-medium mb-2"
              style={{ color: themeColors.text }}
            >
              <FaPalette className="text-sm" />
              Color Scheme
            </label>
            <div className="grid grid-cols-3 gap-2">
              {availablePalettes.map((paletteKey) => {
                const IconComponent = paletteInfo[paletteKey]?.icon || FaPalette;
                return (
                  <button
                    key={paletteKey}
                    onClick={() => changePalette(paletteKey)}
                    className={`flex flex-col items-center p-2 rounded-lg border transition-all duration-200 group ${palette === paletteKey ? 'ring-1' : ''
                      }`}
                    style={{
                      backgroundColor: palette === paletteKey ? themeColors.primary : themeColors.background,
                      borderColor: palette === paletteKey ? themeColors.primary : themeColors.border,
                      color: palette === paletteKey ? themeColors.onPrimary : themeColors.text,
                      ringColor: themeColors.primary,
                    }}
                    title={paletteInfo[paletteKey]?.label || paletteKey}
                  >
                    <IconComponent
                      className="text-sm mb-1 group-hover:scale-110 transition-transform duration-200"
                    />
                    <span className="text-xs truncate w-full">
                      {paletteInfo[paletteKey]?.label || paletteKey}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t" style={{ borderColor: themeColors.border }}>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 p-2 rounded-lg font-medium transition-all duration-200 hover:opacity-80 border"
              style={{
                backgroundColor: themeColors.background,
                color: themeColors.text,
                borderColor: themeColors.border
              }}
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="flex-1 p-2 rounded-lg font-medium transition-all duration-200 hover:opacity-80"
              style={{
                backgroundColor: themeColors.primary,
                color: themeColors.onPrimary,
              }}
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Header = memo(({
  toggleSidebar,
  currentPageTitle
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { themeColors, toggleTheme, palette, changePalette, availablePalettes } = useTheme();
  const { currentFont } = useFont();
  const { admin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <>
      <header
        className="h-16 flex items-center justify-between px-4 sm:px-6 border-b backdrop-blur-sm sticky top-0 z-40 transition-colors shadow-sm"
        style={{
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
        }}
      >
        <div className="flex items-center min-w-0 flex-1">
          <button
            onClick={toggleSidebar}
            className="lg:hidden mr-3 p-1.5 rounded-lg hover:scale-110 transition-all duration-200 active:scale-95"
            style={{
              color: themeColors.text,
              backgroundColor: themeColors.background
            }}
            aria-label="Open sidebar"
          >
            <span className="text-xl">☰</span>
          </button>
          <div className="flex flex-col border-l-4 pl-3" style={{ borderColor: themeColors.primary }}>
            <h2
              className="text-sm sm:text-base font-black truncate leading-none mb-1 flex items-center gap-1.5"
              style={{
                color: themeColors.text,
                fontFamily: currentFont.family
              }}
            >
              <span>👋</span>
              <span>Welcome Back,</span>
              <span className="font-black" style={{ color: themeColors.primary }}>{admin?.name || 'Admin'}</span>
              <span>✨</span>
            </h2>
            <p className="text-[9px] sm:text-[10px] font-semibold tracking-[0.15em] opacity-50 leading-none" style={{ color: themeColors.text }}>
              🛡️ Admin Panel &nbsp;•&nbsp; Full System Access
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
           <button
             onClick={toggleFullScreen}
             className="p-2 rounded-xl transition-all active:scale-95 border group hover:shadow-lg flex items-center justify-center"
             style={{
               backgroundColor: themeColors.primary + '12',
               borderColor: themeColors.primary + '35',
               color: themeColors.primary,
             }}
             title={isFullscreen ? "Exit Full Screen" : "Full Screen"}
           >
             {isFullscreen ? <FaCompress size={16} /> : <FaExpand size={16} />}
           </button>
           <button
             onClick={() => navigate('/admin/profile')}
             className="flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all active:scale-95 border group hover:shadow-lg"
             style={{
               backgroundColor: themeColors.primary + '12',
               borderColor: themeColors.primary + '35',
               color: themeColors.text,
             }}
           >
              <div
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] sm:text-xs font-black uppercase transition-all group-hover:scale-110"
                style={{
                  backgroundColor: themeColors.primary,
                  color: themeColors.onPrimary,
                }}
              >
                {admin?.name?.charAt(0) || '👤'}
              </div>
              <div className="hidden sm:flex flex-col items-start leading-none">
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: themeColors.primary }}>
                  {admin?.name || 'Admin'}
                </span>
                <span className="text-[8px] font-semibold tracking-widest opacity-50 mt-0.5 uppercase">My Profile</span>
              </div>
              <FaUserCircle size={14} className="opacity-40 group-hover:opacity-100 transition-opacity hidden sm:block" style={{ color: themeColors.primary }} />
           </button>
        </div>
      </header>

      {/* Settings Modal */}

    </>
  );
});

Header.displayName = 'Header';
export default Header;