import { useRouteError } from "react-router-dom";
import { Link } from "react-router-dom";

export default function ErrorPage() {
  const error = useRouteError();
  
  // Get a user-friendly error message
  const getErrorMessage = () => {
    if (error instanceof Error) {
      if (error.message.includes("404")) {
        return "The page you're looking for doesn't exist.";
      }
      return error.message;
    }
    return "Something went wrong. Please try again later.";
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-8">
        <h1 className="text-5xl font-bold mb-4 text-gray-900 dark:text-white">
          Oops!
        </h1>
        <p className="text-xl mb-6 text-gray-700 dark:text-gray-300">
          {getErrorMessage()}
        </p>
        <Link 
          to="/"
          className="inline-block px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 
                     text-white font-medium transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
} 