import { WorksPage, worksMetadata } from "../../lib/worksPage";

export const generateMetadata = () => worksMetadata("en");
export default function Page() { return <WorksPage locale="en" />; }
