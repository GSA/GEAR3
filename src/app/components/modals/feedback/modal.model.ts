export interface IModal {
  modalID: string;
  modalHeader?: string;
  modalText?: string;
  primaryButton?: string;
  secondaryButton?: string;
  modalType?: "actionForced"|"content"|"actionForcedWithClose";
  hideFooter?: boolean;
  size?: "large"|"custom";
}