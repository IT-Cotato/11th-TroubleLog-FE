import type { PostCommentProps } from "@/entities/trouble/ui/PostComment";

export interface CommunityPostDetailProps {
  errorType: string;
  title: string;
  tags: string[];
  date: string;
  isMine: boolean;
  authorId?: number;
  authorProfile?: string;
  authorName: string;
  authorFollowers: number;
  authorBio: string;
  isFollowed: boolean;
  importance: number;
  questions: string[];
  contents: (string | { type: "image"; src: string; alt?: string })[][];
  isLiked: boolean;
  likeCounts: number;
  commentCounts: number;
  comments: PostCommentProps[];
  checklistError?: number[];
  checklistReason?: number[];
}
