import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, Archive, ArrowLeft, Bell, Check, CheckCheck, ChevronDown,
  CircleHelp, ClipboardList, Filter, Inbox, LayoutDashboard, LogOut, Menu,
  MessageCircle, Paperclip, Plus, Search, Send, Settings, ShieldCheck,
  Smile, UserRound, X, Pencil, Clock, Image as ImageIcon, FileText, MoreHorizontal
} from 'lucide-react';
import { fetchSharedTickets, saveSharedTickets, subscribeSharedTickets } from './lib/bridge';

const STORE = 'jana-unified-prototype-v2';
const USER = 'jana-user';
const stages = ['Жаңа','Қабылданды','Талдау','Күту','3-линия','Аударма','IT бөлімі','Аймаққа жіберілді','Филиал жауабы күтілуде','Шешім іздеу','Шешім дайын','Клиентке жауап берілді','Аяқталды'];
const kanbanStages = ['Жаңа','Қабылданды','Талдау','Күту','3-линия','Шешім дайын','Аяқталды'];
const seed = [
 {id:'T-1001',track:'JP240001234KZ',jpid:'GZTR',client:'GZTR',title:'Сәлемдеме мәртебесін тексеру',status:'Жаңа',unread:1,updated:Date.now()-3600000,created:Date.now()-3600000,events:[{text:'Өтініш құрылды',time:Date.now()-3600000,actor:'GZTR'}],messages:[{id:1,from:'client',sender:'GZTR',text:'Сәлеметсіз бе! Сәлемдемем қай жерде екенін тексеріп бересіз бе?',time:Date.now()-3600000}]},
 {id:'T-1002',track:'JP240005678KZ',jpid:'JP10245',client:'Клиент JP10245',title:'Жеткізу мерзімі бойынша сұрақ',status:'Талдау',unread:0,updated:Date.now()-7200000,created:Date.now()-7200000,events:[],messages:[{id:1,from:'client',sender:'JP10245',text:'Жеткізу қашан болады?',time:Date.now()-7200000},{id:2,from:'operator',sender:'SWAT',text:'Сұрауыңызды тексеріп жатырмыз.',time:Date.now()-6900000}]},
 {id:'T-1003',track:'JP240009876KZ',jpid:'JP77881',client:'Клиент JP77881',title:'Мекенжайды нақтылау',status:'Күту',unread:0,updated:Date.now()-86400000,created:Date.now()-86400000,events:[],messages:[]},
 {id:'T-1004',track:'JP240004444KZ',jpid:'JP33002',client:'Клиент JP33002',title:'Қайтарым бойынша өтініш',status:'Аяқталды',unread:0,updated:Date.now()-172800000,created:Date.now()-172800000,events:[],messages:[{id:1,from:'operator',sender:'SWAT',text:'Өтінішіңіз орындалды. Рақмет!',time:Date.now()-172800000}]}
];
const readTickets=()=>{try{const x=JSON.parse(localStorage.getItem(STORE));return Array.isArray(x)?x:seed}catch{return seed}};
const fmt=(v)=>new Date(v).toLocaleTimeString('kk-KZ',{hour:'2-digit',minute:'2-digit'});
const dateFmt=(v)=>new Date(v).toLocaleString('kk-KZ',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);

