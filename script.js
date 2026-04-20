// Utility functions (define immediately)
window.toggleMenu=()=>document.getElementById('menu')?.classList.toggle('active');
window.scrollToSection=()=>document.getElementById('uvod')?.scrollIntoView({behavior:'smooth'});
window.toggleText=(c)=>c?.classList.toggle('active');

// Event listeners (wait for DOM)
document.addEventListener('DOMContentLoaded',()=>{const s=document.getElementById('mysearch'),i=document.querySelector('.search-input'),m=document.getElementById('myImage');if(s)s.addEventListener('click',function(){this.classList.toggle('move');if(this.classList.contains('move'))i?.focus();});if(m)m.addEventListener('click',()=>window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'}));});





