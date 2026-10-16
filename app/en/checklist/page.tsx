import { ChecklistPage, checklistMetadata } from "../../../lib/checklistPage";

export const generateMetadata = () => checklistMetadata("en");
export default function Page() { return <ChecklistPage locale="en" />; }
