// 스크롤하면 .rv 요소가 부드럽게 나타남
(function(){
  var els=document.querySelectorAll('.rv');
  if(!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in')});return}
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12,rootMargin:'0px 0px -6% 0px'});
  els.forEach(function(e){io.observe(e)});
})();
// 데모 페이지의 신청 폼은 실제로 보내지 않음
document.querySelectorAll('form[data-demo]').forEach(function(f){
  f.addEventListener('submit',function(ev){ev.preventDefault();alert('예시 페이지라 실제로 접수되지는 않습니다.\n이런 홈페이지가 필요하시면 재재컴퍼니로 문의해 주세요!')});
});
