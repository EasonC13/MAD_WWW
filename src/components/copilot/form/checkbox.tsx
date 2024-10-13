import React, { useEffect, useState } from "react";
import { Checkbox as FBCheckbox, Label } from "flowbite-react";

interface CheckboxProps {
  options: string[];
  onInput: (value: string[]) => void;
  onNext: (selectedOptions: string[]) => Promise<boolean>;
}

const Checkbox: React.FC<CheckboxProps> = ({ options, onInput, onNext }) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isDisabled, setIsDisabled] = useState(false);

  // Handle checkbox change
  const handleCheckboxChange = (option: string, isChecked: boolean) => {
    const updatedSelectedOptions = isChecked 
      ? [...selectedOptions, option]
      : selectedOptions.filter(item => item !== option);

    setSelectedOptions(updatedSelectedOptions);
    onInput(updatedSelectedOptions); // Update parent component with the new selection
};

  // Handle "Next" button click
  const handleNextClick = async () => {
    if (await onNext(selectedOptions)) {
      setIsDisabled(true);
    }
  };

  return (
    <div className="w-full mb-3 mt-3 border rounded-lg bg-gray-700 border-gray-600">
      {options.map((option, index) => (
        <div className="flex items-center gap-2 p-3" key={index}>
          <FBCheckbox
            value={option}
            onChange={(e) => handleCheckboxChange(option, e.target.checked)}
            id={`checkbox-${index}`}
          />
          <Label htmlFor={`checkbox-${index}`} className="flex text-white">
            {option}
          </Label>
        </div>
      ))}

      <div className="flex items-right justify-right px-3 py-2 border-t border-gray-600">
        <button
          onClick={handleNextClick}
          className={`inline-flex items-center py-2.5 px-4 text-xs font-medium text-center ${isDisabled ? "bg-gray-500 cursor-not-allowed" : "text-white bg-blue-700 hover:bg-blue-800"} rounded-lg focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900`}
          type="submit"
          disabled={isDisabled}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Checkbox;
