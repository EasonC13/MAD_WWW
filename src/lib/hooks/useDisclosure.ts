import { useCallback, useState, useId } from "react";
import { useCallbackRef } from "./useCallBackRef";

export type UseDisclosureProps = {
  defaultIsOpen?: boolean;
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  id?: string;
};

type HTMLProps = React.HTMLAttributes<HTMLElement>;

const useDisclosure = (props: UseDisclosureProps = {}) => {
  const {
    defaultIsOpen: defaultIsOpenProp,
    isOpen: isOpenProp,
    onOpen: onOpenProp,
    onClose: onCloseProp,
  } = props;

  const handleOpen = useCallbackRef(onOpenProp);
  const handleClose = useCallbackRef(onCloseProp);

  const [isOpenState, setIsOpen] = useState(defaultIsOpenProp || false);
  const isOpen = isOpenProp !== undefined ? isOpenProp : isOpenState;
  const isControlled = isOpenProp !== undefined;

  const id = `disclosure-${useId()}`;

  const onClose = useCallback(() => {
    if (!isControlled) {
      setIsOpen(false);
    }
    handleClose?.();
  }, [isControlled, handleClose]);

  const onOpen = useCallback(() => {
    if (!isControlled) {
      setIsOpen(true);
    }
    handleOpen?.();
  }, [isControlled, handleOpen]);

  const onToggle = useCallback(() => {
    if (isOpen) {
      onClose();
    } else {
      onOpen();
    }
  }, [isOpen, onOpen, onClose]);

  const getDisclosureProps = (props: HTMLProps = {}): HTMLProps => {
    return {
      ...props,
      hidden: !isOpen,
      id,
    };
  };

  return {
    isOpen,
    onOpen,
    onClose,
    onToggle,
    isControlled,
    getDisclosureProps,
  };
};

export default useDisclosure;
