import { useEffect, useState, Dispatch, SetStateAction, useRef } from "react";

const Loading = ({}) => {
  return (
    <div className="flex flex-col items-center">
      <p className="text-2xl mb-4">Loading, this may take a few second...</p>
    </div>
  );
};

export default Loading;
