import type { NotificationItem } from "@/components/Modal/NotificationModal";

export const mockNotifications: NotificationItem[] = [
  {
    id: 1,
    type: "트러블슈팅",
    text: "아직 해결되지 않은 트러블슈팅이 N개 있어요!",
    link: "/sample/link",
  },
  //   {
  //     id: 2,
  //     type: "댓글",
  //     text: "{코테이토}님이 댓글을 남겼습니다",
  //     link: "/some/comment/link",
  //   },
  {
    id: 3,
    type: "좋아요",
    text: "{코테이토}님이 좋아요를 눌렀습니다",
    link: "/some/like/link",
  },
  {
    id: 4,
    type: "좋아요",
    text: "{코테이토}님이 좋아요를 눌렀습니다",
    link: "/some/like/link",
  },
];
