"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import AlertModal from "@/components/AlertModal";

type AlertType = "success" | "error" | "info";

interface AlertOptions {
  type?: AlertType;
  okText?: string;
  cancelText?: string;
  onOk?: () => void;
  onCancel?: () => void;
}

interface AlertContextType {
  showAlert: (
    title: string,
    message: string,
    typeOrOptions?: AlertType | AlertOptions,
    onOk?: () => void
  ) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<AlertType>("info");
  const [okText, setOkText] = useState("ตกลง");
  const [showCancel, setShowCancel] = useState(false);
  const [cancelText, setCancelText] = useState("ยกเลิก");
  const [onOk, setOnOk] = useState<() => void>(() => () => {});
  const [onCancel, setOnCancel] = useState<() => void>(() => () => {});

  const showAlert = (
    titleInput: string,
    messageInput: string,
    typeOrOptions: AlertType | AlertOptions = "info",
    onOkFallback: () => void = () => {}
  ) => {
    const options: AlertOptions =
      typeof typeOrOptions === "string"
        ? { type: typeOrOptions, onOk: onOkFallback }
        : typeOrOptions;

    setTitle(titleInput);
    setMessage(messageInput);
    setType(options.type ?? "info");
    setOkText(options.okText ?? "ตกลง");

    if (options.cancelText) {
      setShowCancel(true);
      setCancelText(options.cancelText);
      setOnCancel(() => options.onCancel ?? (() => {}));
    } else {
      setShowCancel(false);
      setCancelText("ยกเลิก");
      setOnCancel(() => () => {});
    }

    setOnOk(() => options.onOk ?? onOkFallback ?? (() => {}));
    setIsOpen(true);
  };

  const handleOk = () => {
    setIsOpen(false);
    onOk();
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (showCancel) {
      onCancel();
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <AlertModal
        isOpen={isOpen}
        title={title}
        message={message}
        type={type}
        onClose={handleOk}
        onCancel={showCancel ? handleCancel : undefined}
        showCancel={showCancel}
        okText={okText}
        cancelText={showCancel ? cancelText : undefined}
      />
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
}
