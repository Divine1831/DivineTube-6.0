function nav(){
 const page=location.pathname.split('/').pop()||'index.html';
 const active=p=>page===p?'active':'';
 return `<header class="top">
   <button id="menuBtn" class="hamb" type="button" aria-label="Menu">☰</button>
   <a class="brand" href="index.html"><b>▶</b> Divine<span>Tube</span></a>
   <div class="topActions">
     <button id="mobileSearchBtn" class="topIcon" type="button">⌕</button>
     <button id="themeBtn" class="topIcon" type="button">☼</button>
     <a class="uploadTop" href="upload.html">＋</a>
     <div id="avatar" class="avatar">D</div>
   </div>
 </header>
 <div id="searchPanel" class="searchPanel">
   <input id="topSearch" placeholder="Search DivineTube" autocomplete="off">
   <button id="searchBtn" type="button">Search</button>
 </div>
 <aside class="side">
   <a class="nav ${active('index.html')}" href="index.html">⌂<span>Home</span></a>
   <a class="nav ${active('trending.html')}" href="shorts.html">↗<span>Trending</span></a>
   <a class="nav ${active('subscriptions.html')}" href="subscriptions.html">▣<span>Subscriptions</span></a>
   <hr>
   <a class="nav ${active('library.html')}" href="library.html">▤<span>Library</span></a>
   <a class="nav ${active('history.html')}" href="history.html">◷<span>History</span></a>
   <hr>
   <a class="nav ${active('channel.html')}" href="channel.html">◎<span>Your channel</span></a>
   <a class="nav ${active('studio.html')}" href="studio.html">＋<span>Studio</span></a>
   <a class="nav ${active('settings.html')}" href="settings.html">⚙<span>Settings</span></a>
   <hr>
   <a class="nav" href="auth.html" id="authLink">Sign in</a>
 </aside>
 <nav class="bottomNav">
   <a class="${active('index.html')}" href="index.html"><b>⌂</b><span>Home</span></a>
   <a class="${active('trending.html')}" href="trending.html"><b>▣</b><span>Shorts</span></a>
   <a class="create" href="upload.html"><b>＋</b><span>Create</span></a>
   <a class="${active('subscriptions.html')}" href="subscriptions.html"><b>▤</b><span>Subscriptions</span></a>
   <a class="${active('channel.html')}" href="channel.html"><b>◎</b><span>You</span></a>
 </nav>`;
}
document.addEventListener('DOMContentLoaded',()=>{const a=document.querySelector('#app');if(a)a.innerHTML=nav();});