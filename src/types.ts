export interface Hole {
  number: number;
  name: string;
  teeLocation: google.maps.LatLngLiteral;
  teeDescription: string;
  pinLocation: google.maps.LatLngLiteral;
  pinDescription: string;
  teeImage?: string;
  pinImage?: string;
  par: number;
  tip: string;
  hazard: boolean;
  photoSpot?: string;
}

export interface Score {
  strokes: number;
  putts?: number;
  notes?: string;
}

export interface Round {
  id: string;
  date: string;
  scores: Record<number, Score>;
  isCompleted: boolean;
  courseId?: string;
}
