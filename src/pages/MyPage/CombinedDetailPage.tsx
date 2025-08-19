import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

import TagList from "@/components/Card/TagList";
import PostCombineMd from "./PostCombineMd";
import KebabDropdown from "@/components/Menu/KebabDropdown";
import KebabMenuButton from "@/components/Menu/KebabMenuButton";
import HeaderWoSearch from "@/components/Header/HeaderWoSearch";
import { PATH } from "@/constants/paths";

import {
  getCombinedDetail,
  hardDeletePost,
  getPostDetail,
} from "@/api/post.api";
import type { ViewCombinedResponse } from "@/models/post.model";
import { toTwoPaneVM } from "@/mappers/combinedDetail.mapper";
import { useViewerId } from "@/store/auth";

export default function CombinedDetailPage() {
  const { postId, summaryId } = useParams<{
    postId: string;
    summaryId: string;
  }>();
  const viewerId = useViewerId();
  const navigate = useNavigate();

  const [vm, setVm] = useState<ReturnType<typeof toTwoPaneVM> | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // 케밥
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const pid = Number(postId);
        const sid = Number(summaryId);
        if (!Number.isFinite(pid) || !Number.isFinite(sid)) {
          throw new Error("잘못된 경로 파라미터");
        }
        const data = await getCombinedDetail(pid, sid);
        if (!cancelled)
          setVm(toTwoPaneVM(data as ViewCombinedResponse, viewerId ?? null));
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "합본 상세 불러오기 실패");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postId, summaryId, viewerId]);

  const goEditOriginal = useCallback(async () => {
    if (!postId) return;
    try {
      const detail = await getPostDetail(Number(postId));
      const tt = String((detail as any)?.templateType ?? "").toUpperCase();
      const isFreeform = tt === "FREE_FORM" || tt === "FREEFORM";
      const editorPath = isFreeform ? PATH.FREEFORM_WRITING : PATH.TEMP_WRITING;
      navigate(editorPath, {
        replace: false,
        state: { postId: Number(postId), mode: "edit" },
      });
    } catch {
      alert("수정 화면으로 이동할 수 없어요. 잠시 후 다시 시도해주세요.");
    }
  }, [postId, navigate]);

  const handleDeletePost = useCallback(async () => {
    if (!postId) return;
    if (!window.confirm("원본 문서를 영구 삭제할까요? 복구할 수 없어요."))
      return;
    try {
      setDeleting(true);
      await hardDeletePost(Number(postId));
      alert("삭제되었습니다.");
      navigate(PATH.COMMUNITY, { replace: true });
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "삭제 중 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
      setShowMenu(false);
    }
  }, [postId, navigate]);

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
  if (err || !vm) {
    return (
      <div className="flex justify-center">
        <div className="max-w-[1200px] w-full pt-[180px] text-red-600">
          {err ?? "데이터가 없습니다."}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center flex-col">
      <HeaderWoSearch />
      <div
        className="flex flex-col items-center max-w-[1600px] gap-[50px]
       mb-[224px] w-full"
      >
        {/* 헤더 */}
        <div className="flex w-full pt-[180px] pb-[18px] items-center border-b border-gray1">
          <div className="flex flex-col items-start gap-[40px] w-full">
            <div className="flex w-full justify-between items-start">
              <span className="text-head-20-semibold">
                {vm.header.errorType}
              </span>
              <div className="relative" ref={menuRef}>
                <KebabMenuButton onClick={() => setShowMenu(!showMenu)} />
                {showMenu && (
                  <KebabDropdown
                    options={[
                      { label: "원본 수정", onClick: () => goEditOriginal() },
                      {
                        label: deleting ? "삭제 중..." : "원본 삭제",
                        onClick: () => !deleting && handleDeletePost(),
                      },
                    ]}
                  />
                )}
              </div>
            </div>

            <div className="flex flex-col items-start gap-[40px] w-full">
              <div className="text-head-48">{vm.header.title}</div>
              <div className="flex items-center gap-[16px]">
                <TagList tags={vm.header.tags} variant="post" />
                <div className="text-body-16-regular text-gray3">·</div>
                <div className="text-body-20-regular text-gray3">
                  {vm.header.date}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 본문: 좌(원본) | 우(요약) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[32px] w-full">
          {/* 왼쪽: 원본 */}
          <section className="flex flex-col gap-[24px]">
            <div className="text-head-24-bold">원본</div>
            <div className="flex flex-col gap-[32px]">
              {vm.left.questions.map((q, i) => (
                <PostCombineMd
                  key={`L-${i}`}
                  question={q}
                  content={vm.left.contents[i]}
                />
              ))}
            </div>
          </section>

          {/* 오른쪽: 요약 */}
          <section className="flex flex-col gap-[24px]">
            <div className="flex items-center gap-[12px]">
              <div className="text-head-24-bold">요약</div>
              {vm.right.summaryType && (
                <span className="text-body-16-regular text-gray3">
                  ({vm.right.summaryType})
                </span>
              )}
            </div>

            {vm.right.questions.length === 0 ? (
              <div className="text-body-18-regular text-gray3">
                아직 생성된 요약이 없어요.
              </div>
            ) : (
              <div className="flex flex-col gap-[32px]">
                {vm.right.questions.map((q, i) => (
                  <PostCombineMd
                    key={`R-${i}`}
                    question={q}
                    content={vm.right.contents[i]}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
