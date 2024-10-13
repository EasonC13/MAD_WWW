import React, { useEffect, useState } from "react";

interface SelectProps {
    options: string[];
    onInput: (value: string) => void;
    onNext: () => Promise<boolean>;
}

const Select: React.FC<SelectProps> = ({ options, onInput, onNext }) => {
    const [isDisabled, setIsDisabled] = useState(false);

    // Add the first option to the input state on component mount
    useEffect(() => {
      if (options.length > 0) {
        onInput(options[0]);
      }
    }, []);

    return (
      <div className="w-full mb-3 mt-3 border rounded-lg bg-gray-700 border-gray-600">
        <select 
          onChange={(e) => onInput(e.target.value)} 
          disabled={isDisabled} // Control the disabled state
          className="block appearance-none w-full bg-gray-700 border-gray-600 border text-white py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-gray-600 focus:border-gray-500" 
          id="grid-state"
        >
          {options.map((option: string, index: number) => (
            <option key={index} value={option}>{option}</option>
          ))}
        </select>
        <div className="flex items-right justify-right px-3 py-2 border-t border-gray-600">
          <button 
            onClick={async () => { if (await onNext()) setIsDisabled(true) }} // You missed calling onNext function. It should be onNext(), not onNext.
            className={`inline-flex items-center py-2.5 px-4 text-xs font-medium text-center ${isDisabled ? 'bg-gray-500 cursor-not-allowed' : 'text-white bg-blue-700 hover:bg-blue-800'} rounded-lg focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900`} 
            type="submit" 
            disabled={isDisabled} // Assuming you also want to control the button's disabled state similarly
          >
            Next
          </button>
        </div>
      </div>
    );
}

export default Select;
