import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, Archive, ArrowLeft, Bell, Check, CheckCheck, ChevronDown,
  CircleHelp, ClipboardList, Filter, Inbox, Languages, LayoutDashboard,
  LogOut, Menu, MessageCircle, MoreHorizontal, Paperclip, Plus, Search,
  Send, Settings, ShieldCheck, Sparkles, UserRound, Users, X
} from 'lucide-react';
import { isCloudConfigured, supabase } from './lib/supabase';

const KEY = 'jana-unified-demo-v1';
const stages = ['Жаңа', 'Қабылданды', 'Талдау', 'Күту', '3-линия', 'Шешім дайын', 'Аяқталды'];
const seed = [
  { id: 'T-1001', track: 'JP240001234KZ', jpid: 'GZTR', client: 'GZTR', title: 'Сәлемдеме мәртебесін тексеру', status: 'Жаңа', unread: 1, updated: Date.now() - 3600000, messages: [{ id: 1, from: 'client', text: 'Сәлеметсіз бе! Сәлемдемем қай жерде екенін тексеріп бересіз бе?', time: Date.now() - 3600000 }] },
  { id: 'T-1002', track: 'JP240005678KZ', jpid: 'JP10245', client: 'Клиент JP10245', title: 'Жеткізу мерзімі бойынша сұрақ', status: 'Талдау', unread: 0, updated: Date.now() - 7200000, messages: [{ id: 1, from: 'client', text: 'Жеткізу қашан болады?', time: Date.now() - 7200000 }, { id: 2, from: 'operator', text: 'Сұрауыңызды тексеріп жатырмыз.', time: Date.now() - 6900000 }] },
  { id: 'T-1003', track: 'JP240009876KZ', jpid: 'JP77881', client: 'Клиент JP77881', title: 'Мекенжайды нақтылау', status: 'Күту', unread: 0, updated: Date.now() - 86400000, messages: [] },
  { id: 'T-1004', track: 'JP240004444KZ', jpid: 'JP33002', client: 'Клиент JP33002', title: 'Қайтарым бойынша өтініш', status: 'Аяқталды', unread: 0, updated: Date.now() - 172800000, messages: [{ id: 1, from: 'operator', text: 'Өтінішіңіз орындалды. Рақмет!', time: Date.now() - 172800000 }] }
];

function readStore() {
  try { const value = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(value) ? value : seed; }
  catch { return seed; }
}
const time = (value) => new Date(value).toLocaleTimeString('kk-KZ', { hour: '2-digit', minute: '2-digit' });

