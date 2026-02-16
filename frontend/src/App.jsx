import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Gateways from './pages/Gateways';
import Sessions from './pages/Sessions';
import CronJobs from './pages/CronJobs';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="gateways" element={<Gateways />} />
            <Route path="sessions" element={<Sessions />} />
            <Route path="cron" element={<CronJobs />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
