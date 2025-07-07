// Enhanced notification sound system
export const testNotificationSound = async (): Promise<boolean> => {
  try {
    // First try: Web Audio API with loud alarm sound
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContext();
    
    // User interaction is required to unlock audio context
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    // Create loud alarm sound sequence
    const createAlarmTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'square'; // Square wave for sharper, more attention-grabbing sound
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(1.0, startTime + 0.05); // Maximum volume
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    const now = audioContext.currentTime;
    
    // Create urgent alarm pattern: Extended loud beeping sequence
    createAlarmTone(1200, now + 0.1, 0.4);  // Very high beep
    createAlarmTone(900, now + 0.6, 0.4);   // High beep
    createAlarmTone(1200, now + 1.1, 0.4);  // Very high beep
    createAlarmTone(900, now + 1.6, 0.4);   // High beep
    createAlarmTone(1200, now + 2.1, 0.5);  // Very high beep (longer)
    
    return true;
    
  } catch (error) {
    console.error('Web Audio API failed:', error);
    
    // Fallback 1: HTML5 Audio with multiple sounds
    try {
      const playAudioBeep = () => {
        return new Promise((resolve) => {
          const audio = new Audio();
          audio.volume = 1.0; // Maximum volume
          
          // Generate a more complex beep sound
          const sampleRate = 8000;
          const duration = 0.5;
          const frequency = 900;
          const samples = sampleRate * duration;
          const buffer = new ArrayBuffer(44 + samples * 2);
          const view = new DataView(buffer);
          
          // WAV header
          const writeString = (offset: number, string: string) => {
            for (let i = 0; i < string.length; i++) {
              view.setUint8(offset + i, string.charCodeAt(i));
            }
          };
          
          writeString(0, 'RIFF');
          view.setUint32(4, 36 + samples * 2, true);
          writeString(8, 'WAVE');
          writeString(12, 'fmt ');
          view.setUint32(16, 16, true);
          view.setUint16(20, 1, true);
          view.setUint16(22, 1, true);
          view.setUint32(24, sampleRate, true);
          view.setUint32(28, sampleRate * 2, true);
          view.setUint16(32, 2, true);
          view.setUint16(34, 16, true);
          writeString(36, 'data');
          view.setUint32(40, samples * 2, true);
          
          // Generate beep data with maximum amplitude
          for (let i = 0; i < samples; i++) {
            const sample = Math.sin(frequency * 2 * Math.PI * i / sampleRate) * 1.0;
            view.setInt16(44 + i * 2, sample * 32767, true);
          }
          
          const blob = new Blob([buffer], { type: 'audio/wav' });
          audio.src = URL.createObjectURL(blob);
          
          audio.onended = () => {
            URL.revokeObjectURL(audio.src);
            resolve(true);
          };
          
          audio.onerror = () => resolve(false);
          audio.play().catch(() => resolve(false));
        });
      };
      
      // Play multiple beeps in rapid succession
      await playAudioBeep();
      setTimeout(() => playAudioBeep(), 300);
      setTimeout(() => playAudioBeep(), 600);
      setTimeout(() => playAudioBeep(), 900);
      setTimeout(() => playAudioBeep(), 1200);
      
      return true;
      
    } catch (audioError) {
      console.error('HTML5 Audio also failed:', audioError);
      
      // Fallback 2: System notification sound
      try {
        // Try to play system notification sound
        const audio = new Audio();
        audio.volume = 1.0;
        audio.src = 'data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAAC4AAABDb3B5cmlnaHQgUmVhbFNvdW5kAP/7kGQAAP4AAGkAAAAgAAA0gAABAAAGkAAAAIAAANIAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+5BkA4D+AAAaQAAAACAAADSAAAAEAAA0gAAABAAA0gAABAAAuKqquqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/84KCAAAAAAD/84K';
        
        audio.play().catch(() => {
          // Final fallback: vibration only
          if ('vibrate' in navigator) {
            navigator.vibrate([300, 100, 300, 100, 300]);
          }
        });
        
        return true;
        
      } catch (finalError) {
        console.error('All audio methods failed:', finalError);
        
        // Last resort: intense vibration
        if ('vibrate' in navigator) {
          navigator.vibrate([700, 150, 700, 150, 700, 150, 700]);
        }
        
        return false;
      }
    }
  }
};