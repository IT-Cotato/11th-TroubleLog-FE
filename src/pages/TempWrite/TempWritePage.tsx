import { useEffect, useState } from "react";
import HeaderWoSearch from "@/components/Header/HeaderWoSearch";
import DropDownButton from "../../components/Button/DropDownButton";
import CategoryTag from "../../components/TemplateWrite/CategoryTag";
import EditorBlock, {
  type BlockData,
} from "../../components/TemplateWrite/EditorBlock";
import { questionData } from "../../components/TemplateWrite/questionTemplate";
import PostSaveModal from "./PostSaveModal";
import PostLoadingModal from "./PostLoadingModal";
import TemplateSelectModal from "./TemplateSelectModal";
import { useNavigate } from "react-router-dom";
import { PATH } from "@/constants/paths";
import type { PostSavePayload } from "./PostSaveModal";
import { createPost, startSummary } from "@/api/post.api";
import { toCreatePostRequest, type PostForm } from "@/mappers/postMapper";
import type { PostContentDto, SummaryTypeParam } from "@/models/post.model";
import { useProjectList } from "@/hooks/useProjectList";

const TempWritePage = () => {
  const [title, setTitle] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const [selectedErrorType, setSelectedErrorType] = useState<string | null>(
    null
  );
  const [isPostSaveModalOpen, setIsPostSaveModalOpen] = useState(false);
  const [isTemplateSelectModalOpen, setIsTemplateSelectModalOpen] =
    useState(false);
  const [isLoadingModalOpen, setIsLoadingModalOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const navigate = useNavigate();
  const [previewMeta, setPreviewMeta] = useState<PostSavePayload | null>(null);
  const { data: projectList, loading: projectsLoading } = useProjectList();

  const toContentDtoList = (blocks: BlockData[]): PostContentDto[] =>
    blocks
      .filter((b) => (b.content ?? "").trim().length > 0)
      .map((b, i) => ({
        subTitle: b.question,
        body: b.content,
        sequence: i + 1,
        authorType: "USER_WRITTEN",
        summaryType: "NONE",
      }));

  // 첫번째 블록 생성
  useEffect(() => {
    if (blocks.length === 0 && questionData.length > 0) {
      const firstBlock: BlockData = {
        id: Date.now(),
        content: "",
        checklist: [],
        checklistItems: questionData[0].checklistItems ?? [],
        checklistTitle: questionData[0].title ?? "",
        question: questionData[0].question,
        isSaved: false,
      };
      setBlocks([firstBlock]);
    }
  }, [blocks]);

  // 블록 내용 변경
  const handleChangeBlockContent = (
    index: number,
    updated: Partial<BlockData>
  ) => {
    setBlocks((prev) => {
      const newBlocks = [...prev];
      newBlocks[index] = { ...newBlocks[index], ...updated };
      return newBlocks;
    });
  };

  // 체크리스트 토글
  const handleToggleChecklist = (
    index: number,
    item: string,
    checked: boolean
  ) => {
    setBlocks((prev) => {
      const newBlocks = [...prev];
      const checklist = new Set(newBlocks[index].checklist);
      if (checked) {
        checklist.add(item);
      } else {
        checklist.delete(item);
      }

      newBlocks[index].checklist = Array.from(checklist);
      return newBlocks;
    });
  };

  // 블록 추가
  const handleAddBlock = () => {
    setBlocks((prev) => {
      const nextStep = prev.length;
      if (nextStep >= questionData.length) return prev;

      const stepData = questionData[nextStep];
      const newBlock: BlockData = {
        id: Date.now(),
        content: "",
        checklist: [],
        checklistItems: stepData.checklistItems ?? [],
        checklistTitle: stepData.title ?? "",
        question: stepData.question,
        isSaved: false,
      };

      const newBlocks = [...prev, newBlock];
      setActiveIndex(newBlocks.length - 1);
      return newBlocks;
    });
  };

  //  End 버튼
  const handleEnd = () => {
    if (!title.trim() || !selectedErrorType) {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }
    if (!blocks[0]?.content.trim()) {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }
    setIsPostSaveModalOpen(true);
  };

  const handleShowSaveAlert = () => {
    setShowSaveAlert(true);
    setTimeout(() => setShowSaveAlert(false), 3000);
  };

  const errorOptions = [
    "Build / Compile Error",
    "Runtime Error",
    "Dependency / Version Error",
    "Network / API Error",
    "Authentication / Authorization Error",
    "Database Error",
    "UI / Rendering Error",
    "Configuration Error",
    "Timeout / Error Handling",
    "Third-Party Library Error",
    "Others",
  ];

  function toGuideContent(text: string) {
    const paragraphs = (text ?? "").split(/\n{2,}/).map((s) => s.trim());
    return paragraphs;
  }
  const handleNextInPostSaveModal = (payload: PostSavePayload) => {
    setPreviewMeta(payload);
    setIsPostSaveModalOpen(false);
    setIsTemplateSelectModalOpen(true);
  };

  // 템플릿 선택 후 요약 시작
  const handleConfirmTemplate = async (type: SummaryTypeParam) => {
    try {
      setIsTemplateSelectModalOpen(false);
      setIsLoadingModalOpen(true);

      // 1) PostForm
      const form: PostForm = {
        title,
        introduction: previewMeta?.description ?? "",
        postTags: selectedTags,
        isVisible: (previewMeta?.visibility ?? "public") === "public",
        isSummaryCreated: false,
        postStatus: "DRAFT",
        starRating: String(previewMeta?.importance ?? "0"),
        thumbnailImageUrl: previewMeta?.thumbnail ?? undefined,
        projectId: previewMeta?.projectId ?? 0,
        errorTag: selectedErrorType ?? "",
        contents: toContentDtoList(blocks),
      };

      // 2) 문서 생성
      const req = toCreatePostRequest(form);
      const { data: created } = await createPost(req);
      const postId = created.id;

      // 3) 요약 작업 시작
      await startSummary(postId, { type });
    } catch (e) {
      console.error(e);
      setIsTemplateSelectModalOpen(true);
    } finally {
      setIsLoadingModalOpen(false);
    }
  };

  const handleLater = () => {
    const filledBlocks = blocks.filter((b) => b.content?.trim().length > 0);

    const questions = filledBlocks.map((b) => b.question);
    const contents = filledBlocks.map((b) => toGuideContent(b.content));

    navigate(PATH.PREVIEW, {
      state: {
        title,
        tags: selectedTags,
        errorType: selectedErrorType,

        importance: previewMeta?.importance,
        authorName: "나",
        authorProfile: null,
        authorBio: "",
        date: new Date().toISOString().slice(2, 10).replace(/-/g, "."),

        questions,
        contents,
      },
    });
  };

  return (
    <div>
      <HeaderWoSearch />
      <div className="flex justify-center px-[225px] pt-[68px] items-start">
        <div className="flex-1 flex w-[1500px] flex-col gap-[36px]">
          {/* Alert */}
          {showAlert && (
            <div className="fixed top-[120px] left-1/2 -translate-x-1/2 z-50 bg-purple-100 border border-purple-400 text-purple-700 px-4 py-2 rounded-md shadow">
              제목, 에러 종류, 첫 번째 블록 내용을 모두 입력해주세요.
            </div>
          )}
          {showSaveAlert && (
            <div className="fixed top-[120px] left-1/2 -translate-x-1/2 z-50 bg-white border border-purple-400 text-purple-700 px-4 py-2 rounded-md shadow">
              저장되었습니다.
            </div>
          )}

          {/*  제목 + 태그 */}
          <div className="flex flex-col items-start gap-[40px]">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요."
              className="text-[36px] md:text-[48px] font-bold text-black outline-none w-full leading-tight"
            />
            <div className="flex gap-[36px] items-center">
              <DropDownButton
                options={errorOptions}
                placeholder="에러 종류를 선택하세요"
                width="w-[340px] h-[36px]"
                onSelect={(selectedError) =>
                  setSelectedErrorType(selectedError)
                }
              />
              <CategoryTag value={selectedTags} onChange={setSelectedTags} />
            </div>
          </div>

          {/* 블록 렌더링 (역순 표시) */}
          <div>
            {[...blocks].reverse().map((block, index) => {
              const originalIndex = blocks.length - 1 - index; // 실제 index
              return (
                <EditorBlock
                  key={block.id}
                  block={block}
                  index={originalIndex}
                  isActive={originalIndex === activeIndex}
                  isLast={originalIndex === questionData.length - 1}
                  onChange={handleChangeBlockContent}
                  onToggleChecklist={handleToggleChecklist}
                  onAddBlock={handleAddBlock}
                  onEnd={handleEnd}
                  title={title}
                  selectedErrorType={selectedErrorType}
                  onShowSaveAlert={handleShowSaveAlert}
                  onActivate={(i) => setActiveIndex(i)}
                />
              );
            })}
          </div>

          {/* 모달 */}
          {isPostSaveModalOpen && (
            <PostSaveModal
              onClose={() => setIsPostSaveModalOpen(false)}
              onNext={handleNextInPostSaveModal}
              projects={projectList.map((p) => ({ id: p.id, name: p.name }))}
              loadingProjects={projectsLoading}
            />
          )}
          {isTemplateSelectModalOpen && (
            <TemplateSelectModal
              onConfirm={handleConfirmTemplate}
              onClose={() => setIsTemplateSelectModalOpen(false)}
              onLater={handleLater}
            />
          )}
          {isLoadingModalOpen && (
            <PostLoadingModal
              onClose={() => setIsLoadingModalOpen(false)}
              progress={100}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TempWritePage;
