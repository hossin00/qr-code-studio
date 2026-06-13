import { useState } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { Onboarding } from './components/Onboarding';
import App from './App';
type Phase='splash'|'onboarding'|'app';
export default function AppWrapper() {
  const [phase,setPhase]=useState<Phase>('splash');
  const afterSplash=()=>setPhase(localStorage.getItem('qr_ob') ? 'app' : 'onboarding');
  const afterOnboarding=()=>{localStorage.setItem('qr_ob','1');setPhase('app');};
  if(phase==='splash')return <SplashScreen onDone={afterSplash}/>;
  if(phase==='onboarding')return <Onboarding onDone={afterOnboarding}/>;
  return <App/>;
}
