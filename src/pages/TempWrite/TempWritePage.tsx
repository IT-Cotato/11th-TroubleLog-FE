import { useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import HeaderWoSearch from "@/components/Header/HeaderWoSearch";
import DropDownButton from "@/components/Button/DropDownButton";
import CategoryTag from "@/components/TemplateWrite/CategoryTag";
import EditorBlock from "@/components/TemplateWrite/EditorBlock";
import type { BlockData } from "@/components/TemplateWrite/EditorBlock";
import { questionData } from "@/components/TemplateWrite/questionTemplate";
import PostSaveModal from "@/pages/TempWrite/PostSaveModal";
import PostLoadingModal from "@/pages/TempWrite/PostLoadingModal";
import TemplateSelectModal from "@/pages/TempWrite/TemplateSelectModal";
import alertIcon from "@/assets/icons/alerticon.svg";
import checkBoxIcon from "@/assets/icons/checkedbox.svg";
import nonCheckBoxIcon from "@/assets/icons/noncheckedbox.svg";

const TempWritePage = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  const [isPostSaveModalOpen, setIsPostSaveModalOpen] = useState(false);
  const [isTemplateSelectModalOpen, setIsTemplateSelectModalOpen] =
    useState(false);
  const [isLoadingModalOpen, setIsLoadingModalOpen] = useState(false);

  const [selectedErrorType, setSelectedErrorType] = useState<string | null>(
    null
  );

  const [showAlert, setShowAlert] = useState(false); // 제목/에러 종류 미입력 alert
  const [showSaveAlert, setShowSaveAlert] = useState(false); // 저장되었습니다 alert
  const [showBlockAlert, setShowBlockAlert] = useState(false); // 첫번째 블록 비었을 때 alert

  const handleEnd = () => {
    if (!title.trim() || !selectedErrorType) {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }
    if (!blocks[0]?.content.trim()) {
      setShowBlockAlert(true);
      setTimeout(() => setShowBlockAlert(false), 3000);
      return;
    }
    setIsPostSaveModalOpen(true);
  };

  const handleAddBlock = () => {
    setBlocks((prev) => {
      const nextStep = prev.length + 1;
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

  // Save Alert 보여주기
  const handleShowSaveAlert = () => {
    setShowSaveAlert(true);
    setTimeout(() => setShowSaveAlert(false), 3000);
  };

  // PostSaveModal → 다음
  const handleNextInPostSaveModal = () => {
    setIsPostSaveModalOpen(false);
    setIsTemplateSelectModalOpen(true);
  };

  // TemplateSelectModal → 요약
  const handleConfirmTemplate = () => {
    setIsTemplateSelectModalOpen(false);
    setIsLoadingModalOpen(true);
    setTimeout(() => setIsLoadingModalOpen(false), 60000);
  };

  const defaultCheckListItems = questionData[0]?.checklistItems || [];
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

  return (
    <div>
      <HeaderWoSearch />
      <div className="flex justify-center px-[225px] pt-[68px] items-start">
        <div className="flex-1 flex w-[1500px] flex-col gap-[36px]">
          {/* Alert 메시지 */}
          {showAlert && (
            <div className="fixed top-[120px] left-1/2 -translate-x-1/2 z-50 bg-purple-100 border border-purple-400 text-purple-700 px-4 py-2 rounded-md shadow">
              제목과 에러 종류를 모두 입력해주세요.
            </div>
          )}
          {showBlockAlert && (
            <div className="fixed top-[120px] left-1/2 -translate-x-1/2 z-50 bg-purple-100 border border-purple-400 text-purple-700 px-4 py-2 rounded-md shadow">
              첫 번째 블록의 내용을 입력해주세요.
            </div>
          )}
          {showSaveAlert && (
            <div className="fixed top-[120px] left-1/2 -translate-x-1/2 z-50 bg-white border border-purple-400 text-purple-700 px-4 py-2 rounded-md shadow">
              저장되었습니다.
            </div>
          )}

          {/* 제목 + 태그 */}
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
                width="w-[340px]"
                onSelect={(selectedError) =>
                  setSelectedErrorType(selectedError)
                }
              />
              <CategoryTag value={selectedTags} onChange={setSelectedTags} />
            </div>
          </div>

          {/* 블록들 */}
          <div>
            {blocks
              .slice()
              .reverse()
              .map((block, index) => {
                const originalIndex = blocks.length - 1 - index;
                return (
                  <EditorBlock
                    key={block.id}
                    block={block}
                    index={originalIndex}
                    isActive={originalIndex === activeIndex}
                    isLast={originalIndex === questionData.length - 2}
                    onChange={handleChangeBlockContent}
                    onToggleChecklist={handleToggleChecklist}
                    onAddBlock={handleAddBlock}
                    onEnd={handleEnd}
                    title={title}
                    selectedErrorType={selectedErrorType}
                    onShowSaveAlert={handleShowSaveAlert}
                  />
                );
              })}

            {/* 첫 번째 블록 (어떤오류~) */}
            <div className="flex flex-row gap-[25px]">
              <div className="flex flex-col gap-[16px] w-[1200px]">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-black text-[24px]">
                    {questionData[0].question}
                  </span>
                  {/* Save / Next 버튼을 조건부로 렌더링 */}
                  {blocks.length === 0 && (
                    <div className="flex flex-col items-end gap-2 min-w-[160px]">
                      <div className="flex gap-2">
                        <button
                          onClick={handleShowSaveAlert}
                          className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-purple-500 hover:bg-gray-100"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleAddBlock}
                          className="px-4 py-2 bg-purple-500 text-white rounded-xl text-sm hover:bg-purple-600"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <MDEditor
                  value={content}
                  onChange={(value) => setContent(value || "")}
                  height={240}
                  style={{ width: "1200px" }}
                  preview="edit"
                />
              </div>

              {/* 체크리스트 */}
              <div className="flex flex-col gap-2 mt-14">
                <h3 className="text-base font-semibold text-gray4 flex items-center gap-2">
                  <img src={alertIcon} alt="alert icon" className="w-5 h-5" />
                  {questionData[0].title}
                </h3>
                {defaultCheckListItems.map((item, index) => (
                  <label
                    key={index}
                    className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer"
                  >
                    <input type="checkbox" className="peer hidden" />
                    <span
                      style={{
                        ["--icon-unchecked" as any]: `url(${nonCheckBoxIcon})`,
                        ["--icon-checked" as any]: `url(${checkBoxIcon})`,
                      }}
                      className="
    inline-block w-5 h-5 bg-no-repeat bg-center bg-contain
    [background-image:var(--icon-unchecked)]
    peer-checked:[background-image:var(--icon-checked)]
  "
                    ></span>
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {isPostSaveModalOpen && (
            <PostSaveModal
              onClose={() => setIsPostSaveModalOpen(false)}
              onNext={handleNextInPostSaveModal}
            />
          )}
          {isTemplateSelectModalOpen && (
            <TemplateSelectModal
              onConfirm={handleConfirmTemplate}
              onClose={() => setIsTemplateSelectModalOpen(false)}
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
