export type Anime = {
    id: number;
    title: string;
    episodes: number;
    rating: number;
  };
  
  export type NewAnime = Omit<Anime, "id">; // For the form input