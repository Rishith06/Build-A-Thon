import React, { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [activeTab, setActiveTab] = useState('invitations'); // 'invitations' or 'complaints'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, eventsRes, complaintsRes] = await Promise.all([
          api.get('users/'),
          api.get('events/'),
          api.get('complaints/')
      ]);
      setUsers(usersRes.data);
      setEvents(eventsRes.data);
      setComplaints(complaintsRes.data);
      if (eventsRes.data.length > 0 && !selectedEvent) setSelectedEvent(eventsRes.data[0].name);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch data", err);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const toggleUserSelection = (username) => {
    if (selectedUsers.includes(username)) {
        setSelectedUsers(selectedUsers.filter(u => u !== username));
    } else {
        setSelectedUsers([...selectedUsers, username]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
        setSelectedUsers([]);
    } else {
        setSelectedUsers(users.map(u => u.username));
    }
  };

  const handleBulkInvite = async () => {
    if (!selectedEvent) return setMessage("Please select an event.");
    if (selectedUsers.length === 0) return setMessage("No users selected.");

    setMessage(`Sending invites to ${selectedUsers.length} users...`);
    
    // Process in parallel (limit parallelism if needed, but 50 is fine for now)
    const promises = selectedUsers.map(username => 
        api.post('admin/generate-invite/', { username, event: selectedEvent })
           .then(() => ({ status: 'fulfilled', username }))
           .catch(err => ({ status: 'rejected', username, err }))
    );

    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    setMessage(`Successfully invited ${successCount} users to ${selectedEvent}.`);
    // Refresh data to potentially show updated status?
    fetchData(); 
  };

  const [roleFilter, setRoleFilter] = useState('all');
  const [collegeFilter, setCollegeFilter] = useState('all');

  const getFilteredUsers = () => {
    return users.filter(user => {
      if (roleFilter !== 'all' && user.role !== roleFilter) return false;
      
      if (collegeFilter !== 'all') {
         const type = user.student_type || 'internal';
         if (collegeFilter !== type) return false;
      }
      return true;
    });
  };

  const handleSuspend = async (username, currentStatus) => {
    const action = currentStatus ? 'unsuspend' : 'suspend';
    let duration = null;
    
    if (action === 'suspend') {
        const input = window.prompt(`Suspend ${username}? Enter duration in hours (leave empty for indefinite):`);
        if (input === null) return; // Cancelled
        if (input.trim() !== '') duration = input.trim();
    } else {
        if (!window.confirm(`Are you sure you want to UNSUSPEND ${username}?`)) return;
    }
    
    try {
        await api.post('admin/suspend-user/', { username, action, duration });
        // Update local state - simpler to just refetch
        fetchData();
        alert(`User ${username} ${action}ed.`);
    } catch (err) {
        alert("Action failed: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="container" style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Admin Panel</h1>
        <div>
            <button 
                onClick={() => setActiveTab('invitations')} 
                style={{ background: activeTab === 'invitations' ? '#007bff' : '#444', marginRight: '10px' }}
            >
                Invitations & Users
            </button>
            <button 
                onClick={() => setActiveTab('complaints')} 
                style={{ background: activeTab === 'complaints' ? '#dc3545' : '#444', marginRight: '20px' }}
            >
                ⚠️ Complaints
            </button>
            <button onClick={handleLogout} style={{ background: '#666' }}>Logout</button>
        </div>
      </div>
      
      {message && <div style={{ padding: '10px', background: '#333', margin: '10px 0', borderRadius: '4px' }}>{message}</div>}

      {activeTab === 'invitations' && (
      <>
      <div style={{ background: '#222', padding: '20px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Target Event (for Invites):</label>
            <select 
                value={selectedEvent} 
                onChange={(e) => setSelectedEvent(e.target.value)}
                style={{ width: '100%', padding: '10px' }}
            >
                {events.map(ev => <option key={ev.id} value={ev.name}>{ev.name}</option>)}
            </select>
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Filter by Role:</label>
            <select 
                value={roleFilter} 
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{ width: '100%', padding: '10px' }}
            >
                <option value="all">All Users</option>
                <option value="student">Students</option>
                <option value="guest">Guests</option>
                <option value="staff">Staff</option>
            </select>
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Filter by College:</label>
            <select 
                value={collegeFilter} 
                onChange={(e) => setCollegeFilter(e.target.value)}
                style={{ width: '100%', padding: '10px' }}
            >
                <option value="all">All Colleges</option>
                <option value="internal">My College (Internal)</option>
                <option value="external">Other Colleges (External)</option>
            </select>
        </div>
        <button onClick={handleBulkInvite} style={{ background: '#28a745', height: '42px' }}>
            Invite Selected ({selectedUsers.length})
        </button>
      </div>

      <div style={{ background: '#222', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
         <h4 style={{ marginTop: 0 }}>Create New Event</h4>
         <form onSubmit={async (e) => {
             e.preventDefault();
             const formData = new FormData(e.target);
             const name = formData.get('name');
             if(!name) return;
             try {
                await api.post('events/', { name, is_persistent: false });
                alert('Event created!');
                fetchData();
                e.target.reset();
             } catch(err) { alert('Failed to create event'); }
         }} style={{ display: 'flex', gap: '10px' }}>
             <input name="name" placeholder="Event Name (e.g., Robot War)" style={{ flex: 1, padding: '10px' }} required />
             <button type="submit" style={{ background: '#007bff' }}>Create Event</button>
         </form>
      </div>

      <div style={{ textAlign: 'left' }}>
        <h3>Registered Users</h3>
        {loading ? <p>Loading users...</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ background: '#333' }}>
                <th style={{ padding: '10px' }}>
                    <input 
                        type="checkbox" 
                        checked={selectedUsers.length === users.length && users.length > 0} 
                        onChange={toggleSelectAll} 
                    />
                </th>
                <th style={{ padding: '10px' }}>Username</th>
                <th style={{ padding: '10px' }}>Role</th>
                <th style={{ padding: '10px' }}>College / Type</th>
                <th style={{ padding: '10px' }}>Passes</th>
                <th style={{ padding: '10px' }}>Status</th>
                <th style={{ padding: '10px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredUsers().map(user => {
                const hasPass = user.pass_event_names && user.pass_event_names.includes(selectedEvent);
                return (
                <tr key={user.id} style={{ borderBottom: '1px solid #444', background: user.is_suspended ? 'rgba(255,0,0,0.1)' : 'transparent' }}>
                  <td style={{ padding: '10px' }}>
                    <input 
                        type="checkbox" 
                        checked={selectedUsers.includes(user.username)}
                        onChange={() => toggleUserSelection(user.username)}
                    />
                  </td>
                  <td style={{ padding: '10px' }}>{user.username}</td>
                  <td style={{ padding: '10px' }}>
                      {user.role ? <span style={{ textTransform: 'capitalize', padding: '2px 6px', borderRadius: '4px', background: '#444' }}>{user.role}</span> : 'Student'}
                  </td>
                  <td style={{ padding: '10px' }}>
                     {user.student_type === 'external' ? (
                         <span style={{ color: '#ffc107' }}>
                            {user.college_name || 'External'}
                         </span>
                     ) : (
                         <span style={{ color: '#17a2b8' }}>My College</span>
                     )}
                  </td>
                  <td style={{ padding: '10px' }}>
                     {hasPass ? 
                        <span style={{ color: '#4caf50' }}>Has Pass</span> : 
                        <span style={{ color: '#aaa' }}>None</span>
                     }
                  </td>
                  <td style={{ padding: '10px' }}>
                     {user.is_suspended ? <span style={{ color: 'red', fontWeight: 'bold' }}>SUSPENDED</span> : <span style={{ color: '#4caf50' }}>Active</span>}
                  </td>
                  <td style={{ padding: '10px' }}>
                    {!hasPass && (
                        <button 
                            onClick={async () => {
                                try {
                                    await api.post('admin/generate-invite/', { username: user.username, event: selectedEvent });
                                    alert(`Invited ${user.username} to ${selectedEvent}`);
                                    fetchData();
                                } catch(err) { alert('Failed to invite'); }
                            }}
                            style={{ padding: '5px 10px', fontSize: '0.8em', background: '#17a2b8', marginRight: '5px' }}
                        >
                            Invite
                        </button>
                    )}
                    <button 
                        onClick={() => handleSuspend(user.username, user.is_suspended)}
                        style={{ padding: '5px 10px', fontSize: '0.8em', background: user.is_suspended ? '#28a745' : '#dc3545', marginRight: '5px' }}
                    >
                        {user.is_suspended ? 'Unsuspend' : 'Suspend'}
                    </button>
                    {hasPass && (
                        <button 
                            onClick={async () => {
                                if(!window.confirm(`Revoke pass for ${user.username} for ${selectedEvent}?`)) return;
                                try {
                                    await api.post('admin/revoke-invite/', { username: user.username, event: selectedEvent });
                                    fetchData();
                                } catch(err) { alert('Failed to revoke'); }
                            }}
                            style={{ padding: '5px 10px', fontSize: '0.8em', background: '#ff9800', color: 'black', marginRight: '5px' }}
                        >
                            Revoke
                        </button>
                    )}
                    <button 
                         onClick={async () => {
                             if(!window.confirm(`PERMANENTLY DELETE user ${user.username}? This cannot be undone.`)) return;
                             try {
                                 await api.post('admin/delete-user/', { username: user.username });
                                 fetchData();
                             } catch(err) { alert('Failed to delete user'); }
                         }}
                         style={{ padding: '5px 10px', fontSize: '0.8em', background: '#d9534f', color: 'white' }}
                    >
                        Delete
                    </button>
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        )}
      </div>
      </>
      )}

      {activeTab === 'complaints' && (
      <div>
         <h3>Incident Reports & Complaints</h3>
         {complaints.length === 0 ? <p style={{ color: '#aaa', fontStyle: 'italic' }}>No complaints filed.</p> : (
             <div style={{ display: 'grid', gap: '20px' }}>
                 {complaints.map(complaint => (
                     <div key={complaint.id} style={{ background: '#222', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #dc3545' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                             <div>
                                 <h4 style={{ margin: '0 0 5px 0', color: '#ffc107' }}>
                                    AGAINST: {complaint.user_details.username}
                                 </h4>
                                 <p style={{ margin: '0', fontSize: '0.9em', color: '#aaa' }}>
                                    Role: {complaint.user_details.is_staff ? 'Staff' : 'Student'} | 
                                    Reported by: {complaint.reporter_name} on {new Date(complaint.created_at).toLocaleString()}
                                 </p>
                             </div>
                             <div style={{ textAlign: 'right' }}>
                                 <div style={{ marginBottom: '10px' }}>
                                     {complaint.user_details.is_suspended ? (
                                         <span style={{ color: 'red', fontWeight: 'bold', border: '1px solid red', padding: '2px 8px', borderRadius: '4px' }}>SUSPENDED</span>
                                     ) : (
                                        <span style={{ color: '#4caf50', border: '1px solid #4caf50', padding: '2px 8px', borderRadius: '4px' }}>ACTIVE</span>
                                     )}
                                 </div>
                                 <button 
                                    onClick={() => handleSuspend(complaint.user_details.username, complaint.user_details.is_suspended)}
                                    style={{ background: complaint.user_details.is_suspended ? '#28a745' : '#dc3545', fontSize: '0.9em', padding: '5px 15px', marginRight: '10px' }}
                                 >
                                    {complaint.user_details.is_suspended ? 'Unsuspend Student' : 'Suspend Student'}
                                 </button>
                                 <button 
                                    onClick={async () => {
                                        if(!window.confirm('Delete this complaint report?')) return;
                                        try {
                                            await api.post('admin/delete-complaint/', { id: complaint.id });
                                            // Optimistically remove
                                            setComplaints(complaints.filter(c => c.id !== complaint.id));
                                        } catch (err) { alert('Failed to delete.'); }
                                    }}
                                    style={{ background: '#666', fontSize: '0.9em', padding: '5px 15px' }}
                                 >
                                    🗑️ Delete
                                 </button>
                             </div>
                         </div>
                         
                         <div style={{ marginTop: '15px', background: 'rgba(255,0,0,0.05)', padding: '15px', borderRadius: '5px' }}>
                             <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{complaint.description}</p>
                         </div>

                         {complaint.proof_photo && (
                             <div style={{ marginTop: '15px' }}>
                                 <p style={{ margin: '0 0 5px 0', fontSize: '0.9em', color: '#aaa' }}>Proof / Photo at time of report:</p>
                                 <img 
                                    src={complaint.proof_photo.startsWith('http') ? complaint.proof_photo : `http://127.0.0.1:8000${complaint.proof_photo}`} 
                                    alt="Evidence" 
                                    style={{ maxWidth: '300px', borderRadius: '5px', border: '1px solid #444' }} 
                                 />
                             </div>
                         )}
                     </div>
                 ))}
             </div>
         )}
      </div>
      )}
    </div>
  );
}

export default AdminPanel;
