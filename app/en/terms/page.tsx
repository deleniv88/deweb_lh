import { LegalPage, legalMetadata } from "../../../lib/legalPage";

export const generateMetadata = () => legalMetadata("terms", "en");
export default function Page() { return <LegalPage kind="terms" locale="en" />; }
