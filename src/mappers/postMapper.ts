import type {
  PostContentDto,
  CreatePostRequest,
  EditPostRequest,
  ViewPostResponse,
} from "@/models/post.model";

export interface PostForm {
  title: string;
  introduction: string;
  postTags: string[];
  isVisible: boolean;
  isSummaryCreated: boolean;
  postStatus: string;
  starRating: string;
  thumbnailImageUrl?: string;
  projectId: number;

  errorTag: string;
  contents: PostContentDto[];
}

export const toCreatePostRequest = (form: PostForm): CreatePostRequest => ({
  title: form.title,
  introduction: form.introduction,
  postTags: form.postTags,
  isVisible: form.isVisible,
  isSummaryCreated: form.isSummaryCreated,
  postStatus: form.postStatus,
  starRating: form.starRating,
  thumbnailImageUrl: form.thumbnailImageUrl,
  projectId: form.projectId,
  errorTagName: form.errorTag,
  contentDtoList: form.contents,
});

export const toEditPostRequest = (form: PostForm): EditPostRequest => ({
  title: form.title,
  introduction: form.introduction,
  postTags: form.postTags,
  isVisible: form.isVisible,
  isSummaryCreated: form.isSummaryCreated,
  postStatus: form.postStatus,
  starRating: form.starRating,
  thumbnailImageUrl: form.thumbnailImageUrl,
  projectId: form.projectId,
  errorTagName: form.errorTag,
  contentDtoList: form.contents,
});

export const toPostForm = (res: ViewPostResponse): PostForm => ({
  title: res.title,
  introduction: res.introduction,
  postTags: res.postTags,
  isVisible: res.isVisible,
  isSummaryCreated: res.isSummaryCreated,
  postStatus: res.postStatus,
  starRating: res.starRating,
  thumbnailImageUrl: res.thumbnailImageUrl,
  projectId: res.projectId,
  errorTag: res.errorTag,
  contents: (res.contents ?? []).map(
    ({ subTitle, body, sequence, authorType, summaryType }) => ({
      subTitle,
      body,
      sequence,
      authorType,
      summaryType,
    })
  ),
});
