export type Place = {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  created_at: string;
};

export type Trip = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};
