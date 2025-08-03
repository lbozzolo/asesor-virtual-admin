
"use client";

const studyxLogoUrl = "https://studyxacademia.com/wp-content/uploads/2024/08/logo-nuevo-xs-min.png";

export const ChatHeader = () => {
  return (
    <header className="py-4 bg-white shadow-sm flex-shrink-0 z-10">
      <div className="container mx-auto px-6 lg:px-8">
          <img src={studyxLogoUrl} alt="Logo Studyx" className="h-8" />
      </div>
    </header>
  );
};
