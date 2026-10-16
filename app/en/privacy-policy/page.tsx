import { LegalPage, legalMetadata } from "../../../lib/legalPage";

export const generateMetadata = () => legalMetadata("privacy", "en");
export default function Page() { return <LegalPage kind="privacy" locale="en" />; }
