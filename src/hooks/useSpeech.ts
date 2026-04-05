// TTS using Web Speech API & STT using Web Speech API
import { useState, useCallback, useRef, useEffect } from 'react';

// Extend Window for webkit prefix
interface SpeechRecognitionAPI {
  new (): SpeechRecognitionInstance;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: { error: string }) => void) | null;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionAPI;
    webkitSpeechRecognition: SpeechRecognitionAPI;
  }
}

interface SpeechOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: string;
}

interface UseSpeechReturn {
  speak: (text: string, options?: SpeechOptions) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  voices: SpeechSynthesisVoice[];
  startListening: () => void;
  stopListening: () => void;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  ttsSupported: boolean;
  sttSupported: boolean;
}

export const useSpeech = (): UseSpeechReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const sttSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (!ttsSupported) return;
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, [ttsSupported]);

  const speak = useCallback((text: string, options: SpeechOptions = {}) => {
    if (!ttsSupported) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options.lang || 'en-US';
    utterance.rate = options.rate ?? 1;
    utterance.pitch = options.pitch ?? 1;
    utterance.volume = options.volume ?? 1;
    if (options.voice) {
      const found = voices.find(v => v.name.toLowerCase().includes(options.voice!.toLowerCase()));
      if (found) utterance.voice = found;
    }
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [ttsSupported, voices]);

  const stopSpeaking = useCallback(() => {
    if (ttsSupported) window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [ttsSupported]);

  const startListening = useCallback(() => {
    if (!sttSupported) return;
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onstart = () => { setIsListening(true); setTranscript(''); setInterimTranscript(''); };
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '', final = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) final += result[0].transcript;
        else interim += result[0].transcript;
      }
      if (final) setTranscript(final);
      setInterimTranscript(interim);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => { console.error('Speech recognition error:', event.error); setIsListening(false); };
    recognitionRef.current = recognition;
    recognition.start();
  }, [sttSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; }
    setIsListening(false);
  }, []);

  return {
    speak, stopSpeaking, isSpeaking, voices,
    startListening, stopListening, isListening,
    transcript, interimTranscript, ttsSupported, sttSupported,
  };
};
