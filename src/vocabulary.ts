import type { VisionFrame } from './vision';

export type VocabularyGroup = 'Kepala & wajah' | 'Tubuh & tangan' | 'Kaki';
export type Word = {
  id: string;
  arabic: string;
  latin: string;
  indonesian: string;
  group: VocabularyGroup;
  source: 'face' | 'body' | 'hand' | null;
  hint?: string;
};

// Semua kata tetap dapat dipelajari. Hanya titik yang didukung model yang diberi penanda AR.
export const WORDS: Word[] = [
  { id: 'head', arabic: 'رَأْسٌ', latin: 'ra’s', indonesian: 'Kepala', group: 'Kepala & wajah', source: 'face' },
  { id: 'hair', arabic: 'شَعْرٌ', latin: 'sya‘r', indonesian: 'Rambut', group: 'Kepala & wajah', source: null },
  { id: 'face', arabic: 'وَجْهٌ', latin: 'wajh', indonesian: 'Wajah', group: 'Kepala & wajah', source: 'face' },
  { id: 'forehead', arabic: 'جَبْهَةٌ', latin: 'jabhah', indonesian: 'Dahi', group: 'Kepala & wajah', source: 'face' },
  { id: 'eyebrow', arabic: 'حَاجِبٌ', latin: 'hājib', indonesian: 'Alis', group: 'Kepala & wajah', source: 'face' },
  { id: 'eye', arabic: 'عَيْنٌ', latin: '‘ain', indonesian: 'Mata', group: 'Kepala & wajah', source: 'face' },
  { id: 'ear', arabic: 'أُذُنٌ', latin: 'udzun', indonesian: 'Telinga', group: 'Kepala & wajah', source: 'body' },
  { id: 'nose', arabic: 'أَنْفٌ', latin: 'anf', indonesian: 'Hidung', group: 'Kepala & wajah', source: 'face' },
  { id: 'cheek', arabic: 'خَدٌّ', latin: 'khadd', indonesian: 'Pipi', group: 'Kepala & wajah', source: 'face' },
  { id: 'mouth', arabic: 'فَمٌ', latin: 'fam', indonesian: 'Mulut', group: 'Kepala & wajah', source: 'face' },
  { id: 'teeth', arabic: 'أَسْنَانٌ', latin: 'asnān', indonesian: 'Gigi', group: 'Kepala & wajah', source: null },
  { id: 'tongue', arabic: 'لِسَانٌ', latin: 'lisān', indonesian: 'Lidah', group: 'Kepala & wajah', source: null },
  { id: 'neck', arabic: 'رَقَبَةٌ', latin: 'raqabah', indonesian: 'Leher', group: 'Tubuh & tangan', source: 'body', hint: 'Titik leher diperkirakan dari kedua bahu.' },
  { id: 'shoulder', arabic: 'كَتِفٌ', latin: 'katif', indonesian: 'Bahu', group: 'Tubuh & tangan', source: 'body' },
  { id: 'arm', arabic: 'ذِرَاعٌ', latin: 'dzirā‘', indonesian: 'Lengan', group: 'Tubuh & tangan', source: 'body', hint: 'Titik lengan berada di antara bahu dan siku.' },
  { id: 'elbow', arabic: 'مِرْفَقٌ', latin: 'mirfaq', indonesian: 'Siku', group: 'Tubuh & tangan', source: 'body' },
  { id: 'wrist', arabic: 'مِعْصَمٌ', latin: 'mi‘sham', indonesian: 'Pergelangan tangan', group: 'Tubuh & tangan', source: 'body' },
  { id: 'hand', arabic: 'يَدٌ', latin: 'yad', indonesian: 'Tangan', group: 'Tubuh & tangan', source: 'hand' },
  { id: 'palm', arabic: 'كَفٌّ', latin: 'kaff', indonesian: 'Telapak tangan', group: 'Tubuh & tangan', source: 'hand' },
  { id: 'finger', arabic: 'إِصْبَعٌ', latin: 'ishba‘', indonesian: 'Jari tangan', group: 'Tubuh & tangan', source: 'hand' },
  { id: 'thumb', arabic: 'إِبْهَامٌ', latin: 'ibhām', indonesian: 'Ibu jari', group: 'Tubuh & tangan', source: 'hand' },
  { id: 'chest', arabic: 'صَدْرٌ', latin: 'shadr', indonesian: 'Dada', group: 'Tubuh & tangan', source: 'body', hint: 'Titik dada diperkirakan dari bahu dan pinggul.' },
  { id: 'stomach', arabic: 'بَطْنٌ', latin: 'bathn', indonesian: 'Perut', group: 'Tubuh & tangan', source: 'body', hint: 'Titik perut diperkirakan dari bahu dan pinggul.' },
  { id: 'back', arabic: 'ظَهْرٌ', latin: 'zhahr', indonesian: 'Punggung', group: 'Tubuh & tangan', source: null },
  { id: 'waist', arabic: 'خَصْرٌ', latin: 'khashr', indonesian: 'Pinggang', group: 'Tubuh & tangan', source: 'body', hint: 'Titik pinggang diperkirakan dari kedua pinggul.' },
  { id: 'thigh', arabic: 'فَخِذٌ', latin: 'fakhidz', indonesian: 'Paha', group: 'Kaki', source: 'body', hint: 'Titik paha berada di antara pinggul dan lutut.' },
  { id: 'knee', arabic: 'رُكْبَةٌ', latin: 'rukbah', indonesian: 'Lutut', group: 'Kaki', source: 'body' },
  { id: 'shin', arabic: 'سَاقٌ', latin: 'sāq', indonesian: 'Tungkai', group: 'Kaki', source: 'body', hint: 'Titik tungkai berada di antara lutut dan mata kaki.' },
  { id: 'ankle', arabic: 'كَاحِلٌ', latin: 'kāhil', indonesian: 'Mata kaki', group: 'Kaki', source: 'body' },
  { id: 'foot', arabic: 'قَدَمٌ', latin: 'qadam', indonesian: 'Kaki / telapak kaki', group: 'Kaki', source: null },
  { id: 'toe', arabic: 'إِصْبَعُ القَدَمِ', latin: 'ishba‘ al-qadam', indonesian: 'Jari kaki', group: 'Kaki', source: null },
];

