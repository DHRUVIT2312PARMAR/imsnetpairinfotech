

import React from "react";

const AuthLayout = ({ children }) => {
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="flex w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden">
      
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center px-10 py-16 ">
          
     
          <img
            src="/src/assets/imgs/logo.png"
            alt="Company Logo"
            className="h-16 mb-8"
          />

         
          <div className="w-full overflow-y-auto max-h-[448px] pr-2">
            {children}
          </div>
        </div>

        <div className="hidden md:block md:w-1/2">
          <img
            src="/src/assets/imgs/img1.jpg"
            alt="Auth Illustration"
            className="h-full w-full object-fill"
          />
        </div>

      </div>
    </div>
  );
};

export default AuthLayout;
