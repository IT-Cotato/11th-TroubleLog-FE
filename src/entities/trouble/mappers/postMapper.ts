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
  starRating: number;
  templateType: string;
  thumbnailImageUrl?: string;
  projectId: number;
  checklistError: number[];
  checklistReason: number[];

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
  templateType: form.templateType,
  thumbnailImageUrl: form.thumbnailImageUrl,
  projectId: form.projectId,
  errorTagName: form.errorTag,
  contentDtoList: form.contents,
  checklistError: form.checklistError ?? [],
  checklistReason: form.checklistReason ?? [],
});

export const toEditPostRequest = (form: PostForm): EditPostRequest => ({
  title: form.title,
  introduction: form.introduction,
  postTags: form.postTags,
  isVisible: form.isVisible,
  isSummaryCreated: form.isSummaryCreated,
  postStatus: form.postStatus,
  starRating: form.starRating,
  templateType: form.templateType,
  thumbnailImageUrl: form.thumbnailImageUrl,
  projectId: form.projectId,
  errorTagName: form.errorTag,
  contentDtoList: form.contents,
  checklistError: form.checklistError ?? [],
  checklistReason: form.checklistReason ?? [],
});

export const toPostForm = (res: ViewPostResponse): PostForm => ({
  title: res.title,
  introduction: res.introduction,
  postTags: res.postTags,
  isVisible: res.isVisible,
  isSummaryCreated: res.isSummaryCreated,
  postStatus: res.postStatus,
  starRating: res.starRating,
  templateType: res.templateType,
  thumbnailImageUrl: res.thumbnailImageUrl,
  projectId: res.projectId,
  errorTag: res.errorTag,
  contents: (res.contents ?? []).map(({ subTitle, body, sequence }) => ({
    subTitle,
    body,
    sequence,
  })),
  checklistError: res.checkListError ?? [],
  checklistReason: res.checkListReason ?? [],
});
