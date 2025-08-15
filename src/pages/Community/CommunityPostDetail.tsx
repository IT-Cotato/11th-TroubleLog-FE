import TagList from "@/components/Card/TagList";
import PostComment, {
  type PostCommentProps,
} from "@/components/Community/PostComment";
import PostGuide from "@/components/Community/PostGuide";
import KebabDropdown from "@/components/Menu/KebabDropdown";
import KebabMenuButton from "@/components/Menu/KebabMenuButton";
import { PATH } from "@/constants/paths";
import useClickOutside from "@/hooks/useClickOutside";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import imageIcon from "@/assets/icons/image.svg";
import starIcon from "@/assets/icons/star.svg";
import heartIcon from "@/assets/icons/heart.svg";
import likeEmptyIcon from "@/assets/icons/like_empty.svg";
import shareIcon from "@/assets/icons/share.svg";
import { getCommunityPostDetail } from "@/api/community.api";
import { toCommunityPostVM } from "@/mappers/communityPostDetail.mapper";

export interface CommunityPostDetailProps {
  errorType: string;
  title: string;
  tags: string[];
  date: string;
  isMine: boolean;
  authorProfile?: string;
  authorName: string;
  authorFollowers: number;
  authorBio: string;
  importance: number;
  questions: string[];
  contents: (string | { type: "image"; src: string; alt?: string })[][];
  isLiked: boolean;
  likeCounts: number;
  commentCounts: number;
  comments: PostCommentProps[];
}

