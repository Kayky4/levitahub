import React from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <h2 className="mt-6 text-center text-9xl font-extrabold text-primary">404</h2>
          <h2 className="mt-4 text-center text-3xl font-extrabold text-gray-900">
            Página não encontrada
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            O recurso que você está procurando não existe ou foi movido.
          </p>
        </div>
        <div>
          <Link
            to="/dashboard"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-700 focus:outline-none"
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;