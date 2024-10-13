import * as React from "react";
export const LeftBottomButtonWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <div className="fixed bottom-0 right-0">{children}</div>;
};
