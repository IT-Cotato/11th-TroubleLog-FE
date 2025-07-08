import React, { useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import Header from "@/components/Header/Header";
import DropDownButton from "./DropDownButton";

const TempWritePage = () => {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");

  return (
    <div>
      <Header />

      <div className="w-[1200px] mx-auto py-8 flex flex-col gap-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요."
          className="text-[48px] font-bold text-black outline-none w-full"
        />
        <DropDownButton />
        <div data-color-mode="light">
          <MDEditor
            value={content}
            onChange={(value) => setContent(value || "")}
            height={350}
            autoFocus={false}
            preview="edit"
          />
        </div>
      </div>
    </div>
  );
};

export default TempWritePage;
