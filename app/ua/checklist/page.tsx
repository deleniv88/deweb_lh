import { ChecklistPage, checklistMetadata } from "../../../lib/checklistPage";

export const generateMetadata = () => checklistMetadata("ua");
export default function Page() { return <ChecklistPage locale="ua" />; }
