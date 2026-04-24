import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// Optional: customize NProgress appearance
NProgress.configure({ showSpinner: false, trickleSpeed: 200 });

const RouteProgress = () => {
  const location = useLocation();

  useEffect(() => {
    NProgress.start();
    // Simulate short delay for demo; in real app, you might tie to data loading.
    const timer = setTimeout(() => {
      NProgress.done();
    }, 300);
    return () => {
      clearTimeout(timer);
      NProgress.done();
    };
  }, [location]);

  return null;
};

export default RouteProgress;
