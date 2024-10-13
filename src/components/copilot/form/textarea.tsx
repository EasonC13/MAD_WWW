import React, { useState } from 'react';

interface TextAreaProps {
    placeholder: string;
    onInput: (value: string) => void;
    onNext: () => Promise<boolean>;
}

const TextArea: React.FC<TextAreaProps> = ({placeholder, onInput, onNext}) => {
    const [isDisabled, setIsDisabled] = useState(false);

    return (
        <>
            <div className="w-full mb-3 mt-3 border rounded-lg bg-gray-700 border-gray-600">
                <div className="px-4 py-2 rounded-t-lg">
                    <textarea 
                      onChange={(e) => onInput(e.target.value)} 
                      id="comment" 
                      rows={2} 
                      className={`w-full px-0 text-sm text-white border-0 bg-gray-700 focus:ring-0 dark:text-white placeholder-gray-400 ${isDisabled ? 'cursor-not-allowed' : ''}`} 
                      placeholder={placeholder} 
                      required 
                      disabled={isDisabled} // Use the isDisabled state to control the disabled property
                    />                </div>
                <div className="flex items-right justify-right px-3 py-2 border-t border-gray-600">
                    <button 
                        onClick={async () => { if (await onNext()) setIsDisabled(true) }} 
                        disabled={isDisabled} 
                        className={`inline-flex items-center py-2.5 px-4 text-xs font-medium text-center ${isDisabled ? 'bg-gray-500 cursor-not-allowed' : 'text-white bg-blue-700 hover:bg-blue-800'} rounded-lg focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900`} 
                        type="submit">
                            Next
                    </button>
                </div>
            </div>
        </>
    )
}

export default TextArea;