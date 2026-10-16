import { ChecklistPage, checklistMetadata } from "../../lib/checklistPage";

export const generateMetadata = () => checklistMetadata("pl");
export default function Page() { return <ChecklistPage locale="pl" />; }
