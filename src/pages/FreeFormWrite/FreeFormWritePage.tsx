import { useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import HeaderWoSearch from "@/components/Header/HeaderWoSearch";
import DropDownButton from "../../components/Button/DropDownButton";
import CategoryTag from "../../components/TemplateWrite/CategoryTag";
import type { BlockData } from "../../components/FreeFormWrite/EditorBlockFF";

import PostSaveModal from "../TempWrite/PostSaveModal";
import PostLoadingModal from "../TempWrite/PostLoadingModal";
import TemplateSelectModal from "../TempWrite/TemplateSelectModal";

const FreeFormWritePage = () => {
  const [title, setTitle] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isPostSaveModalOpen, setIsPostSaveModalOpen] = useState(false);
  const [isTemplateSelectModalOpen, setIsTemplateSelectModalOpen] =
    useState(false);
  const [isLoadingModalOpen, setIsLoadingModalOpen] = useState(false);
  const [selectedErrorType, setSelectedErrorType] = useState<string | null>(
    null
  );
  const [showAlert, setShowAlert] = useState(false);
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [showBlockAlert, setShowBlockAlert] = useState(false);

  const [blocks, setBlocks] = useState<BlockData[]>([
    {
      id: Date.now(),
      title: "",
      content: "",
      isSaved: false,
    },
  ]);

  const handleEnd = () => {
    if (!title.trim() || !selectedErrorType) {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }
    if (!blocks[0].content.trim()) {
      setShowBlockAlert(true);
      setTimeout(() => setShowBlockAlert(false), 3000);
      return;
    }

    setShowAlert(false);
    setIsPostSaveModalOpen(true);
  };

  const handleAddBlock = () => {
    if (blocks.length >= 10) return;
    const newBlock: BlockData = {
      id: Date.now(),
      title: "",
      content: "",
      isSaved: false,
    };
    setBlocks((prev) => [...prev, newBlock]);
  };

  const handleChangeBlock = (
    id: number,
    key: "title" | "content",
    value: string
  ) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [key]: value } : b))
    );
  };

  const handleNextInPostSaveModal = () => {
    setIsPostSaveModalOpen(false);
    setIsTemplateSelectModalOpen(true);
  };

  const handleConfirmTemplate = () => {
    setIsTemplateSelectModalOpen(false);
    setIsLoadingModalOpen(true);
    setTimeout(() => setIsLoadingModalOpen(false), 60000);
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

  return (
    <div>
      <HeaderWoSearch />
      <div className="flex justify-center px-[360px] pt-[68px] items-start">
        <div className="flex-1 flex w-[1200px] flex-col gap-3">
          {showAlert && (
            <div className="fixed top-[120px] left-1/2 transform -translate-x-1/2 z-50 bg-purple-100 border border-purple-400 text-purple-700 px-4 py-2 rounded-md shadow">
              제목과 에러 종류를 모두 입력해주세요.
            </div>
          )}
          {showBlockAlert && (
            <div className="fixed top-[120px] left-1/2 transform -translate-x-1/2 z-50 bg-purple-100 border border-purple-400 text-purple-700 px-4 py-2 rounded-md shadow">
              첫 번째 블록의 내용이 비어있습니다.
            </div>
          )}

          {showSaveAlert && (
            <div className="fixed top-[120px] left-1/2 transform -translate-x-1/2 z-50 bg-purple-100-100 border border-purple-400 text-purple-700 px-4 py-2 rounded-md shadow">
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

          {blocks.length > 0 && (
            <div
              key={blocks[0].id}
              className="flex justify-between items-start max-w-[1200px] gap-4"
            >
              <div className="flex-1">
                <div className="w-full flex flex-row justify-center items-end h-[60px] mb-3">
                  <input
                    type="text"
                    value={blocks[0].title}
                    onChange={(e) =>
                      handleChangeBlock(blocks[0].id, "title", e.target.value)
                    }
                    placeholder="소제목을 입력해주세요"
                    className="w-[1070px] p-2 border-none rounded  font-bold text-black text-[24px]"
                  />
                  {/* Save / End 버튼 */}
                  <div className="flex items-end justify-center gap-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowSaveAlert(true);
                          setTimeout(() => setShowSaveAlert(false), 3000);
                        }}
                        className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-purple-500 hover:bg-gray-100"
                      >
                        Save
                      </button>

                      <button
                        onClick={handleEnd}
                        className="px-4 py-2 bg-purple-500 text-white rounded-xl text-sm hover:bg-purple-600"
                      >
                        End
                      </button>
                    </div>
                  </div>
                </div>

                <MDEditor
                  value={blocks[0].content}
                  onChange={(val) =>
                    handleChangeBlock(blocks[0].id, "content", val || "")
                  }
                  preview="edit"
                />
              </div>
            </div>
          )}

          {/* 나머지 블록 */}
          {blocks.slice(1).map((block) => (
            <div key={block.id} className="border-none max-w-[1200px]">
              <input
                type="text"
                value={block.title}
                onChange={(e) =>
                  handleChangeBlock(block.id, "title", e.target.value)
                }
                placeholder="소제목을 입력하세요"
                className="w-[1200px] p-2 border-none rounded mb-3 font-bold text-black text-[24px]"
              />

              <MDEditor
                value={block.content}
                onChange={(val) =>
                  handleChangeBlock(block.id, "content", val || "")
                }
                preview="edit"
              />
            </div>
          ))}

          {/* 블록 추가 버튼 */}
          <button
            onClick={handleAddBlock}
            disabled={blocks.length >= 10}
            className="border-2 border-dashed p-4 rounded-xl w-full h-[140px] mt-4 text-gray-500 text-[20px] hover:bg-gray-50 disabled:opacity-50"
          >
            + 블록 추가하기 ({blocks.length}/10)
          </button>

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

export default FreeFormWritePage;
