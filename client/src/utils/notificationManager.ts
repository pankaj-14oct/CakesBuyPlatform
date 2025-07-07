// Enhanced notification manager for delivery boys with persistent alerts
export class NotificationManager {
  private static instance: NotificationManager;
  private audioContext: AudioContext | null = null;
  private ringtoneAudio: HTMLAudioElement | null = null;
  private isPlaying = false;
  private playInterval: NodeJS.Timeout | null = null;
  private registration: ServiceWorkerRegistration | null = null;

  private constructor() {
    this.initializeAudio();
    this.registerServiceWorker();
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  private async initializeAudio() {
    try {
      // Create AudioContext
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create mobile ringtone-style audio
      this.ringtoneAudio = new Audio();
      this.ringtoneAudio.volume = 1.0;
      this.ringtoneAudio.loop = false;
      
      // Generate a ringtone-style beep sequence
      this.createRingtoneSound();
      
      // Handle user interaction to unlock audio
      const unlockAudio = async () => {
        if (this.audioContext?.state === 'suspended') {
          await this.audioContext.resume();
        }
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('touchstart', unlockAudio);
      };
      
      document.addEventListener('click', unlockAudio, { once: true });
      document.addEventListener('touchstart', unlockAudio, { once: true });
    } catch (error) {
      console.warn('Audio initialization failed:', error);
    }
  }

  private createRingtoneSound() {
    if (!this.audioContext) return;

    // Create a mobile ringtone-style melody using Web Audio API
    const createTone = (frequency: number, duration: number, startTime: number) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);
      
      oscillator.frequency.setValueAtTime(frequency, startTime);
      oscillator.type = 'sine';
      
      // Envelope for smooth sound
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.8, startTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0.4, startTime + duration * 0.7);
      gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    // Nokia-style ringtone sequence
    this.ringtoneAudio!.src = this.generateRingtoneDataURL();
  }

  private generateRingtoneDataURL(): string {
    // Create a Nokia-style ringtone using Web Audio API
    if (!this.audioContext) {
      return 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaBTCC0fPJeiiD';
    }

    try {
      // Generate a more realistic mobile ringtone data URL
      const sampleRate = 44100;
      const duration = 2; // 2 seconds
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
      
      // Generate Nokia-style ringtone melody
      const melody = [659, 587, 370, 415, 554, 494, 294, 330, 494, 440]; // E5-D5-F#4-G#4-C#5-B4-D4-E4-B4-A4
      let offset = 44;
      
      for (let i = 0; i < samples; i++) {
        const t = i / sampleRate;
        const noteIndex = Math.floor((t * 5) % melody.length); // 5 notes per second
        const freq = melody[noteIndex];
        const volume = 0.3 * Math.sin(2 * Math.PI * 2 * t); // 2Hz volume modulation
        const sample = Math.sin(2 * Math.PI * freq * t) * volume * 32767;
        view.setInt16(offset, sample, true);
        offset += 2;
      }
      
      const blob = new Blob([buffer], { type: 'audio/wav' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.warn('Failed to generate ringtone:', error);
      return 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaBTCC0fPJeiiD';
    }
  }

  private async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workers not supported');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered');
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Browser notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      console.warn('Notification permission denied');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async showOrderNotification(orderData: {
    orderNumber: string;
    customerName: string;
    amount: number;
    address: string;
  }) {
    const hasPermission = await this.requestPermission();
    
    if (hasPermission) {
      // Show browser notification
      const notification = new Notification('🚚 New Order Assignment!', {
        body: `Order #${orderData.orderNumber}\nCustomer: ${orderData.customerName}\nAmount: ₹${orderData.amount}\nAddress: ${orderData.address}`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'order-notification',
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200, 100, 200, 100, 200],
        silent: false
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close after 30 seconds if not clicked
      setTimeout(() => {
        notification.close();
      }, 30000);
    }

    // Play persistent ringtone
    this.playPersistentRingtone();

    // Vibrate mobile device
    this.vibrateDevice();

    // Flash browser tab title
    this.flashPageTitle(orderData.orderNumber);
  }

  private playPersistentRingtone() {
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    let playCount = 0;
    const maxPlays = 10; // Play 10 times

    const playRingtone = () => {
      if (playCount >= maxPlays) {
        this.stopRingtone();
        return;
      }

      try {
        // Play Web Audio API tones
        if (this.audioContext && this.audioContext.state === 'running') {
          const now = this.audioContext.currentTime;
          // Nokia ringtone pattern: E5-D5-F#4-G#4-C#5-B4-D4-E4-B4-A4
          const notes = [659, 587, 370, 415, 554, 494, 294, 330, 494, 440];
          const noteDuration = 0.15;
          
          notes.forEach((freq, index) => {
            this.createTone(freq, noteDuration, now + (index * noteDuration));
          });
        }

        // Fallback HTML5 audio
        if (this.ringtoneAudio) {
          this.ringtoneAudio.currentTime = 0;
          this.ringtoneAudio.play().catch(console.warn);
        }

        playCount++;
      } catch (error) {
        console.warn('Ringtone playback failed:', error);
      }
    };

    // Play immediately and then every 3 seconds
    playRingtone();
    this.playInterval = setInterval(playRingtone, 3000);

    // Auto-stop after 30 seconds
    setTimeout(() => {
      this.stopRingtone();
    }, 30000);
  }

  private createTone(frequency: number, duration: number, startTime: number) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, startTime);
    oscillator.type = 'sine';
    
    // Envelope for smooth sound
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.8, startTime + 0.02);
    gainNode.gain.linearRampToValueAtTime(0.4, startTime + duration * 0.8);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }

  private vibrateDevice() {
    if ('vibrate' in navigator) {
      // Strong vibration pattern for attention
      navigator.vibrate([500, 200, 500, 200, 500, 200, 1000]);
      
      // Repeat vibration every 5 seconds for 30 seconds
      let vibrateCount = 0;
      const vibrateInterval = setInterval(() => {
        if (vibrateCount >= 6) {
          clearInterval(vibrateInterval);
          return;
        }
        navigator.vibrate([300, 200, 300, 200, 300]);
        vibrateCount++;
      }, 5000);
    }
  }

  private flashPageTitle(orderNumber: string) {
    const originalTitle = document.title;
    let isFlashing = true;
    let flashCount = 0;
    const maxFlashes = 60; // Flash for 30 seconds (every 500ms)

    const flashInterval = setInterval(() => {
      if (flashCount >= maxFlashes) {
        document.title = originalTitle;
        clearInterval(flashInterval);
        return;
      }

      document.title = isFlashing 
        ? `🚨 NEW ORDER #${orderNumber} 🚨`
        : originalTitle;
      
      isFlashing = !isFlashing;
      flashCount++;
    }, 500);

    // Stop flashing when user focuses on the tab
    const stopFlashing = () => {
      document.title = originalTitle;
      clearInterval(flashInterval);
      document.removeEventListener('visibilitychange', stopFlashing);
      window.removeEventListener('focus', stopFlashing);
    };

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        stopFlashing();
      }
    });
    window.addEventListener('focus', stopFlashing);
  }

  stopRingtone() {
    this.isPlaying = false;
    
    if (this.playInterval) {
      clearInterval(this.playInterval);
      this.playInterval = null;
    }

    if (this.ringtoneAudio) {
      this.ringtoneAudio.pause();
      this.ringtoneAudio.currentTime = 0;
    }
  }

  // Test notification method
  async testNotification(): Promise<boolean> {
    try {
      await this.showOrderNotification({
        orderNumber: 'TEST-001',
        customerName: 'Test Customer',
        amount: 500,
        address: 'Test Address, Gurgaon'
      });
      return true;
    } catch (error) {
      console.error('Test notification failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const notificationManager = NotificationManager.getInstance();