/* 재재컴퍼니 공통 스크립트 — 모든 페이지에서 사용 */
(function(){
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // 문의 접수: 서버로 보내 담당자 메일로 도착. 서버가 안 되면 false 반환
  function sendInquiry(data){
    data.page = location.pathname;
    return fetch('/api/inquiry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})
      .then(function(r){ return r.json().catch(function(){ return {ok:false}; }).then(function(j){ j.status=r.status; return j; }); })
      .catch(function(){ return {ok:false,status:0}; });
  }
  // 메일 주소는 페이지에 있는 메일 링크에서 읽음 (주소를 한 곳에서만 관리)
  function mailAddr(){ var a=document.querySelector('a[href^="mailto:"]'); return a ? a.getAttribute('href').slice(7).split('?')[0] : ''; }

  /* 헤더 배경 + 모바일 메뉴 */
  var hd=document.getElementById('hd'), btn=document.getElementById('menuBtn');
  if(hd){
    var onScroll=function(){ hd.classList.toggle('solid', scrollY>40 || document.body.classList.contains('sub')); };
    onScroll(); addEventListener('scroll', onScroll, {passive:true});
    if(btn){
      btn.addEventListener('click', function(){ var o=hd.classList.toggle('open'); btn.setAttribute('aria-expanded', o); });
      hd.querySelectorAll('nav a').forEach(function(a){ a.addEventListener('click', function(){ hd.classList.remove('open'); btn.setAttribute('aria-expanded','false'); }); });
    }
  }

  /* 스크롤 등장 */
  var els=document.querySelectorAll('.rv');
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }); }, {threshold:.12, rootMargin:'0px 0px -6% 0px'});
    els.forEach(function(e){ io.observe(e); });
  } else els.forEach(function(e){ e.classList.add('in'); });

  /* 진행 방식: 화면 가운데를 지난 단계까지 불 켜기 */
  var steps=document.querySelectorAll('.step');
  if(steps.length){
    var tk=false;
    var mark=function(){ tk=false; var mid=innerHeight*.55; steps.forEach(function(s){ s.classList.toggle('on', s.getBoundingClientRect().top<mid); }); };
    mark(); addEventListener('scroll', function(){ if(!tk){ tk=true; requestAnimationFrame(mark); } }, {passive:true});
  }

  /* 숫자 올라가기 (실제 개수만) */
  var bs=document.querySelectorAll('[data-count]');
  if(bs.length && !reduce && 'IntersectionObserver' in window){
    var co=new IntersectionObserver(function(es){ es.forEach(function(e){
      if(!e.isIntersecting) return; co.unobserve(e.target);
      var b=e.target, to=+b.dataset.count, unit=b.querySelector('small').outerHTML, t0=performance.now();
      (function f(now){ var p=Math.min(1,(now-t0)/1100); b.innerHTML=Math.max(1,Math.round(to*(1-Math.pow(1-p,3))))+unit; if(p<1) requestAnimationFrame(f); })(t0);
    }); }, {threshold:.6});
    bs.forEach(function(b){ co.observe(b); });
  }

  /* 홈 첫 화면: 만든 사이트 화면들이 뒤에서 날아오는 배경 */
  var warp=document.getElementById('warp');
  if(warp){
    var IMGS=['daehan','daehan-cases','daehan-rental','daehan-2183','hanjicue','shorts','ttolgi','d-rapakyo','d-bakery','d-gogi','d-pilates','d-interior','d-tax'].map(function(n){ return 'assets/work/'+n+'-s.webp'; });
    var small=innerWidth<760, FAR=-3400, NEAR=700, TILES=small?14:26, STARS=small?40:90, items=[], bag=[];
    var nextImg=function(){ if(!bag.length){ bag=IMGS.slice(); for(var i=bag.length-1;i>0;i--){ var j=(Math.random()*(i+1))|0, t=bag[i]; bag[i]=bag[j]; bag[j]=t; } } return bag.pop(); };
    var place=function(el,star,first){
      el._x=(Math.random()-.5)*(star?3000:(small?900:2000));
      el._y=(Math.random()-.5)*(star?2000:(small?1300:1200));
      var cx=star?140:(small?150:420), cy=small?260:0;
      if(Math.abs(el._x)<cx) el._x+=(el._x<0?-cx:cx);
      if(cy && Math.abs(el._y)<cy && !star) el._y+=(el._y<0?-cy:cy);
      el._z=first?FAR+Math.random()*(NEAR-FAR):FAR-Math.random()*800;
      el._sp=(star?1.5:1)*(.8+Math.random()*.7);
      el._rot=(Math.random()-.5)*14;
      if(!star) el.style.backgroundImage="url('"+nextImg()+"')";
    };
    var build=function(n,star){ for(var i=0;i<n;i++){ var el=document.createElement('div'); el.className=star?'star':'tile'; place(el,star,true); warp.appendChild(el); items.push({el:el,star:star}); } };
    build(STARS,true); build(TILES,false);
    var draw=function(it){
      var el=it.el, z=el._z, o=1;
      if(z<FAR+1000) o=Math.max(0,(z-FAR)/1000);
      if(z>240) o=Math.max(0,1-(z-240)/(NEAR-240));
      el.style.opacity=it.star?o*.7:o*.95;
      el.style.transform='translate3d('+el._x+'px,'+el._y+'px,'+z+'px)'+(it.star?'':' rotate('+el._rot+'deg)');
    };
    items.forEach(draw);
    if(!reduce){
      var run=true, last=performance.now();
      var tick=function(now){
        if(!run) return;
        var dt=Math.min(.05,(now-last)/1000); last=now;
        for(var i=0;i<items.length;i++){ var it=items[i]; it.el._z+=it.el._sp*260*dt; if(it.el._z>NEAR) place(it.el,it.star,false); draw(it); }
        requestAnimationFrame(tick);
      };
      if('IntersectionObserver' in window) new IntersectionObserver(function(es){ var was=run; run=es[0].isIntersecting; if(run && !was){ last=performance.now(); requestAnimationFrame(tick); } }).observe(warp);
      requestAnimationFrame(tick);
    }
  }

  /* 오른쪽 간편 문의: 스크롤을 부드럽게 따라 내려옴 */
  var qk=document.getElementById('qk');
  if(qk){
    var cur=null, raf=0;
    var target=function(){ var h=qk.offsetHeight||300; return scrollY+Math.max(96,(innerHeight-h)/2); };
    var step=function(){ raf=0; if(innerWidth<=760){ qk.style.transform=''; return; } var t=target(); if(cur===null||reduce) cur=t; else cur+=(t-cur)*.1;
      qk.style.transform='translate3d(0,'+cur.toFixed(1)+'px,0)'; if(Math.abs(t-cur)>.5) raf=requestAnimationFrame(step); };
    var kick=function(){ if(!raf) raf=requestAnimationFrame(step); };
    addEventListener('scroll',kick,{passive:true}); addEventListener('resize',kick); step();

    var opens=qk.querySelectorAll('[data-qk-open]');
    var setOpen=function(o){ qk.classList.toggle('open',o); opens.forEach(function(b){ b.setAttribute('aria-expanded',o); }); if(o) setTimeout(function(){ var n=document.getElementById('qkName'); if(n) n.focus({preventScroll:true}); },200); };
    opens.forEach(function(b){ b.addEventListener('click',function(e){ e.stopPropagation(); setOpen(!qk.classList.contains('open')); }); });
    var close=document.getElementById('qkClose'); if(close) close.addEventListener('click',function(){ setOpen(false); });
    addEventListener('keydown',function(e){ if(e.key==='Escape') setOpen(false); });
    document.addEventListener('click',function(e){ if(qk.classList.contains('open') && !qk.contains(e.target)) setOpen(false); });
    var top=document.getElementById('qkTop'); if(top) top.addEventListener('click',function(){ scrollTo({top:0,behavior:reduce?'auto':'smooth'}); });
    var smsTo=function(msg){ var a=qk.querySelector('a[href^="sms:"]'); location.href=(a?a.getAttribute('href'):'sms:')+(/iPhone|iPad|Mac/.test(navigator.userAgent)?'&':'?')+'body='+encodeURIComponent(msg); };
    qk.querySelectorAll('[data-send]').forEach(function(b){ b.addEventListener('click',function(){
      var n=document.getElementById('qkName').value.trim(), p=document.getElementById('qkPhone').value.trim(), t=document.getElementById('qkType').value;
      var hp=document.getElementById('qkWeb');
      if(!n||!p){ alert('성함과 연락처를 남겨주세요!'); return; }
      var msg='[재재컴퍼니 간편 문의]\n성함/업체명: '+n+'\n연락처: '+p+'\n문의 분야: '+t;
      if(b.dataset.send==='sms'){ smsTo(msg); return; }
      b.disabled=true; var old=b.textContent; b.textContent='보내는 중…';
      sendInquiry({kind:'quick',name:n,phone:p,type:t,website:hp?hp.value:''}).then(function(r){
        b.disabled=false; b.textContent=old;
        if(r.ok){ qk.querySelector('.qk-pop').classList.add('done'); }
        else if(r.status===400||r.status===429){ alert(r.error||'잠시 후 다시 시도해 주세요.'); }
        else if(confirm('지금은 바로 접수가 안 됩니다. 문자로 보내시겠어요?')){ smsTo(msg); }
      });
    }); });
  }

  /* 문의 페이지 폼 → 메일 앱 */
  var inq=document.getElementById('inq');
  if(inq){
    inq.addEventListener('submit',function(e){
      e.preventDefault();
      var v=function(id){ return document.getElementById(id).value.trim(); };
      var n=v('name'), p=v('phone'), t=v('type'), b=v('budget'), m=v('msg');
      if(!n||!p||!m){ alert('성함, 연락처, 내용을 채워주세요!'); return; }
      var sb=inq.querySelector('button[type="submit"]'), old=sb.textContent; sb.disabled=true; sb.textContent='보내는 중…';
      var hp=document.getElementById('inqWeb');
      sendInquiry({kind:'form',name:n,phone:p,type:t,budget:b,msg:m,website:hp?hp.value:''}).then(function(r){
        sb.disabled=false; sb.textContent=old;
        if(r.ok){ inq.classList.add('done'); inq.scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'}); return; }
        if(r.status===400||r.status===429){ alert(r.error||'잠시 후 다시 시도해 주세요.'); return; }
        // 서버 접수가 안 될 때만 메일 앱으로
        if(confirm('지금은 바로 접수가 안 됩니다. 메일 앱으로 보내시겠어요?\n(급하시면 010-2183-0312 로 전화 주세요)')){
          var subject='[재재컴퍼니 문의] '+t+' - '+n, body='성함/업체명: '+n+'\n연락처: '+p+'\n문의 분야: '+t+'\n예산: '+b+'\n\n내용:\n'+m;
          location.href='mailto:'+mailAddr()+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
        }
      });
    });
    // ?type=홈페이지 처럼 넘어오면 분야 미리 선택
    var qs=new URLSearchParams(location.search).get('type');
    if(qs){ var sel=document.getElementById('type'); for(var i=0;i<sel.options.length;i++){ if(sel.options[i].text.indexOf(qs)>-1){ sel.selectedIndex=i; break; } } }
  }
})();
