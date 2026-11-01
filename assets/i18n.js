/* ma7zooz.com — Arabic/English page switcher. Arabic is the default (and what search engines index);
   English is applied in the browser from assets/i18n-en.js (loaded only when needed). */
(function(){
  var KEY='ma7zooz_lang', AR=/[؀-ۿ]/, D=document, H=D.documentElement;
  var dict=null, frag=null, mo=null, busy=false, lang='ar', loading=false;
  var ATTRS=['aria-label','title','alt','placeholder'];
  var origTitle=D.title;

  function lookup(core){ return dict.hasOwnProperty(core)?dict[core]:null; }
  function tr(s){
    if(!AR.test(s)) return s;
    var m=s.match(/^(\s*)([\s\S]*?)(\s*)$/), core=m[2].replace(/\s+/g,' ');
    var hit=lookup(core);
    if(hit!==null) return m[1]+hit+m[3];
    var out=s, i, k;
    for(i=0;i<frag.length;i++){ k=frag[i]; if(out.indexOf(k)>-1) out=out.split(k).join(dict[k]); }
    return out;
  }
  function skip(n){
    var p=n.parentNode;
    if(!p) return true;
    var t=p.nodeName;
    if(t==='SCRIPT'||t==='STYLE'||t==='TEXTAREA'||t==='NOSCRIPT') return true;
    return !!(p.closest&&p.closest('[data-noi18n]'));
  }
  function doText(n){
    if(skip(n)) return;
    var v=n.nodeValue;
    if(n.__en===v) return;
    if(!AR.test(v)) return;
    var t=tr(v);
    if(t!==v){ n.__ar=v; n.__en=t; n.nodeValue=t; }
  }
  function doAttrs(el){
    if(!el.getAttribute||(el.closest&&el.closest('[data-noi18n]'))) return;
    for(var i=0;i<ATTRS.length;i++){
      var a=ATTRS[i], v=el.getAttribute(a);
      if(v&&AR.test(v)){
        var t=tr(v);
        if(t!==v){ if(!el.hasAttribute('data-ar-'+a)) el.setAttribute('data-ar-'+a,v); el.setAttribute(a,t); }
      }
    }
  }
  function walk(root){
    if(root.nodeType===3){ doText(root); return; }
    if(root.nodeType!==1) return;
    doAttrs(root);
    var w=D.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT,null), n;
    while((n=w.nextNode())){ if(n.nodeType===3) doText(n); else doAttrs(n); }
  }
  function restore(root){
    var w=D.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT,null), n;
    while((n=w.nextNode())){
      if(n.nodeType===3){ if(n.__ar!==undefined&&n.__en===n.nodeValue){ n.nodeValue=n.__ar; } n.__ar=undefined; n.__en=undefined; }
      else for(var i=0;i<ATTRS.length;i++){
        var a=ATTRS[i];
        if(n.hasAttribute('data-ar-'+a)){ n.setAttribute(a,n.getAttribute('data-ar-'+a)); n.removeAttribute('data-ar-'+a); }
      }
    }
  }
  function start(){
    if(mo) return;
    mo=new MutationObserver(function(list){
      if(busy) return; busy=true;
      try{
        for(var i=0;i<list.length;i++){
          var m=list[i];
          if(m.type==='characterData') doText(m.target);
          else if(m.type==='attributes') doAttrs(m.target);
          else for(var j=0;j<m.addedNodes.length;j++) walk(m.addedNodes[j]);
        }
      }finally{ busy=false; }
    });
    mo.observe(D.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:ATTRS});
  }
  function stop(){ if(mo){ mo.disconnect(); mo=null; } }
  function label(){
    var b=D.getElementById('langBtn');
    if(b){ b.textContent=(lang==='en')?'عربي':'EN'; b.setAttribute('aria-label',lang==='en'?'التبديل إلى العربية':'Switch to English'); b.setAttribute('lang',lang==='en'?'ar':'en'); }
  }
  function applyEn(){
    H.lang='en'; H.dir='ltr';
    var t=H.getAttribute('data-en-title'); if(t) D.title=t;
    busy=true; try{ walk(D.body); }finally{ busy=false; }
    start();
    label();
  }
  function applyAr(){
    stop();
    H.lang='ar'; H.dir='rtl';
    D.title=origTitle;
    restore(D.body);
    label();
  }
  function load(cb){
    if(dict){ cb(); return; }
    if(loading) return; loading=true;
    var s=D.createElement('script'); s.src='assets/i18n-en.js?v=1';
    s.onload=function(){
      dict=window.__MA7_EN||{};
      frag=window.__MA7_FRAG||[];
      loading=false; cb();
    };
    s.onerror=function(){ loading=false; };
    D.head.appendChild(s);
  }
  function set(l,save){
    lang=l;
    if(save){ try{ localStorage.setItem(KEY,l); }catch(e){} }
    if(l==='en') load(applyEn); else applyAr();
    D.dispatchEvent(new CustomEvent('ma7zooz:lang',{detail:l}));
  }
  function init(){
    var b=D.getElementById('langBtn');
    if(b) b.addEventListener('click',function(){ set(lang==='en'?'ar':'en',true); });
    var saved=null; try{ saved=localStorage.getItem(KEY); }catch(e){}
    lang='ar'; label();
    if(saved==='en') set('en',false);
  }
  window.ma7Lang={set:function(l){set(l,true);},get:function(){return lang;}};
  if(D.readyState==='loading') D.addEventListener('DOMContentLoaded',init); else init();
})();