export default function App(){
 const [tickets,setTickets]=useState(readTickets);
 const [user,setUser]=useState(()=>{if(new URLSearchParams(window.location.search).get('portal')==='operator')return {jpid:'SWAT',role:'operator'};try{return JSON.parse(sessionStorage.getItem(USER))||null}catch{return null}});
 const [loginId,setLoginId]=useState('');
 const [section,setSection]=useState(()=>new URLSearchParams(window.location.search).get('portal')==='operator'?'operator':'client');
 const [sidebar,setSidebar]=useState(true);
 const [activeId,setActiveId]=useState(null);
 const [view,setView]=useState('open');
 const [clientTab,setClientTab]=useState('open');
 const [drawerTab,setDrawerTab]=useState('Клиент');
 const [query,setQuery]=useState('');
 const [chatQuery,setChatQuery]=useState('');
 const [message,setMessage]=useState('');
 const [notice,setNotice]=useState('');
 const [showNew,setShowNew]=useState(false);
 const [newTrack,setNewTrack]=useState('');
 const [newTitle,setNewTitle]=useState('');
 const [newBody,setNewBody]=useState('');
 const [editClient,setEditClient]=useState(false);
 const [clientDraft,setClientDraft]=useState('');
 const [editingMessage,setEditingMessage]=useState(null);
 const [editText,setEditText]=useState('');
 const [filterStage,setFilterStage]=useState('Барлығы');
 const [emojiOpen,setEmojiOpen]=useState(false);
 const fileRef=useRef(null);
 const chatRef=useRef(null);
 const active=tickets.find(t=>t.id===activeId)||null;
 const isOperator=section==='operator';
 const role=isOperator?'operator':'client';
 const currentJpid=isOperator?'SWAT':(user?.jpid||'');

 const [sharedReady,setSharedReady]=useState(false);
 const ticketsRef=useRef(tickets);
 useEffect(()=>{ticketsRef.current=tickets},[tickets]);
 useEffect(()=>{
   let alive=true;
   const reload=async()=>{
     try{
       const incoming=await fetchSharedTickets();
       if(alive&&Array.isArray(incoming)&&JSON.stringify(incoming)!==JSON.stringify(ticketsRef.current)){
         ticketsRef.current=incoming;
         setTickets(incoming);
       }
     }catch(error){console.error('Shared server read error:',error)}
   };
   reload().finally(()=>{if(alive)setSharedReady(true)});
   const stop=subscribeSharedTickets(reload);
   return()=>{alive=false;if(stop)stop()};
 },[]);
 useEffect(()=>{
   if(!sharedReady)return;
   saveSharedTickets(tickets).catch(error=>console.error('Shared server write error:',error));
 },[tickets,sharedReady]);
 useEffect(()=>{const sync=e=>{if(e.key===STORE&&e.newValue){try{setTickets(JSON.parse(e.newValue))}catch{}}};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync)},[]);
 useEffect(()=>{if(chatRef.current)chatRef.current.scrollTop=chatRef.current.scrollHeight},[activeId,active?.messages?.length,drawerTab]);
 const flash=t=>{setNotice(t);window.clearTimeout(flash.timer);flash.timer=window.setTimeout(()=>setNotice(''),2600)};
 const patch=(id,fn)=>setTickets(prev=>prev.map(t=>t.id===id?fn(t):t));
 const login=e=>{e.preventDefault();const v=loginId.trim().toUpperCase();if(!v)return;const r=['SWAT','OPERATOR','ADMIN','SUPERVISOR'].includes(v)?(v==='ADMIN'?'admin':v==='SUPERVISOR'?'supervisor':'operator'):'client';const p={jpid:v,role:r};sessionStorage.setItem(USER,JSON.stringify(p));setUser(p);setSection(r==='client'?'client':'operator')};
 const logout=()=>{sessionStorage.removeItem(USER);setUser(null);setActiveId(null);setLoginId('')};
 const mine=tickets.filter(t=>t.jpid===currentJpid);
 const baseTickets=isOperator?tickets:mine;
 const visible=useMemo(()=>baseTickets.filter(t=>{
   const closed=t.status==='Аяқталды';
   const tab=isOperator?view:clientTab;
   if(tab==='open'&&closed)return false;if(tab==='done'&&!closed)return false;
   if(filterStage!=='Барлығы'&&t.status!==filterStage)return false;
   const q=query.trim().toLowerCase();
   return !q||[t.track,t.jpid,t.client,t.title,t.id].some(x=>String(x||'').toLowerCase().includes(q));
 }).sort((a,b)=>b.updated-a.updated),[tickets,currentJpid,isOperator,view,clientTab,filterStage,query]);
 const createTicket=e=>{e.preventDefault();if(!newTrack.trim())return;const t={id:'T-'+Date.now(),track:newTrack.trim().toUpperCase(),jpid:currentJpid,client:currentJpid,title:newTitle.trim()||'Жаңа өтініш',status:'Жаңа',unread:0,updated:Date.now(),created:Date.now(),messages:newBody.trim()?[{id:uid(),from:'client',sender:currentJpid,text:newBody.trim(),time:Date.now()}]:[],events:[{text:'Клиент жаңа өтініш ашты',actor:currentJpid,time:Date.now()}]};setTickets(p=>[t,...p]);setActiveId(t.id);setShowNew(false);setNewTrack('');setNewTitle('');setNewBody('');flash('Өтініш құрылды')};
 const send=(text=message,attachment=null)=>{if(!active||(!text.trim()&&!attachment))return;const item={id:uid(),from:role,sender:currentJpid,text:text.trim(),time:Date.now(),attachment};patch(active.id,t=>({...t,messages:[...(t.messages||[]),item],updated:Date.now(),unread:role==='client'?0:(t.unread||0)+1}));setMessage('');setEmojiOpen(false)};
 const changeStatus=(id,status)=>patch(id,t=>({...t,status,updated:Date.now(),events:[...(t.events||[]),{text:'Мәртебе өзгертілді: '+status,actor:currentJpid,time:Date.now()}]}));
 const updateClient=()=>{patch(active.id,t=>({...t,jpid:clientDraft.trim().toUpperCase(),client:clientDraft.trim().toUpperCase(),updated:Date.now(),events:[...(t.events||[]),{text:'Клиент JPID өзгертілді',actor:currentJpid,time:Date.now()}]}));setEditClient(false);flash('Клиент JPID жаңартылды')};
 const saveEdit=msgId=>{patch(active.id,t=>({...t,messages:t.messages.map(m=>m.id===msgId?{...m,text:editText,editedAt:Date.now()}:m),updated:Date.now()}));setEditingMessage(null)};
 const addFile=async file=>{if(!file||!active)return; if(file.size>3*1024*1024){flash('Демо режимінде файл көлемі 3 МБ-тан аспауы керек');return}const reader=new FileReader();reader.onload=()=>send('',{name:file.name,type:file.type,data:reader.result});reader.readAsDataURL(file)};
 const onPaste=e=>{const f=[...(e.clipboardData?.files||[])].find(x=>x.type.startsWith('image/'));if(f){e.preventDefault();addFile(f)}};
 const onDrop=(e)=>{e.preventDefault();[...(e.dataTransfer.files||[])].forEach(addFile)};
 const dragStart=(e,id)=>e.dataTransfer.setData('ticketId',id);
 const dragOver=e=>e.preventDefault();
 const dropStage=(e,stage)=>{e.preventDefault();const id=e.dataTransfer.getData('ticketId');if(id)changeStatus(id,stage)};
 const openTicket=t=>{setActiveId(t.id);setDrawerTab('Клиент');if(role==='client')patch(t.id,x=>({...x,unread:0}))};
 const msgList=(active?.messages||[]).filter(m=>!chatQuery||m.text?.toLowerCase().includes(chatQuery.toLowerCase()));
 const emojis=['🙂','👍','🙏','📦','❤️','✅','👋','😊'];

 if(!user)return <div className="login-screen"><div className="login-card"><div className="brand-mark">J</div><div className="eyebrow">JANA POST · UNIFIED PLATFORM</div><h1>Бірыңғай жұмыс кеңістігі</h1><p>Клиенттік қолдау және SWAT операторлық жүйесі</p><form onSubmit={login}><label>JPID</label><input autoFocus value={loginId} onChange={e=>setLoginId(e.target.value)} placeholder="JPID енгізіңіз"/><button className="primary full">Жүйеге кіру <ArrowLeft size={17}/></button></form><div className="login-hint"><ShieldCheck size={15}/> Демо кіру: клиент — кез келген JPID; оператор — SWAT</div><div className="login-foot">Jana Post · Prototype</div></div></div>;

 return <div className="app-shell">
  <header className="topbar"><button className="icon-btn" onClick={()=>setSidebar(v=>!v)}><Menu/></button><div className="brand"><span className="brand-mark small">J</span><b>Jana Post</b><span className="divider-v"/><span className="muted">Unified Platform</span></div><div className="top-actions"><span className={isCloudConfigured?'cloud online':'cloud'}><i/>Shared server · Real-time</span><button className="icon-btn" onClick={()=>flash('Жаңа хабарламалар осы тикеттерде белгіленеді')}><Bell/></button><div className="user-chip"><span className="avatar">{currentJpid.slice(0,1)}</span><span>{currentJpid}</span><ChevronDown size={14}/></div><button className="icon-btn" title="Шығу" onClick={logout}><LogOut/></button></div></header>
  <div className="workspace">
   {sidebar&&<aside className="sidebar"><div className="side-caption">ЖҰМЫС КЕҢІСТІГІ</div><button className={section==='operator'?'side-link selected':'side-link'} onClick={()=>{setSection('operator');setActiveId(null)}}><LayoutDashboard/> SWAT · Оператор</button><button className={section==='client'?'side-link selected':'side-link'} onClick={()=>{setSection('client');setActiveId(null)}}><MessageCircle/> Jana AI Chat</button><div className="side-caption space">ЖАЛПЫ</div><button className="side-link" onClick={()=>flash('Аналитика келесі модульде қосылады')}><Activity/> Аналитика</button><button className="side-link" onClick={()=>flash('Баптаулар келесі модульде қосылады')}><Settings/> Баптаулар</button><div className="sidebar-bottom"><div className="help-box"><CircleHelp/><b>Көмек керек пе?</b><span>Жүйе бойынша нұсқаулық</span></div><small>Jana Post © 2026</small></div></aside>}
   <main className="main-area">
    <div className="page-heading"><div><div className="eyebrow">{section==='operator'?'ОПЕРАЦИЯЛЫҚ БАСҚАРУ':'КЛИЕНТТІК ҚОЛДАУ'}</div><h1>{section==='operator'?'SWAT — Тикеттер':'Jana AI Chat'}</h1><p>{section==='operator'?'Өтініштерді қабылдау, өңдеу және бақылау':'Өтініштеріңіз бен операторлармен хат алмасу'}</p></div><div className="heading-actions">{section==='client'&&<button className="primary" onClick={()=>setShowNew(true)}><Plus size={17}/> Өтініш ашу</button>}</div></div>
    {section==='client'&&<div className="client-tabs"><button className={clientTab==='open'?'active':' '} onClick={()=>setClientTab('open')}>Аяқталмаған мәселе</button><button className={clientTab==='done'?'active':' '} onClick={()=>setClientTab('done')}>Аяқталған мәселе</button></div>}
    <div className="toolbar"><div className="searchbox"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Трек-код, JPID немесе өтініш бойынша іздеу..."/></div>{section==='operator'&&<select className="filter-select" value={filterStage} onChange={e=>setFilterStage(e.target.value)}><option>Барлығы</option>{stages.map(s=><option key={s}>{s}</option>)}</select>}<button className="soft-btn" onClick={()=>{if(section==='operator')setView(view==='done'?'open':'done');else setClientTab(clientTab==='done'?'open':'done')}}><Archive size={16}/>{(section==='operator'?view:clientTab)==='open'?'Аяқталған':'Аяқталмаған'}</button><div className="count-label">{visible.length} өтініш</div></div>
    {section==='operator'?<div className="kanban">{kanbanStages.filter(s=>view==='done'?s==='Аяқталды':s!=='Аяқталды').map((stage,i)=><section className="kanban-column" key={stage} onDragOver={dragOver} onDrop={e=>dropStage(e,stage)}><div className="column-head"><span className={'stage-dot dot-'+i}/><b>{stage}</b><span className="stage-count">{visible.filter(t=>t.status===stage).length}</span></div><div className="ticket-stack">{visible.filter(t=>t.status===stage).map(t=><div key={t.id} draggable onDragStart={e=>dragStart(e,t.id)}><Ticket ticket={t} onClick={()=>openTicket(t)}/></div>)}{visible.filter(t=>t.status===stage).length===0&&<div className="empty-column">Өтініш жоқ</div>}</div></section>)}</div>:<div className="client-list">{visible.map(t=><Ticket key={t.id} ticket={t} onClick={()=>openTicket(t)}/>)}{visible.length===0&&<div className="empty-state"><Inbox size={34}/><b>Өтініштер табылмады</b><span>Жаңа өтініш ашу үшін жоғарыдағы батырманы басыңыз.</span></div>}</div>}
   </main>
  </div>
  {active&&<div className="drawer-backdrop" onClick={()=>setActiveId(null)}><aside className="ticket-drawer" onClick={e=>e.stopPropagation()}><div className="drawer-head"><div><div className="eyebrow">ӨТІНІШ КАРТОЧКАСЫ</div><h2>{active.track}</h2><span className="muted">{active.id} · {active.jpid}</span></div><button className="icon-btn" onClick={()=>setActiveId(null)}><X/></button></div>
   <div className="progress-wrap"><div className="progress-label"><b>Өңдеу кезеңі</b><span>{Math.max(1,stages.indexOf(active.status)+1)} / 13</span></div><div className="progress-track">{stages.map((s,i)=><span key={s} title={s} className={i<=stages.indexOf(active.status)?'done':''}/>)}</div></div>
   <div className="drawer-meta"><div><small>КЛИЕНТ JPID</small><b>{active.jpid}</b></div><div><small>МӘРТЕБЕСІ</small><b>{active.status}</b></div><div><small>ҚҰРЫЛҒАН</small><b>{dateFmt(active.created||active.updated)}</b></div></div>
   <div className="drawer-tabs">{['Клиент','Информация','История'].map(t=><button key={t} className={drawerTab===t?'active-tab':''} onClick={()=>setDrawerTab(t)}>{t}</button>)}</div>
   {drawerTab==='Клиент'?<><div className="chat-title"><div><b><MessageCircle size={16}/> Клиентпен чат</b><small>Трек-код пен JPID-ге байланыстырылған диалог</small></div><span className="live-dot">Диалог</span></div><div className="chat-search"><Search size={14}/><input value={chatQuery} onChange={e=>setChatQuery(e.target.value)} placeholder="Хабарламадан іздеу..."/></div><div className="chat-messages" ref={chatRef} onDragOver={dragOver} onDrop={onDrop} onPaste={onPaste}>{msgList.map(m=><div key={m.id} className={'message-row '+(m.from===role?'mine':'')}><div className="bubble">{editingMessage===m.id?<><textarea value={editText} onChange={e=>setEditText(e.target.value)}/><div className="edit-actions"><button onClick={()=>saveEdit(m.id)}>Сақтау</button><button onClick={()=>setEditingMessage(null)}>Болдырмау</button></div></>:<><span>{m.text}</span>{m.attachment&&<div className="attachment">{m.attachment.type?.startsWith('image/')?<img src={m.attachment.data} alt={m.attachment.name}/>:<a href={m.attachment.data} download={m.attachment.name}><FileText size={16}/>{m.attachment.name}</a>}</div>}<small>{m.sender|| (m.from==='operator'?'SWAT':'Клиент')} · {fmt(m.time)} {m.editedAt?'· өңделді':''} {m.from===role&&<CheckCheck size={12}/>}</small>{m.from===role&&<button className="message-edit" onClick={()=>{setEditingMessage(m.id);setEditText(m.text||'')}}><Pencil size={12}/></button>}</>}</div></div>)}{msgList.length===0&&<div className="chat-empty">Хабарлама жоқ. Диалогты бастаңыз немесе іздеуді өзгертіңіз.</div>}</div><form className="chat-compose" onSubmit={e=>{e.preventDefault();send()}}><input type="file" ref={fileRef} hidden onChange={e=>addFile(e.target.files?.[0])}/><button type="button" className="icon-btn" title="Файл тіркеу" onClick={()=>fileRef.current?.click()}><Paperclip/></button><div className="compose-input"><input value={message} onChange={e=>setMessage(e.target.value)} onPaste={onPaste} placeholder="Хабарлама жазыңыз..."/><button type="button" className="emoji-btn" onClick={()=>setEmojiOpen(v=>!v)}><Smile size={17}/></button>{emojiOpen&&<div className="emoji-pop">{emojis.map(x=><button type="button" key={x} onClick={()=>setMessage(v=>v+x)}>{x}</button>)}</div>}</div><button className="send-btn" type="submit"><Send size={17}/></button></form><div className="chat-hint">Файлды тіркеуге болады · Скриншотты Ctrl+V арқылы қоюға болады</div></>:drawerTab==='Информация'?<div className="info-panel"><div className="info-title"><b>ИНФОРМАЦИЯ</b><button className="soft-btn" onClick={()=>{setClientDraft(active.jpid);setEditClient(v=>!v)}}><Pencil size={14}/> Өзгерту</button></div><div className="info-field"><small>Трек-код</small><b>{active.track}</b></div><div className="info-field"><small>Клиент</small>{editClient?<div className="inline-edit"><input value={clientDraft} onChange={e=>setClientDraft(e.target.value)} placeholder="JPID енгізіңіз"/><button onClick={updateClient}>Сақтау</button></div>:<b>{active.jpid||'Не заполнено'}</b>}</div><div className="info-field"><small>Өтініш тақырыбы</small><b>{active.title}</b></div><div className="info-field"><small>Жасалған уақыты</small><b>{dateFmt(active.created||active.updated)}</b></div><div className="info-field"><small>Мәртебе</small><select value={active.status} onChange={e=>changeStatus(active.id,e.target.value)}>{stages.map(s=><option key={s}>{s}</option>)}</select></div><div className="info-field"><small>13 кезеңдік жұмыс процесі</small><div className="stage-list">{stages.map((s,i)=><button key={s} className={active.status===s?'current':''} onClick={()=>changeStatus(active.id,s)}><span>{i+1}</span>{s}</button>)}</div></div></div>:<div className="history-panel"><h3><Clock size={16}/> Өзгерістер тарихы</h3>{[...(active.events||[])].reverse().map((ev,i)=><div className="history-item" key={i}><span className="history-dot"/><div><b>{ev.text}</b><small>{ev.actor} · {dateFmt(ev.time)}</small></div></div>)}{(active.events||[]).length===0&&<div className="chat-empty">Әзірге тарих жоқ.</div>}</div>}
   {isOperator&&<div className="drawer-status"><label>Өтініш мәртебесін өзгерту</label><select value={active.status} onChange={e=>changeStatus(active.id,e.target.value)}>{stages.map(s=><option key={s}>{s}</option>)}</select></div>}
  </aside></div>}
  {showNew&&<div className="modal-backdrop" onClick={()=>setShowNew(false)}><form className="modal" onSubmit={createTicket} onClick={e=>e.stopPropagation()}><div className="modal-head"><h2>Жаңа өтініш</h2><button type="button" className="icon-btn" onClick={()=>setShowNew(false)}><X/></button></div><label>Трек-код</label><input required value={newTrack} onChange={e=>setNewTrack(e.target.value)} placeholder="Мысалы: JP240001234KZ"/><label>Өтініш тақырыбы</label><input value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Мәселені қысқаша сипаттаңыз"/><label>Хабарлама</label><textarea value={newBody} onChange={e=>setNewBody(e.target.value)} placeholder="Мәселені сипаттаңыз..."/><button className="primary full">Өтінішті құру</button></form></div>}
  {notice&&<div className="toast"><Check size={16}/>{notice}</div>}
 </div>;
}
function Ticket({ticket,onClick}){return <button className="ticket-card" onClick={onClick}><div className="ticket-top"><span className="ticket-id">{ticket.id}</span><span className="ticket-time">{fmt(ticket.updated)}</span></div><b className="ticket-track">{ticket.track}</b><span className="ticket-title">{ticket.title}</span><div className="ticket-bottom"><span className="client-tag"><UserRound size={13}/>{ticket.jpid||'Не заполнено'}</span>{ticket.unread>0&&<span className="unread">{ticket.unread}</span>}</div></button>}
