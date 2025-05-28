"use client";

import React from "react";

interface DocumentWriteButtonProps {
  onClick?: () => void;
}

const DocumentWriteButton: React.FC<DocumentWriteButtonProps> = ({
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="absolute right-0 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
    >
      글쓰기
    </button>
  );
};

export default DocumentWriteButton;
