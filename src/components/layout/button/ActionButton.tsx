import React from "react";

const ActionButton = ({
  title,
  className,
  ...props
}: {
  title: string;
  className: string | undefined;
}) => {
  return (
    <button className={className} {...props}>
      {title}
    </button>
  );
};

export default ActionButton;
