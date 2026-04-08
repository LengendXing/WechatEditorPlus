import { AlertTriangle, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  loading?: boolean;
}

export default function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  loading,
}: DeleteConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      width={420}
      showClose={false}
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button
            variant="danger"
            loading={loading}
            icon={<Trash2 size={14} />}
            onClick={onConfirm}
          >
            确认删除
          </Button>
        </div>
      }
    >
      <div className="px-6 py-7 flex flex-col items-center gap-4">
        {/* Warning icon */}
        <div className="w-14 h-14 rounded-full bg-[#EF444414] flex items-center justify-center">
          <AlertTriangle size={28} className="text-error" />
        </div>

        {/* Title */}
        <div className="text-[16px] font-semibold text-fg-primary text-center">
          {title}
        </div>

        {/* Description */}
        {description && (
          <div className="text-[13px] text-fg-muted text-center leading-relaxed max-w-[300px]">
            {description}
          </div>
        )}
      </div>
    </Modal>
  );
}
