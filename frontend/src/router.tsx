import { createBrowserRouter } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { BookingPage } from './pages/BookingPage';
import { HomePage } from './pages/HomePage';
import { MoviesPage } from './pages/MoviesPage';
import { RewatchPage } from './pages/RewatchPage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppLayout,
    children: [
      { index: true, Component: HomePage },
      { path: 'movies', Component: MoviesPage },
      { path: 'rewatch', Component: RewatchPage },
      { path: 'booking', Component: BookingPage },
    ],
  },
]);
