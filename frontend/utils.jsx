import { toast } from "react-toastify";

const BASE_OPTS = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
};

export const handlesuccess = (msg) => {
  toast.success(msg, {
    ...BASE_OPTS,
    style: {
      background: "#0c0f1a",
      border: "1px solid #00e5a0",
      color: "#00e5a0",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: "13px",
    },
    progressStyle: { background: "#00e5a0" },
  });
};

export const handleerror = (msg) => {
  toast.error(msg, {
    ...BASE_OPTS,
    style: {
      background: "#0c0f1a",
      border: "1px solid #ff4d6d",
      color: "#ff4d6d",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: "13px",
    },
    progressStyle: { background: "#ff4d6d" },
  });
};

export const intermediate = (msg) => {
  toast.info(msg, {
    ...BASE_OPTS,
    style: {
      background: "#0c0f1a",
      border: "1px solid #4d9fff",
      color: "#4d9fff",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: "13px",
    },
    progressStyle: { background: "#4d9fff" },
  });
};