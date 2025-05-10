// Shared types for Kodesh M Tracker

// ParticipationLevel now supports 4 options:
// 1) DidNotParticipate 2) InShabbos 3) OneMealOut 4) OutShabbos
export type ParticipationLevel = 'DidNotParticipate' | 'InShabbos' | 'OneMealOut' | 'OutShabbos';

export interface Student {
  id: string;
  name: string;
}

export interface Week {
  id: string;
  title: string;
  date: string; // ISO string
  students: StudentParticipation[];
}

export interface StudentParticipation {
  studentId: string;
  participation: ParticipationLevel;
  hoursLearned?: number; // Number of hours learned for this week (optional, default 0)
}
