import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
      <h1 className="text-4xl font-thin mb-12">Chill & Fresh</h1>
      <div className="flex flex-col gap-4 w-full max-w-md">
        <Button 
          onClick={() => navigate('/create')} 
          variant="primary"
          size="large"
          fullWidth
        >
          방 만들기
        </Button>
        <Button 
          onClick={() => navigate('/join')} 
          variant="secondary"
          size="large"
          fullWidth
        >
          참여하기
        </Button>
      </div>
      <p className="text-xs text-gray-400 mt-12">
        © 2025 Chill & Fresh - 로컬 네트워크 기반 소셜 게임
      </p>
    </div>
  );
};

export default Home;