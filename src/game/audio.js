export class AudioRig{
  constructor(){this.ctx=null;this.master=null;this.engine=null;this.engineGain=null;this.siren=null;this.sirenGain=null;this.rainGain=null;}
  async start(){if(this.ctx){await this.ctx.resume();return;}const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;this.ctx=new AC();this.master=this.ctx.createGain();this.master.gain.value=.28;this.master.connect(this.ctx.destination);
    this.engine=this.ctx.createOscillator();this.engine.type='sawtooth';this.engineGain=this.ctx.createGain();this.engineGain.gain.value=.02;const filter=this.ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=700;this.engine.connect(filter).connect(this.engineGain).connect(this.master);this.engine.start();
    this.siren=this.ctx.createOscillator();this.siren.type='square';this.sirenGain=this.ctx.createGain();this.sirenGain.gain.value=0;this.siren.connect(this.sirenGain).connect(this.master);this.siren.start();
    const len=this.ctx.sampleRate*2,buf=this.ctx.createBuffer(1,len,this.ctx.sampleRate),d=buf.getChannelData(0);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*.3;const noise=this.ctx.createBufferSource();noise.buffer=buf;noise.loop=true;const hp=this.ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=2200;this.rainGain=this.ctx.createGain();this.rainGain.gain.value=.045;noise.connect(hp).connect(this.rainGain).connect(this.master);noise.start();
  }


  door(){
    if(!this.ctx||!this.master)return;const t=this.ctx.currentTime,osc=this.ctx.createOscillator(),g=this.ctx.createGain(),f=this.ctx.createBiquadFilter();osc.type='triangle';osc.frequency.setValueAtTime(165,t);osc.frequency.exponentialRampToValueAtTime(62,t+.12);f.type='lowpass';f.frequency.value=520;g.gain.setValueAtTime(.075,t);g.gain.exponentialRampToValueAtTime(.001,t+.16);osc.connect(f).connect(g).connect(this.master);osc.start(t);osc.stop(t+.18);
  }

  impact(severity=1){
    if(!this.ctx||!this.master)return;const t=this.ctx.currentTime;const osc=this.ctx.createOscillator(),g=this.ctx.createGain(),f=this.ctx.createBiquadFilter();
    osc.type='square';osc.frequency.setValueAtTime(95+severity*12,t);osc.frequency.exponentialRampToValueAtTime(38,t+.16);f.type='lowpass';f.frequency.value=430;
    g.gain.setValueAtTime(Math.min(.24,.045+severity*.024),t);g.gain.exponentialRampToValueAtTime(.001,t+.22);osc.connect(f).connect(g).connect(this.master);osc.start(t);osc.stop(t+.24);
  }
  update(speed,heat,nearest=100,rain=1,inTunnel=false){if(!this.ctx)return;const t=this.ctx.currentTime;this.engine.frequency.setTargetAtTime(48+Math.min(290,speed*1.12),t,.05);this.engineGain.gain.setTargetAtTime(.012+Math.min(.06,speed/4300),t,.08);const sirenLevel=heat>0?Math.max(0,.06-nearest*.0004):0;this.sirenGain.gain.setTargetAtTime(sirenLevel,t,.12);this.siren.frequency.setTargetAtTime(610+Math.sin(performance.now()/240)*240,t,.04);if(this.rainGain)this.rainGain.gain.setTargetAtTime(inTunnel?.004:(.008+.05*rain),t,.4);}
}