type Point = [number, number];
const average = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const along = (a: Point, b: Point, t: number): Point => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

export function locateWord(id: string, frame: VisionFrame): Point | null {
  const face = frame.face;
  if (face && ['head','face','forehead','eyebrow','eye','nose','cheek','mouth'].includes(id)) {
    if (id === 'head') return [face.box[0] + face.box[2] / 2, face.box[1] + face.box[3] * 0.2];
    if (id === 'face') return [face.box[0] + face.box[2] / 2, face.box[1] + face.box[3] / 2];
    return face.landmarks[id] || null;
  }
  if (['hand','palm','finger','thumb'].includes(id)) {
    const hand = frame.hands[0];
    if (!hand || hand.length < 21) return null;
    if (id === 'thumb') return hand[4];
    if (id === 'finger') return hand[8];
    const palm = average(hand[5], hand[17]);
    return id === 'palm' ? average(palm, hand[0]) : palm;
  }
  const points = frame.body;
  if (!points) return null;
  const any = (...names: string[]) => names.map(name => points[name]).find(Boolean) || null;
  const pair = (a: string, b: string) => points[a] && points[b] ? average(points[a], points[b]) : null;
  const segment = (a: string, b: string, t = 0.5) => points[a] && points[b] ? along(points[a], points[b], t) : null;
  switch (id) {
    case 'ear': return any('leftEar', 'rightEar');
    case 'shoulder': return any('leftShoulder', 'rightShoulder');
    case 'elbow': return any('leftElbow', 'rightElbow');
    case 'wrist': return any('leftWrist', 'rightWrist');
    case 'neck': { const shoulders = pair('leftShoulder', 'rightShoulder'); return shoulders ? [shoulders[0], shoulders[1] - (frame.face?.box[3] || 50) * 0.12] : null; }
    case 'arm': return segment('leftShoulder', 'leftElbow') || segment('rightShoulder', 'rightElbow');
    case 'waist': return pair('leftHip', 'rightHip');
    case 'chest': case 'stomach': {
      const shoulders = pair('leftShoulder', 'rightShoulder');
      const hips = pair('leftHip', 'rightHip');
      return shoulders && hips ? along(shoulders, hips, id === 'chest' ? 0.22 : 0.65) : null;
    }
    case 'thigh': return segment('leftHip', 'leftKnee') || segment('rightHip', 'rightKnee');
    case 'knee': return any('leftKnee', 'rightKnee');
    case 'shin': return segment('leftKnee', 'leftAnkle') || segment('rightKnee', 'rightAnkle');
    case 'ankle': return any('leftAnkle', 'rightAnkle');
    default: return null;
  }
}
