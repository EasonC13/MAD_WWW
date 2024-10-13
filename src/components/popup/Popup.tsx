// Popup.tsx
import * as Dialog from "@radix-ui/react-dialog";

interface PopupProps {
  isOpen: boolean; // 控制弹出窗口是否显示的参数
  onOpenChange?: (open: boolean) => void; // 控制弹出窗口开关状态的函数
  children: React.ReactNode; // 弹出窗口的内容
  [key: string]: any; // 其他参数
}

const Popup: React.FC<PopupProps> = ({
  isOpen,
  onOpenChange,
  children,
  ...props
}) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30" />
        <Dialog.Content
          className="fixed inset-0 z-50 m-auto w-auto max-w-lg rounded flex items-center justify-center"
          {...props}
        >
          {children}
          <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-none disabled:pointer-events-none">
            <span className="sr-only">Close</span>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default Popup;
