import { useState, useEffect } from "react";
import { PiUserBold } from "react-icons/pi";
import { Link, useMatches, useNavigate } from "react-router";
import { SignupModal } from "../profile/SignupModal";
import { isAuthenticated, getUserDetails } from "@/lib/auth/user";

interface NavbarProps {
  theme: string;
  zoomMode: string;
  onThemeChange: (theme: string) => void;
  onZoomModeChange: (zoomMode: string) => void;
}

export function Navbar({ theme, zoomMode, onThemeChange, onZoomModeChange }: NavbarProps) {
  const ignoreNavRoutes = ["/blog", "/terms-of-service", "/open-source", "/brand-kit", "/updates"];
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTypes, setSearchTypes] = useState('comics');
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);

  const userDetails = getUserDetails();
  const isUserAuthenticated = isAuthenticated();

  const matches = useMatches();
  const navigate = useNavigate();

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    onThemeChange(newTheme);
  };

  const toggleZoomMode = async () => {
    const newZoomMode = zoomMode === 'in' ? 'out' : 'in';
    onZoomModeChange(newZoomMode);
    
    // Add/remove zoom class to root element
    if (newZoomMode === 'in') {
      document.documentElement.classList.add('zoomed-in');
    } else {
      document.documentElement.classList.remove('zoomed-in');
    }
  };

  // Check if the current route starts with any of the ignoreNavRoutes
  const ignoreNav = matches.some((match) => 
    ignoreNavRoutes.some(route => match.pathname.startsWith(route))
  );

  const isRootRoute = matches.length > 0 && matches[matches.length - 1].pathname === '/';

  function handleSearch(e?: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>) {
    navigate(`/search/${searchTerm}/${searchTypes}`);
  }

  useEffect(() => {
    const handleCloseSearchBox = () => setShowSearchBox(false);
    window.addEventListener('closeSearchBox', handleCloseSearchBox);
    
    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('closeSearchBox', handleCloseSearchBox);
    };
  }, []);

  // Close settings when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showSettings && !target.closest('.settings-modal') && !target.closest('.settings-button')) {
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettings]);

  return (ignoreNav
   ?  <>
        <SignupModal
          isOpen={showSignupModal}
          onClose={() => setShowSignupModal(false)}
          hideComponent={false}
        />
      </>
   : <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="w-full pt-4 flex items-center justify-between">
          <div className="flex items-center">
            {isRootRoute 
              ? (<NavbarLogo />) 
              : (<Link to="/"><NavbarLogo /></Link>)
            }
          </div>
          <div className='flex flex-row items-center space-x-4'>
            {/* Search Icon */}
            <button 
              onClick={() => setShowSearchBox(!showSearchBox)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6 text-gray-800 dark:text-white stroke-current" 
                  fill="none" 
                  viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Theme Toggle */}
            {!isUserAuthenticated && (
              <>
                <button 
                  onClick={toggleTheme}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center"
                >
                  {theme === 'light' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800 stroke-current" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" 
                      />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white stroke-current" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" 
                      />
                    </svg>
                  )}
                </button>
              </>
            )}
            
            {/* if window is undefined, add some space to the right */}
            {typeof window === 'undefined' && (
              <div className="w-4"></div>
            )}

            {typeof window !== 'undefined' && !isAuthenticated() && (
              <>
                <button
                  onClick={() => setShowSignupModal(true)}
                  className="bg-red-500 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-800 text-white font-semibold px-6 py-2 rounded-full flex items-center justify-center"
                >
                  Sign Up
                </button>
                
                <SignupModal
                  isOpen={showSignupModal}
                  onClose={() => setShowSignupModal(false)}
                />
              </>
            )}

            {/* Profile Button */}
            {typeof window !== 'undefined' && userDetails && (
              <Link to={userDetails?.username ? `/${userDetails?.username}` : '/profile/setup'} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center">
                <PiUserBold className="h-6 w-6 text-gray-800 dark:text-white" />
              </Link>
            )}
          </div>
        </div>
        {showSearchBox && (
          <>
            <div className="relative mt-2">
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-4 pr-20 py-2 border rounded-full text-inkverse-black w-full" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                onKeyDown={(e) => {if (e.key === 'Enter') handleSearch()}} 
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="text-black font-bold py-2 px-4">
                    x
                  </button>
                )}
                <button onClick={handleSearch} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded-full">
                  Search
                </button>
              </div>
            </div>
          </>
        )}
    </nav>
  )
}

function NavbarLogo() {
  return (
    <img 
      className="h-14 w-auto sm:h-16" 
      src="https://ax0.taddy.org/inkverse/inkverse-square-transparent.png" 
      alt="Inkverse Logo" 
    />
  );
}

export default Navbar;