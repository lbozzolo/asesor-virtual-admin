
"use client";

const teamAvatarUrl = "https://studyxacademia.com/wp-content/uploads/2024/07/cropped-android-chrome-512x512-2.png";

export const TypingIndicator = () => {
    return (
        <div className="flex items-start gap-3 my-4 justify-start">
            <img src={teamAvatarUrl} alt="Equipo de Studyx escribiendo" className="flex-shrink-0 w-10 h-10 rounded-full object-cover" />
            <div className="px-4 py-3 rounded-2xl bg-gray-200 text-gray-500 rounded-tl-none flex items-center justify-center">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse mx-1" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
            </div>
        </div>
    );
};
