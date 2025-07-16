import React, { useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import Header from "@/components/Header/Header";
import DropDownButton from "./DropDownButton";
import CategoryTag from "./CategoryTag";

const TempWritePage = () => {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div>
      <Header />
      <div className="flex justify-center py-[50px] px-4">
        {/* 전체 1200px 박스 */}
        <div className="flex max-w-[1200px] w-full gap-[36px] items-start">
          {/* 왼쪽: 제목, 태그, 에디터 */}
          <div className="flex-1 flex flex-col gap-[56px]">
            {/* 제목 + 태그 */}
            <div className="flex flex-col items-start gap-[40px]">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력하세요."
                className="text-[36px] md:text-[48px] font-bold text-black outline-none w-full"
              />

              <div className="flex gap-[36px] items-center">
                <DropDownButton />
                <CategoryTag value={selectedTags} onChange={setSelectedTags} />
              </div>
            </div>

            {/* 에디터 */}
            <div className="flex flex-col gap-[16px] w-full">
              <div className="flex justify-between items-start">
                <span className="font-bold text-black text-[24px]">
                  어떤 오류가 발생했나요?
                </span>
                <div className="flex flex-col items-end gap-2 min-w-[160px]">
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Save
                    </button>
                    <button className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600">
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
                  style={{ width: "100%" }}
                  autoFocus={false}
                  preview="edit"
                />
              </div>
            </div>
          </div>

          {/* 오른쪽: 체크리스트 */}
          <div className="w-[280px] flex flex-col gap-3">
            <h3 className="text-base font-semibold text-black">
              오류를 정확히 인식하셨나요?
            </h3>
            <div className="flex flex-col gap-2">
              {[
                "오류 메시지를 정확히 읽고 이해했나요?",
                "로컬과 배포 환경의 차이를 점검해봤나요?",
                "문제가 발생한 모듈/기능 범위를 파악했나요?",
                "디버깅 툴이나 로그 추적을 활용해보셨나요?",
                "개발 환경 (IDE, OS, 실행 조건 등)을 확인했나요?",
              ].map((item, index) => (
                <label
                  key={index}
                  className="flex items-start gap-2 text-sm text-gray-700"
                >
                  <input type="checkbox" className="mt-1" />
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
