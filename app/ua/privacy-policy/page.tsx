import { LegalPage, legalMetadata } from "../../../lib/legalPage";

export const generateMetadata = () => legalMetadata("privacy", "ua");
export default function Page() { return <LegalPage kind="privacy" locale="ua" />; }
