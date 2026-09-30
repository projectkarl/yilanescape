export class Controls {
  constructor(){
    this.state={gas:false,brake:false,left:false,right:false,handbrake:false};
    const map={KeyW:'gas',ArrowUp:'gas',KeyS:'brake',ArrowDown:'brake',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',Space:'handbrake'};
    addEventListener('keydown',e=>{if(map[e.code]){this.state[map[e.code]]=true;e.preventDefault();}});
    addEventListener('keyup',e=>{if(map[e.code]){this.state[map[e.code]]=false;e.preventDefault();}});
    document.querySelectorAll('[data-key]').forEach(b=>{const k=b.dataset.key==='gas'?'gas':b.dataset.key==='brake'?'brake':b.dataset.key==='left'?'left':b.dataset.key==='right'?'right':'handbrake';const on=e=>{e.preventDefault();this.state[k]=true},off=e=>{e.preventDefault();this.state[k]=false};b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('pointerleave',off);});
  }
  reset(){Object.keys(this.state).forEach(k=>this.state[k]=false);}
}
