import { WorksPage, worksMetadata } from "../../../lib/worksPage";

export const generateMetadata = () => worksMetadata("pl");
export default function Page() { return <WorksPage locale="pl" />; }
