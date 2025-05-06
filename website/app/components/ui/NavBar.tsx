import { useState, useEffect } from "react";
import { BsGear } from "react-icons/bs";
import { useMatches, useNavigate } from "react-router";

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

  return (ignoreNav ? null :
    <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="w-full pt-4 flex items-center justify-between">
          <div className="flex items-center">
            {isRootRoute 
              ? (<NavbarLogo />) 
              : (<a href="/"><NavbarLogo /></a>)
            }
          </div>
          <div className='flex flex-row items-center'>
            <div className="flex items-center mr-4">
              <svg onClick={() => setShowSearchBox(!showSearchBox)} 
                   xmlns="http://www.w3.org/2000/svg" 
                   className="h-6 w-6 cursor-pointer mr-2 text-gray-800 hover:text-gray-400 dark:text-white dark:hover:text-gray-400 stroke-current" 
                   fill="none" 
                   viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="text-gray-800 mt-1 hover:text-gray-400 dark:text-white dark:hover:text-gray-400 settings-button"
                aria-label="Settings"
              >
                <BsGear size={24}/>
              </button>
              {showSettings && (
                <div className="settings-modal absolute right-0 mt-2 w-60 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
                  <div className="px-4 py-2 flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-700">
                    <button 
                      onClick={toggleTheme}
                      className="flex justify-center items-center w-full text-gray-800 dark:text-white"
                    >
                      <span className="text-base text-gray-700 dark:text-gray-200 mr-2">
                        {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                      </span>
                      {theme === 'dark' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 stroke-current" fill="none" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" 
                          />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 stroke-current" fill="none" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" 
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="hidden sm:block px-4 py-2 justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-700">
                    
                      <button 
                        onClick={toggleZoomMode}
                        className="flex justify-center items-center w-full text-gray-800 dark:text-white flex-col"
                      >
                        <div className="flex items-center w-full">
                          <span className="text-base text-gray-700 dark:text-gray-200">
                            {zoomMode === 'out' ? 'Switch to Zoomed In Reading Mode' : 'Switch to Zoomed Out Reading Mode'}
                          </span>
                          {zoomMode === 'out' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 stroke-current ml-2" fill="none" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10H7" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 stroke-current ml-2" fill="none" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10H7M10 7v6" />
                            </svg>
                          )}
                        </div>
                        <img className="aspect-1 mt-2 bg-white" src="https://ink0.inkverse.co/general/zommed-in-vs-out-5.png" alt="Zoomed In vs Zoomed Out" />
                      </button>
                  </div>
                </div>
              )}
            </div>
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