export default function App() {
  const [tickets, setTickets] = useState(readStore);
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('jana-user')) || null; } catch { return null; }
  });
  const [jpid, setJpid] = useState('');
  const [role, setRole] = useState('client');
  const [activeId, setActiveId] = useState(null);
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const [view, setView] = useState('open');
  const [section, setSection] = useState('operator');
  const [sidebar, setSidebar] = useState(true);
  const [notice, setNotice] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newTrack, setNewTrack] = useState('');
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(tickets)); }, [tickets]);
  useEffect(() => {
    const sync = (event) => { if (event.key === KEY && event.newValue) { try { setTickets(JSON.parse(event.newValue)); } catch {} } };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const active = tickets.find(t => t.id === activeId) || null;
  const mine = tickets.filter(t => t.jpid === user?.jpid);
  const visibleTickets = useMemo(() => {
    const base = role === 'operator' ? tickets : mine;
    return base.filter(t => {
      const matchesView = view === 'done' ? t.status === 'Аяқталды' : t.status !== 'Аяқталды';
      const q = query.toLowerCase();
      return matchesView && [t.track, t.jpid, t.client, t.title].some(v => String(v || '').toLowerCase().includes(q));
    }).sort((a,b) => b.updated-a.updated);
  }, [tickets, mine, role, view, query]);

  function login(e) {
    e.preventDefault();
    const value = jpid.trim().toUpperCase();
    if (!value) return;
    const nextRole = value === 'SWAT' || value === 'OPERATOR' ? 'operator' : 'client';
    const profile = { jpid: value, role: nextRole };
    sessionStorage.setItem('jana-user', JSON.stringify(profile));
    setUser(profile); setRole(nextRole); setSection(nextRole === 'operator' ? 'operator' : 'client');
  }
  function logout() { sessionStorage.removeItem('jana-user'); setUser(null); setActiveId(null); setJpid(''); }
  function sendMessage(e) {
    e.preventDefault();
    if (!message.trim() || !active) return;
    const item = { id: Date.now(), from: role, text: message.trim(), time: Date.now() };
    setTickets(prev => prev.map(t => t.id === active.id ? { ...t, messages: [...(t.messages || []), item], updated: Date.now(), unread: role === 'client' ? (t.unread || 0) + 1 : 0 } : t));
    setMessage('');
  }
  function createTicket(e) {
    e.preventDefault();
    if (!newTrack.trim()) return;
    const ticket = { id: 'T-' + Date.now(), track: newTrack.trim().toUpperCase(), jpid: user.jpid, client: user.jpid, title: newTitle.trim() || 'Жаңа өтініш', status: 'Жаңа', unread: 0, updated: Date.now(), messages: [] };
    setTickets(prev => [ticket, ...prev]); setActiveId(ticket.id); setShowNew(false); setNewTrack(''); setNewTitle('');
  }
  function changeStatus(id, status) { setTickets(prev => prev.map(t => t.id === id ? { ...t, status, updated: Date.now() } : t)); }
  function flash(text) { setNotice(text); window.setTimeout(() => setNotice(''), 2600); }

  if (!user) return <div className="login-screen"><div className="login-card"><div className="brand-mark">J</div><div className="eyebrow">JANA POST · UNIFIED PLATFORM</div><h1>Бірыңғай жұмыс кеңістігі</h1><p>Клиенттік қолдау және SWAT операторлық жүйесі</p><form onSubmit={login}><label>JPID</label><input autoFocus value={jpid} onChange={e=>setJpid(e.target.value)} placeholder="JPID енгізіңіз" /><button className="primary full" type="submit">Жүйеге кіру <ArrowLeft size={17}/></button></form><div className="login-hint"><ShieldCheck size={15}/> MVP режимі: клиент үшін JPID, оператор үшін SWAT</div><div className="login-foot">Jana Post · 2026</div></div></div>;

  return <div className="app-shell">
    <header className="topbar"><button className="icon-btn" onClick={()=>setSidebar(!sidebar)}><Menu/></button><div className="brand"><span className="brand-mark small">J</span><b>Jana Post</b><span className="divider-v"></span><span className="muted">Unified Platform</span></div><div className="top-actions"><span className={isCloudConfigured?'cloud online':'cloud'}><i/> {isCloudConfigured?'Cloud connected':'Demo mode'}</span><button className="icon-btn" onClick={()=>flash('Хабарламалар әзірге жоқ')}><Bell/></button><div className="user-chip"><span className="avatar">{user.jpid.slice(0,1)}</span><span>{user.jpid}</span><ChevronDown size={14}/></div><button className="icon-btn" title="Шығу" onClick={logout}><LogOut/></button></div></header>
    <div className="workspace">
      {sidebar && <aside className="sidebar"><div className="side-caption">ЖҰМЫС КЕҢІСТІГІ</div><button className={section==='operator'?'side-link selected':'side-link'} onClick={()=>{setSection('operator');setRole('operator');setActiveId(null)}}><LayoutDashboard/> SWAT · Оператор</button><button className={section==='client'?'side-link selected':'side-link'} onClick={()=>{setSection('client');setRole('client');setActiveId(null)}}><MessageCircle/> Jana AI Chat</button><div className="side-caption space">ЖАЛПЫ</div><button className="side-link" onClick={()=>flash('Аналитика келесі кезеңде қосылады')}><Activity/> Аналитика</button><button className="side-link" onClick={()=>flash('Баптаулар келесі кезеңде қосылады')}><Settings/> Баптаулар</button><div className="sidebar-bottom"><div className="help-box"><CircleHelp/><b>Көмек керек пе?</b><span>Жүйе бойынша нұсқаулық</span></div><small>Jana Post © 2026</small></div></aside>}
      <main className="main-area">
        <div className="page-heading"><div><div className="eyebrow">{section==='operator'?'ОПЕРАЦИЯЛЫҚ БАСҚАРУ':'КЛИЕНТТІК ҚОЛДАУ'}</div><h1>{section==='operator'?'SWAT — Тикеттер':'Jana AI Chat'}</h1><p>{section==='operator'?'Өтініштерді қабылдау, өңдеу және бақылау':'Өтініштеріңіз бен операторлармен хат алмасу'}</p></div><div className="heading-actions"><button className="soft-btn" onClick={()=>setView(view==='open'?'done':'open')}><Archive size={16}/>{view==='open'?'Аяқталған':'Аяқталмаған'}</button>{section==='client'&&<button className="primary" onClick={()=>setShowNew(true)}><Plus size={17}/> Өтініш ашу</button>}</div></div>
        <div className="toolbar"><div className="searchbox"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Трек-код, JPID немесе өтініш бойынша іздеу..."/></div><button className="soft-btn"><Filter size={16}/> Сүзгі</button><div className="count-label">{visibleTickets.length} өтініш</div></div>
        {section==='operator' ? <div className="kanban">{stages.filter(s=>view==='done'?s==='Аяқталды':s!=='Аяқталды').map(stage=><section className="kanban-column" key={stage}><div className="column-head"><span className={'stage-dot dot-'+stages.indexOf(stage)}></span><b>{stage}</b><span className="stage-count">{visibleTickets.filter(t=>t.status===stage).length}</span></div><div className="ticket-stack">{visibleTickets.filter(t=>t.status===stage).map(t=><Ticket key={t.id} ticket={t} onClick={()=>setActiveId(t.id)}/>)}{visibleTickets.filter(t=>t.status===stage).length===0&&<div className="empty-column">Өтініш жоқ</div>}</div></section>)}</div> : <div className="client-list">{visibleTickets.map(t=><Ticket key={t.id} ticket={t} onClick={()=>setActiveId(t.id)}/>)}{visibleTickets.length===0&&<div className="empty-state"><Inbox size={34}/><b>Өтініштер табылмады</b><span>Жаңа өтініш ашу үшін жоғарыдағы батырманы басыңыз.</span></div>}</div>}
      </main>
    </div>
    {active&&<div className="drawer-backdrop" onClick={()=>setActiveId(null)}><aside className="ticket-drawer" onClick={e=>e.stopPropagation()}><div className="drawer-head"><div><div className="eyebrow">ӨТІНІШ КАРТОЧКАСЫ</div><h2>{active.track}</h2><span className="muted">{active.id} · {active.jpid}</span></div><button className="icon-btn" onClick={()=>setActiveId(null)}><X/></button></div><div className="drawer-meta"><div><small>КЛИЕНТ</small><b>{active.client}</b></div><div><small>МӘРТЕБЕСІ</small><b>{active.status}</b></div></div><div className="drawer-tabs"><span className="active-tab">Клиент</span><span>Ақпарат</span><span>Тарих</span></div><div className="chat-title"><div><b><MessageCircle size={16}/> Клиентпен чат</b><small>Трек-кодқа байланыстырылған диалог</small></div><span className="live-dot">Онлайн</span></div><div className="chat-messages">{(active.messages||[]).map(m=><div key={m.id} className={'message-row '+(m.from===role?'mine':'')}><div className="bubble"><span>{m.text}</span><small>{m.from==='operator'?'Оператор':'Клиент'} · {time(m.time)} {m.from===role&&<CheckCheck size={12}/>}</small></div></div>)}{(!active.messages||active.messages.length===0)&&<div className="chat-empty">Әзірге хабарлама жоқ. Диалогты бастаңыз.</div>}</div><form className="chat-compose" onSubmit={sendMessage}><button type="button" className="icon-btn" onClick={()=>flash('Файл тіркеу келесі кезеңде қосылады')}><Paperclip/></button><input value={message} onChange={e=>setMessage(e.target.value)} placeholder="Хабарлама жазыңыз..."/><button className="send-btn" type="submit"><Send size={17}/></button></form>{role==='operator'&&<div className="drawer-status"><label>Өтініш мәртебесін өзгерту</label><select value={active.status} onChange={e=>changeStatus(active.id,e.target.value)}>{stages.map(s=><option key={s}>{s}</option>)}</select></div>}</aside></div>}
    {showNew&&<div className="modal-backdrop" onClick={()=>setShowNew(false)}><form className="modal" onSubmit={createTicket} onClick={e=>e.stopPropagation()}><div className="modal-head"><h2>Жаңа өтініш</h2><button type="button" className="icon-btn" onClick={()=>setShowNew(false)}><X/></button></div><label>Трек-код</label><input required value={newTrack} onChange={e=>setNewTrack(e.target.value)} placeholder="Мысалы: JP240001234KZ"/><label>Өтініш тақырыбы</label><input value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Мәселені қысқаша сипаттаңыз"/><button className="primary full" type="submit">Өтінішті құру</button></form></div>}
    {notice&&<div className="toast"><Check size={16}/>{notice}</div>}
  </div>;
}

function Ticket({ticket,onClick}) {
  return <button className="ticket-card" onClick={onClick}><div className="ticket-top"><span className="ticket-id">{ticket.id}</span><span className="ticket-time">{time(ticket.updated)}</span></div><b className="ticket-track">{ticket.track}</b><span className="ticket-title">{ticket.title}</span><div className="ticket-bottom"><span className="client-tag"><UserRound size={13}/>{ticket.jpid}</span>{ticket.unread>0&&<span className="unread">{ticket.unread}</span>}</div></button>;
}