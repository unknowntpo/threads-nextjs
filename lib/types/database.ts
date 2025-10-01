export interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProfile {
  username: string;
  display_name: string;
  bio?: string;
}

export interface UpdateProfile {
  display_name?: string;
  bio?: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  username: string;
  display_name?: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePost {
  content: string;
  image_url?: string;
}

export interface UpdatePost {
  content?: string;
  image_url?: string;
}

export interface PostWithProfile extends Post {
  profiles: Profile;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: CreateProfile;
        Update: UpdateProfile;
      };
      posts: {
        Row: Post;
        Insert: CreatePost;
        Update: UpdatePost;
      };
    };
  };
};