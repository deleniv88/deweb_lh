import { WorksPage, worksMetadata } from "../../../lib/worksPage";

export const generateMetadata = () => worksMetadata("ua");
export default function Page() { return <WorksPage locale="ua" />; }
