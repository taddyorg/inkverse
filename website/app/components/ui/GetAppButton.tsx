export function GetAppButton() {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 ly_app_floating on md:hidden w-auto">
      <a 
        href="https://inkverse.co/download" 
        className="link flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl shadow-lg text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-base py-3 px-4 no-underline whitespace-nowrap"
      >
        <div className="flex items-center">
          <span className="flex items-center justify-center mr-3 w-7 h-7 bg-paper-pink rounded-lg">
            <img src="https://ax0.taddy.org/inkverse/inkverse-square-transparent.png" alt="App logo" className="w-5 h-5" />
          </span>
          <span className="font-semibold">Get the Inkverse app</span>
        </div>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 ml-1 mt-0.5" 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path 
            fillRule="evenodd" 
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" 
            clipRule="evenodd" 
          />
        </svg>
      </a>
    </div>
  );
} 