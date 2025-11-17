// globals.d.ts
export {};

// Fix: Defined a named interface `AIStudio` to resolve a type conflict.
// The error message indicated that subsequent property declarations for `window.aistudio`
// must use the type `AIStudio` instead of an inline object.
interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

declare global {
  interface Window {
    // For Speech Recognition API
    SpeechRecognition: any;
    webkitSpeechRecognition: any;

    // For AI Studio environment, used for Veo API key selection
    aistudio?: AIStudio;
  }
}
