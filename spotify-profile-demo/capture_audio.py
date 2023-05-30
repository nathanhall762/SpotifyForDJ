import sys
import pyaudio
import wave
from pydub import AudioSegment

CHUNK = 1024
FORMAT = pyaudio.paInt16
CHANNELS = 2
RATE = 44100
BITRATE = '320k'


def record_audio(duration):
    p = pyaudio.PyAudio()
    stream = p.open(format=FORMAT,
                    channels=CHANNELS,
                    rate=RATE,
                    input=True,
                    frames_per_buffer=CHUNK)

    frames = []
    for i in range(0, int(RATE / CHUNK * duration)):
        data = stream.read(CHUNK)
        frames.append(data)

    stream.stop_stream()
    stream.close()
    p.terminate()

    wave_filename = 'output.wav'
    with wave.open(wave_filename, 'wb') as wf:
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(p.get_sample_size(FORMAT))
        wf.setframerate(RATE)
        wf.writeframes(b''.join(frames))

    audio = AudioSegment.from_wav(wave_filename)
    audio.export('output.mp3', format='mp3', bitrate=BITRATE)

    # Optionally, delete the intermediate WAV file
    # os.remove(wave_filename)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Please provide the duration of the recording in seconds.')
    else:
        duration = int(sys.argv[1])
        record_audio(duration)
