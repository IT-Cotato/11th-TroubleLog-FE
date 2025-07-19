import React, { useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import HeaderWoSearch from "@/components/Header/HeaderWoSearch";
import DropDownButton from "./DropDownButton";
import CategoryTag from "./CategoryTag";
import EditorBlock from "../../components/TemplateWrite/EditorBlock";
import type { BlockData } from "../../components/TemplateWrite/EditorBlock";
import { questionData } from "./questionTemplate";

const TempWritePage = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [blocks, setBlocks] = useState<BlockData[]>([]);

  const handleAddBlock = () => {
    setBlocks((prev) => {
      const nextStep = prev.length + 1; // ← 핵심 수정
      if (nextStep >= questionData.length) return prev;

      const stepData = questionData[nextStep];
      const { question, title, checklistItems } = stepData;

      const newBlock: BlockData = {
        id: Date.now(),
        content: "",
        checklist: [],
        checklistItems: checklistItems ?? [],
        checklistTitle: title ?? "",
        question,
        isSaved: false,
      };

      return [...prev, newBlock];
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

  const handleSave = (index: number) => {
    setBlocks((prev) => {
      const newBlocks = [...prev];
      newBlocks[index].isSaved = true;
      return newBlocks;
    });

    setTimeout(() => {
      setBlocks((prev) => {
        const newBlocks = [...prev];
        if (newBlocks[index]) newBlocks[index].isSaved = false;
        return newBlocks;
      });
    }, 3000);
  };

  const defaultCheckListItems = questionData[0]?.checklistItems || [];

  return (
    <div>
      <HeaderWoSearch />
      <div className="flex justify-center px-[225px] pt-[68px]  items-start">
        <div className="flex-1 flex w-[1500px] flex-col gap-[36px]">
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
              <DropDownButton />
              <CategoryTag value={selectedTags} onChange={setSelectedTags} />
            </div>
          </div>

          {/* 추가될 블록들 */}
          {blocks
            .slice()
            .reverse()
            .map((block, index) => (
              <EditorBlock
                key={block.id}
                block={block}
                index={index}
                onChange={handleAddBlock}
                onToggleChecklist={handleToggleChecklist}
                onAddBlock={handleAddBlock}
                onSave={handleSave}
              />
            ))}

          {/* 어떤오류~ 블록*/}
          <div className="flex flex-row gap-[25px]">
            <div className="flex flex-col gap-[16px] w-[1200px]">
              <div className="flex justify-between items-start">
                <span className="font-bold text-black text-[24px]">
                  {questionData[0].question}
                </span>
                <div className="flex flex-col items-end gap-2 min-w-[160px]">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsSaved(true)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleAddBlock}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600"
                    >
                      Next
                    </button>
                  </div>
                  {isSaved && (
                    <p className="text-sm text-gray-600">✔ 저장되었습니다.</p>
                  )}
                </div>
              </div>
              <div data-color-mode="light">
                <MDEditor
                  value={content}
                  onChange={(value) => setContent(value || "")}
                  height={240}
                  style={{ width: "1200px" }}
                  preview="edit"
                />
              </div>
            </div>
            {/*체크리스트*/}
            <div className="flex flex-col gap-2 mt-14">
              <h3 className="text-base font-semibold text-gray4">
                {questionData[0].title}
              </h3>
              {defaultCheckListItems.map((item, index) => (
                <label
                  key={index}
                  className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="peer hidden"
                    id={`check-${index}`}
                  />

                  <span
                    className={`
        inline-block w-5 h-5 bg-no-repeat bg-center bg-contain
        peer-checked:bg-[url('src/assets/images/checkedbox.svg')]
        bg-[url('src/assets/images/noncheckedbox.svg')]
      `}
                  ></span>
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TempWritePage;