export default function CommunityPostDetail() {
  const { postId } = useParams<{ postId: string }>(); // postId 불러오기
  const navigate = useNavigate();

  const [post, setPost] = useState<CommunityPostDetailProps | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 좋아요/댓글 로컬 상태
  const [isLiked, setIsLiked] = useState(false);
  const [likeCounts, setLikeCounts] = useState(0);
  const [commentInput, setCommentInput] = useState("");
  const [comments, setComments] = useState<PostCommentProps[]>([]);

  // 케밥 메뉴
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useClickOutside(() => setShowMenu(false));

  // 섹션 추적
  const [currentSection, setCurrentSection] = useState<number>(0);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  // 데이터 로드
  useEffect(() => {
    let dead = false;
    const run = async () => {
      setLoading(true);
      try {
        const numId = Number(postId);
        if (!Number.isFinite(numId)) throw new Error("잘못된 포스트 ID");

        // getAPIResponseData가 이미 inner data를 반환합니다.
        const data = await getCommunityPostDetail(numId);

        if (dead) return;
        if (!data) {
          setLoadError("빈 응답입니다.");
          return;
        }

        const vm = toCommunityPostVM(data);
        setPost(vm);
        setIsLiked(vm.isLiked);
        setLikeCounts(vm.likeCounts);
        setComments(vm.comments);
      } catch (e: any) {
        if (!dead) setLoadError(e?.message ?? "포스트 불러오기 실패");
      } finally {
        if (!dead) setLoading(false);
      }
    };
    run();
    return () => {
      dead = true;
    };
  }, [postId]);

  // 스크롤 감시
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      let cur = 0;
      sectionRefs.current.forEach((ref, idx) => {
        if (ref) {
          const top = ref.getBoundingClientRect().top + window.scrollY;
          if (y >= top - 250) cur = idx;
        }
      });
      setCurrentSection(cur);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToSection = (idx: number) => {
    const target = sectionRefs.current[idx];
    if (target) {
      window.scrollTo({ top: target.offsetTop - 180, behavior: "smooth" });
    }
  };

  // 작성자 프로필 클릭 핸들러
  const handleProfileClick = () => {
    // 작성자 마이페이지로
    if (!post) return;
    navigate(PATH.MYPAGE(localStorage.getItem("userId") || ""));
  };

  const handleToggleLike = () => {
    // 토글 UI (서버 연동은 추후)
    setIsLiked((prev) => {
      const next = !prev;
      setLikeCounts((c) => (next ? c + 1 : Math.max(0, c - 1)));
      return next;
    });
  };

  const handleEdit = (id: string, newContent: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, content: newContent } : c))
    );
  };
  const handleDelete = (id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
  };
  const handleReply = (parentId: string, replyContent: string) => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    setComments((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: "현재 유저",
        date: `${yy}.${mm}.${dd}`,
        content: replyContent,
        isMine: true,
        isReply: true,
        parentId,
      },
    ]);
  };

  // 로딩/에러 처리
  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="flex flex-col items-start max-w-[1200px] ml-[360px] mr-[36px] gap-[24px] w-full pt-[180px]">
          <div className="w-full h-[120px] bg-gray-100 rounded" />
          <div className="w-full h-[400px] bg-gray-100 rounded" />
        </div>
      </div>
    );
  }
  if (loadError || !post) {
    return (
      <div className="flex justify-center">
        <div className="max-w-[1200px] w-full pt-[180px] text-red-600">
          {loadError ?? "포스트를 찾을 수 없습니다."}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      {/* 포스트 영역 */}
      <div className="flex flex-col items-start max-w-[1200px] ml-[360px] mr-[36px] gap-[56px] mb-[224px]">
        {/* 상단 영역 */}
        <div className="flex w-full pt-[180px] pb-[18px] items-center border-b border-gray1">
          <div className="flex flex-col items-start gap-[44px]">
            <div className="flex flex-col items-start gap-[53px]">
              <div className="flex flex-col items-start gap-[10px]">
                {/* 에러 종류 & (케밥 버튼) */}
                <div className="flex w-[1200px] justify-between items-start">
                  <span className="text-head-20-semibold">
                    {post.errorType}
                  </span>
                  {post.isMine && (
                    <div className="relative" ref={menuRef}>
                      <KebabMenuButton onClick={() => setShowMenu(!showMenu)} />
                      {showMenu && (
                        <KebabDropdown
                          options={[
                            {
                              label: "포스트 수정",
                              onClick: () => {
                                setShowMenu(false);
                              },
                            },
                            {
                              label: "삭제",
                              onClick: () => {
                                setShowMenu(false);
                              },
                            },
                          ]}
                          position={{ top: "0.1rem", left: "1.5rem" }}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* 포스트 제목 */}
                <div className="text-head-48">{post.title}</div>
              </div>

              {/* 태그 & 작성일 */}
              <div className="flex items-center gap-[16px]">
                {/* 태그 */}
                <TagList tags={post.tags} variant="post" />

                {/* 구분점 */}
                <div className="text-body-16-regular text-gray3">·</div>

                {/* 작성일 */}
                <div className="text-body-20-regular text-gray3">
                  {post.date}
                </div>
              </div>
            </div>

            {/* 작성자 정보 & 중요도 */}
            <div className="flex w-full items-center justify-between">
              {/* 작성자 정보 */}
              <div className="flex items-center gap-[20px]">
                {/* 프로필 이미지 */}
                <img
                  src={post.authorProfile || imageIcon}
                  onError={(e) => {
                    e.currentTarget.src = imageIcon;
                  }}
                  alt="profile"
                  className="w-[66px] h-[66px]"
                />

                {/* 작성자명 */}
                <div className="text-head-24-bold">{post.authorName}</div>
              </div>

              {/* 중요도 */}
              <div className="flex items-center gap-[8px]">
                <img
                  src={starIcon}
                  alt="importance"
                  className="w-[24px] h-[24px]"
                />
                <div className="text-body-20-regular text-gray3">
                  {post.importance}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 영역 */}
        <div className="flex w-full flex-col items-start gap-[8px]">
          {/* 메인 */}
          <div className="flex flex-col items-start gap-[36px] self-stretch">
            {/* 포스트 내용 & 작성자 정보 */}
            <div className="flex flex-col items-start self-stretch">
              <div className="flex flex-col items-start gap-[48px] self-stretch">
                {/* 포스트 내용 */}
                <div className="flex flex-col items-start gap-[48px] self-stretch">
                  {post.questions.map((q, idx) => (
                    <div
                      id={`section-${idx}`}
                      key={idx}
                      className="scroll-mt-[200px]"
                    >
                      <PostGuide question={q} content={post.contents[idx]} />
                    </div>
                  ))}
                </div>

                {/* 작성자 정보 */}
                <div className="flex py-[32px] px-[40px] flex-col items-start gap-[10px] self-stretch rounded-[36px] bg-[#F2F2F2]">
                  <div className="flex justify-between items-center self-stretch">
                    <div
                      className="flex items-center gap-[28px] cursor-pointer"
                      onClick={handleProfileClick}
                    >
                      {/* 프로필 이미지 */}
                      <img
                        src={post.authorProfile || imageIcon}
                        onError={(e) => {
                          e.currentTarget.src = imageIcon;
                        }}
                        alt="profile"
                        className="w-[131px] h-[131px]"
                      />
                      <div className="flex flex-col items-start gap-[13px]">
                        {/* 작성자명 & 팔로워 수 */}
                        <div className="flex flex-col items-start gap-[2px]">
                          <div className="text-head-24-bold">
                            {post.authorName}
                          </div>
                          <div className="text-body-16-regular">
                            {post.authorFollowers} 팔로워
                          </div>
                        </div>

                        {/* 한줄 소개 */}
                        <div className="text-body-18-regular">
                          {post.authorBio}
                        </div>
                      </div>
                    </div>

                    {/* 팔로우 버튼 */}
                    <button className="flex py-[18px] pl-[41px] pr-[40px] justify-center items-center rounded-[100px] bg-primary text-head-20-semibold text-white cursor-pointer">
                      팔로우
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 좋아요, 공유 */}
            <div className="flex pt-[52px] pb-[20px] items-center self-stretch border-b border-gray1">
              <div className="flex items-center gap-[20px]">
                {/* 좋아요 */}
                <div
                  className="flex items-center gap-[8px] cursor-pointer"
                  onClick={handleToggleLike}
                >
                  <img
                    src={isLiked ? heartIcon : likeEmptyIcon}
                    alt="like"
                    className="w-[40px] h-[40px]"
                  />

                  <div className="text-body-20-regular text-gray3">
                    {likeCounts}
                  </div>
                </div>

                {/* 공유 버튼 */}
                <img
                  src={shareIcon}
                  alt="share"
                  className="w-[40px] h-[40px]"
                />
              </div>
            </div>

            {/* 댓글 작성 창 */}
            <div className="flex flex-col items-end gap-[12px] self-stretch">
              <div className="flex flex-col items-start gap-[36px] self-stretch">
                <div className="text-head-32-semibold">
                  {post.commentCounts}개의 댓글
                </div>
                <textarea
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="댓글을 작성해주세요."
                  className="flex pt-[28px] pl-[32px] pb-[130px] w-full items-start self-stretch resize-none rounded-[24px] bg-white shadow-card text-body-20-regular text-[#757575] focus:outline-none"
                ></textarea>
              </div>

              {/* 작성하기 버튼 */}
              <button
                disabled={!commentInput.trim()}
                className={`flex pt-[8px] pl-[32px] pb-[12px] pr-[31px] justify-center items-center rounded-[100px] text-head-20-semibold text-white transition-colors ${
                  commentInput.trim() ? "bg-primary" : "bg-subColor1"
                }`}
              >
                작성하기
              </button>
            </div>
          </div>

          {/* 댓글 목록 */}
          <div className="flex flex-col items-end self-stretch">
            {comments
              .filter((c) => !c.isReply) // 부모 댓글만
              .map((parent) => (
                <div key={parent.id} className="w-full">
                  <PostComment
                    {...parent}
                    onEdit={(newContent) => handleEdit(parent.id, newContent)}
                    onDelete={() => handleDelete(parent.id)}
                    onReply={(replyContent) =>
                      handleReply(parent.id, replyContent)
                    }
                  />
                  {/* 답글 목록 */}
                  {comments
                    .filter((c) => c.parentId === parent.id)
                    .map((reply) => (
                      <PostComment
                        key={reply.id}
                        {...reply}
                        onEdit={(newContent) =>
                          handleEdit(reply.id, newContent)
                        }
                        onDelete={() => handleDelete(reply.id)}
                        onReply={(replyContent) =>
                          handleReply(reply.id, replyContent)
                        }
                      />
                    ))}
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* 목차 */}
      <div className="inline-flex items-start mt-[588px] mr-[89px] sticky top-[588px] h-fit">
        {/* 목차 리스트 */}
        <div className="flex flex-col items-start gap-[16px] border-l border-gray3 p-[12px] text-body-20-regular text-gray3">
          {post.questions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => scrollToSection(idx)}
              className={`text-left ${
                currentSection === idx ? "text-black" : ""
              }`}
            >
              {idx + 1}. {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
