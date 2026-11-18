import { createContext, useContext } from "react";
import { createPortal } from "react-dom";

// Layout puts an empty slot in the header and shares its DOM node here.
// A page renders <HeaderAction> to place its primary button (such as "Add task")
// in the header while keeping its own state and modal.
export const HeaderActionContext = createContext(null);

export default function HeaderAction({ children }) {
  const slot = useContext(HeaderActionContext);
  return slot ? createPortal(children, slot) : null;
}
