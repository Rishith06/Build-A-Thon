import React, { useEffect, useState } from 'react';
import api from '../api';
import { QRCodeCanvas } from 'qrcode.react';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

function Dashboard() {
  const [passes, setPasses] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch User Details
      try {
        const userRes = await api.get('me/');
        setUser(userRes.data);
      } catch (err) {
        console.error("Failed to fetch user", err);
      }

      // 2. Fetch Passes
      try {
        const qrRes = await api.get('my-qr/');
        if (Array.isArray(qrRes.data)) {
            setPasses(qrRes.data);
        } else {
            setPasses([]);
        }
      } catch (err) {
        setPasses([]); 
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const baseURL = 'http://localhost:8000'; // Or from env

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in-up">
        {/* User Profile Section */}
        <div className="md:col-span-1">
          <Card className="h-full flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[var(--primary)] shadow-[0_0_20px_var(--primary-glow)]">
                {user?.photo_url ? (
                  <img 
                    src={`${baseURL}${user.photo_url}`} 
                    alt={user.username} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#2a2a2a] flex items-center justify-center text-3xl text-[var(--text-muted)]">
                    {user?.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[var(--bg-surface)] ${user?.is_suspended ? 'bg-red-500' : 'bg-green-500'}`}></div>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-1">{user?.username}</h2>
            <p className="text-[var(--text-muted)] mb-4">{user?.email}</p>
            
            <div className="w-full mt-auto pt-4 border-t border-[var(--border-color)]">
               <div className="flex justify-between items-center text-sm mb-2">
                 <span className="text-[var(--text-muted)]">Role</span>
                 <span className="capitalize px-2 py-1 rounded bg-[rgba(255,255,255,0.05)] text-[var(--primary)] border border-[var(--primary)] border-opacity-30">
                   {user?.role}
                 </span>
               </div>
               <div className="flex justify-between items-center text-sm">
                 <span className="text-[var(--text-muted)]">Status</span>
                 <span className={user?.is_suspended ? "text-red-500 font-bold" : "text-green-400 font-bold"}>
                   {user?.is_suspended ? 'SUSPENDED' : 'ACTIVE'}
                 </span>
               </div>
            </div>
          </Card>
        </div>

        {/* Functionality / Passes Section */}
        <div className="md:col-span-2">
          <h3 className="text-xl font-bold mb-6 border-l-4 border-[var(--secondary)] pl-3">
            Your Event Passes
          </h3>

          {passes.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {passes.map((pass) => (
                <Card key={pass.id} className="relative group hover:border-[var(--secondary)] transition-colors">
                  <div className="text-center">
                    <h4 className="text-lg font-bold text-[var(--secondary)] mb-4">
                      {pass.event ? pass.event.name : 'Hackathon Entry'}
                    </h4>
                    
                    <div className="bg-white p-4 rounded-xl inline-block shadow-[0_0_30px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_30px_var(--secondary-glow)] transition-shadow duration-300">
                      <QRCodeCanvas value={pass.qr_code_data} size={180} />
                    </div>
                    
                    <p className="mt-4 text-xs font-mono text-[var(--text-muted)] opacity-50">
                      ID: {pass.qr_code_data.substring(0, 16)}...
                    </p>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">
                      Scan at venue entrance
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2 border-[var(--border-color)] bg-transparent">
              <div className="text-4xl mb-4">🎫</div>
              <h3 className="text-xl font-bold mb-2">No Active Passes</h3>
              <p className="text-[var(--text-muted)] max-w-sm mb-6">
                You don't have any event passes yet. Once registered for an event, your QR code will appear here.
              </p>
              <Button onClick={() => window.location.reload()}>Refresh</Button>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;
