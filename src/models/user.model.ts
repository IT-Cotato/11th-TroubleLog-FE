export interface ProfileData {
  name: string;
  sort: string;
  bio: string;
  git: string;
}

export interface FollowingData {
  id: number;
  name: string;
  email: string;
  follow: boolean;
}
