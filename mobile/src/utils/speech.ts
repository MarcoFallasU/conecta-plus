import * as Speech from 'expo-speech'

interface SpeakOptions {
  // Se llama cuando termina de leer o se detiene (para actualizar el botón).
  onEnd?: () => void
}

// Lectura en voz alta para quienes ven poco. Si el dispositivo no tiene voz instalada,
// falla en silencio: la información siempre sigue disponible en pantalla.
export function speak(text: string, { onEnd }: SpeakOptions = {}) {
  try {
    Speech.stop()
    Speech.speak(text, {
      language: 'es-CR',
      rate: 0.9,
      onDone: onEnd,
      onStopped: onEnd,
      onError: onEnd,
    })
  } catch {
    onEnd?.()
  }
}

export function stopSpeaking() {
  try {
    Speech.stop()
  } catch {
    // nada que detener
  }
}
