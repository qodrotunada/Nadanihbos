import Human, { type FaceResult } from '@vladmandic/human';

type Point = [number, number];
export type LiveFace = { embedding: number[]; box: [number, number, number, number]; score: number; mesh: Point[]; landmarks: Record<string, Point | undefined>; features: { eye: Point; nose: Point; mouth: Point } | null };
export type VisionFrame = { face: LiveFace | null; body: Record<string, Point> | null; hands: Point[][]; count: number; width: number; height: number };

export class FaceVision {
  private human: Human | null = null;
  private stream: MediaStream | null = null;
  private running = false;
  private facing: 'user' | 'environment' = 'user';
  private timer: number | null = null;
  private busy = false;
  private lastFrame = 0;
  private generation = 0;
  private callbacks: { onFrame: (frame: VisionFrame) => void; onError: (error: Error) => void };

  constructor(private video: HTMLVideoElement, callbacks: FaceVision['callbacks']) { this.callbacks = callbacks; }
  get active() { return this.running; }
  get cameraFacing() { return this.facing; }

  async start() {
    if (this.running) return;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw Error('Kamera memerlukan HTTPS atau localhost dan browser yang mendukungnya.');
    const generation = ++this.generation;
    try {
      await this.openCamera(generation);
      if (generation !== this.generation) return;
      if (!this.human) {
        const model = new Human({
          backend: 'webgl',
          modelBasePath: '/models/',
          debug: false,
          gesture: { enabled: false },
          body: { enabled: true, maxDetected: 1, minConfidence: 0.35, skipFrames: 1, skipTime: 160 },
          hand: { enabled: true, maxDetected: 2, minConfidence: 0.45, skipFrames: 1, skipTime: 350 },
          object: { enabled: false }, segmentation: { enabled: false },
          face: {
            enabled: true,
            detector: { maxDetected: 2, rotation: true, skipFrames: 0, skipTime: 0, minConfidence: 0.45 },
            mesh: { enabled: true }, iris: { enabled: false }, emotion: { enabled: false },
            description: { enabled: true, skipFrames: 0, skipTime: 0 },
            antispoof: { enabled: false }, liveness: { enabled: false },
          },
        });
        try { await model.load(); await model.warmup(); }
        catch (cause) {
          console.warn('WebGL tidak siap; mencoba backend CPU.', cause);
          model.config.backend = 'cpu';
          await model.load();
        }
        this.human = model;
      }
      if (generation !== this.generation) return;
      this.running = true;
      this.timer = requestAnimationFrame(() => void this.tick());
    } catch (cause) {
      this.stop();
      throw cause;
    }
  }

  async switchCamera() {
    const next = this.facing === 'user' ? 'environment' : 'user';
    this.stop();
    this.facing = next;
    try { await this.start(); }
    catch (cause) { this.facing = next === 'user' ? 'environment' : 'user'; throw cause; }
  }

  stop() {
    this.generation++;
    this.running = false;
    if (this.timer !== null) cancelAnimationFrame(this.timer);
    this.timer = null;
    this.stream?.getTracks().forEach(track => track.stop());
    this.stream = null;
    this.video.pause();
    this.video.srcObject = null;
    this.callbacks.onFrame({ face: null, body: null, hands: [], count: 0, width: 0, height: 0 });
  }

  private async openCamera(generation: number) {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: this.facing }, width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24, max: 30 } },
    });
    if (generation !== this.generation) { stream.getTracks().forEach(track => track.stop()); return; }
    this.stream = stream;
    this.video.srcObject = stream;
    await this.video.play();
    if (generation !== this.generation) { stream.getTracks().forEach(track => track.stop()); return; }
    if (!this.video.videoWidth || !this.video.videoHeight) throw Error('Kamera tidak mengirim gambar. Periksa izin dan perangkat.');
  }

  private async tick() {
    if (!this.running || !this.human) return;
    const now = performance.now();
    if (!this.busy && now - this.lastFrame > 180 && this.video.readyState >= 2) {
      this.busy = true;
      this.lastFrame = now;
      try {
        const result = await this.human.detect(this.video);
        if (!this.running) return;
        const available: FaceResult[] = result.face.filter(face => face.boxScore >= 0.45);
        const first = available.length === 1 ? available[0] : null;
        const embedding = first?.embedding;
        const face = first && embedding?.length === 1024 && first.box[2] >= 80
          ? { embedding: [...embedding], box: [...first.box] as LiveFace['box'], score: first.boxScore,
              mesh: first.mesh.filter((_, index) => index % 16 === 0).map(point => [point[0], point[1]] as [number, number]),
              landmarks: first.mesh.length > 263 ? {
                forehead: [first.mesh[10][0], first.mesh[10][1]] as Point,
                eyebrow: [first.mesh[70][0], first.mesh[70][1]] as Point,
                eye: [first.mesh[33][0], first.mesh[33][1]] as Point,
                nose: [first.mesh[1][0], first.mesh[1][1]] as Point,
                cheek: [first.mesh[205][0], first.mesh[205][1]] as Point,
                mouth: [first.mesh[13][0], first.mesh[13][1]] as Point,
              } : {},
              features: first.mesh.length > 263 ? {
                eye: [(first.mesh[33][0] + first.mesh[263][0]) / 2, (first.mesh[33][1] + first.mesh[263][1]) / 2] as [number, number],
                nose: [first.mesh[1][0], first.mesh[1][1]] as [number, number],
                mouth: [first.mesh[13][0], first.mesh[13][1]] as [number, number],
              } : null }
          : null;
        const person = result.body[0];
        const body: Record<string, Point> | null = person ? Object.fromEntries(person.keypoints
          .filter(point => point.score >= 0.35 && Number.isFinite(point.position[0]) && Number.isFinite(point.position[1]))
          .map(point => [point.part, [point.position[0], point.position[1]] as Point])) : null;
        const hands = result.hand.filter(hand => hand.score >= 0.45 && hand.keypoints.length >= 21)
          .map(hand => hand.keypoints.map(point => [point[0], point[1]] as Point));
        this.callbacks.onFrame({ face, body, hands, count: available.length, width: this.video.videoWidth, height: this.video.videoHeight });
      } catch (cause) { this.callbacks.onError(cause instanceof Error ? cause : Error(String(cause))); this.stop(); }
      finally { this.busy = false; }
    }
    if (this.running) this.timer = requestAnimationFrame(() => void this.tick());
  }
}
