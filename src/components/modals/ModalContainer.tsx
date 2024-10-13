import { cn } from "@/lib/utils/func/cn";
import React, { useRef, type ReactNode } from "react";
import useOnClickOutside from "@/lib/hooks/useOnClickOutside";
import { UseDisclosureProps } from "@/lib/hooks/useDisclosure";

type Props = UseDisclosureProps & {
  children: ReactNode;
  showCloseButton?: boolean;
  top?: string;
};

const ModalContainer = (props: Props) => {
  const { onClose, showCloseButton, top } = props;
  const clickOutsideRef = useRef<HTMLDivElement>(null);
  const clickOutsidehandler = () => {
    onClose?.();
  };
  useOnClickOutside(clickOutsideRef, clickOutsidehandler);

  return (
    <div className="fixed inset-0 z-40 flex h-full justify-center bg-gray-dark1 bg-opacity-30 backdrop-blur-sm">
      <div
        className={cn(
          "relative flex h-full items-start justify-center px-6 lg:px-0",
          top ?? ""
        )}
      >
        <div
          ref={clickOutsideRef}
          className="relative mt-[15vh] overflow-hidden rounded-2xl bg-white  text-black shadow"
        >
          {showCloseButton ? (
            <button
              onClick={onClose}
              className="text-gray-400 hover:bg-gray-200 hover:text-gray-900 absolute top-4 right-4 ml-auto inline-flex items-center rounded-lg bg-transparent p-1 text-sm "
            >
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </button>
          ) : (
            <></>
          )}
          {props.children}
        </div>
      </div>
    </div>
  );
};

export default ModalContainer;
