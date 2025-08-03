export interface ProfileData {
  userId: number;
  nickame: string;
  field: string;
  bio: string;
  githubUrl: string;
}

export interface FollowingData {
  id: number;
  name: string;
  email: string;
  follow: boolean;
}
