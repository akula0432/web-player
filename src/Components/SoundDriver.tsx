import Drawer from "./Drawer";

class SoundDriver {
  private readonly audiFile;

  private drawer?: Drawer;

  private context: AudioContext;

  private gainNode?: GainNode = undefined; // sound volume controller

  private audioBuffer?: AudioBuffer = undefined;

  private bufferSource?: AudioBufferSourceNode = undefined; // audio buffer source, to play the sound

  private startedAt = 0;

  private pausedAt = 0;

  private isRunning = false;

  private currentTime: number;

  constructor(audioFile: Blob) {
    this.audiFile = audioFile;
    this.context = new AudioContext();
    this.currentTime = 0;
  }

  static showError(error: string) {
    return error;
    alert(
      "SoundParser constructor error. Can not read audio file as ArrayBuffer"
    );
  }

  public init(parent: HTMLElement | null) {
    return new Promise((resolve, reject) => {
      if (!parent) {
        reject(new Error("Parent element not found"));
        return;
      }

      const reader = new FileReader();
      reader.readAsArrayBuffer(this.audiFile);
      reader.onload = (event: ProgressEvent<FileReader>) =>
        this.loadSound(event).then((buffer) => {
          this.audioBuffer = buffer;
          this.drawer = new Drawer(buffer, parent);
          resolve(undefined);
        });
      reader.onerror = reject;
    });
  }

  private loadSound(readerEvent: ProgressEvent<FileReader>) {
    if (!readerEvent?.target?.result) {
      throw new Error("Can not read file");
    }

    return this.context.decodeAudioData(
      readerEvent.target.result as ArrayBuffer
    );
  }

  public async play(startTime: number = 0) {
    if (!this.audioBuffer) {
      throw new Error(
        "Play error. Audio buffer is not exists. Try to call loadSound before Play."
      );
    }

    if (!this.isRunning) {
      this.gainNode = this.context.createGain();

      this.bufferSource = this.context.createBufferSource();
      this.bufferSource.buffer = this.audioBuffer;

      this.bufferSource.connect(this.gainNode);
      this.bufferSource.connect(this.context.destination);

      this.gainNode.connect(this.context.destination);

      await this.context.resume();
      this.bufferSource.start(
        0,
        this.pausedAt,
        this.audioBuffer.duration - startTime
      );

      this.startedAt = this.context.currentTime - this.pausedAt;
      this.pausedAt = 0;

      this.isRunning = true;
    }
  }

  public async pause(reset?: boolean) {
    if (!this.bufferSource || !this.gainNode) {
      throw new Error(
        "Pause - bufferSource is not exists. Maybe you forgot to call Play before?"
      );
    }

    if (this.isRunning) {
      this.bufferSource.stop();
      await this.context.suspend();
      this.pausedAt = reset ? 0 : this.context.currentTime - this.startedAt;
      this.bufferSource.disconnect();
      this.gainNode.disconnect();
      this.isRunning = false;
    }
  }

  public changeVolume(volume: number) {
    if (!this.gainNode) {
      return;
    }

    this.gainNode.gain.value = volume;
  }

  public drawChart() {
    this.drawer?.init(this.pausedAt);
  }

  public getCurrentTime() {
    if (this.isRunning) {
      return this.pausedAt + (this.context.currentTime - this.startedAt);
    } else {
      return this.pausedAt;
    }
  }

  public updateCurrentTimeLine(time: number) {
    let duration = this.audioBuffer?.duration;
    if (!duration) {
      return;
    }
    this.drawer?.updateCurrentTimeLine(time, duration);
  }

  public getDuration(): number | undefined {
    return this.audioBuffer?.duration;
  }

  public rewindTrack(time: number) {
    this.pausedAt = time;
  }
}

export default SoundDriver;
