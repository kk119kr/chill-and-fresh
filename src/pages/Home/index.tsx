import React from 'react';

const Home: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <h1 className="text-4xl font-thin mb-12">Chill & Fresh</h1>
      <div className="flex flex-col gap-4 w-4/5 max-w-md">
        <button className="h-14 w-full bg-gray-50 rounded-full shadow-sm hover:bg-gray-100 transition-colors">
          방 만들기
        </button>
        <button className="h-14 w-full bg-white border border-gray-100 rounded-full hover:bg-gray-50 transition-colors">
          참여하기
        </button>
      </div>
    </div>
  );
};

export default Home;