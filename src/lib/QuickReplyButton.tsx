export const QuickReplyButton = ({
  onClick,
  text,
  bgColor = "bg-gray-200",
  textColor = "text-black",
}: {
  onClick: () => void;
  text: string;
  bgColor?: string;
  textColor?: string;
}) => (
  <button
    type="button"
    className={`${bgColor} ${textColor} font-bold py-1 px-4 rounded mx-2`}
    onClick={onClick}
  >
    {text}
  </button>
);
