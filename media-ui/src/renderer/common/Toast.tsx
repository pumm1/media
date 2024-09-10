import React, { useEffect } from 'react'
import './Toast.css'

interface ToastProps {
    message: string | JSX.Element
    durationMs: number
    onClose:() => void

}


const Toast = ({ message, durationMs, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, durationMs);

    return () => clearTimeout(timer);
  }, [durationMs, onClose])

  return (
    <div className="toast">
      {message}
    </div>
  );
};

export default Toast
