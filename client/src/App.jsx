import React, { useEffect, useState } from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import api from './api';
import { setSession, clearSession } from './store';

const demo = {
  employees: [
    { _id:'1', name:'Aarav Sharma', email:'aarav@staffsync.demo', department:'Engineering', title:'Frontend Developer', role:'employee' },
    { _id:'2', name:'Meera Patel', email:'meera@staffsync.demo', department:'People & Culture', title:'HR Executive', role:'hr' },
    { _id:'3', name:'Rohan Verma', email:'rohan@staffsync.demo', department:'Design', title:'Product Designer', role:'manager' },
    { _id:'4', name:'Ananya Singh', email:'ananya@staffsync.demo', department:'Marketing', title:'Marketing Associate', role:'employee' }
  ],
  leaves: [
    { _id:'l1', user:{name:'Aarav Sharma'}, type:'Casual Leave', startDate:'2026-10-28', endDate:'2026-10-29', status:'Pending', reason:'Personal work' },
    { _id:'l2', user:{name:'Ananya Singh'}, type:'Sick Leave', startDate:'2026-10-22', endDate:'2026-10-22', status:'Approved', reason:'Not feeling well' }
  ],
  announcements: [
    { _id:'a1', title:'Welcome to StaffSync', body:'Find team updates, HR information and resources here.', author:'People Team', createdAt:new Date().toISOString() },
    { _id:'a2', title:'Learning week', body:'New learning sessions will be shared in the training area this week.', author:'Learning Team', createdAt:new Date().toISOString() }
  ],
  trainings: [
    { _id:'t1', title:'Data Privacy Essentials', description:'Understand safe handling of company and employee data.', date:'2026-11-05' },
    { _id:'t2', title:'Communication at Work', description:'Practical techniques for clear and constructive teamwork.', date:'2026-11-12' }
  ]
};
function useLoad(path, fallback) {
  const [data, setData] = useState(fallback);
  const [error, setError] = useState('');
  const reload = async () => { try { const r = await api.get(path); setData(r.data); setError(''); } catch { setError('API offline — showing sample data. Start the server to save real records.'); } };
  useEffect(() => { reload(); }, [path]);
  return [data, setData, reload, error];
}
function AuthPage({ mode }) {
  const dispatch = useDispatch(), navigate = useNavigate();
  const [form, setForm] = useState({ name:'', email:'', password:'' }), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const submit = async e => {
    e.preventDefault(); setBusy(true); setError('');
    try { const { data } = await api.post(`/auth/${mode}`, form); dispatch(setSession(data)); navigate('/'); }
    catch (err) { setError(err.response?.data?.message || 'Could not connect. Make sure the backend is running.'); }
    finally { setBusy(false); }
  };
  return <div className="auth-wrap"><div className="auth-card"><div className="brand-mark large">S</div><p className="eyebrow">PEOPLE, CONNECTED</p><h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1><p className="muted">Your people operations, in one calm workspace.</p>
    <form onSubmit={submit}>{mode === 'register' && <label className="form-label">Full name<input required className="form-control" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your name"/></label>}
      <label className="form-label">Work email<input required type="email" className="form-control" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@company.com"/></label>
      <label className="form-label">Password<input required minLength="8" type="password" className="form-control" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="At least 8 characters"/></label>
      {error && <div className="alert alert-danger py-2">{error}</div>}<button className="btn btn-dark w-100 mt-2" disabled={busy}>{busy?'Please wait…':mode==='login'?'Sign in':'Create account'}</button></form>
    <p className="small muted mt-4 mb-0">{mode==='login'?'New to StaffSync? ':'Already have an account? '}<NavLink to={mode==='login'?'/register':'/login'}>{mode==='login'?'Create account':'Sign in'}</NavLink></p>
    <div className="demo-note mt-4"><strong>Preview mode</strong><br/>Explore sample dashboard data after signing in once the API is connected. Real accounts require MongoDB.</div>
  </div></div>;
}
function App() {
  const { token, user } = useSelector(s=>s.session), dispatch = useDispatch(), navigate = useNavigate();
  const [page, setPage] = useState('overview');
  if (!token) return <Routes><Route path="/register" element={<AuthPage mode="register"/>}/><Route path="*" element={<AuthPage mode="login"/>}/></Routes>;
  const role = user?.role || 'employee';
  const nav = [
    ['overview','Overview','▦'], ['employees','Employees','♙'], ['attendance','Attendance','◷'],
    ['leaves','Leave requests','▤'], ['announcements','Announcements','◉'], ['trainings','Training','◇']
  ];
  const logout = () => { dispatch(clearSession()); navigate('/login'); };
  return <div className="app-shell"><aside className="sidebar"><div className="brand"><span className="brand-mark">S</span><span>staff<span className="brand-light">sync</span><small>PEOPLE PLATFORM</small></span></div><div className="workspace-label">WORKSPACE</div><nav>{nav.map(([key,label,icon])=><button key={key} onClick={()=>setPage(key)} className={`side-link ${page===key?'active':''}`}><span className="nav-icon">{icon}</span>{label}{key==='leaves'&&<span className="nav-dot"/>}</button>)}</nav><div className="sidebar-bottom"><div className="avatar">{(user?.name||'U').split(' ').map(x=>x[0]).join('').slice(0,2)}</div><div className="user-meta"><strong>{user?.name||'Team member'}</strong><small>{role.toUpperCase()}</small></div><button className="logout" onClick={logout} title="Sign out">↗</button></div></aside>
    <main className="main-area"><header className="topbar"><div><div className="crumb">Workspace <span>/</span> <strong>{nav.find(x=>x[0]===page)?.[1]}</strong></div><div className="top-subtitle">A better day at work starts here.</div></div><div className="top-actions"><span className="status-pill"><i/> Workspace active</span><div className="top-avatar">{(user?.name||'U')[0]}</div></div></header>
    <div className="page-content">{page==='overview'?<Overview user={user} setPage={setPage}/>:page==='employees'?<Employees role={role}/>:page==='attendance'?<Attendance/>:page==='leaves'?<Leaves role={role}/>:page==='announcements'?<Announcements role={role}/>:<Trainings role={role}/>}</div>
    <footer className="footer">© 2026 StaffSync <span>Built for people-first teams</span></footer></main></div>;
}
function PageHeading({eyebrow,title,subtitle,action}) { return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="muted">{subtitle}</p></div>{action}</div>; }
function Overview({user,setPage}) {
  const [employees,, ,e1]=useLoad('/employees',demo.employees), [leaves,, ,e2]=useLoad('/leaves',demo.leaves), [announcements]=useLoad('/announcements',demo.announcements), [trainings]=useLoad('/trainings',demo.trainings);
  const isStaff = user?.role==='hr'||user?.role==='manager';
  return <><PageHeading eyebrow="YOUR WORKSPACE" title={`Good day, ${(user?.name||'there').split(' ')[0]} 👋`} subtitle="Here’s what’s happening across your workspace today." action={<button className="btn btn-dark" onClick={()=>setPage('leaves')}>＋ New request</button>}/>
    {(e1||e2)&&<div className="alert alert-warning py-2 small">{e1||e2}</div>}
    <div className="welcome-banner"><div><span className="banner-label">STAFFSYNC SNAPSHOT</span><h2>Great teams start with<br/>people who feel supported.</h2><p>Keep your people, plans and progress moving forward.</p><button className="banner-button" onClick={()=>setPage('announcements')}>View team updates <span>→</span></button></div><div className="banner-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="art-card"><div className="art-dot">✦</div><strong>People first.</strong><span>Work better together.</span><div className="art-people"><i>A</i><i>M</i><i>R</i><i>+</i></div></div></div></div>
    <div className="stats-grid"><Stat label={isStaff?'Total employees':'My department'} value={isStaff?employees.length:(user?.department||'General')} icon="♙" trend={isStaff?'+12% this quarter':'Team overview'}/><Stat label="Leave requests" value={leaves.length} icon="▤" trend={`${leaves.filter(x=>x.status==='Pending').length} pending review`}/><Stat label="Announcements" value={announcements.length} icon="◉" trend="Latest team updates"/><Stat label="Learning programs" value={trainings.length} icon="◇" trend="Keep growing"/></div>
    <div className="content-grid"><section className="panel"><div className="panel-head"><div><p className="eyebrow">PEOPLE DIRECTORY</p><h3>{isStaff?'Team members':'Your colleagues'}</h3></div><button className="text-button" onClick={()=>setPage('employees')}>View all →</button></div><div className="table-responsive"><table className="table align-middle"><thead><tr><th>NAME</th><th>DEPARTMENT</th><th>ROLE</th></tr></thead><tbody>{employees.slice(0,4).map((x,i)=><tr key={x._id||x.email}><td><div className="person-cell"><span className={`person-avatar color-${i%4}`}>{x.name.split(' ').map(y=>y[0]).join('')}</span><div><strong>{x.name}</strong><small>{x.email}</small></div></div></td><td>{x.department}</td><td><span className="role-tag">{x.title||x.role}</span></td></tr>)}</tbody></table></div></section>
    <section className="panel"><div className="panel-head"><div><p className="eyebrow">STAY IN THE LOOP</p><h3>Latest updates</h3></div><span className="soft-count">{announcements.length}</span></div>{announcements.slice(0,3).map(a=><div className="update-item" key={a._id}><span className="update-symbol">✦</span><div><strong>{a.title}</strong><p>{a.body}</p><small>{a.author||'People Team'}</small></div></div>)}<button className="btn btn-outline-secondary w-100 mt-2" onClick={()=>setPage('announcements')}>All announcements</button></section></div>
  </>;
}
function Stat({label,value,icon,trend}) { return <div className="stat-card"><div className="stat-top"><span>{label}</span><span className="stat-icon">{icon}</span></div><div className="stat-value">{value}</div><div className="stat-trend"><span>↗</span> {trend}</div></div>; }
function Employees({role}) {
  const [employees,setEmployees,reload,error]=useLoad('/employees',demo.employees), [query,setQuery]=useState(''), [form,setForm]=useState({name:'',email:'',department:'Engineering',title:'Team Member'}), [notice,setNotice]=useState('');
  const save=async e=>{e.preventDefault();try{await api.post('/employees',form);setNotice('Employee added successfully.');setForm({name:'',email:'',department:'Engineering',title:'Team Member'});reload();}catch(err){setNotice(err.response?.data?.message||'Could not save. Check that you are signed in as HR and the API is running.');}};
  const remove=async id=>{if(!confirm('Delete this employee?'))return;try{await api.delete(`/employees/${id}`);reload();}catch(err){setNotice(err.response?.data?.message||'Could not delete employee.');}};
  const filtered=employees.filter(x=>`${x.name} ${x.email} ${x.department}`.toLowerCase().includes(query.toLowerCase()));
  return <><PageHeading eyebrow="PEOPLE DIRECTORY" title="Employees" subtitle="Manage your people and keep team information up to date." action={<span className="soft-count">{employees.length} members</span>}/>{error&&<div className="alert alert-warning py-2 small">{error}</div>}{notice&&<div className="alert alert-info py-2">{notice}</div>}
    {role==='hr'&&<section className="panel mb-4"><div className="panel-head"><h3>Add a team member</h3></div><form className="row g-2" onSubmit={save}>{[['name','Full name'],['email','Work email'],['department','Department'],['title','Job title']].map(([k,l])=><div className="col-md-3" key={k}><input required className="form-control" placeholder={l} type={k==='email'?'email':'text'} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/></div>)}<div className="col-12"><button className="btn btn-dark">＋ Add employee</button></div></form></section>}
    <section className="panel"><div className="panel-head"><h3>All team members</h3><input className="form-control search-input" placeholder="Search people…" value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="table-responsive"><table className="table align-middle"><thead><tr><th>EMPLOYEE</th><th>DEPARTMENT</th><th>POSITION</th><th>ACCESS</th>{role==='hr'&&<th/>}</tr></thead><tbody>{filtered.map((x,i)=><tr key={x._id||x.email}><td><div className="person-cell"><span className={`person-avatar color-${i%4}`}>{x.name.split(' ').map(y=>y[0]).join('')}</span><div><strong>{x.name}</strong><small>{x.email}</small></div></div></td><td>{x.department}</td><td>{x.title||'Team member'}</td><td><span className="role-tag">{x.role||'employee'}</span></td>{role==='hr'&&<td><button className="btn btn-sm btn-outline-danger" onClick={()=>remove(x._id)}>Delete</button></td>}</tr>)}</tbody></table></div></section></>;
}
function Attendance() {
  const [records,,reload,error]=useLoad('/attendance',[]), [notice,setNotice]=useState('');
  const mark=async()=>{try{await api.post('/attendance');setNotice('Attendance marked for today.');reload();}catch(err){setNotice(err.response?.data?.message||'Could not mark attendance.');}};
  return <><PageHeading eyebrow="TIME & ATTENDANCE" title="Attendance" subtitle="Keep track of daily attendance and check-in history." action={<button className="btn btn-dark" onClick={mark}>＋ Mark present</button>}/>{notice&&<div className="alert alert-info">{notice}</div>}{error&&<div className="alert alert-warning small">{error}</div>}<section className="panel"><div className="panel-head"><h3>Attendance history</h3><span className="soft-count">{records.length} records</span></div><table className="table align-middle"><thead><tr><th>EMPLOYEE</th><th>DATE</th><th>STATUS</th></tr></thead><tbody>{records.length?records.map((r,i)=><tr key={r._id||i}><td>{r.user?.name||'You'}</td><td>{r.date||new Date(r.createdAt).toLocaleDateString()}</td><td><span className="status approved">{r.status||'Present'}</span></td></tr>):<tr><td colSpan="3" className="empty-state">No attendance records yet. Mark present to add today's record.</td></tr>}</tbody></table></section></>;
}
function Leaves({role}) {
  const [leaves,,reload,error]=useLoad('/leaves',demo.leaves), [form,setForm]=useState({type:'Casual Leave',startDate:'',endDate:'',reason:''}), [notice,setNotice]=useState('');
  const submit=async e=>{e.preventDefault();try{await api.post('/leaves',form);setNotice('Leave request submitted.');setForm({type:'Casual Leave',startDate:'',endDate:'',reason:''});reload();}catch(err){setNotice(err.response?.data?.message||'Could not submit request.');}};
  const decide=async(id,status)=>{try{await api.patch(`/leaves/${id}`,{status});reload();}catch(err){setNotice(err.response?.data?.message||'Could not update request.');}};
  return <><PageHeading eyebrow="TIME OFF" title="Leave management" subtitle="Request time away or review your team's leave requests."/><div className="content-grid"><section className="panel"><div className="panel-head"><h3>Request leave</h3></div><form onSubmit={submit} className="form-stack"><label>Leave type<select className="form-select" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option>Casual Leave</option><option>Sick Leave</option><option>Earned Leave</option><option>Unpaid Leave</option></select></label><div className="row g-2"><div className="col"><label>From<input required type="date" className="form-control" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})}/></label></div><div className="col"><label>To<input required min={form.startDate} type="date" className="form-control" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})}/></label></div></div><label>Reason<textarea className="form-control" rows="3" value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} placeholder="Optional details…"/></label><button className="btn btn-dark">Submit request</button></form>{notice&&<p className="small mt-3 mb-0">{notice}</p>}</section><section className="panel"><div className="panel-head"><h3>Recent requests</h3></div>{error&&<p className="small text-warning">{error}</p>}{leaves.map(l=><div className="leave-item" key={l._id}><div className="leave-icon">▤</div><div className="leave-details"><strong>{l.user?.name||'You'} · {l.type}</strong><p>{l.startDate} — {l.endDate}</p><span className={`status ${l.status?.toLowerCase()}`}>{l.status}</span>{l.reason&&<small className="d-block mt-1">{l.reason}</small>}</div>{['hr','manager'].includes(role)&&l.status==='Pending'&&<div className="leave-actions"><button className="btn btn-sm btn-success" onClick={()=>decide(l._id,'Approved')}>✓</button><button className="btn btn-sm btn-outline-danger" onClick={()=>decide(l._id,'Rejected')}>×</button></div>}</div>)}</section></div></>;
}
function Announcements({role}) {
  const [items,,reload,error]=useLoad('/announcements',demo.announcements), [form,setForm]=useState({title:'',body:''}), [notice,setNotice]=useState('');
  const post=async e=>{e.preventDefault();try{await api.post('/announcements',form);setNotice('Announcement posted.');setForm({title:'',body:''});reload();}catch(err){setNotice(err.response?.data?.message||'Only HR can post announcements when the API is running.');}};
  return <><PageHeading eyebrow="COMPANY NEWS" title="Announcements" subtitle="One place for team news, reminders and updates."/><div className="content-grid"><section className="panel"><div className="panel-head"><h3>Latest updates</h3></div>{error&&<div className="small text-warning mb-2">{error}</div>}{items.map(a=><article className="announcement-card" key={a._id}><div className="announcement-date">{new Date(a.createdAt||Date.now()).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</div><div><h4>{a.title}</h4><p>{a.body}</p><small>Posted by {a.author||'People Team'}</small></div></article>)}</section>{role==='hr'&&<section className="panel"><div className="panel-head"><h3>Post an announcement</h3></div><form className="form-stack" onSubmit={post}><label>Title<input required className="form-control" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label><label>Message<textarea required rows="4" className="form-control" value={form.body} onChange={e=>setForm({...form,body:e.target.value})}/></label><button className="btn btn-dark">Publish update</button>{notice&&<small>{notice}</small>}</form></section>}</div></>;
}
function Trainings({role}) {
  const [items,,reload,error]=useLoad('/trainings',demo.trainings), [form,setForm]=useState({title:'',description:'',date:''}), [notice,setNotice]=useState('');
  const post=async e=>{e.preventDefault();try{await api.post('/trainings',form);setNotice('Training added.');setForm({title:'',description:'',date:''});reload();}catch(err){setNotice(err.response?.data?.message||'Could not add training.');}};
  return <><PageHeading eyebrow="LEARNING & DEVELOPMENT" title="Training programs" subtitle="Build skills, share knowledge and keep growing."/><div className="training-grid">{items.map((t,i)=><article className="training-card" key={t._id}><div className={`training-art art-${i%3}`}>✦</div><div className="training-body"><span className="eyebrow">LEARNING PATH · 0{i+1}</span><h3>{t.title}</h3><p>{t.description}</p><div className="training-date">◷ {t.date||'Date to be announced'}</div></div></article>)}</div>{error&&<p className="small text-warning mt-2">{error}</p>}{['hr','manager'].includes(role)&&<section className="panel mt-4"><div className="panel-head"><h3>Add training program</h3></div><form className="row g-2" onSubmit={post}><div className="col-md-4"><input required className="form-control" placeholder="Training title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></div><div className="col-md-4"><input className="form-control" placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></div><div className="col-md-2"><input type="date" className="form-control" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div><div className="col-md-2"><button className="btn btn-dark w-100">Add training</button></div></form>{notice&&<small>{notice}</small>}</section>}</>;
}
export default App;
