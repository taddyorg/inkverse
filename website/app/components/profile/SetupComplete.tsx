import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserDetails } from "@/lib/auth/user";

export function SetupComplete() {
  const navigate = useNavigate();
  
  useEffect(() => {
    const user = getUserDetails();
    if (!user) {
      navigate('/');
      return;
    }

    setTimeout(() => {
      navigate(`/${user?.username}`);
    }, 500);

    
  }, []);

  return (
    <div className="text-center py-8">
      <div className="mb-4">
        <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Profile setup complete!
      </h2>
      <p className="text-gray-600 dark:text-gray-400">
        Redirecting you to your profile...
      </p>
    </div>
  );
}