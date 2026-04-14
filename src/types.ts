export interface Child {
  id?: string;
  name: string;
  birthDate: string;
  allergies: string;
  specialNeeds: string;
  parentId?: string; // Keep for backward compatibility
  parentIds?: string[];
  familyId?: string;
  familyName?: string;
  photoUrl?: string;
  status?: 'Ativa' | 'Inativa' | 'Visitante';
  checkedIn?: boolean;
  lastCheckIn?: string;
  lastCheckOut?: string;
}

export interface Parent {
  id?: string;
  name: string;
  phone: string;
  leader: string;
  relation: string;
  familyId?: string;
  photoUrl?: string;
}

export interface Material {
  id?: string;
  name: string;
  quantity: number;
  category: string;
  minQuantity: number;
  lastUpdated: string;
}

export interface Volunteer {
  id?: string;
  name: string;
  phone: string;
  role: string; // e.g., "Professor", "Auxiliar", "Coordenador"
  active: boolean;
  birthDate?: string;
}

export interface Schedule {
  id?: string;
  date: string;
  volunteerId: string;
  groupId: string; // G1, G2, G3, G4
  shift: string; // "Manhã", "Noite"
  studyTheme?: string;
  studyIdeas?: string;
}

export interface Service {
  id?: string;
  name: string;
  date: string;
  type: string;
  description?: string;
  theme?: string;
  studyContent?: string;
  aiSuggestions?: string;
  fileUrl?: string;
  fileName?: string;
}
