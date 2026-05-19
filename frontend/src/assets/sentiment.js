import {
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaFolderOpen,
  FaChartLine,
  FaProjectDiagram,
  FaCheck,
  FaUpload,
} from "react-icons/fa";
import { FiSettings, FiLogOut } from "react-icons/fi";

export const sentimentLabel = {
  positive: {
    text: "Bullish",
    icon: FaArrowUp,
  },
  negative: {
    text: "Bearish",
    icon: FaArrowDown,
  },
  neutral: {
    text: "Neutral",
    icon: FaMinus,
  },
};

export const workspaceIcons = {
  upload: FaFolderOpen,
  correlation: FaChartLine,
  pca: FaProjectDiagram,
  success: FaCheck,
  dropArrow: FaUpload,
  settings: FiSettings,
  logout: FiLogOut,
};
