import { useState } from 'react';
import Sidebar, { type PageId } from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ManageDrivers from './pages/ManageDrivers';
import AddCar from './pages/AddCar';
import ShiftLog from './pages/ShiftLog';
import Maintenance from './pages/Maintenance';

function App() {
  const [activePage, setActivePage] = useState<PageId>('dashboard');

  const pageMap: Record<PageId, React.ReactNode> = {
    dashboard: <Dashboard />,
    drivers: <ManageDrivers />,
    cars: <AddCar />,
    'shift-log': <ShiftLog />,
    maintenance: <Maintenance />,
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="flex-1 lg:ml-64 min-h-screen pt-20 lg:pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {pageMap[activePage]}
        </div>
      </main>
    </div>
  );
}

export default App;
